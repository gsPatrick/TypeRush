import { DUEL_MODE_ORDER, DUEL_MODES } from "@/lib/duel/modes";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./ModePicker.module.css";

/** Seleção de modo: cartões com nome + regra. Só o anfitrião edita. */
export default function ModePicker({ value, onChange, disabled }) {
  const { lang, t } = useLocale();
  return (
    <div className={styles.root} role="radiogroup" aria-label={t.duel.mode}>
      {DUEL_MODE_ORDER.map((id) => {
        const m = DUEL_MODES[id];
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled && !active}
            className={`${styles.card} ${active ? styles.active : ""} ${styles[id]}`}
            onClick={() => !disabled && onChange?.(id)}
          >
            <span className={styles.name}>{m.name[lang]}</span>
            <span className={styles.rule}>{m.rule[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}
