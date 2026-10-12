import { GAME_CONFIG } from "@/lib/game/config";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./LiveStats.module.css";

/** Linha de métricas ao vivo acima do relógio. */
export default function LiveStats({ wpm, words, errors, streak, combo, active, level = 0, broke = null }) {
  const { t } = useLocale();
  const every = GAME_CONFIG.combo.every;
  const filled = streak % every;
  // sequência "pega fogo" a partir de 5; esquenta em 10, 25 e 50
  const hot = streak >= GAME_CONFIG.streak.hotFrom;
  const heat = streak >= 50 ? 4 : streak >= 25 ? 3 : streak >= 10 ? 2 : hot ? 1 : 0;

  return (
    <div className={`${styles.root} ${active ? styles.active : ""}`}>
      {level ? (
        <div className={styles.item}>
          <span key={level} className={`${styles.value} ${styles.level} ${level > 1 ? styles.levelUp : ""}`}>
            {level}
          </span>
          <span className={styles.label}>{t.level}</span>
        </div>
      ) : null}
      <Item label={t.wpm} value={wpm} />
      <Item label={t.words} value={words} />
      <Item label={t.errors} value={errors} tone={errors > 0 ? "red" : undefined} />
      <div
        key={broke && streak === 0 ? `broke-${broke.id}` : "streak"}
        className={`${styles.item} ${styles.streak} ${heat ? styles[`heat${heat}`] : ""} ${
          broke && streak === 0 ? styles.broke : ""
        }`}
      >
        {hot ? (
          <span className={styles.flame} aria-hidden="true">
            🔥
          </span>
        ) : null}
        {/* key = streak: cada acerto remonta o número e replaya o "bump" */}
        <span key={streak} className={`${styles.value} ${streak > 0 ? styles.bump : ""}`}>
          {streak}
        </span>
        <span className={styles.label}>{t.streak}</span>
        {combo ? (
          <span
            key={streak > 0 && filled === 0 ? `full-${streak}` : "meter"}
            className={`${styles.meter} ${streak > 0 && filled === 0 ? styles.full : ""}`}
            aria-label={t.comboMeter(filled, every)}
          >
            {Array.from({ length: every }, (_, i) => (
              <i key={i} className={i < filled ? styles.on : undefined} />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Item({ label, value, tone }) {
  return (
    <div className={styles.item}>
      <span className={`${styles.value} ${tone ? styles[tone] : ""}`}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
