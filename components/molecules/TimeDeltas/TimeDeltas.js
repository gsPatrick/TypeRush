import styles from "./TimeDeltas.module.css";

function format(ms) {
  const s = Math.abs(ms) / 1000;
  const n = Number.isInteger(s) ? s : s.toFixed(1);
  return `${ms > 0 ? "+" : "−"}${n}s`;
}

/** "+1s" / "−2s" que sobem e somem ao lado do relógio. */
export default function TimeDeltas({ deltas, onDone }) {
  return (
    <div className={styles.root} aria-hidden="true">
      {deltas.map((d) => (
        <span
          key={d.id}
          className={`${styles.delta} ${d.ms > 0 ? styles.gain : styles.loss} ${d.combo ? styles.combo : ""}`}
          onAnimationEnd={() => onDone(d.id)}
        >
          {format(d.ms)}
          {d.combo ? <small>combo</small> : null}
        </span>
      ))}
    </div>
  );
}
