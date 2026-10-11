import styles from "./YouTubeSearchButton.module.css";

/**
 * "Buscar no YouTube" — abre a busca da música em outra aba. Sem chave da
 * API, é o caminho mais curto: o jogador copia o link e cola de volta.
 * A busca já pede o áudio oficial: é a versão que costuma bater com a letra.
 */
export function youtubeSearchUrl(artist, track) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${track} audio`)}`;
}

export default function YouTubeSearchButton({ artist, track, label, title }) {
  return (
    <a className={styles.root} href={youtubeSearchUrl(artist, track)} target="_blank" rel="noreferrer" title={title}>
      <svg viewBox="0 0 28 20" className={styles.logo} aria-hidden="true" focusable="false">
        <rect width="28" height="20" rx="5.5" fill="#ff0033" />
        <path d="M11.2 5.8v8.4l7.3-4.2z" fill="#fff" />
      </svg>
      <span>{label}</span>
      <span className={styles.out} aria-hidden="true">↗</span>
    </a>
  );
}
