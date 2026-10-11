import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./SoundToggle.module.css";

/** Alto-falante: ondas quando ligado, × quando mudo. */
export default function SoundToggle({ enabled, onToggle }) {
  const { t } = useLocale();
  const label = enabled ? t.soundOn : t.soundOff;

  return (
    <button
      type="button"
      className={`${styles.root} ${enabled ? styles.on : ""}`}
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true" focusable="false">
        <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" className={styles.body} />
        {enabled ? (
          <>
            <path d="M15.2 9.2a4 4 0 0 1 0 5.6" className={styles.wave} />
            <path d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4" className={styles.wave} />
          </>
        ) : (
          <path d="M15.5 9.5l5 5m0-5l-5 5" className={styles.wave} />
        )}
      </svg>
    </button>
  );
}
