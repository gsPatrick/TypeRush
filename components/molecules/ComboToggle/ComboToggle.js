import { GAME_CONFIG } from "@/lib/game/config";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./ComboToggle.module.css";

export default function ComboToggle({ enabled, onToggle, disabled }) {
  const { t } = useLocale();
  const { every, bonusMs } = GAME_CONFIG.combo;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      className={styles.root}
      onClick={onToggle}
      disabled={disabled}
      title={t.comboTitle(bonusMs / 1000, every)}
    >
      <span className={`${styles.track} ${enabled ? styles.on : ""}`}>
        <span className={styles.thumb} />
      </span>
      <span className={styles.text}>
        {t.combo} <span className={styles.rule}>+{bonusMs / 1000}s / {every}</span>
      </span>
    </button>
  );
}
