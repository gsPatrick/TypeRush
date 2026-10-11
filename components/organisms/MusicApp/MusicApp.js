"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import LanguageSwitch from "@/components/molecules/LanguageSwitch/LanguageSwitch";
import ModeNav from "@/components/molecules/ModeNav/ModeNav";
import MusicSearch from "@/components/organisms/MusicSearch/MusicSearch";
import MusicSession from "@/components/organisms/MusicSession/MusicSession";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { DEFAULT_LANG } from "@/lib/game/languages";
import { loadPrefs, savePrefs } from "@/lib/game/storage";
import styles from "./MusicApp.module.css";

/** /music — busca → sessão (preparo · jogo · resultado). */
export default function MusicApp() {
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    setLang(loadPrefs().lang);
  }, []);

  const changeLang = (l) => {
    setLang(l);
    savePrefs({ lang: l });
  };

  return (
    <LocaleProvider lang={lang}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.home} aria-label="TypeRush">
            <BrandMark />
          </Link>
          <ModeNav current="music" lang={lang} className={styles.nav} />
          <LanguageSwitch value={lang} onChange={changeLang} />
        </header>
        <main className={styles.main}>
          {picked ? (
            <MusicSession key={picked.id} pick={picked} onBack={() => setPicked(null)} />
          ) : (
            <MusicSearch onPick={setPicked} />
          )}
        </main>
      </div>
    </LocaleProvider>
  );
}
