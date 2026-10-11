import styles from "./StatBlock.module.css";

/** Rótulo em micro caixa-alta + valor mono. `tone` colore só o valor. */
export default function StatBlock({ label, value, unit, hint, size = "md", tone }) {
  return (
    <div className={`${styles.root} ${styles[size]}`}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${tone ? styles[tone] : ""}`}>
        {value}
        {unit ? <span className={styles.unit}>{unit}</span> : null}
      </span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}
