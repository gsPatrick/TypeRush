"use client";

import { useEffect, useRef } from "react";
import Avatar from "@/components/atoms/Avatar/Avatar";
import Button from "@/components/atoms/Button/Button";
import Kbd from "@/components/atoms/Kbd/Kbd";
import * as sfx from "@/lib/audio/sfx";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./DuelResult.module.css";

/** Resultado do duelo: veredito, motivo, os dois lado a lado, placar, revanche. */
export default function DuelResult({ room, name, avatar, mine }) {
  const { t } = useLocale();
  const d = t.duel;
  const { result, role, rivalRole } = room;
  const rivalName = room.rival?.name ?? "—";

  const outcome = result.winner === null ? "tie" : result.winner === role ? "win" : "lose";
  const title = outcome === "win" ? d.win : outcome === "lose" ? d.lose : d.tie;

  let reason;
  if (outcome === "tie") reason = d.reason.tie();
  else if (result.reason === "survive") {
    const loser = outcome === "win" ? rivalName : d.you;
    reason = room.mode.id === "sudden" ? d.reason.sudden(loser) : d.reason.survive(loser);
  }
  else if (result.reason === "goal") reason = d.reason.goal(outcome === "win" ? d.you : rivalName);
  else reason = d.reason[result.reason]?.() ?? "";
  reason = reason.charAt(0).toUpperCase() + reason.slice(1);

  // o meu lado: prefiro o resultado completo do meu motor
  const me = mine
    ? { words: mine.correctWords, errors: mine.errors, wpm: mine.wpm, accuracy: mine.accuracy, survivedMs: mine.survivedMs }
    : result.stats?.[role];
  const rival = result.stats?.[rivalRole] ?? room.rivalLive?.sum ?? null;

  const playedRef = useRef(null);
  useEffect(() => {
    if (playedRef.current === result.round) return;
    playedRef.current = result.round;
    if (outcome === "win") sfx.playEnd(true);
    else if (outcome === "lose") sfx.playEnd(false);
    else sfx.playRetry();
  }, [outcome, result.round]);

  // Sem foco automático no botão: quem estava digitando rápido continua
  // batendo espaço por inércia, e espaço num botão focado é clique — a
  // revanche era votada sem querer. Atalho é só Enter, e só depois de 700ms.
  const voteRematch = room.voteRematch;
  const canVote = !!room.rival;
  useEffect(() => {
    const shownAt = performance.now();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const onKey = (e) => {
      if (e.key !== "Enter" || !canVote || performance.now() - shownAt < 700) return;
      if (e.target instanceof HTMLElement && e.target.closest("button, a")) return; // botão focado trata o próprio Enter
      e.preventDefault();
      voteRematch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [voteRematch, canVote]);

  const rows = [
    ["survived", t.survived, (s) => `${(s.survivedMs / 1000).toFixed(1)}s`],
    ["words", t.correctWords, (s) => s.words],
    ["errors", t.errors, (s) => s.errors],
    ["wpm", t.wpm, (s) => s.wpm],
    ["accuracy", t.accuracy, (s) => `${s.accuracy}%`],
  ];

  return (
    <div className={`${styles.root} ${styles[outcome]}`} role="dialog" aria-labelledby="duel-verdict">
      <h2 id="duel-verdict" className={styles.verdict}>
        {title}
      </h2>
      <p className={styles.reason}>{reason}</p>

      <div className={styles.score}>
        <Avatar id={avatar} name={name} size={44} tone="me" />
        <span className={styles.me}>{name}</span>
        <b className={styles.meScore}>{room.score[role]}</b>
        <span className={styles.x}>×</span>
        <b className={styles.rivalScore}>{room.score[rivalRole]}</b>
        <span className={styles.rivalName}>{rivalName}</span>
        <Avatar id={room.rival?.avatar} name={rivalName} size={44} tone="rival" />
      </div>

      {me || rival ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th />
              <th className={styles.colMe}>{d.you}</th>
              <th className={styles.colRival}>{rivalName}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, label, fmt]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{me ? fmt(me) : "—"}</td>
                <td>{rival ? fmt(rival) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <div className={styles.actions}>
        {room.rival ? (
          <Button size="lg" variant={room.votes.me ? "ghost" : "primary"} onClick={room.voteRematch}>
            {room.votes.me ? d.rematchWaiting : d.rematch}
          </Button>
        ) : null}
        {room.role === "host" ? (
          <Button variant="ghost" onClick={room.backToLobby}>
            {d.changeMode}
          </Button>
        ) : null}
        {room.votes.rival && !room.votes.me ? (
          <span className={styles.nudge}>
            <b>{rivalName}</b> {d.rivalWantsRematch}
          </span>
        ) : null}
        {room.rival ? (
          <span className={styles.keys}>
            <Kbd>enter</Kbd>
          </span>
        ) : null}
      </div>
    </div>
  );
}
