import styles from "./RulesMarquee.module.css";

/**
 * Faixa de regras — recipe marquee-seamless (variante texto).
 * Lista renderizada DUAS vezes + translateX(-50%) = costura invisível.
 */
const RULES = [
  ["30s", "para começar"],
  ["+1s", "por acerto"],
  ["−2s", "por erro"],
  ["60s", "de teto"],
  ["+2s", "a cada 10 seguidos"],
  ["+0,5s", "na segunda chance"],
  ["35s+", "overdrive"],
  ["20s", "e o nível sobe"],
];

export default function RulesMarquee() {
  const items = [...RULES, ...RULES];
  return (
    <section className={styles.section} aria-label="Regras">
      <div className={styles.track}>
        {items.map(([value, label], i) => (
          <span key={i} className={styles.item} aria-hidden={i >= RULES.length}>
            <b>{value}</b> {label}
            <span className={styles.sep}>/</span>
          </span>
        ))}
      </div>
    </section>
  );
}
