import Reveal from "@/components/molecules/Reveal/Reveal";
import styles from "./ResultShowcase.module.css";

/**
 * Resultado — prévia da tela de fim de partida. Números são um EXEMPLO
 * ilustrativo e estão rotulados assim; nada de métrica inventada de usuários.
 */
const SERIES = [48, 58, 64, 69, 66, 73, 78, 76, 70, 74, 80, 84, 81, 77, 83, 88, 85, 79, 86, 90, 87, 82, 78, 76];
const ERRORS = [8, 17];
const MAX = 100;

const FACTS = [
  ["wpm", "médio e de pico, numa janela de 5 segundos"],
  ["precisão", "por tecla, não por palavra"],
  ["gráfico", "segundo a segundo, com os erros marcados"],
  ["recordes", "salvos no seu navegador — sem cadastro"],
];

export default function ResultShowcase() {
  const pts = SERIES.map((v, i) => [(i / (SERIES.length - 1)) * 100, 100 - (v / MAX) * 100]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("");
  const area = `${line}L100,100L0,100Z`;

  return (
    <section className={styles.section}>
      <Reveal className={styles.copy}>
        <span className={styles.kicker}>depois da partida</span>
        <h2 className={styles.h2}>
          Cada partida
          <br />
          <span className={styles.muted}>
            vira um <span className={styles.nowrap}>raio-x.</span>
          </span>
        </h2>
        <ul className={styles.facts}>
          {FACTS.map(([k, v]) => (
            <li key={k}>
              <b>{k}</b>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className={styles.cardWrap} delay={120}>
        <span className={styles.example}>exemplo de resultado</span>
        <div className={styles.card} aria-label="Exemplo da tela de resultado" role="img">
          <div className={styles.cardHead}>
            <span>tempo esgotado</span>
            <span className={styles.chip}>novo recorde</span>
          </div>

          <div className={styles.hero}>
            <div className={styles.big}>
              <span className={styles.label}>wpm</span>
              <span className={styles.value}>81</span>
              <span className={styles.label}>precisão</span>
              <span className={styles.value}>
                96.4<small>%</small>
              </span>
            </div>
            <div className={styles.chart}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {[0, 50, 100].map((y) => (
                  <line key={y} x1="0" x2="100" y1={y} y2={y} className={styles.grid} vectorEffect="non-scaling-stroke" />
                ))}
                <path d={area} className={styles.area} />
                <path d={line} className={styles.line} vectorEffect="non-scaling-stroke" />
              </svg>
              {ERRORS.map((i) => (
                <span
                  key={i}
                  className={styles.err}
                  style={{ left: `${pts[i][0]}%`, top: `${pts[i][1]}%` }}
                  aria-hidden="true"
                >
                  ×
                </span>
              ))}
            </div>
          </div>

          <div className={styles.stats}>
            {[
              ["wpm máx", "92"],
              ["palavras", "58"],
              ["erros", "3"],
              ["sobreviveu", "47.6s"],
              ["sequência", "24"],
              ["overdrive", "9.1s"],
            ].map(([k, v]) => (
              <div key={k}>
                <span className={styles.label}>{k}</span>
                <span className={`${styles.small} ${k === "erros" ? styles.red : ""}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
