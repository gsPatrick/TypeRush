import styles from "./BrandMark.module.css";

/**
 * Marca TypeRush — mostrador (anel) atravessado pelo cursor de texto.
 * Duas primitivas, centro exato em 12/12: o anel é o relógio, a barra é o
 * caret. Anel em contorno, caret em preenchimento.
 */
export default function BrandMark({ className = "", title, lead = "type", tail = "rush", showWord = true }) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(" ")}>
      <svg
        className={styles.symbol}
        viewBox="0 0 24 24"
        role={title && !showWord ? "img" : undefined}
        aria-hidden={title && !showWord ? undefined : true}
        focusable="false"
      >
        {title && !showWord ? <title>{title}</title> : null}
        <circle className={styles.dial} cx="12" cy="12" r="9.2" fill="none" strokeWidth="1.5" />
        <rect className={styles.caret} x="11.25" y="7.4" width="1.5" height="9.2" rx="0.75" />
      </svg>
      {showWord ? (
        <span className={styles.word}>
          {lead}
          <em>{tail}</em>
        </span>
      ) : null}
    </span>
  );
}
