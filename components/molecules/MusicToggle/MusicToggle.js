import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "@/components/molecules/SoundToggle/SoundToggle.module.css";

/**
 * Nota musical: liga/desliga a musiquinha da sequência (os efeitos sonoros
 * continuam). Com o som geral mudo, fica apagada — não há o que tocar.
 */
export default function MusicToggle({ enabled, onToggle, muted = false }) {
  const { t } = useLocale();
  const on = enabled && !muted;
  const label = on ? t.musicOn : t.musicOff;

  return (
    <button
      type="button"
      className={`${styles.root} ${on ? styles.on : ""}`}
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true" focusable="false">
        <path d="M9 17.5V6l10-2v11.5" className={styles.body} />
        <ellipse cx="6.8" cy="17.6" rx="2.3" ry="1.9" className={styles.body} />
        <ellipse cx="16.8" cy="15.6" rx="2.3" ry="1.9" className={styles.body} />
        {on ? null : <path d="M4 4l16 16" className={styles.wave} />}
      </svg>
    </button>
  );
}
