"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Burst from "@/components/molecules/Burst/Burst";
import Word from "@/components/molecules/Word/Word";
import { toChars } from "@/lib/game/text";
import { useLocale } from "@/lib/i18n/LocaleContext";
import styles from "./WordStream.module.css";

/**
 * WordStream — trilha de palavras com cursor e campo de digitação.
 *
 * Camadas:   palavras (3 linhas visíveis) · cursor (absolute) · input
 *            transparente por cima de tudo (recebe toque no celular)
 * Driver:    eventos de teclado/input; cursor medido no layout após cada tecla
 * Estados:   linha ativa fica sempre na 2ª linha — quando a palavra ativa cai
 *            na 3ª, a 1ª linha é descartada (`first` avança). DOM fica pequeno
 *            mesmo em partidas longas.
 * Composição: entre compositionstart e compositionend o texto pendente é
 *            exibido neutro e o motor não contabiliza teclas.
 * Juice:     a cada envio, a palavra recebe `fx` (pop/tremor), faíscas saem do
 *            centro dela (Burst, fora do box para não serem cortadas) e o
 *            cursor pisca vermelho no erro.
 * Retry:     Backspace no campo vazio logo após um erro, ou o chip abaixo da
 *            trilha (toque no celular, onde Backspace vazio não gera evento).
 */
const WINDOW = 90;

