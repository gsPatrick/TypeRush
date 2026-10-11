import Flag from "@/components/atoms/Flag/Flag";
import Kbd from "@/components/atoms/Kbd/Kbd";
import Reveal from "@/components/molecules/Reveal/Reveal";
import styles from "./Mechanics.module.css";

/**
 * Mecânicas — grid assimétrico, um foco: overdrive ocupa a coluna grande.
 * Cada bloco mostra a mecânica em miniatura (não ícone + texto genérico).
 */
export default function Mechanics() {
  return (
    <section id="mecanicas" className={styles.section}>
      <Reveal as="header" className={styles.head}>
        <span className={styles.kicker}>mecânicas</span>
        <h2 className={styles.h2}>
          Simples de entender.
          <br />
          <span className={styles.muted}>Difícil de largar.</span>
        </h2>
      </Reveal>

      <div className={styles.grid}>
        <Reveal className={`${styles.tile} ${styles.overdrive}`}>
          <div className={styles.odVisual} aria-hidden="true">
            <span className={styles.odLabel}>
              overdrive <b>8.2s</b>
            </span>
            <span className={styles.odNumber}>
              41<span>.3</span>
            </span>
            <span className={styles.odBar}>
              <span />
            </span>
          </div>
          <div className={styles.copy}>
            <h3>Overdrive</h3>
            <p>
              Passe de 35 segundos e a tela acende. Um segundo cronômetro conta quanto tempo você se mantém lá em
              cima. Quando cair, explode.
            </p>
          </div>
        </Reveal>

        <Reveal className={styles.tile} delay={80}>
          <div className={styles.combo} aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${i * 0.22}s` }} />
            ))}
            <b>+2s</b>
          </div>
          <div className={styles.copy}>
            <h3>Combo</h3>
            <p>Dez acertos seguidos valem dois segundos extras. E o som sobe uma nota a cada palavra.</p>
          </div>
        </Reveal>

        <Reveal className={styles.tile} delay={160}>
          <div className={styles.retry} aria-hidden="true">
            <span className={styles.wrongWord}>relogio</span>
            <Kbd>⌫</Kbd>
            <b>+0,5s</b>
          </div>
          <div className={styles.copy}>
            <h3>Segunda chance</h3>
            <p>Errou? Backspace volta para a palavra. Acertando agora, recupera meio segundo.</p>
          </div>
        </Reveal>

        <Reveal className={`${styles.tile} ${styles.wide}`} delay={120}>
          <div className={styles.langs} aria-hidden="true">
            <Flag code="pt" className={styles.flag} />
            <Flag code="en" className={styles.flag} />
            <span className={styles.accents}>ç ã é ô ü</span>
          </div>
          <div className={styles.copy}>
            <h3>Português de verdade. E inglês.</h3>
            <p>
              Acentos e cedilha contam como devem — inclusive acento morto e teclado de celular. Recordes separados
              por idioma.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
