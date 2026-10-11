"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./OverdriveBlast.module.css";

/**
 * OverdriveBlast — explosão de saída do overdrive.
 *
 * Camadas:   flash radial (tela toda) · partículas · placar da sessão
 * Ancoragem: fixed sobre a página, centrada no relógio (medido no mount)
 * Driver:    tempo — monta, anima ~1.6s, chama onDone
 * Reduced:   sem partículas nem escala; flash e placar só em opacidade
 */
const PARTICLES = 42;

function rand(seed, i) {
  const x = Math.sin(seed * 91.17 + i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function OverdriveBlast({ id, durationMs, best, onDone }) {
  const { t } = useLocale();
  const [origin, setOrigin] = useState(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useLayoutEffect(() => {
    const timer = document.querySelector("[role=timer]");
    const r = timer?.getBoundingClientRect();
    setOrigin(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 3 });
  }, []);

  useEffect(() => {
    // o placar ocupa o lugar do relógio: o relógio recua enquanto ele aparece
    const doc = document.documentElement;
    doc.dataset.blast = "1";
    const release = setTimeout(() => delete doc.dataset.blast, 1250);
    const timeout = setTimeout(() => doneRef.current?.(), 1700);
    return () => {
      clearTimeout(release);
      clearTimeout(timeout);
      delete doc.dataset.blast;
    };
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2 + (rand(id, i) - 0.5) * 0.5;
        const dist = 120 + rand(id + 3, i) * 260;
        return {
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist + 40 * rand(id + 7, i), // leve "gravidade"
          size: 3 + Math.round(rand(id + 5, i) * 6),
          round: rand(id + 9, i) > 0.5,
          bone: i % 4 === 0,
          delay: Math.round(rand(id + 11, i) * 80),
        };
      }),
    [id]
  );

  if (!origin) return null;

  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.flash} style={{ "--x": `${origin.x}px`, "--y": `${origin.y}px` }} />
      <div className={styles.center} style={{ left: origin.x, top: origin.y }}>
        <span className={styles.ring} />
        <span className={`${styles.ring} ${styles.ring2}`} />
        {particles.map((p, i) => (
          <span
            key={i}
            className={`${styles.p} ${p.round ? styles.round : ""} ${p.bone ? styles.bone : ""}`}
            style={{
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}ms`,
            }}
          />
        ))}
        <div className={styles.score}>
          <span className={styles.label}>{best ? t.overdriveBest : t.overdriveBlast}</span>
          <span className={styles.value}>{(durationMs / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
