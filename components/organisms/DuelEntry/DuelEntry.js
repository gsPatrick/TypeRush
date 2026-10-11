"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import Button from "@/components/atoms/Button/Button";
import LanguageSwitch from "@/components/molecules/LanguageSwitch/LanguageSwitch";
import ModeNav from "@/components/molecules/ModeNav/ModeNav";
import ModePicker from "@/components/molecules/ModePicker/ModePicker";
import { DEFAULT_MODE } from "@/lib/duel/modes";
import { cleanName, loadName, newRoomCode, normalizeCode } from "@/lib/duel/room";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./DuelEntry.module.css";

/**
 * Entrada do duelo. Duas situações:
 * - sem código: criar sala (modo + idioma) ou entrar com código
 * - chegou por link (?sala=CODE): só pede o nome e entra
 */
export default function DuelEntry({ lang, onLangChange, presetCode, presetHost, onEnter }) {
  const { t } = useLocale();
  const d = t.duel;
  const [name, setName] = useState("");
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    setName(loadName() || `${t.duel.you === "você" ? "Jogador" : "Player"} ${Math.floor(100 + Math.random() * 900)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validName = cleanName(name).length > 0;

  const create = () => {
    if (!validName) return;
    onEnter({ code: newRoomCode(), name: cleanName(name), host: true, mode, lang });
  };

  const join = (code) => {
    const c = normalizeCode(code);
    if (!validName || c.length < 4) return;
    onEnter({ code: c, name: cleanName(name), host: !!presetHost && c === presetCode, mode: null, lang });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.home} aria-label="TypeRush">
          <BrandMark />
        </Link>
        <ModeNav current="duel" lang={lang} className={styles.modes} />
        <LanguageSwitch value={lang} onChange={onLangChange} />
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <span className={styles.kicker}>{d.nav}</span>
          <h1 className={styles.h1}>{d.title}</h1>
          <p className={styles.lede}>{d.lede}</p>
          <p className={styles.note}>{d.p2pNote}</p>
        </div>

        <div className={styles.panel}>
          <label className={styles.field}>
            <span className={styles.label}>{d.yourName}</span>
            <input
              className={styles.input}
              value={name}
              maxLength={18}
              placeholder={d.namePlaceholder}
              onChange={(e) => setName(e.target.value)}
              autoComplete="nickname"
            />
          </label>

          {presetCode ? (
            <section className={styles.block}>
              <p className={styles.joining}>
                {d.code} <b>{presetCode}</b>
              </p>
              <Button size="lg" onClick={() => join(presetCode)} disabled={!validName} className={styles.full}>
                {d.join} <span aria-hidden="true">→</span>
              </Button>
            </section>
          ) : (
            <>
              <section className={styles.block}>
                <span className={styles.label}>{d.mode}</span>
                <ModePicker value={mode} onChange={setMode} />
                <Button size="lg" onClick={create} disabled={!validName} className={styles.full}>
                  {d.create} <span aria-hidden="true">→</span>
                </Button>
              </section>

              <section className={styles.block}>
                <span className={styles.divider}>{d.or}</span>
                <form
                  className={styles.joinRow}
                  onSubmit={(e) => {
                    e.preventDefault();
                    join(joinCode);
                  }}
                >
                  <input
                    className={`${styles.input} ${styles.code}`}
                    value={joinCode}
                    placeholder={d.codePlaceholder}
                    onChange={(e) => setJoinCode(normalizeCode(e.target.value))}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label={d.codePlaceholder}
                  />
                  <Button variant="ghost" type="submit" disabled={!validName || joinCode.length < 4}>
                    {d.join}
                  </Button>
                </form>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
