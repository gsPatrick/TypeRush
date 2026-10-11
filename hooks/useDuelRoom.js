"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { randomSeed } from "@/lib/game/rng";
import { DEFAULT_MODE, DUEL_MODES } from "@/lib/duel/modes";
import { createReferee, forfeitResult } from "@/lib/duel/referee";

/**
 * Sala de duelo P2P (Trystero/WebRTC — sem servidor próprio).
 *
 * Papéis: quem cria a sala é o ANFITRIÃO e também o JUIZ; quem entra pelo
 * código é o CONVIDADO. Um terceiro recebe "full".
 *
 * Fases: lobby → countdown → playing → result → (revanche) countdown …
 *
 * Mensagens (nome ≤ 12 bytes, exigência do Trystero):
 *   hello   {role, name}           apresentação
 *   cfg     {mode, lang}           anfitrião → convidado (configuração)
 *   ready   {ready}                pronto no lobby
 *   start   {round, seed, mode, lang}  anfitrião → convidado (3-2-1)
 *   st      {...}                  estado ao vivo, ~6×/s
 *   over    {round, ms, sum}       meu relógio zerou
 *   goal    {round, ms, sum}       bati a meta (overdrive)
 *   result  {round, winner, reason, stats, score}  anfitrião → convidado
 *   rematch {round, vote}          voto de revanche
 *   lobby   {}                     anfitrião: volta ao lobby (trocar modo)
 *   full    {}                     anfitrião → intruso
 */

const APP_ID = "typerush-duel-v1";

/**
 * Relays Nostr usados só para os dois navegadores se ACHAREM (depois disso a
 * conexão é direta, P2P). Basta UM relay em comum entre os dois jogadores.
 *
 * Lista explícita e verificada (out/2026): a padrão da lib sorteia 5 de uma
 * lista fixa e 3 dos 5 sorteados para este appId estavam fora do ar — a sala
 * nunca conectava. Todos abaixo aceitam os eventos efêmeros da Trystero;
 * ficaram de fora os que exigem autenticação, lista branca ou "web of trust"
 * (offchain.pub, nostromo, grooveix, nostraddress).
 * Relay público tem limite de taxa por IP — muitas salas abertas do mesmo IP
 * em sequência podem ser bloqueadas por alguns minutos (visto nos testes).
 */
const RELAY_URLS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://nostr.mom",
  "wss://relay.snort.social",
  "wss://relay.primal.net",
  "wss://relay.fountain.fm",
  "wss://nostr.data.haus",
  "wss://yabu.me/v2",
  "wss://nostr.sathoarder.com",
];
const COUNTDOWN_MS = 3000;
const LIVE_INTERVAL_MS = 160;

/**
 * Estado "sincronizado": atualiza um ref NA HORA e agenda o estado React.
 *
 * Por quê: os handlers de rede leem o estado atual. Com useState puro, o valor
 * só muda no próximo render — e uma mensagem que chega microssegundos depois
 * de `setRival(...)` era descartada por "não vir do rival" (bug real: a sala
 * conectava via WebRTC mas o nome do convidado nunca aparecia, de forma
 * intermitente). Aqui o ref já tem o valor novo antes do render.
 */
function useSynced(initial) {
  const [state, setState] = useState(initial);
  const ref = useRef(state);
  const set = useCallback((next) => {
    const value = typeof next === "function" ? next(ref.current) : next;
    ref.current = value;
    setState(value);
  }, []);
  return [state, set, ref];
}

