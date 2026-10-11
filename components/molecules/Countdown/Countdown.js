"use client";

import { useEffect, useRef, useState } from "react";
import * as sfx from "@/lib/audio/sfx";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./Countdown.module.css";

/**
 * 3 · 2 · 1 · vai! — alinhado a `goAt` (performance.now), não a timeouts
 * encadeados: um frame atrasado não empurra o "vai!" de um jogador só.
 */
export default function Countdown({ goAt, onGo }) {
  const { t } = useLocale();
  const [label, setLabel] = useState(null);
  const goneRef = useRef(false);
  const onGoRef = useRef(onGo);
  onGoRef.current = onGo;

  useEffect(() => {
    goneRef.current = false;
    let raf = 0;
    let last = null;
    const frame = () => {
      const left = goAt - performance.now();
      if (left <= 0) {
        if (!goneRef.current) {
          goneRef.current = true;
          setLabel(t.duel.go);
          sfx.playCombo();
          onGoRef.current?.();
          setTimeout(() => setLabel(null), 700);
        }
        return;
      }
      const n = Math.ceil(left / 1000);
      if (n !== last) {
        last = n;
        setLabel(String(n));
        sfx.playTick(n === 1 ? 3 : 2);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [goAt, t]);

  if (!label) return null;
  return (
    <div className={styles.root} aria-live="assertive">
      <span key={label} className={`${styles.n} ${label === t.duel.go ? styles.go : ""}`}>
        {label}
      </span>
    </div>
  );
}
