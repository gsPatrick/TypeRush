import Link from "next/link";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import ComboToggle from "@/components/molecules/ComboToggle/ComboToggle";
import LanguageSwitch from "@/components/molecules/LanguageSwitch/LanguageSwitch";
import ModeNav from "@/components/molecules/ModeNav/ModeNav";
import MusicToggle from "@/components/molecules/MusicToggle/MusicToggle";
import SoundToggle from "@/components/molecules/SoundToggle/SoundToggle";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./Header.module.css";

export default function Header({ combo, onToggleCombo, lang, onChangeLanguage, sound, onToggleSound, music, onToggleMusic, running, best }) {
  const { t } = useLocale();
  return (
    <header className={`${styles.root} ${running ? styles.dim : ""}`}>
      <div className={styles.left}>
        <Link href="/" className={styles.home} aria-label="TypeRush — início">
          <BrandMark className={styles.brand} />
        </Link>
        <ModeNav current="solo" lang={lang} className={styles.modes} />
      </div>
      <div className={styles.right}>
        <LanguageSwitch value={lang} onChange={onChangeLanguage} disabled={running} />
        <ComboToggle enabled={combo} onToggle={onToggleCombo} disabled={running} />
        <span className={styles.audio}>
          <SoundToggle enabled={sound} onToggle={onToggleSound} />
          {onToggleMusic ? <MusicToggle enabled={music} onToggle={onToggleMusic} muted={!sound} /> : null}
        </span>
        <span className={styles.best}>
          <span className={styles.label}>{t.record}</span>
          <span className={styles.value}>{best ? best.words : "—"}</span>
        </span>
      </div>
    </header>
  );
}
