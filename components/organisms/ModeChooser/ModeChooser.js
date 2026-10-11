"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import ModeCards, { MODE_LINKS } from "@/components/organisms/ModeCards/ModeCards";
import styles from "./ModeChooser.module.css";

/**
 * /jogar — a escolha de modo. É para onde vai todo "Jogar" sem modo
 * definido (landing, Enter). Teclas 1 · 2 · 3 escolhem direto.
 */
export default function ModeChooser() {
  const router = useRouter();

  useEffect(() => {
    MODE_LINKS.forEach((href) => router.prefetch(href));
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const i = ["1", "2", "3"].indexOf(e.key);
      if (i >= 0) router.push(MODE_LINKS[i]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.home} aria-label="TypeRush — início">
          <BrandMark />
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <span className={styles.kicker}>jogar</span>
          <h1 className={styles.h1}>
            Escolha como jogar.
            <br />
            <span className={styles.muted}>O relógio é o mesmo.</span>
          </h1>
        </div>
        <ModeCards numbered />
        <p className={styles.hint}>
          aperte <kbd>1</kbd> <kbd>2</kbd> ou <kbd>3</kbd>
        </p>
      </main>
    </div>
  );
}
