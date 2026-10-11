"use client";

import { useEffect, useRef } from "react";
import { GAME_CONFIG } from "@/lib/game/config";
import TimeDeltas from "@/components/molecules/TimeDeltas/TimeDeltas";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./Timer.module.css";

/**
 * Timer — o momento da página.
 *
 * Camadas:   número (segundos + décimos) · deltas flutuantes · trilho de reserva
 * Driver:    relógio do motor via subscribeClock (rAF) — escreve no DOM direto,
 *            zero re-render React por frame
 * Estados:   contínuo (--tension 0..1 nos últimos 10s) + discreto (data-level
 *            0..3) para cor e pulso
 * Overdrive: acima de 35s o número fica lime, sai uma onda de choque e,
 *            à esquerda (espelhando os deltas), aparece o cronômetro da
 *            sessão. data-overdrive = off | on | grace (tolerância: pisca).
 * Reduced:   pulso, tremor e onda desligados; cor e reserva continuam
 */
export default function Timer({ subscribeClock, deltas, onDeltaDone, overdrive }) {
  const { t } = useLocale();
  const rootRef = useRef(null);
  const secRef = useRef(null);
  const tenthRef = useRef(null);
  const fillRef = useRef(null);
  const odTimeRef = useRef(null);
  const last = useRef({ sec: -1, tenth: -1, level: -1, od: "", odText: "" });

  useEffect(() => {
    const doc = document.documentElement;
    const unsubscribe = subscribeClock((ms, level, od) => {
      const sec = Math.floor(ms / 1000);
      const tenth = Math.floor((ms % 1000) / 100);
      const l = last.current;

      if (sec !== l.sec) secRef.current.textContent = String(sec);
      if (tenth !== l.tenth) tenthRef.current.textContent = `.${tenth}`;
      if (level !== l.level) {
        rootRef.current.dataset.level = String(level);
        doc.dataset.tension = String(level);
      }
      const odState = !od?.active ? "off" : od.grace ? "grace" : "on";
      if (odState !== l.od) {
        rootRef.current.dataset.overdrive = odState;
        doc.dataset.overdrive = odState;
      }
      const odText = od?.active ? `${(od.elapsedMs / 1000).toFixed(1)}s` : l.odText;
      if (odText !== l.odText) odTimeRef.current.textContent = odText;

      last.current = { sec, tenth, level, od: odState, odText };

      const tension = Math.min(Math.max(1 - ms / GAME_CONFIG.tension.warn, 0), 1);
      doc.style.setProperty("--tension", tension.toFixed(3));
      fillRef.current.style.transform = `scaleX(${(ms / GAME_CONFIG.maxMs).toFixed(4)})`;
    });

    return () => {
      unsubscribe();
      doc.style.removeProperty("--tension");
      delete doc.dataset.tension;
      delete doc.dataset.overdrive;
    };
  }, [subscribeClock]);

  // Tremor curto a cada penalidade
  const lastLoss = deltas.filter((d) => d.ms < 0).at(-1)?.id;
  useEffect(() => {
    if (!lastLoss) return;
    const el = rootRef.current;
    el.classList.remove(styles.shake);
    void el.offsetWidth; // reinicia a animação
    el.classList.add(styles.shake);
  }, [lastLoss]);

  // Onda de choque ao entrar no overdrive
  const enterId = overdrive?.active ? overdrive.id : 0;
  useEffect(() => {
    if (!enterId) return;
    const el = rootRef.current;
    el.classList.remove(styles.odEnter);
    void el.offsetWidth;
    el.classList.add(styles.odEnter);
  }, [enterId]);

  const startSec = GAME_CONFIG.startMs / 1000;
  const thresholdPct = (GAME_CONFIG.overdrive.thresholdMs / GAME_CONFIG.maxMs) * 100;

  return (
    <div className={styles.root} ref={rootRef} data-level="0" data-overdrive="off">
      <div className={styles.readout} role="timer" aria-label={t.timerLabel}>
        <span ref={secRef} className={styles.sec}>{startSec}</span>
        <span ref={tenthRef} className={styles.tenth}>.0</span>
        <TimeDeltas deltas={deltas} onDone={onDeltaDone} />
        <span className={styles.od} aria-live="polite">
          <span className={styles.odLabel}>{t.overdrive}</span>
          <span ref={odTimeRef} className={styles.odTime}>0.0s</span>
        </span>
        <span className={styles.shock} aria-hidden="true" />
      </div>
      <div className={styles.reserve} aria-hidden="true">
        <span ref={fillRef} className={styles.fill} style={{ transform: `scaleX(${GAME_CONFIG.startMs / GAME_CONFIG.maxMs})` }} />
        <span className={styles.threshold} style={{ left: `${thresholdPct}%` }} />
        <span className={styles.cap}>{GAME_CONFIG.maxMs / 1000}s</span>
      </div>
    </div>
  );
}
