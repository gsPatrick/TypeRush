"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Countdown from "@/components/molecules/Countdown/Countdown";
import LiveStats from "@/components/molecules/LiveStats/LiveStats";
import RivalPanel from "@/components/molecules/RivalPanel/RivalPanel";
import DuelResult from "@/components/organisms/DuelResult/DuelResult";
import OverdriveBlast from "@/components/organisms/OverdriveBlast/OverdriveBlast";
import Timer from "@/components/organisms/Timer/Timer";
import WordStream from "@/components/organisms/WordStream/WordStream";
import useTypeRush from "@/hooks/useTypeRush";
import { now } from "@/lib/game/clock";
import { DUEL_MODES } from "@/lib/duel/modes";
import { liveSummary, summarize } from "@/lib/duel/summary";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./DuelPlay.module.css";

/**
 * DuelPlay — o mesmo jogo do modo solo, com o adversário ao vivo.
 *
 * Camadas:   painel do adversário · métricas · relógio · trilha (+ traço do
 *            adversário) · [meta do overdrive] · countdown/resultado por cima
 * Driver:    motor local (useTypeRush em modo duelo) + mensagens da sala
 * Fluxo:     countdown → startNow() no "vai!" → onFinish → reportOver
 *            resultado do juiz chega → forceFinish() se eu ainda estava vivo
 * Mantido montado entre rodadas: a revanche só troca a semente do motor.
 */
const noop = () => {};

export default function DuelPlay({ room, name }) {
  const { t } = useLocale();
  const { match } = room;
  const mode = DUEL_MODES[match.mode];

  const duel = useMemo(
    () => ({ seed: match.seed, config: mode.config, lang: match.lang }),
    [match.seed, match.lang, mode]
  );

  const reportOver = room.reportOver;
  const onFinish = useCallback((result) => reportOver(result.survivedMs, summarize(result)), [reportOver]);
  const game = useTypeRush({ duel, onFinish });

  // revanche: mesma tela, motor novo com a semente nova
  const roundRef = useRef(match.round);
  useEffect(() => {
    if (roundRef.current === match.round) return;
    roundRef.current = match.round;
    game.restart({ duel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.round]);

  // estado ao vivo que a sala transmite ao adversário
  const getEngine = game.getEngine;
  useEffect(() => {
    room.setLiveSource(() => {
      const e = getEngine();
      const at = now();
      const od = e.overdrive(at);
      const s = e.state;
      return {
        rem: Math.round(e.remaining(at)),
        w: s.correctWords,
        e: s.errors,
        i: s.index,
        od: od.active ? 1 : 0,
        odt: Math.round(s.odTotalMs + (od.active ? od.elapsedMs : 0)),
        alive: s.status === "running",
        sum: liveSummary(e, at),
      };
    });
    return () => room.setLiveSource(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // modo overdrive: mede a meta a cada frame do relógio
  const goalFillRef = useRef(null);
  const reportGoal = room.reportGoal;
  const subscribeClock = game.subscribeClock;
  useEffect(() => {
    if (mode.win !== "overdrive") return undefined;
    return subscribeClock((ms, level, od) => {
      const e = getEngine();
      const total = e.state.odTotalMs + (od.active ? od.elapsedMs : 0);
      if (goalFillRef.current) goalFillRef.current.style.transform = `scaleX(${Math.min(1, total / mode.goalMs)})`;
      if (e.state.status === "running" && total >= mode.goalMs) {
        const at = now();
        reportGoal(at - e.state.startAt, liveSummary(e, at));
      }
    });
  }, [mode, subscribeClock, getEngine, reportGoal]);

  // o juiz decidiu: se eu ainda estava jogando, encerra
  const forceFinish = game.forceFinish;
  useEffect(() => {
    if (room.phase === "result") forceFinish();
  }, [room.phase, forceFinish]);

  const onGo = useCallback(() => {
    game.startNow();
    room.markPlaying();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.startNow, room.markPlaying]);

  const rivalIndex = room.rivalLive?.i ?? null;
  const playing = room.phase === "playing";

  return (
    <section className={styles.root} aria-label={t.duel.title}>
      <div className={styles.top}>
        <RivalPanel
          name={room.rival?.name ?? "—"}
          live={room.rivalLive}
          goalMs={mode.win === "overdrive" ? mode.goalMs : null}
          playing={room.phase !== "result"}
        />
      </div>

      <div className={`${styles.arena} ${room.phase === "result" ? styles.faded : ""}`}>
        <LiveStats
          wpm={game.stats.liveWpm}
          words={game.stats.correctWords}
          errors={game.stats.errors}
          streak={game.stats.streak}
          combo={mode.config.combo.bonusMs > 0}
          active={playing}
        />

        <Timer
          subscribeClock={game.subscribeClock}
          deltas={game.deltas}
          onDeltaDone={game.dropDelta}
          overdrive={game.overdrive}
          config={mode.config}
        />

        <WordStream
          ready={game.ready}
          round={game.round}
          words={game.words}
          typed={game.typed}
          verdicts={game.verdicts}
          index={game.index}
          input={game.input}
          status={game.status}
          juice={game.juice}
          canRetry={game.canRetry && mode.id !== "sudden"}
          onInput={game.onInput}
          onSubmit={game.onSubmit}
          onRetry={game.onRetry}
          onRestart={noop}
          rivalIndex={rivalIndex}
        />

        {mode.win === "overdrive" ? (
          <div className={styles.goal}>
            <span className={styles.goalLabel}>{t.duel.goal(mode.goalMs / 1000)}</span>
            <span className={styles.goalTrack}>
              <span ref={goalFillRef} className={styles.goalFill} />
            </span>
          </div>
        ) : (
          <p className={styles.rule}>{mode.rule[match.lang]}</p>
        )}

        {room.phase === "countdown" ? <Countdown goAt={match.goAt} onGo={onGo} /> : null}
      </div>

      {room.phase === "result" && room.result ? (
        <DuelResult room={room} name={name} mine={game.outcome?.result} />
      ) : null}

      {game.blast ? <OverdriveBlast key={game.blast.id} {...game.blast} onDone={game.clearBlast} /> : null}
    </section>
  );
}