export default function WordStream({
  ready,
  round,
  words,
  typed,
  verdicts,
  index,
  input,
  status,
  juice,
  canRetry,
  onInput,
  onSubmit,
  onRetry,
  onRestart,
  rivalIndex = null,
}) {
  const { t } = useLocale();
  const boxRef = useRef(null);
  const caretRef = useRef(null);
  const rivalRef = useRef(null);
  const inputRef = useRef(null);
  const composingRef = useRef(false);

  const [first, setFirst] = useState(0);
  const [composeFrom, setComposeFrom] = useState(null);
  const [focused, setFocused] = useState(false);
  const [layoutTick, setLayoutTick] = useState(0);
  const [burst, setBurst] = useState(null);
  const rootRef = useRef(null);

  const over = status === "over";

  // novo round: volta ao topo e foca
  useEffect(() => {
    setFirst(0);
    setComposeFrom(null);
    composingRef.current = false;
    inputRef.current?.focus({ preventScroll: true });
    // o autoFocus da hidratação acontece antes do onFocus existir
    setFocused(document.activeElement === inputRef.current);
  }, [round, ready]);

  useEffect(() => {
    const onResize = () => setLayoutTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Qualquer tecla fora do campo devolve o foco (a tecla cai no input).
  useEffect(() => {
    if (over) return undefined;
    const onKey = (e) => {
      if (document.activeElement === inputRef.current) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("button, a, [role=switch]")) {
        if (e.key === "Enter" || e.key === " ") return;
      }
      if (e.key.length === 1 || e.key === "Dead") inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [over]);

  // Rolagem de linhas: mantém a palavra ativa na 2ª linha.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const els = box.querySelectorAll("[data-word]");
    const active = els[index - first];
    if (!active || !els[0]) return;
    const top0 = els[0].offsetTop;
    const lineH = active.offsetHeight;
    if (active.offsetTop > top0 + lineH * 1.5) {
      for (let i = 1; i < els.length; i++) {
        if (els[i].offsetTop > top0) {
          setFirst(first + i);
          return;
        }
      }
    }
    if (index < first) setFirst(index);
  }, [index, first, layoutTick, words]);

  // Cursor: medido depois do layout, escrito direto no estilo.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const caret = caretRef.current;
    if (!box || !caret) return;
    const active = box.querySelector("[data-active]") || box.querySelectorAll("[data-word]")[index - first];
    if (!active) return;

    const boxRect = box.getBoundingClientRect();
    const letters = active.querySelectorAll("[data-letter]");
    const pos = toChars(input).length;
    let x;
    let rect;

    if (letters.length === 0) {
      rect = active.getBoundingClientRect();
      x = rect.left;
    } else if (pos < letters.length) {
      rect = letters[pos].getBoundingClientRect();
      x = rect.left;
    } else {
      rect = letters[letters.length - 1].getBoundingClientRect();
      x = rect.right;
    }
    const y = rect.top - boxRect.top + rect.height * 0.12;
    caret.style.height = `${rect.height * 0.76}px`;
    caret.style.transform = `translate3d(${x - boxRect.left - 1}px, ${y}px, 0)`;
  });

  // Juice: posiciona as faíscas no centro da palavra e pisca o cursor no erro.
  useLayoutEffect(() => {
    if (!juice) return;
    const root = rootRef.current;
    const box = boxRef.current;
    if (!root || !box) return;

    if (juice.kind === "correct" || juice.kind === "combo" || juice.kind === "save") {
      const el = box.querySelectorAll("[data-word]")[juice.index - first];
      if (el) {
        const r = el.getBoundingClientRect();
        const rr = root.getBoundingClientRect();
        setBurst({ id: juice.id, kind: juice.kind, x: r.left - rr.left + r.width / 2, y: r.top - rr.top + r.height / 2 });
      }
    }

    if (juice.kind === "wrong") {
      const caret = caretRef.current;
      caret.classList.remove(styles.caretMiss);
      void caret.offsetWidth; // reinicia a animação
      caret.classList.add(styles.caretMiss);
    }
    // só no evento novo — `first` muda depois, não deve redisparar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juice?.id]);

  // Duelo: traço sob a palavra em que o adversário está (mesma lista nos dois)
  useLayoutEffect(() => {
    const mark = rivalRef.current;
    if (!mark) return;
    const box = boxRef.current;
    const el = rivalIndex === null ? null : box?.querySelectorAll("[data-word]")[rivalIndex - first];
    if (!el) {
      mark.style.opacity = "0";
      return;
    }
    const br = box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    mark.style.opacity = "1";
    mark.style.width = `${r.width}px`;
    mark.style.transform = `translate3d(${r.left - br.left}px, ${r.bottom - br.top - 3}px, 0)`;
  });

  const handleChange = useCallback(
    (e) => {
      const composing = composingRef.current || e.nativeEvent.isComposing === true;
      onInput(e.target.value, composing);
    },
    [onInput]
  );

  const handleCompositionStart = useCallback((e) => {
    composingRef.current = true;
    setComposeFrom(toChars(e.currentTarget.value).length);
  }, []);

  const handleCompositionEnd = useCallback(
    (e) => {
      composingRef.current = false;
      setComposeFrom(null);
      onInput(e.currentTarget.value, false);
    },
    [onInput]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Tab" || e.key === "Escape") {
        e.preventDefault();
        onRestart();
        return;
      }
      if (e.key === "Enter" && !composingRef.current) {
        e.preventDefault();
        onSubmit();
        return;
      }
      if (e.key === "Backspace" && e.currentTarget.value === "" && !composingRef.current) {
        if (onRetry()) e.preventDefault();
      }
    },
    [onRestart, onSubmit, onRetry]
  );

  const tapRetry = useCallback(() => {
    onRetry();
    inputRef.current?.focus({ preventScroll: true });
  }, [onRetry]);

  const end = Math.max(first + WINDOW, index + 30);
  const visible = ready ? words.slice(first, end) : [];

  return (
    <div ref={rootRef} className={styles.root} data-status={status}>
      <div ref={boxRef} className={`${styles.box} ${focused || over ? "" : styles.blurred}`}>
        <div className={styles.words}>
          {visible.map((w, i) => {
            const n = first + i;
            let wordStatus = "pending";
            if (n < index) wordStatus = verdicts[n] ? "correct" : "wrong";
            else if (n === index) wordStatus = "active";
            return (
              <Word
                key={n}
                target={w}
                typed={n < index ? typed[n] : n === index ? input : undefined}
                status={wordStatus}
                composeFrom={n === index ? composeFrom : null}
                fx={juice && juice.index === n ? juice.kind : null}
              />
            );
          })}
        </div>

        {rivalIndex !== null ? <span ref={rivalRef} className={styles.rival} aria-hidden="true" /> : null}

        <span
          ref={caretRef}
          className={`${styles.caret} ${status === "idle" ? styles.blink : ""}`}
          hidden={over}
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          readOnly={over}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="next"
          aria-label={t.inputLabel}
        />
      </div>

      {burst ? <Burst key={burst.id} {...burst} /> : null}

      <button
        type="button"
        className={`${styles.retry} ${canRetry ? styles.retryOn : ""}`}
        onPointerDown={(e) => e.preventDefault() /* não tira o foco do input */}
        onClick={tapRetry}
        tabIndex={canRetry ? 0 : -1}
        aria-hidden={!canRetry}
      >
        <span className={styles.retryKey}>⌫</span> {t.retry} <b>{t.retryBonus}</b>
      </button>

      {!focused && !over ? (
        // só visual: o toque atravessa e cai no input real, que é o que abre o
        // teclado virtual de forma confiável no iOS/Android
        <p className={styles.focusHint} aria-hidden="true">
          {t.focusHint}
        </p>
      ) : null}
    </div>
  );
}
