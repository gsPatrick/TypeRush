"use client";

import useTypeRush from "@/hooks/useTypeRush";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import Arena from "@/components/organisms/Arena/Arena";
import Footer from "@/components/organisms/Footer/Footer";
import Header from "@/components/organisms/Header/Header";
import OverdriveBlast from "@/components/organisms/OverdriveBlast/OverdriveBlast";
import Results from "@/components/organisms/Results/Results";
import styles from "./TypeRushGame.module.css";

/**
 * Casca do jogo: header · palco central · footer, mais a vinheta de tensão.
 * A vinheta lê --tension (escrito pelo Timer) — sem estado React.
 */
export default function TypeRushGame() {
  const game = useTypeRush();
  const running = game.status === "running";

  return (
    <LocaleProvider lang={game.lang}>
    <div className={styles.shell}>
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.aurora} aria-hidden="true" />
      {game.blast ? <OverdriveBlast key={game.blast.id} {...game.blast} onDone={game.clearBlast} /> : null}

      <Header
        combo={game.combo}
        onToggleCombo={game.toggleCombo}
        lang={game.lang}
        onChangeLanguage={game.changeLanguage}
        sound={game.sound}
        onToggleSound={game.toggleSound}
        running={running}
        best={game.profile?.best}
      />

      <main className={styles.stage}>
        {game.outcome ? (
          <Results key={game.round} outcome={game.outcome} profile={game.profile} onRestart={game.restart} />
        ) : (
          <Arena game={game} />
        )}
      </main>

      <Footer running={running} />
    </div>
    </LocaleProvider>
  );
}
