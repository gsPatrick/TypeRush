import Button from "@/components/atoms/Button/Button";
import EnterToPlay from "@/components/molecules/EnterToPlay/EnterToPlay";
import HeroDemo from "./HeroDemo";
import styles from "./LandingHero.module.css";

/**
 * Herói — o produto é o herói. Manchete + CTA em colunas flanqueando,
 * e abaixo a "tela" com o jogo se jogando sozinho.
 */
export default function LandingHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.head}>
        <div className={styles.title}>
          <p className={styles.eyebrow}>
            <span className={styles.dot} /> jogo de digitação · sobrevivência
          </p>
          <h1 className={styles.h1}>
            Digite contra
            <br />
            <span className={styles.muted}>o relógio.</span>
          </h1>
        </div>

        <div className={styles.aside}>
          <p className={styles.lede}>
            Trinta segundos no relógio. Cada palavra certa devolve um. Cada erro tira dois. Até onde você chega?
          </p>
          <div className={styles.actions}>
            <Button href="/jogar" size="lg">
              Jogar agora <span aria-hidden="true">→</span>
            </Button>
            <EnterToPlay />
          </div>
        </div>
      </div>

      <HeroDemo />
    </section>
  );
}
