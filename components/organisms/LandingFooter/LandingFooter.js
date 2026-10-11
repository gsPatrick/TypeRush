import Link from "next/link";
import BrandMark from "@/components/atoms/BrandMark/BrandMark";
import styles from "./LandingFooter.module.css";

/** Rodapé com peso: wordmark em largura total + linha de créditos. */
export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <BrandMark className={styles.brand} />
        <nav className={styles.links} aria-label="Rodapé">
          <a href="#como-funciona">como funciona</a>
          <a href="#mecanicas">mecânicas</a>
          <Link href="/play">solo</Link>
          <Link href="/duel">duelo</Link>
          <Link href="/music">música</Link>
        </nav>
      </div>
      <p className={styles.word} aria-hidden="true">
        type<span>rush</span>
      </p>
      <div className={styles.legal}>
        <span>© 2026 TypeRush</span>
        <a href="https://codebypatrick.dev/" target="_blank" rel="noreferrer">
          feito por Patrick
        </a>
      </div>
    </footer>
  );
}
