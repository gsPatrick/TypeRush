"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GROOVE_BPM } from "@/lib/audio/sfx";
import { GAME_CONFIG, streakTier } from "@/lib/game/config";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./StreakMeter.module.css";

/**
 * Medidor da sequência — fica na tela enquanto o jogador não erra.
 *
 * Liga junto com o groove (5 seguidas) e pulsa no mesmo andamento da batida.
 * Mostra o número grande, o nome da fase e a barra até a próxima; as bordas
 * da tela acendem cada vez mais forte. No erro, o número racha ao meio, as
 * bordas piscam vermelho e tudo some.
 */
const SHATTER_MS = 1400;

export default function StreakMeter({ streak, broke }) {
  const { t } = useLocale();
  const tiers = GAME_CONFIG.streak.tiers;
  const tier = streakTier(streak);
  const [shatter, setShatter] = useState(null);

  useEffect(() => {
    if (!broke) return undefined;
    setShatter(broke);
    const id = setTimeout(() => setShatter(null), SHATTER_MS);
    return () => clearTimeout(id);
  }, [broke]);

  const beat = { "--beat": `${60 / GROOVE_BPM}s` };

  if (tier === 0) {
    if (!shatter) return null;
    return (
      <div className={`${styles.root} ${styles.shatter}`} style={beat} role="status">
        <Aura className={`${styles.aura} ${styles.auraBroke}`} style={beat} />
        <div className={styles.count} aria-hidden="true">
          <b className={styles.halfA}>{shatter.streak}</b>
          <b className={styles.halfB}>{shatter.streak}</b>
        </div>
        <span className={styles.brokeLabel}>{t.streakBroke}</span>
      </div>
    );
  }

  const from = tiers[tier - 1];
  const to = tiers[tier];
  const progress = to ? (streak - from) / (to - from) : 1;

  return (
    <div className={`${styles.root} ${styles[`t${tier}`]}`} style={beat} aria-label={t.streakHot(streak)}>
      <Aura className={`${styles.aura} ${styles[`aura${tier}`]}`} style={beat} />
      <div className={styles.count}>
        <b key={streak} className={styles.num}>
          {streak}
        </b>
        <small>{t.inARow}</small>
      </div>
      <span key={`tier${tier}`} className={styles.tierName}>
        {t.streakTiers[tier - 1]}
      </span>
      <span className={styles.bar} aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </span>
    </div>
  );
}

/** Bordas da tela: vai direto no <body> — dentro do medidor (que tem
 *  transform) o position: fixed ficaria preso numa caixa. */
function Aura({ className, style }) {
  return createPortal(<span className={className} style={style} aria-hidden="true" />, document.body);
}
