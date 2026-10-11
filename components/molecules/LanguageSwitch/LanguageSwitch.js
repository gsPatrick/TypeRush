import Flag from "@/components/atoms/Flag/Flag";
import { LANGUAGES } from "@/lib/game/languages";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./LanguageSwitch.module.css";

/** Seletor de idioma (palavras + interface). Trocar reinicia a partida. */
export default function LanguageSwitch({ value, onChange, disabled }) {
  const { t } = useLocale();

  return (
    <div className={styles.root} role="radiogroup" aria-label={t.langSwitch}>
      {Object.values(LANGUAGES).map((lang) => {
        const active = lang.code === value;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={lang.name}
            title={lang.name}
            className={`${styles.option} ${active ? styles.active : ""}`}
            onClick={() => onChange(lang.code)}
            disabled={disabled}
          >
            <Flag code={lang.code} className={styles.flag} />
            <span className={styles.code}>{lang.code}</span>
          </button>
        );
      })}
    </div>
  );
}
