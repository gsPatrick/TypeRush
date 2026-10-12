import LiveStats from "@/components/molecules/LiveStats/LiveStats";
import Timer from "@/components/organisms/Timer/Timer";
import WordStream from "@/components/organisms/WordStream/WordStream";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./Arena.module.css";

/** Tela de jogo: métricas ao vivo → relógio → trilha de palavras. */
export default function Arena({ game }) {
  const { t } = useLocale();
  const running = game.status === "running";

  return (
    <section className={styles.root} aria-label="Partida">
      <LiveStats
        wpm={game.stats.liveWpm}
        words={game.stats.correctWords}
        errors={game.stats.errors}
        streak={game.stats.streak}
        combo={game.combo}
        active={running}
        level={game.stats.level}
        broke={game.broke}
      />

      {game.callout && (running || game.callout.kind === "break") ? (
        <Callout key={game.callout.id} callout={game.callout} t={t} />
      ) : null}

      <Timer
        subscribeClock={game.subscribeClock}
        deltas={game.deltas}
        onDeltaDone={game.dropDelta}
        overdrive={game.overdrive}
      />

      <WordStream
        ready={game.ready}
        round={game.round}
        words={game.words}
        typed={game.typed}
        verdicts={game.verdicts}
        index={game.index}
        input={game.input}
        status={game.status}
        juice={game.juice}
        canRetry={game.canRetry}
        onInput={game.onInput}
        onSubmit={game.onSubmit}
        onRetry={game.onRetry}
        onRestart={game.restart}
      />

      <p className={`${styles.hint} ${running ? styles.hidden : ""}`}>
        {t.hintStart} <span>{t.hintSpace}</span> {t.hintEnd}
      </p>
    </section>
  );
}

/** Aviso no vão acima das métricas: nível, marco de sequência, sequência quebrada. */
function Callout({ callout: c, t }) {
  const [title, sub] =
    c.kind === "level"
      ? [t.levelUp(c.level), t.levelRules(c.bonusMs, c.penaltyMs)]
      : c.kind === "streak"
        ? [`🔥 ${t.streakHot(c.streak)}`, t.streakKeep]
        : [t.streakBroke, t.streakLost(c.streak)];
  return (
    <p className={`${styles.callout} ${styles[c.kind]}`} role="status">
      <b>{title}</b>
      <span>{sub}</span>
    </p>
  );
}
