/**
 * Crédito ao artista: capa (Deezer, sem chave) + link para ouvir no Spotify.
 * O link do Spotify é uma busca — não precisa de credencial e sempre leva
 * à música certa no app/web do Spotify.
 */
export function spotifySearchUrl(artist, track) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${track} ${artist}`)}`;
}

async function deezer(q) {
  const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=1`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return null;
  return (await res.json()).data?.[0] ?? null;
}

/** Busca exata primeiro; se o nome do artista diferir ("X" vs "X & Y"), solta. */
export async function findCover({ artist, track }) {
  try {
    const hit = (await deezer(`artist:"${artist}" track:"${track}"`)) || (await deezer(`${artist} ${track}`));
    return hit ? { cover: hit.album?.cover_big || hit.album?.cover_medium || null } : null;
  } catch {
    return null;
  }
}
