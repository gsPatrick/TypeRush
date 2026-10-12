import Link from "next/link";
import Reveal from "@/components/molecules/Reveal/Reveal";
import styles from "@/components/organisms/PlayModes/PlayModes.module.css";

/**
 * Os três cartões de modo (solo · duelo · música), cada um com o modo em
 * miniatura e levando direto a ele. Usado na landing (com entrada animada)
 * e na escolha de modo /jogar (com o número do atalho de teclado).
 * Cor por modo segue o sistema do jogo: lime = você, lavanda = adversário.
 */
const BARS = [0.5, 0.9, 0.35, 0.75, 0.6, 1, 0.45, 0.8, 0.55, 0.7, 0.4, 0.95];

export const MODE_LINKS = ["/rush", "/duel", "/music"];

export default function ModeCards({ reveal = false, numbered = false }) {
  const Wrap = reveal ? Reveal : Plain;
  return (
      <div className={styles.grid}>
        <Wrap>
          <Link href="/rush" className={`${styles.card} ${styles.solo}`}>
            <div className={styles.visual} aria-hidden="true">
              <span className={styles.soloClock}>
                30<small>.0</small>
              </span>
              <span className={styles.soloDeltas}>
                <b>+1s</b>
                <i>−2s</i>
              </span>
            </div>
            <div className={styles.copy}>
              <span className={styles.tag}>
                {numbered ? <kbd className={styles.key}>1</kbd> : null}solo
              </span>
              <h3>Sobrevivência</h3>
              <p>Trinta segundos, palavras sem fim. Acerto devolve tempo, erro tira — e a cada 20s o nível sobe.</p>
              <span className={styles.cta}>jogar →</span>
            </div>
          </Link>
        </Wrap>

        <Wrap delay={90}>
          <Link href="/duel" className={`${styles.card} ${styles.duel}`}>
            <div className={styles.visual} aria-hidden="true">
              <span className={styles.duelRow}>
                <i className={styles.me}>A</i>
                <b className={styles.meScore}>2</b>
                <span className={styles.x}>×</span>
                <b className={styles.rivalScore}>1</b>
                <i className={styles.rival}>B</i>
              </span>
              <span className={styles.duelModes}>sobrevivência · overdrive · livre · morte súbita</span>
            </div>
            <div className={styles.copy}>
              <span className={styles.tag}>
                {numbered ? <kbd className={styles.key}>2</kbd> : null}online · 1×1
              </span>
              <h3>Duelo</h3>
              <p>Crie uma sala, mande o link. Mesmas palavras, dois relógios — quem cair primeiro perde. Revanche com um clique.</p>
              <span className={styles.cta}>criar sala →</span>
            </div>
          </Link>
        </Wrap>

        <Wrap delay={180}>
          <Link href="/music" className={`${styles.card} ${styles.music}`}>
            <div className={styles.visual} aria-hidden="true">
              <span className={styles.eq}>
                {BARS.map((h, i) => (
                  <i key={i} style={{ "--h": h, animationDelay: `${(i % 5) * 0.12}s` }} />
                ))}
              </span>
              <span className={styles.lyric}>
                <b>we're no stran</b>
                <span>gers to love</span>
              </span>
            </div>
            <div className={styles.copy}>
              <span className={styles.tag}>
                {numbered ? <kbd className={styles.key}>3</kbd> : null}música
              </span>
              <h3>Modo música</h3>
              <p>Escolha a música. A letra aparece no tempo do cantor — digite cada linha antes da próxima. Normal ou 3 vidas.</p>
              <span className={styles.cta}>escolher música →</span>
            </div>
          </Link>
        </Wrap>
      </div>
  );
}

function Plain({ children }) {
  return <div>{children}</div>;
}
