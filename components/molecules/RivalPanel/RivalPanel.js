"use client";

import { useEffect, useRef } from "react";
import Avatar from "@/components/atoms/Avatar/Avatar";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./RivalPanel.module.css";

/**
 * Painel compacto do adversário. O relógio dele chega ~6×/s; entre uma
 * mensagem e outra é interpolado localmente (rem − tempo desde a chegada),
 * então anda liso em vez de pular de 160 em 160ms.
 */
export default function RivalPanel({ name, avatar, live, goalMs, playing = true }) {
  const { t } = useLocale();
  const secRef = useRef(null);
  const liveRef = useRef(live);
  liveRef.current = live;

  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const l = liveRef.current;
      if (secRef.current) {
        let ms = l ? l.rem : 0;
        if (l && l.alive) ms = Math.max(0, l.rem - (performance.now() - l.at));
        secRef.current.textContent = l ? (ms / 1000).toFixed(1) : "—";
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // "caiu" só faz sentido com a rodada rolando — depois do resultado o motor
  // do vencedor também é encerrado pelo juiz, e ele não "caiu"
  const down = playing && live && live.alive === false;
  const od = live?.od === 1;
  const goalPct = goalMs && live ? Math.min(1, (live.odt || 0) / goalMs) : null;

  return (
    <div className={`${styles.root} ${down ? styles.down : ""} ${od ? styles.od : ""}`}>
      <Avatar id={avatar} name={name} size={34} tone="rival" />
      <span className={styles.who}>
        <b>{name}</b>
        <small>{!playing ? "\u00a0" : down ? t.duel.rivalDown : t.duel.rivalAlive}</small>
      </span>
      <span className={styles.clock}>
        <span ref={secRef}>—</span>
        <small>s</small>
      </span>
      <span className={styles.stat}>
        <b>{live?.w ?? 0}</b> {t.words}
      </span>
      <span className={styles.stat}>
        <b>{live?.e ?? 0}</b> {t.errors}
      </span>
      {goalPct !== null ? (
        <span className={styles.goal} title={t.duel.goal(goalMs / 1000)}>
          <span style={{ transform: `scaleX(${goalPct})` }} />
        </span>
      ) : null}
    </div>
  );
}
