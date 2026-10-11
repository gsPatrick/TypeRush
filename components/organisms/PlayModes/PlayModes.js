import Reveal from "@/components/molecules/Reveal/Reveal";
import ModeCards from "@/components/organisms/ModeCards/ModeCards";
import styles from "./PlayModes.module.css";

/** Seção da landing com os três modos (os cartões vêm de ModeCards). */

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

      <ModeCards reveal />
    </section>
  );
}
