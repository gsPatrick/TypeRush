"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/atoms/Button/Button";
import Kbd from "@/components/atoms/Kbd/Kbd";
import StatBlock from "@/components/molecules/StatBlock/StatBlock";
import WpmChart from "@/components/molecules/WpmChart/WpmChart";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./Results.module.css";

function seconds(ms) {
  return (ms / 1000).toFixed(1);
}

/** Fim de partida: duas métricas-herói, gráfico, grade de estatísticas, ação. */
export default function Results({ outcome, profile, onRestart }) {
  const { t } = useLocale();
  const { result, isRecord, previousBest } = outcome;
  const buttonRef = useRef(null);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Tab" || e.key === "Escape" || (e.key === "Enter" && e.target === document.body)) {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRestart]);

  const best = profile?.best;

  return (
    <section className={styles.root} aria-labelledby="results-title">
      <header className={styles.head}>
        <h1 id="results-title" className={styles.title}>
          {t.timeUp}
        </h1>
        {isRecord ? (
          <span className={styles.record}>
            {t.newRecord}
            {previousBest ? <span> · {t.before} {previousBest.words}</span> : null}
          </span>
        ) : null}
      </header>

      <div className={styles.hero}>
        <div className={styles.heroStats}>
          <StatBlock label={t.wpm} value={result.wpm} size="xl" />
          <StatBlock label={t.accuracy} value={result.accuracy} unit="%" size="xl" />
        </div>
        <WpmChart series={result.series} errorMarks={result.errorMarks} remainingSeries={result.remainingSeries} />
      </div>

      <div className={styles.grid}>
        <StatBlock label={t.peakWpm} value={result.peakWpm} hint={t.peakHint} />
        <StatBlock label={t.correctWords} value={result.correctWords} tone={isRecord ? "lime" : undefined} />
        <StatBlock
          label={t.errors}
          value={result.errors}
          tone={result.errors > 0 ? "red" : undefined}
          hint={result.retrySaves > 0 ? t.saves(result.retrySaves) : undefined}
        />
        <StatBlock
          label={t.survived}
          value={seconds(result.survivedMs)}
          unit="s"
          hint={result.overdrive.bestMs > 0 ? t.overdriveHint(seconds(result.overdrive.bestMs)) : undefined}
        />
        <StatBlock
          label={t.bestStreak}
          value={result.bestStreak}
          hint={result.combos > 0 ? t.combos(result.combos) : undefined}
        />
        <StatBlock
          label={t.personalBest}
          value={best ? best.words : 0}
          unit={t.wordsUnit}
          hint={best ? `${best.wpm} wpm · ${seconds(best.survivedMs)}s` : undefined}
        />
      </div>

      <footer className={styles.actions}>
        <Button ref={buttonRef} onClick={() => onRestart()}>
          {t.playAgain}
        </Button>
        <span className={styles.keys}>
          <Kbd>tab</Kbd> {t.or} <Kbd>esc</Kbd>
        </span>
        {profile ? (
          <span className={styles.totals}>
            {t.totals(profile.totals.games, profile.totals.words, profile.bestWpm)}
          </span>
        ) : null}
      </footer>
    </section>
  );
}
