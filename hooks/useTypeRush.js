"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createEngine } from "@/lib/game/engine";
import { now, tensionLevel } from "@/lib/game/clock";
import { DEFAULT_LANG, LANGUAGES } from "@/lib/game/languages";
import { loadPrefs, loadProfile, recordGame, savePrefs } from "@/lib/game/storage";
import * as sfx from "@/lib/audio/sfx";

/**
 * Ponte entre o motor (lib/game/engine) e a interface.
 *
 * Contrato de performance:
 * - O relógio NÃO passa por estado React. Um loop rAF lê o prazo e entrega
 *   `remaining` aos assinantes (`subscribeClock`), que escrevem direto no DOM.
 * - Re-render só acontece em eventos de jogo: tecla, envio, fim, reinício.
 * - O WPM ao vivo vira estado no máximo 4×/s, e só se o número mudar.
 */
export default function useTypeRush() {
  const [combo, setCombo] = useState(true);
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [sound, setSound] = useState(true);
  // último evento de palavra — dispara o "juice" visual na trilha
  const [juice, setJuice] = useState(null);
  // overdrive: estado só muda na entrada/saída; o cronômetro da sessão vai
  // pelo subscribeClock, como o relógio principal
  const [overdrive, setOverdrive] = useState({ active: false, id: 0 });
  const [blast, setBlast] = useState(null);
  const engineRef = useRef(null);
  if (engineRef.current === null) engineRef.current = createEngine({ combo: true });

  const [, bump] = useReducer((x) => x + 1, 0);
  const [round, setRound] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [deltas, setDeltas] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [profile, setProfile] = useState(null);
  // palavras são aleatórias: só renderizam no cliente, senão a hidratação diverge
  const [ready, setReady] = useState(false);

  const listeners = useRef(new Set());
  const deltaId = useRef(0);

  // perfil só no cliente — evita divergência de hidratação
  useEffect(() => {
    const prefs = loadPrefs();
    setLang(prefs.lang);
    setCombo(prefs.combo);
    setSound(prefs.sound);
    sfx.setSoundEnabled(prefs.sound);
    setProfile(loadProfile(prefs.lang));
    engineRef.current = createEngine({ combo: prefs.combo, pool: LANGUAGES[prefs.lang].words });
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGUAGES[lang].htmlLang;
  }, [lang]);

  useEffect(() => sfx.installAudioUnlock(), []);

  const emitClock = useCallback((at) => {
    const ms = engineRef.current.remaining(at);
    const level = tensionLevel(ms);
    const od = engineRef.current.overdrive(at);
    listeners.current.forEach((fn) => fn(ms, level, od));
  }, []);

  const subscribeClock = useCallback(
    (fn) => {
      listeners.current.add(fn);
      emitClock(now());
      return () => listeners.current.delete(fn);
    },
    [emitClock]
  );

  const finalize = useCallback(() => {
    const result = engineRef.current.result();
    const saved = recordGame(result, lang);
    setProfile(saved.profile);
    setOutcome({ result, isRecord: saved.isRecord, previousBest: saved.previousBest });
    sfx.playEnd(saved.isRecord);
    setOverdrive((o) => (o.active ? { active: false, id: o.id } : o));
    setLiveWpm(0);
    emitClock(now());
    bump();
  }, [emitClock, lang]);

  const handleEvents = useCallback(
    (events) => {
      let ended = false;
      const fresh = [];
      let lastJuice = null;
      for (const ev of events) {
        if (ev.type === "end") ended = true;
        if (ev.type === "retry") {
          sfx.playRetry();
          lastJuice = { id: ++deltaId.current, index: ev.index, kind: "retry" };
        }
        if (ev.type === "submit") {
          if (ev.deltaMs !== 0) fresh.push({ id: ++deltaId.current, ms: ev.deltaMs, combo: ev.combo });
          let kind = "wrong";
          if (ev.correct) kind = ev.combo ? "combo" : ev.retry ? "save" : "correct";
          const inOverdrive = engineRef.current.state.od.active;
          if (kind === "combo") sfx.playCombo();
          else if (kind === "save") sfx.playRetrySave();
          else if (kind === "correct") sfx.playCorrect(ev.streak, inOverdrive);
          else sfx.playWrong();
          lastJuice = { id: ++deltaId.current, index: ev.index, kind, streak: ev.streak };
        }
        if (ev.type === "overdrive-start") {
          sfx.playOverdriveStart();
          setOverdrive({ active: true, id: ++deltaId.current });
        }
        if (ev.type === "overdrive-end") {
          sfx.playOverdriveEnd(ev.blast);
          setOverdrive({ active: false, id: ++deltaId.current });
          if (ev.blast) setBlast({ id: deltaId.current, durationMs: ev.durationMs, best: ev.best });
        }
      }
      if (fresh.length) setDeltas((d) => d.concat(fresh).slice(-6));
      if (lastJuice) setJuice(lastJuice);
      if (ended) finalize();
      else bump();
    },
    [finalize]
  );

  const status = engineRef.current.state.status;

  // Loop do relógio: só roda durante a partida.
  useEffect(() => {
    if (status !== "running") return undefined;
    let raf = 0;
    let lastWpmAt = 0;
    let lastTickSec = -1;

    const frame = () => {
      const at = now();
      const engine = engineRef.current;
      const { ended, events } = engine.tick(at);
      emitClock(at);
      if (ended) {
        finalize();
        return;
      }
      if (events.length) handleEvents(events);
      const left = engine.remaining(at);
      if (left <= 5000) {
        const sec = Math.ceil(left / 1000);
        if (sec !== lastTickSec) {
          if (lastTickSec !== -1) sfx.playTick(tensionLevel(left));
          lastTickSec = sec;
        }
      } else {
        lastTickSec = -1;
      }
      if (at - lastWpmAt > 250) {
        lastWpmAt = at;
        setLiveWpm(engine.liveWpm(at)); // mesmo valor = React não re-renderiza
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [status, emitClock, finalize, handleEvents]);

  const onInput = useCallback(
    (value, composing) => {
      handleEvents(engineRef.current.input(value, { composing, at: now() }));
    },
    [handleEvents]
  );

  const onSubmit = useCallback(() => {
    handleEvents(engineRef.current.submit(now()));
  }, [handleEvents]);

  /** true se consumiu o Backspace (havia retry disponível). */
  const onRetry = useCallback(() => {
    const events = engineRef.current.retry(now());
    if (events.length) handleEvents(events);
    return events.some((e) => e.type === "retry");
  }, [handleEvents]);

  const restart = useCallback(
    ({ combo: nextCombo = combo, lang: nextLang = lang } = {}) => {
      engineRef.current = createEngine({ combo: nextCombo, pool: LANGUAGES[nextLang].words });
      setOutcome(null);
      setDeltas([]);
      setJuice(null);
      setOverdrive({ active: false, id: 0 });
      setBlast(null);
      setLiveWpm(0);
      setRound((r) => r + 1);
      emitClock(now());
    },
    [combo, lang, emitClock]
  );

  const toggleCombo = useCallback(() => {
    const next = !combo;
    setCombo(next);
    savePrefs({ combo: next });
    // trocar a regra no meio da partida seria trapaça — reinicia
    restart({ combo: next });
  }, [combo, restart]);

  const toggleSound = useCallback(() => {
    const next = !sound;
    setSound(next);
    sfx.setSoundEnabled(next);
    savePrefs({ sound: next });
    if (next) sfx.playCorrect(3); // confirma que ligou
  }, [sound]);

  const changeLanguage = useCallback(
    (next) => {
      if (next === lang || !LANGUAGES[next]) return;
      setLang(next);
      savePrefs({ lang: next });
      setProfile(loadProfile(next)); // recorde é por idioma
      restart({ lang: next });
    },
    [lang, restart]
  );

  const clearBlast = useCallback(() => setBlast(null), []);

  const dropDelta = useCallback((id) => {
    setDeltas((d) => d.filter((x) => x.id !== id));
  }, []);

  const s = engineRef.current.state;

  return {
    ready,
    round,
    status: s.status,
    words: s.words,
    typed: s.typed,
    verdicts: s.verdicts,
    index: s.index,
    input: s.input,
    composing: s.composing,
    stats: {
      liveWpm,
      correctWords: s.correctWords,
      errors: s.errors,
      streak: s.streak,
    },
    combo,
    lang,
    sound,
    juice,
    overdrive,
    blast,
    clearBlast,
    canRetry: engineRef.current.canRetry(),
    deltas,
    outcome,
    profile,
    subscribeClock,
    onInput,
    onSubmit,
    onRetry,
    toggleSound,
    restart,
    toggleCombo,
    changeLanguage,
    dropDelta,
  };
}
