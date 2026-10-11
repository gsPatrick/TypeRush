import Link from "next/link";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import ComboToggle from "@/components/molecules/ComboToggle/ComboToggle";
import LanguageSwitch from "@/components/molecules/LanguageSwitch/LanguageSwitch";
import SoundToggle from "@/components/molecules/SoundToggle/SoundToggle";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./Header.module.css";

export default function Header({ combo, onToggleCombo, lang, onChangeLanguage, sound, onToggleSound, running, best }) {
  const { t } = useLocale();
  return (
    <header className={`${styles.root} ${running ? styles.dim : ""}`}>
      <Link href="/" className={styles.home} aria-label="TypeRush — início">
        <BrandMark className={styles.brand} />
      </Link>
      <div className={styles.right}>
        <Link href="/duel" className={styles.duel}>
          {t.duel.nav}
        </Link>
        <LanguageSwitch value={lang} onChange={onChangeLanguage} disabled={running} />
        <ComboToggle enabled={combo} onToggle={onToggleCombo} disabled={running} />
        <SoundToggle enabled={sound} onToggle={onToggleSound} />
        <span className={styles.best}>
          <span className={styles.label}>{t.record}</span>
          <span className={styles.value}>{best ? best.words : "—"}</span>
        </span>
      </div>
    </header>
  );
}
