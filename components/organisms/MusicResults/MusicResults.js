"use client";

import Button from "@/components/atoms/Button/Button";
import StatBlock from "@/components/molecules/StatBlock/StatBlock";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./MusicResults.module.css";

/** Resultado da música: rank carimbado, números e o crédito ao artista. */
export default function MusicResults({ outcome, track, media, onAgain, onAnother }) {
  const { t } = useLocale();
  const m = t.music;
  const { result, isRecord, best } = outcome;

  return (
    <section className={styles.root}>
      <div className={styles.head}>
        <span className={`${styles.rank} ${styles[`r${result.rank}`]}`}>{result.rank}</span>
        <div className={styles.headText}>
          <span className={styles.score}>
            {result.score}
            <small> {m.score}</small>
          </span>
          {isRecord ? <span className={styles.record}>{m.newBest}</span> : <span className={styles.best}>{m.best}: {best?.score}</span>}
        </div>
      </div>

      <div className={styles.grid}>
        <StatBlock label={m.completion} value={result.completion} unit="%" />
        <StatBlock label={m.perfectLines} value={`${result.perfects}/${result.lines}`} />
        <StatBlock label={m.bestStreak} value={result.bestStreak} />
        <StatBlock label={t.accuracy} value={result.accuracy} unit="%" />
        <StatBlock label={t.wpm} value={result.wpm} />
      </div>

      <div className={styles.actions}>
        <Button size="lg" onClick={onAgain}>
          {m.playAgain}
        </Button>
        <Button variant="ghost" onClick={onAnother}>
          {m.another}
        </Button>
      </div>
    </section>
  );
}
