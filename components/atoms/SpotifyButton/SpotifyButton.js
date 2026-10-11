import styles from "./SpotifyButton.module.css";

/** "Ouvir no Spotify" — pílula verde com o ícone, para o crédito ter peso. */
export default function SpotifyButton({ href, label, size = "md" }) {
  if (!href) return null;
  return (
    <a className={`${styles.root} ${styles[size]}`} href={href} target="_blank" rel="noreferrer">
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="12" fill="#0b0c0b" />
        <path d="M6.2 9.3c3.9-1.2 8.3-.8 11.7 1.1" stroke="#1ed760" strokeWidth="1.9" strokeLinecap="round" fill="none" />
        <path d="M6.9 12.6c3.2-.9 6.6-.6 9.4 1" stroke="#1ed760" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <path d="M7.6 15.7c2.5-.7 5-.4 7.2.8" stroke="#1ed760" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
