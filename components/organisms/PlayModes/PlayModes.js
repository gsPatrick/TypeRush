import Link from "next/link";
import Reveal from "@/components/molecules/Reveal/Reveal";
import styles from "./PlayModes.module.css";

/**
 * Três jeitos de jogar — cada cartão mostra o modo em miniatura (não ícone)
 * e leva direto a ele. Cor por modo segue o sistema do jogo: lime = você,
 * lavanda = adversário, bone = música (a capa de cada música dá a cor lá).
 */
const BARS = [0.5, 0.9, 0.35, 0.75, 0.6, 1, 0.45, 0.8, 0.55, 0.7, 0.4, 0.95];

export default function PlayModes() {
  return (
    <section id="modos" className={styles.section}>
      <Reveal as="header" className={styles.head}>
        <span className={styles.kicker}>modos</span>
        <h2 className={styles.h2}>
          Três jeitos de jogar.
          <br />
          <span className={styles.muted}>O mesmo relógio implacável.</span>
        </h2>
      </Reveal>

      <div className={styles.grid}>
        <Reveal>
          <Link href="/play" className={`${styles.card} ${styles.solo}`}>
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
              <span className={styles.tag}>solo</span>
              <h3>Sobrevivência</h3>
              <p>Trinta segundos, palavras sem fim. Acerto devolve tempo, erro tira. Bata o seu recorde.</p>
              <span className={styles.cta}>jogar →</span>
            </div>
          </Link>
        </Reveal>

        <Reveal delay={90}>
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
              <span className={styles.tag}>online · 1×1</span>
              <h3>Duelo</h3>
              <p>Crie uma sala, mande o link. Mesmas palavras, dois relógios — quem cair primeiro perde. Revanche com um clique.</p>
              <span className={styles.cta}>criar sala →</span>
            </div>
          </Link>
        </Reveal>

        <Reveal delay={180}>
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
              <span className={styles.tag}>música</span>
              <h3>Modo música</h3>
              <p>Escolha a música. A letra aparece no tempo do cantor — digite cada linha antes da próxima. Normal ou 3 vidas.</p>
              <span className={styles.cta}>escolher música →</span>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
