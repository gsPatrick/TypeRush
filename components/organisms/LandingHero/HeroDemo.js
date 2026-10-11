"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./HeroDemo.module.css";

/**
 * HeroDemo — o jogo se jogando sozinho.
 *
 * Camadas:   moldura · métricas · relógio gigante (+ deltas) · trilha de palavras
 * Driver:    tempo. Um "robô" digita a própria mensagem da landing a ~100 wpm,
 *            erra uma letra de vez em quando e corrige. O relógio usa prazo
 *            absoluto (igual ao jogo) e é escrito no DOM via rAF.
 * Estados:   normal → overdrive (> 35s, relógio lime) → reinicia ao fim da frase
 * Pausa:     fora da tela (IntersectionObserver) e aba oculta — não gasta CPU
 * Reduced:   sem robô; um quadro estático representativo
 */
const MESSAGE =
  "digite contra o relógio cada palavra certa devolve um segundo cada erro custa dois passe de trinta e cinco e entre em overdrive até onde você chega".split(
    " "
  );

const START_MS = 30_000;
const MAX_MS = 60_000;
const OVERDRIVE_MS = 35_000;
const TYPO_CHANCE = 1 / 22;
const NEIGHBORS = "qwertyuiopasdfghjklzxcvbnm";

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function HeroDemo() {
  const frameRef = useRef(null);
  const boxRef = useRef(null);
  const caretRef = useRef(null);
  const secRef = useRef(null);
  const tenthRef = useRef(null);
  const fillRef = useRef(null);
  const deadline = useRef(0);
  const visible = useRef(true);

  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [first, setFirst] = useState(0);
  const [stats, setStats] = useState({ words: 0, streak: 0 });
  const [deltas, setDeltas] = useState([]);
  const [overdrive, setOverdrive] = useState(false);
  const [reduced, setReduced] = useState(false);

  // pausa fora da tela
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.1 });
    io.observe(frameRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // relógio: prazo absoluto, escrito direto no DOM
  useEffect(() => {
    if (reduced) return undefined;
    deadline.current = performance.now() + START_MS;
    let raf = 0;
    let pausedAt = 0;
    const frame = () => {
      const now = performance.now();
      if (!visible.current || document.hidden) {
        if (!pausedAt) pausedAt = now;
      } else if (pausedAt) {
        deadline.current += now - pausedAt; // tempo parado não conta
        pausedAt = 0;
      }
      const ms = Math.max(0, deadline.current - (pausedAt || now));
      secRef.current.textContent = String(Math.floor(ms / 1000));
      tenthRef.current.textContent = `.${Math.floor((ms % 1000) / 100)}`;
      fillRef.current.style.transform = `scaleX(${(ms / MAX_MS).toFixed(4)})`;
      const od = ms > OVERDRIVE_MS;
      if (frameRef.current.dataset.overdrive !== String(od)) {
        frameRef.current.dataset.overdrive = String(od);
        setOverdrive(od);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // o robô
  useEffect(() => {
    if (reduced) {
      setIndex(9);
      setStats({ words: 9, streak: 9 });
      return undefined;
    }
    let alive = true;
    const idle = async () => {
      while (alive && (!visible.current || document.hidden)) await wait(200);
    };

    (async () => {
      await wait(900);
      while (alive) {
        for (let w = 0; w < MESSAGE.length && alive; w++) {
          const word = MESSAGE[w];
          let current = "";
          for (let c = 0; c < word.length && alive; c++) {
            await idle();
            if (Math.random() < TYPO_CHANCE) {
              const wrong = NEIGHBORS[Math.floor(Math.random() * NEIGHBORS.length)];
              setTyped(current + wrong);
              await wait(240);
              setTyped(current);
              await wait(110);
            }
            current += word[c];
            setTyped(current);
            await wait(48 + Math.random() * 70);
          }
          await wait(70);
          if (!alive) return;
          // envio: +1s no prazo (com teto)
          const now = performance.now();
          deadline.current = Math.min(deadline.current + 1000, now + MAX_MS);
          setDeltas((d) => d.concat({ id: now }).slice(-4));
          setStats((s) => ({ words: s.words + 1, streak: s.streak + 1 }));
          setTyped("");
          setIndex(w + 1);
        }
        await wait(1600);
        if (!alive) return;
        // recomeça a frase
        deadline.current = performance.now() + START_MS;
        setIndex(0);
        setFirst(0);
        setStats({ words: 0, streak: 0 });
      }
    })();

    return () => {
      alive = false;
    };
  }, [reduced]);

  // mantém a palavra ativa na 1ª/2ª linha (mesma regra do jogo)
  useLayoutEffect(() => {
    const els = boxRef.current?.querySelectorAll("[data-w]");
    if (!els?.length) return;
    const active = els[Math.min(index, MESSAGE.length - 1) - first];
    if (!active) return;
    const top0 = els[0].offsetTop;
    if (active.offsetTop > top0 + active.offsetHeight * 1.5) {
      for (let i = 1; i < els.length; i++) {
        if (els[i].offsetTop > top0) {
          setFirst(first + i);
          return;
        }
      }
    }
  }, [index, first]);

  // cursor
  useLayoutEffect(() => {
    const box = boxRef.current;
    const caret = caretRef.current;
    if (!box || !caret) return;
    const active = box.querySelector("[data-active]");
    if (!active) {
      caret.style.opacity = "0";
      return;
    }
    caret.style.opacity = "1";
    const letters = active.querySelectorAll("[data-l]");
    const br = box.getBoundingClientRect();
    const pos = typed.length;
    const r = pos < letters.length ? letters[pos].getBoundingClientRect() : letters[letters.length - 1].getBoundingClientRect();
    const x = pos < letters.length ? r.left : r.right;
    caret.style.height = `${r.height * 0.76}px`;
    caret.style.transform = `translate3d(${x - br.left - 1}px, ${r.top - br.top + r.height * 0.12}px, 0)`;
  });

  const words = MESSAGE.slice(first, first + 26);

  return (
    <div ref={frameRef} className={styles.frame} data-overdrive="false" aria-hidden="true">
      <div className={styles.stats}>
        <span><b>{stats.words}</b> palavras</span>
        <span><b>{stats.streak}</b> sequência</span>
        <span className={`${styles.odTag} ${overdrive ? styles.odOn : ""}`}>overdrive</span>
      </div>

      <div className={styles.timer}>
        <span className={styles.readout}>
          <span ref={secRef}>30</span>
          <span ref={tenthRef} className={styles.tenth}>.0</span>
          <span className={styles.deltas}>
            {deltas.map((d) => (
              <span
                key={d.id}
                className={styles.delta}
                onAnimationEnd={() => setDeltas((all) => all.filter((x) => x.id !== d.id))}
              >
                +1s
              </span>
            ))}
          </span>
        </span>
        <span className={styles.reserve}>
          <span ref={fillRef} className={styles.fill} />
          <span className={styles.mark} />
        </span>
      </div>

      <div ref={boxRef} className={styles.words}>
        {words.map((w, i) => {
          const n = first + i;
          if (n < index) {
            return <span key={n} data-w className={styles.done}>{w}</span>;
          }
          if (n === index) {
            return (
              <span key={n} data-w data-active className={styles.active}>
                {Array.from(w).map((ch, j) => (
                  <span
                    key={j}
                    data-l
                    className={j < typed.length ? (typed[j] === ch ? styles.ok : styles.bad) : undefined}
                  >
                    {j < typed.length && typed[j] !== ch ? typed[j] : ch}
                  </span>
                ))}
              </span>
            );
          }
          return <span key={n} data-w>{w}</span>;
        })}
        <span ref={caretRef} className={styles.caret} />
      </div>
    </div>
  );
}
