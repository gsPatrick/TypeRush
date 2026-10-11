import Link from "next/link";
import styles from "./ModeNav.module.css";

/**
 * Troca de modo no topo de todas as telas de jogo: solo · duelo · música.
 * O modo atual fica marcado; os outros são links diretos.
 */
const MODES = [
  { id: "solo", href: "/rush", label: { pt: "solo", en: "solo" } },
  { id: "duel", href: "/duel", label: { pt: "duelo", en: "duel" } },
  { id: "music", href: "/music", label: { pt: "música", en: "music" } },
];

export default function ModeNav({ current, lang = "pt", className = "" }) {
  return (
    <nav className={`${styles.root} ${className}`} aria-label={lang === "en" ? "Game mode" : "Modo de jogo"}>
      {MODES.map((m) =>
        m.id === current ? (
          <span key={m.id} className={`${styles.item} ${styles.on}`} aria-current="page">
            {m.label[lang] ?? m.label.pt}
          </span>
        ) : (
          <Link key={m.id} href={m.href} className={styles.item}>
            {m.label[lang] ?? m.label.pt}
          </Link>
        )
      )}
    </nav>
  );
}
