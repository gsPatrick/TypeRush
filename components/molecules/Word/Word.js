import { memo } from "react";
import { diffWord, toChars } from "@/lib/game/text";
import styles from "./Word.module.css";

/**
 * Uma palavra da trilha.
 *   status: "pending" | "active" | "correct" | "wrong"
 *   composeFrom: índice a partir do qual o texto digitado ainda está em
 *     composição (acento morto / IME) — exibido neutro, nunca como erro.
 *   fx: "correct" | "combo" | "save" | "wrong" | "retry" — animação de
 *     resposta, só na palavra do último evento.
 *
 * Palavras futuras renderizam texto puro (DOM leve). Só a ativa e as já
 * enviadas com erro precisam de um span por letra.
 */
function Word({ target, typed = "", status, composeFrom = null, fx = null }) {
  const fxClass = fx ? styles[`fx_${fx}`] : "";

  if (status === "pending") {
    return <span className={styles.word} data-word>{target}</span>;
  }

  if (status === "correct") {
    return <span className={`${styles.word} ${styles.done} ${fxClass}`} data-word>{target}</span>;
  }

  const { letters, extra } = diffWord(target, typed);
  const typedLen = toChars(typed).length;
  const isComposing = (i) => composeFrom !== null && i >= composeFrom && i < typedLen;

  return (
    <span
      className={`${styles.word} ${status === "wrong" ? styles.wrong : styles.active} ${fxClass}`}
      data-word
      data-active={status === "active" || undefined}
    >
      {letters.map((l, i) => (
        <span key={i} data-letter className={styles[isComposing(i) ? "composing" : l.state]}>
          {l.char}
        </span>
      ))}
      {extra.map((c, i) => (
        <span
          key={`x${i}`}
          data-letter
          className={isComposing(letters.length + i) ? styles.composing : styles.extra}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

export default memo(Word);
