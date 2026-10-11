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

// cache por instância da função (reaproveitada entre chamadas na Vercel)
const coverCache = new Map();

/** Busca exata primeiro; se o nome do artista diferir ("X" vs "X & Y"), solta. */
export async function findCover({ artist, track }) {
  const key = `${artist}\u0000${track}`.toLowerCase();
  if (coverCache.has(key)) return coverCache.get(key);
  let out = null;
  try {
    const hit = (await deezer(`artist:"${artist}" track:"${track}"`)) || (await deezer(`${artist} ${track}`));
    out = hit
      ? { cover: hit.album?.cover_big || hit.album?.cover_medium || null, thumb: hit.album?.cover_medium || hit.album?.cover_small || null }
      : null;
  } catch {
    return null; // erro de rede não entra no cache
  }
  if (coverCache.size > 500) coverCache.clear();
  coverCache.set(key, out);
  return out;
}

/**
 * Capas para uma lista de resultados: uma consulta por música ÚNICA (as
 * várias versões da mesma música dividem a capa), em paralelo, com teto de
 * tempo — a busca nunca espera mais que `budgetMs` por capa.
 */
export async function attachCovers(results, { limit = 10, budgetMs = 2500 } = {}) {
  const uniq = new Map();
  for (const r of results) {
    const k = `${r.artist}\u0000${r.track}`.toLowerCase();
    if (!uniq.has(k) && uniq.size < limit) uniq.set(k, { artist: r.artist, track: r.track });
  }
  const timeout = new Promise((res) => setTimeout(() => res(null), budgetMs));
  const covers = new Map(
    await Promise.all(
      [...uniq].map(async ([k, q]) => [k, await Promise.race([findCover(q), timeout])])
    )
  );
  return results.map((r) => {
    const c = covers.get(`${r.artist}\u0000${r.track}`.toLowerCase());
    return { ...r, cover: c?.thumb ?? null };
  });
}
