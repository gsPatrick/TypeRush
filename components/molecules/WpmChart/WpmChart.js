"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./WpmChart.module.css";

/**
 * WPM ao longo da partida (uma série) + marcadores de erro.
 * Um eixo só. Linha 2px, área a 10%, grade hairline sólida, erro como "×"
 * com anel na cor da superfície. Crosshair encaixa no segundo mais próximo.
 */
const H = 200;
const PAD = { top: 16, right: 12, bottom: 28, left: 36 };

function niceMax(v) {
  const step = v <= 60 ? 20 : v <= 150 ? 30 : 50;
  return Math.max(step * 2, Math.ceil((v * 1.1) / step) * step);
}

export default function WpmChart({ series, errorMarks, remainingSeries }) {
  const { t } = useLocale();
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const errorsBySecond = useMemo(() => {
    const map = new Map();
    for (const s of errorMarks) {
      const idx = Math.min(s, series.length - 1);
      map.set(idx, (map.get(idx) || 0) + 1);
    }
    return map;
  }, [errorMarks, series.length]);

  if (series.length < 2) {
    return <p className={styles.empty}>{t.chartEmpty}</p>;
  }

  const yMax = niceMax(Math.max(...series, 1));
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (i / (series.length - 1)) * innerW;
  const y = (v) => PAD.top + innerH - (v / yMax) * innerH;

  const line = series.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = `${line}L${x(series.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const ticks = [0, yMax / 2, yMax];
  const xStep = series.length > 60 ? 15 : series.length > 30 ? 10 : 5;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - PAD.left) / innerW) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };

  const hv = hover !== null ? series[hover] : null;
  const tipLeft = hover !== null ? Math.min(Math.max(x(hover), 70), width - 70) : 0;

  return (
    <figure className={styles.root}>
      <figcaption className={styles.caption}>
        <span>{t.chartTitle}</span>
        <span className={styles.legend}>
          <span className={styles.keyLine} /> wpm
          <span className={styles.keyX}>×</span> {t.chartMiss}
        </span>
      </figcaption>

      <div ref={wrapRef} className={styles.plot}>
        {width > 0 ? (
          <svg
            width={width}
            height={H}
            className={styles.svg}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label={t.chartAria(series.length)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className={styles.grid} />
                <text x={PAD.left - 10} y={y(t)} className={styles.tickY}>
                  {t}
                </text>
              </g>
            ))}
            {series.map((_, i) =>
              (i + 1) % xStep === 0 ? (
                <text key={i} x={x(i)} y={H - 8} className={styles.tickX}>
                  {i + 1}s
                </text>
              ) : null
            )}

            <path d={area} className={styles.area} />
            <path d={line} className={styles.line} />

            {[...errorsBySecond.keys()].map((i) => (
              <g key={i} transform={`translate(${x(i)},${y(series[i])})`} className={styles.err}>
                <path d="M-4,-4L4,4M4,-4L-4,4" className={styles.errRing} />
                <path d="M-4,-4L4,4M4,-4L-4,4" className={styles.errMark} />
              </g>
            ))}

            {hover !== null ? (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} className={styles.cross} />
                <circle cx={x(hover)} cy={y(hv)} r="4.5" className={styles.dot} />
              </g>
            ) : null}
          </svg>
        ) : null}

        {hover !== null ? (
          <div className={styles.tip} style={{ left: tipLeft }}>
            <strong>{hv} wpm</strong>
            <span>{t.chartSecond(hover + 1)}</span>
            {remainingSeries[hover] !== undefined ? (
              <span>{t.chartClock((remainingSeries[hover] / 1000).toFixed(1))}</span>
            ) : null}
            {errorsBySecond.get(hover) ? (
              <span className={styles.tipErr}>
                × {t.chartErrors(errorsBySecond.get(hover))}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* tabela só para leitor de tela — o recorte fica no div: <table> ignora
          height: 1px e esticava a página com ~850px invisíveis */}
      <div className={styles.srOnly}>
      <table>
        <caption>{t.chartTitle}</caption>
        <thead>
          <tr>
            <th scope="col">{t.chartColSecond}</th>
            <th scope="col">wpm</th>
            <th scope="col">{t.errors}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((v, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{v}</td>
              <td>{errorsBySecond.get(i) || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
