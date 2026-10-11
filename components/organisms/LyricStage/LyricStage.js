"use client";

import { useCallback, useEffect, useRef } from "react";
import Burst from "@/components/molecules/Burst/Burst";
import { diffWord, toChars } from "@/lib/game/text";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./LyricStage.module.css";

/**
 * LyricStage — a letra no tempo da música.
 *
 * Camadas:   progresso da música · placar · linha anterior (com nota) ·
 *            LINHA ATIVA (diff por letra + cursor) · barra da janela ·
 *            próxima linha · input transparente por cima de tudo
 * Driver:    tempo da letra (subscribeTime, rAF) — barras e contagem são
 *            escritas direto no DOM; React só re-renderiza em tecla/linha
 * Estados:   intro (antes da 1ª linha) · linha ativa · instrumental (vão)
 * Juice:     linha perfeita → faíscas + "+pontos" subindo; a cada 5 seguidas
 *            uma faixa de marco e o multiplicador sobe (×1,5 … ×3); 10 seguidas
 *            = "em chamas" (aura lime); erro no modo 3 vidas → coração quebra
 *            + flash vermelho
 * Reduced:   sem flash/tremor/faíscas; cores e barras continuam
 */
export default function LyricStage({ game, duration }) {
  const { t } = useLocale();
  const m = t.music;
  const inputRef = useRef(null);
  const composingRef = useRef(false);
  const songBarRef = useRef(null);
  const windowBarRef = useRef(null);
  const waitRef = useRef(null);

  const { lines, active, input, grades, juice } = game;
  const line = active >= 0 ? lines[active] : null;

  // tempo → barras e contagem (sem estado React)
  useEffect(
    () =>
      game.subscribeTime((time) => {
        if (songBarRef.current) songBarRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, time / (duration || 1)))})`;
        const cur = active >= 0 ? lines[active] : null;
        if (windowBarRef.current && cur) {
          const left = Math.max(0, (cur.end - time) / (cur.end - cur.t));
          windowBarRef.current.style.transform = `scaleX(${left.toFixed(3)})`;
          windowBarRef.current.dataset.low = left < 0.3 ? "1" : "0";
        }
        if (waitRef.current && !cur) {
          const next = lines.find((l) => l.t > time);
          waitRef.current.textContent = next ? m.nextIn(Math.max(0, next.t - time).toFixed(1)) : "";
        }
      }),
    [game, duration, active, lines, m]
  );

  // linha nova: limpa e mantém o foco
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [active]);

  // qualquer tecla fora do campo devolve o foco
  useEffect(() => {
    const onKey = (e) => {
      if (document.activeElement === inputRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length === 1 || e.key === "Dead") inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onChange = useCallback(
    (e) => game.onInput(e.target.value, composingRef.current || e.nativeEvent.isComposing === true),
    [game]
  );

  // anterior com nota (a última avaliada antes da ativa)
  let prevIndex = -1;
  for (let i = (active >= 0 ? active : lines.length) - 1; i >= 0; i--) {
    if (grades[i]) {
      prevIndex = i;
      break;
    }
  }
  const prev = prevIndex >= 0 ? { line: lines[prevIndex], grade: grades[prevIndex] } : null;
  const nextIndex = active >= 0 ? active + 1 : lines.findIndex((l, i) => !grades[i]);
  const next = nextIndex >= 0 ? lines[nextIndex] : null;
  const done = active >= 0 && grades[active];
  const firstLinePending = !grades.some(Boolean) && active < 0;

  const fresh = juice && game.status === "playing" ? juice : null;

  return (
    <section className={`${styles.root} ${game.onFire ? styles.onFire : ""}`} aria-label={m.title}>
      {fresh?.strike ? <span key={`s${fresh.id}`} className={styles.strikeFlash} aria-hidden="true" /> : null}
      <div className={styles.songBar} aria-hidden="true">
        <span ref={songBarRef} />
      </div>

      <div className={styles.hud}>
        {game.mode === "lives" ? (
          <span className={styles.lives} aria-label={`${game.livesLeft} ${m.lives}`}>
            {Array.from({ length: game.lives }, (_, i) => (
              <Heart key={i} alive={i < game.livesLeft} breaking={fresh?.strike && i === game.livesLeft} />
            ))}
          </span>
        ) : null}
        <span>
          <b>{game.score}</b> {m.score}
        </span>
        <span key={`m${game.multiplier}`} className={`${styles.mult} ${game.multiplier > 1 ? styles.multOn : ""}`}>
          ×{game.multiplier}
        </span>
        <span>
          <b>{game.perfects}</b> {m.perfect}
        </span>
        <span>
          <b key={game.streak} className={game.streak > 0 ? styles.bump : ""}>
            {game.streak}
          </b>{" "}
          {m.streak}
        </span>
      </div>

      <div className={styles.lines}>
        <p
          key={prev ? `p${prevIndex}-${juice?.id ?? 0}` : "p"}
          className={`${styles.prev} ${prev?.grade.perfect ? styles.perfect : prev ? styles.partial : ""} ${
            juice && juice.index === prevIndex ? (juice.perfect ? styles.flash : styles.shake) : ""
          } ${fresh?.milestone ? styles.yield : ""}`}
        >
          {prev ? (
            <>
              {prev.line.text}
              <span className={styles.grade}>{Math.round(prev.grade.completion * 100)}%</span>
            </>
          ) : (
            " "
          )}
        </p>

        <div className={styles.activeWrap}>
          {fresh?.perfect ? (
            <span key={`f${fresh.id}`} className={styles.fx} aria-hidden="true">
              <Burst id={fresh.id} x="50%" y="40%" kind={fresh.milestone ? "combo" : "correct"} />
              <span className={styles.plus}>+{fresh.score}</span>
            </span>
          ) : null}
          {fresh?.milestone ? (
            <span key={`b${fresh.id}`} className={styles.banner} aria-live="polite">
              {fresh.milestone >= 10 ? m.onFire : m.combo(fresh.milestone)}
              <small>×{game.multiplier}</small>
            </span>
          ) : null}
          {line ? (
            <p className={`${styles.active} ${done ? styles.activeDone : ""}`}>
              <ActiveLine text={line.text} typed={input} done={!!done} />
            </p>
          ) : (
            <p className={styles.waiting}>
              <span className={styles.waitLabel}>{firstLinePending ? m.intro : m.interlude}</span>
              <span ref={waitRef} className={styles.waitTime} />
            </p>
          )}
          <span className={`${styles.windowBar} ${line ? "" : styles.hidden}`} aria-hidden="true">
            <span ref={windowBarRef} />
          </span>
        </div>

        <p className={styles.next}>{next ? next.text : " "}</p>
      </div>

      <input
        ref={inputRef}
        className={styles.input}
        value={input}
        onChange={onChange}
        onCompositionStart={() => (composingRef.current = true)}
        onCompositionEnd={(e) => {
          composingRef.current = false;
          game.onInput(e.currentTarget.value, false);
        }}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        readOnly={!line || !!done}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={line ? line.text : m.intro}
      />
    </section>
  );
}

/** Linha ativa: cada caractere pendente/certo/errado + cursor na posição. */
function ActiveLine({ text, typed, done }) {
  const { letters, extra } = diffWord(text, typed);
  const pos = toChars(typed).length;
  return (
    <>
      {letters.map((l, i) => (
        <span
          key={i}
          className={`${styles[l.state]} ${l.char === " " && l.state === "incorrect" ? styles.badSpace : ""} ${
            !done && i === pos ? styles.caret : ""
          }`}
        >
          {l.state === "incorrect" ? toChars(typed)[i] : l.char}
        </span>
      ))}
      {extra.map((c, i) => (
        <span key={`x${i}`} className={styles.extra}>
          {c}
        </span>
      ))}
      {!done && pos >= letters.length ? <span className={`${styles.caret} ${styles.caretEnd}`}>{"​"}</span> : null}
    </>
  );
}

function Heart({ alive, breaking }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${styles.heart} ${alive ? styles.alive : ""} ${breaking ? styles.breaking : ""}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
    </svg>
  );
}
