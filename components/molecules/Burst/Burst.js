import { memo } from "react";
import styles from "./Burst.module.css";

/**
 * Faíscas radiais saindo da palavra acertada. Puro CSS: cada faísca é um
 * traço girado no seu ângulo que corre para fora e some.
 *   kind: "correct" (8) · "save" (6) · "combo" (14 + anel)
 * Ângulos com variação determinística pelo `id`: cada burst parece único,
 * mas re-render não sorteia de novo.
 */
const COUNT = { correct: 8, save: 6, combo: 14 };
const DIST = { correct: 22, save: 18, combo: 40 };

function jitter(seed, i) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Burst({ id, x, y, kind }) {
  const n = COUNT[kind] || 8;
  const dist = DIST[kind] || 22;

  return (
    <span className={`${styles.root} ${styles[kind] || ""}`} style={{ left: x, top: y }} aria-hidden="true">
      {kind === "combo" ? <span className={styles.ring} /> : null}
      {Array.from({ length: n }, (_, i) => {
        const angle = (360 / n) * i + (jitter(id, i) - 0.5) * (300 / n);
        const d = dist * (0.75 + jitter(id + 1, i) * 0.5);
        return <span key={i} className={styles.spark} style={{ "--a": `${angle}deg`, "--d": `${d}px` }} />;
      })}
    </span>
  );
}

export default memo(Burst);
