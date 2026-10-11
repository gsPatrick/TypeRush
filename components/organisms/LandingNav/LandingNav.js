"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import styles from "./LandingNav.module.css";

/**
 * Nav — recipe nav-morph-frosted, versão escura.
 * Transparente sobre o herói; em scrollY > 8 o container interno vira pílula
 * de vidro escuro. O vidro vai no .inner (não no header) para respeitar o
 * max-width em vez de grudar nas bordas.
 */
const LINKS = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Mecânicas", href: "#mecanicas" },
  { label: "Duelo", href: "/duel" },
  { label: "Música", href: "/music" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <a href="#top" className={styles.brand} aria-label="TypeRush — topo">
          <BrandMark />
        </a>
        <nav className={styles.nav} aria-label="Seções">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </a>
          ))}
          <Link href="/play" className={styles.cta}>
            Jogar
          </Link>
        </nav>
      </div>
    </header>
  );
}
