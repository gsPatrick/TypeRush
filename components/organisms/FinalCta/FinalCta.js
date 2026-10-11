import Button from "@/components/atoms/Button/Button";
import EnterToPlay from "@/components/molecules/EnterToPlay/EnterToPlay";
import Reveal from "@/components/molecules/Reveal/Reveal";
import styles from "./FinalCta.module.css";

/** Fecho: o relógio parado em 30.0 esperando você. */
export default function FinalCta() {
  return (
    <section className={styles.section}>
      <Reveal className={styles.inner}>
        <span className={styles.clock} aria-hidden="true">
          30<span>.0</span>
          <i className={styles.caret} />
        </span>
        <h2 className={styles.h2}>Sua vez.</h2>
        <p className={styles.lede}>Sem cadastro, sem download. O relógio começa na primeira tecla.</p>
        <div className={styles.actions}>
          <Button href="/jogar" size="lg">
            Começar a partida <span aria-hidden="true">→</span>
          </Button>
          <EnterToPlay listen={false} />
        </div>
      </Reveal>
    </section>
  );
}
