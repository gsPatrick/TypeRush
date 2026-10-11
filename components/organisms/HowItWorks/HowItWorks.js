"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HowItWorks.module.css";

/**
 * Como funciona — recipe reveal-char-scroll, com um giro: as letras não só
 * "acendem", elas são DIGITADAS — pendentes em slate (a cor das palavras não
 * digitadas no jogo), digitadas em bone, e o cursor lime anda na frente.
 *
 * Camadas:   label · barra de progresso · índice | declaração ativa
 * Ancoragem: section 450vh · sticky top 0 / 100vh (sem overflow em ancestral)
 * Driver:    offset de scroll — parar de rolar congela a digitação
 * Pista:     450vh − 100vh = 350vh úteis ÷ 4 declarações ≈ 88vh cada
 * Estados:   progress (0..1) → active (0..3) → local (0..1)
 * Mobile:    grid vira uma coluna; pista igual (vh)
 * Reduced:   declarações completas, sem cursor
 */
const STATEMENTS = [
  "Você começa com trinta segundos. O relógio só anda quando você aperta a primeira tecla.",
  "Cada palavra certa devolve um segundo. Errou, perde dois. E o relógio nunca passa de sessenta.",
  "Errou por pouco? Backspace volta para a palavra. Acertando agora, você recupera meio segundo.",
  "Passe de trinta e cinco segundos e entre em overdrive. Quanto tempo você aguenta lá em cima?",
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      setProgress(scrollable > 0 ? scrolled / scrollable : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const count = STATEMENTS.length;
  const scaled = progress * count;
  const active = Math.min(count - 1, Math.floor(scaled));
  // termina de digitar em 85% do trecho: sobra um respiro com a frase completa
  const local = Math.min((scaled - active) / 0.85, 1);

  return (
    <section ref={sectionRef} id="como-funciona" className={styles.section}>
      <div className={styles.sticky}>
        <div className={styles.head}>
          <span className={styles.label}>como funciona</span>
        </div>

        <div className={styles.body}>
          <div className={styles.progress}>
            <div className={styles.progressBar} style={{ transform: `scaleX(${progress})` }} />
          </div>

          <div className={styles.content}>
            <aside className={styles.index}>
              <span>{String(active + 1).padStart(2, "0")}</span>
              <span className={styles.dim}>/</span>
              <span className={styles.dim}>{String(count).padStart(2, "0")}</span>
            </aside>

            <div className={styles.main}>
              {STATEMENTS.map((statement, si) => {
                const isActive = si === active;
                const chars = statement.split("");
                const revealCount = isActive ? Math.floor(local * chars.length) : si < active ? chars.length : 0;
                const typing = isActive && revealCount < chars.length;

                return (
                  <p
                    key={si}
                    className={styles.statement}
                    style={{ opacity: isActive ? 1 : 0 }}
                    aria-hidden={!isActive}
                  >
                    {chars.map((ch, i) => (
                      <span
                        key={i}
                        className={`${styles.char} ${i < revealCount ? styles.typed : ""} ${
                          typing && i === revealCount ? styles.at : ""
                        }`}
                      >
                        {ch}
                      </span>
                    ))}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
