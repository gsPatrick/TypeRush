/**
 * LRCLIB (lrclib.net) — letras sincronizadas, grátis, sem chave.
 * Pede um User-Agent que identifique o app. Às vezes responde 503
 * "ServerOverloaded": tenta de novo com espera crescente.
 */
const BASE = "https://lrclib.net/api";
const UA = "TypeRush/1.0 (+https://github.com/gsPatrick/TypeRush)";

async function lrclib(path, { attempts = 3 } = {}) {
  let lastStatus = 0;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "User-Agent": UA, "Lrclib-Client": UA },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return res.json();
    lastStatus = res.status;
    if (res.status === 404) return null;
    if (res.status !== 503 && res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  const err = new Error(`lrclib ${lastStatus}`);
  err.status = lastStatus;
  throw err;
}

// a LRCLIB às vezes manda o texto "null" no lugar de álbum vazio
const clean = (v) => (v && v.trim() && v.trim().toLowerCase() !== "null" ? v.trim() : null);

// títulos sujos da comunidade: "Nirvana - Lithium" com artista "Nirvana"
function cleanTrack(track, artist) {
  const t = (track || "").trim();
  const a = (artist || "").trim();
  if (a && t.toLowerCase().startsWith(a.toLowerCase())) {
    const rest = t.slice(a.length).replace(/^\s*[-–:]\s*/, "").trim();
    if (rest && rest !== t.slice(a.length)) return rest;
  }
  return t;
}

const pick = (r) => ({
  id: r.id,
  track: cleanTrack(r.trackName, r.artistName),
  artist: r.artistName,
  album: clean(r.albumName),
  duration: Math.round(r.duration || 0),
});

const LIVE = /\b(ao vivo|live|en vivo|ac[uú]stico|acoustic)\b/i;

/**
 * Busca e só devolve o que dá para jogar (letra sincronizada, não
 * instrumental). Tenta a busca livre e, se o texto tiver " - ", também
 * artista/música separados — o resultado é bem melhor.
 */
export async function searchTracks(q) {
  const queries = [`/search?q=${encodeURIComponent(q)}`];
  const dash = q.split(/\s+[-–]\s+/);
  if (dash.length === 2) {
    queries.unshift(`/search?artist_name=${encodeURIComponent(dash[0])}&track_name=${encodeURIComponent(dash[1])}`);
  }
  const seen = new Set();
  const out = [];
  for (const path of queries) {
    const list = (await lrclib(path)) || [];
    for (const r of list) {
      if (!r.syncedLyrics || r.instrumental || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(pick(r));
    }
    if (out.length >= 12) break;
  }
  // versão de estúdio antes da ao vivo: é a que casa com o áudio oficial.
  // sort estável — dentro de cada grupo, mantém a relevância da LRCLIB
  return out.sort((a, b) => Number(LIVE.test(a.album || "")) - Number(LIVE.test(b.album || ""))).slice(0, 20);
}

export async function getTrack(id) {
  const r = await lrclib(`/get/${encodeURIComponent(id)}`);
  if (!r || !r.syncedLyrics) return null;
  return { ...pick(r), synced: r.syncedLyrics };
}