export default function useDuelRoom({ code, isHost, name, lang: initialLang, mode: initialMode }) {
  const role = isHost ? "host" : "guest";
  const rivalRole = isHost ? "guest" : "host";

  const [conn, setConn] = useState("connecting"); // connecting | waiting | connected | full | host-left | error
  const [phase, setPhase, phaseRef] = useSynced("lobby"); // lobby | countdown | playing | result
  const [settings, setSettings, settingsRef] = useSynced({ mode: initialMode || DEFAULT_MODE, lang: initialLang });
  const [rival, setRival, rivalRef] = useSynced(null); // {id, name, ready}
  const [meReady, setMeReady, meReadyRef] = useSynced(false);
  const [match, setMatch, matchRef] = useSynced(null); // {round, seed, mode, lang, goAt}
  const [score, setScore, scoreRef] = useSynced({ host: 0, guest: 0 });
  const [result, setResult] = useState(null);
  const [votes, setVotes, votesRef] = useSynced({ me: false, rival: false });
  const [rivalLive, setRivalLive, rivalLiveRef] = useSynced(null);
  const [slow, setSlow] = useState(false); // ninguém apareceu em 15s
  const nameRef = useRef(name);
  nameRef.current = name;

  // os handlers de rede são registrados uma vez e leem o estado atual daqui —
  // getters sobre os refs sincronizados, nunca um retrato do último render
  const R = useRef(null);
  if (R.current === null) {
    R.current = {
      get phase() { return phaseRef.current; },
      get settings() { return settingsRef.current; },
      get rival() { return rivalRef.current; },
      get meReady() { return meReadyRef.current; },
      get match() { return matchRef.current; },
      get score() { return scoreRef.current; },
      get votes() { return votesRef.current; },
      get rivalLive() { return rivalLiveRef.current; },
      get name() { return nameRef.current; },
    };
  }

  const roomRef = useRef(null);
  const send = useRef({});
  const refereeRef = useRef(null);
  const decideTimer = useRef(null);
  const liveSource = useRef(null); // () => snapshot do meu jogo
  const reportedRef = useRef({ over: -1, goal: -1 });
  const myFinalRef = useRef(null);

  // ── juiz (só anfitrião) ─────────────────────────────────────

  const applyResult = useCallback((res) => {
    setResult(res);
    setScore(res.score);
    setVotes({ me: false, rival: false });
    setPhase("result");
  }, []);

  const decideNow = useCallback(() => {
    const ref = refereeRef.current;
    if (!ref || ref.decided) return;
    const { winner, reason } = ref.decide();
    const s = { ...R.current.score };
    if (winner) s[winner] += 1;
    const live = R.current.rivalLive;
    const stats = {
      [role]: ref.summaryOf(role) ?? myFinalRef.current ?? liveSource.current?.()?.sum ?? null,
      [rivalRole]: ref.summaryOf(rivalRole) ?? live?.sum ?? null,
    };
    const res = { round: R.current.match.round, winner, reason, stats, score: s };
    send.current.result?.(res);
    applyResult(res);
  }, [applyResult, role, rivalRole]);

  const refereeRecord = useCallback(
    (who, type, ms, sum) => {
      const ref = refereeRef.current;
      if (!ref) return;
      const wait = ref.record(who, type, ms, sum);
      if (wait === null) return;
      clearTimeout(decideTimer.current);
      decideTimer.current = setTimeout(decideNow, wait);
    },
    [decideNow]
  );

  // ── início da rodada ────────────────────────────────────────

  const beginCountdown = useCallback((m) => {
    reportedRef.current = { over: -1, goal: -1 };
    myFinalRef.current = null;
    setResult(null);
    setRivalLive(null);
    setVotes({ me: false, rival: false });
    setMatch({ ...m, goAt: performance.now() + COUNTDOWN_MS });
    setPhase("countdown");
  }, []);

  const startRound = useCallback(async () => {
    const r = R.current;
    if (!isHost || !r.rival) return;
    const m = {
      round: (r.match?.round ?? 0) + 1,
      seed: randomSeed(),
      mode: r.settings.mode,
      lang: r.settings.lang,
    };
    refereeRef.current = createReferee(m.mode);
    let rtt = 0;
    try {
      rtt = await Promise.race([roomRef.current.ping(r.rival.id), new Promise((res) => setTimeout(() => res(0), 800))]);
    } catch {
      rtt = 0;
    }
    send.current.start?.(m);
    // a mensagem leva ~rtt/2 para chegar: o anfitrião atrasa o próprio 3-2-1
    // nessa medida para o "vai!" cair junto nos dois lados
    setTimeout(() => beginCountdown(m), Math.min(rtt / 2, 400));
  }, [isHost, beginCountdown]);

  // ── conexão ─────────────────────────────────────────────────

  useEffect(() => {
    let alive = true;
    let room;
    let liveTimer;

    (async () => {
      let joinRoom;
      try {
        ({ joinRoom } = await import("trystero"));
      } catch {
        setConn("error");
        return;
      }
      if (!alive) return;
      room = joinRoom({ appId: APP_ID, relayUrls: RELAY_URLS }, `room-${code}`);
      roomRef.current = room;
      setConn(isHost ? "waiting" : "connecting");

      const act = (n) => room.makeAction(n);
      const [sHello, gHello] = act("hello");
      const [sCfg, gCfg] = act("cfg");
      const [sReady, gReady] = act("ready");
      const [sStart, gStart] = act("start");
      const [sSt, gSt] = act("st");
      const [sOver, gOver] = act("over");
      const [sGoal, gGoal] = act("goal");
      const [sResult, gResult] = act("result");
      const [sRematch, gRematch] = act("rematch");
      const [sLobby, gLobby] = act("lobby");
      const [sFull, gFull] = act("full");

      const toRival = (fn) => (data) => {
        const id = R.current.rival?.id;
        if (id) fn(data, id);
      };
      send.current = {
        hello: (d, to) => sHello(d, to),
        cfg: toRival(sCfg),
        ready: toRival(sReady),
        start: toRival(sStart),
        st: toRival(sSt),
        over: toRival(sOver),
        goal: toRival(sGoal),
        result: toRival(sResult),
        rematch: toRival(sRematch),
        lobby: toRival(sLobby),
      };

      room.onPeerJoin((peerId) => {
        if (isHost) {
          if (R.current.rival && R.current.rival.id !== peerId) {
            sFull({}, peerId);
            return;
          }
          setRival({ id: peerId, name: "…", ready: false });
          setConn("connected");
          sHello({ role: "host", name: R.current.name }, peerId);
          sCfg(R.current.settings, peerId);
        } else {
          sHello({ role: "guest", name: R.current.name }, peerId);
        }
      });

      gHello((d, peerId) => {
        if (isHost) {
          if (R.current.rival?.id === peerId) setRival((rv) => ({ ...rv, name: d.name }));
          return;
        }
        if (d.role !== "host") return;
        setRival({ id: peerId, name: d.name, ready: true });
        setConn("connected");
      });

      gCfg((d) => {
        if (isHost) return;
        setSettings(d);
        // a regra mudou: o convidado precisa concordar de novo
        setMeReady(false);
        sReady({ ready: false }, R.current.rival?.id);
      });

      gReady((d, peerId) => {
        if (R.current.rival?.id === peerId) setRival((rv) => ({ ...rv, ready: d.ready }));
      });

      gStart((m) => {
        if (!isHost) beginCountdown(m);
      });

      gSt((d, peerId) => {
        if (R.current.rival?.id !== peerId || d.r !== R.current.match?.round) return;
        setRivalLive({ ...d, at: performance.now() });
      });

      gOver((d) => {
        if (d.round !== R.current.match?.round) return;
        setRivalLive((l) => ({ ...(l || {}), alive: false, sum: d.sum }));
        if (isHost) refereeRecord("guest", "over", d.ms, d.sum);
      });

      gGoal((d) => {
        if (isHost && d.round === R.current.match?.round) refereeRecord("guest", "goal", d.ms, d.sum);
      });

      gResult((res) => {
        if (!isHost) applyResult(res);
      });

      gRematch((d) => {
        if (d.round !== R.current.match?.round) return;
        setVotes((v) => ({ ...v, rival: d.vote }));
      });

      gLobby(() => {
        if (isHost) return;
        setPhase("lobby");
        setMeReady(false);
        setResult(null);
      });

      gFull(() => {
        setConn("full");
        room.leave();
      });

      room.onPeerLeave((peerId) => {
        if (R.current.rival?.id !== peerId) return;
        if (!isHost) {
          setConn("host-left");
          return;
        }
        const ph = R.current.phase;
        setRival(null);
        setConn("waiting");
        if (ph === "countdown" || ph === "playing") {
          // desistência: quem ficou vence
          refereeRef.current = null;
          clearTimeout(decideTimer.current);
          const f = forfeitResult("host");
          const s = { ...R.current.score, host: R.current.score.host + 1 };
          applyResult({ round: R.current.match.round, ...f, stats: {}, score: s });
        } else if (ph === "result") {
          setVotes({ me: false, rival: false });
        }
      });

      // estado ao vivo para o painel do adversário
      liveTimer = setInterval(() => {
        if (R.current.phase !== "playing" || !liveSource.current) return;
        const snap = liveSource.current();
        if (snap) send.current.st?.({ r: R.current.match.round, ...snap });
      }, LIVE_INTERVAL_MS);
    })();

    return () => {
      alive = false;
      clearInterval(liveTimer);
      clearTimeout(decideTimer.current);
      room?.leave();
      roomRef.current = null;
    };
  }, [code, isHost, beginCountdown, applyResult, refereeRecord]);

  // conexão demorando: P2P via relay público pode levar alguns segundos
  useEffect(() => {
    if (rival) {
      setSlow(false);
      return undefined;
    }
    const id = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(id);
  }, [rival]);

  // revanche: quando os dois votam, o anfitrião começa a próxima
  useEffect(() => {
    if (isHost && phase === "result" && votes.me && votes.rival && rival) startRound();
  }, [isHost, phase, votes, rival, startRound]);

  // ── ações da interface ─────────────────────────────────────

  const toggleReady = useCallback(() => {
    const next = !R.current.meReady;
    setMeReady(next);
    send.current.ready?.({ ready: next });
  }, []);

  const changeSettings = useCallback(
    (patch) => {
      if (!isHost) return;
      const next = { ...R.current.settings, ...patch };
      setSettings(next);
      setRival((rv) => (rv ? { ...rv, ready: false } : rv));
      send.current.cfg?.(next);
    },
    [isHost]
  );

  const voteRematch = useCallback(() => {
    const next = !R.current.votes.me;
    setVotes((v) => ({ ...v, me: next }));
    send.current.rematch?.({ round: R.current.match?.round, vote: next });
  }, []);

  const backToLobby = useCallback(() => {
    if (!isHost) return;
    setPhase("lobby");
    setMeReady(false);
    setResult(null);
    setRival((rv) => (rv ? { ...rv, ready: false } : rv));
    send.current.lobby?.({});
  }, [isHost]);

  /** O 3-2-1 terminou: o componente chama ao dar o "vai!". */
  const markPlaying = useCallback(() => setPhase("playing"), []);

  /** Meu relógio zerou (ou o tempo fixo acabou). */
  const reportOver = useCallback(
    (ms, sum) => {
      const round = R.current.match?.round;
      if (reportedRef.current.over === round) return;
      reportedRef.current.over = round;
      myFinalRef.current = sum;
      send.current.over?.({ round, ms, sum });
      if (isHost) refereeRecord("host", "over", ms, sum);
    },
    [isHost, refereeRecord]
  );

  /** Bati a meta do modo overdrive. */
  const reportGoal = useCallback(
    (ms, sum) => {
      const round = R.current.match?.round;
      if (reportedRef.current.goal === round) return;
      reportedRef.current.goal = round;
      send.current.goal?.({ round, ms, sum });
      if (isHost) refereeRecord("host", "goal", ms, sum);
    },
    [isHost, refereeRecord]
  );

  const setLiveSource = useCallback((fn) => {
    liveSource.current = fn;
  }, []);

  // o anfitrião não marca "pronto": é ele quem aperta "começar"
  const canStart = isHost && phase === "lobby" && !!rival && rival.ready;

  return {
    role,
    rivalRole,
    conn,
    phase,
    settings,
    mode: DUEL_MODES[match?.mode ?? settings.mode],
    rival,
    meReady,
    match,
    score,
    result,
    votes,
    rivalLive,
    slow,
    canStart,
    startRound,
    toggleReady,
    changeSettings,
    voteRematch,
    backToLobby,
    markPlaying,
    reportOver,
    reportGoal,
    setLiveSource,
  };
}
