/**
 * Acha o vídeo do YouTube que casa com a VERSÃO da letra.
 *
 * O que importa é a duração: a letra do LRCLIB é marcada sobre uma gravação
 * específica (estúdio, ao vivo…). Um vídeo com intro diferente desalinha
 * tudo. Então: busca ~8 candidatos, pega a duração de cada um e escolhe o
 * mais próximo da duração da letra, preferindo canais "- Topic" (áudio
 * oficial da gravadora = versão do álbum) e evitando cover/karaokê/ao vivo
 * quando a letra não é ao vivo.
 *
 * Custo de cota da YouTube Data API v3: search = 100 unidades, videos = 1.
 * Plano grátis: 10.000/dia ≈ 100 músicas novas/dia. As rotas são cacheadas
 * na CDN da Vercel, então música repetida não gasta cota.
 */
const API = "https://www.googleapis.com/youtube/v3";

function isoToSeconds(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}

const BAD = /\b(cover|karaok[eê]|instrumental|remix|8d|slowed|sped up|nightcore|tutorial|reaction|lyrics? video)\b/i;
const LIVE = /\b(live|ao vivo|en vivo|acoustic|ac[uú]stico)\b/i;

export function scoreCandidate(c, { duration, album }) {
  const wantsLive = LIVE.test(album || "");
  let score = Math.abs(c.duration - duration) * 3;
  if (/ - Topic$/.test(c.channel)) score -= 6;
  if (BAD.test(c.title)) score += 40;
  if (!wantsLive && LIVE.test(c.title)) score += 15;
  return score;
}

export function matchQuality(delta) {
  if (delta <= 2) return "exact";
  if (delta <= 6) return "close";
  return "loose";
}

export async function findVideo({ artist, track, duration, album }) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { video: null, reason: "no-key" };

  const q = `${artist} ${track}`;
  const search = await fetch(
    `${API}/search?part=snippet&type=video&videoEmbeddable=true&maxResults=8&q=${encodeURIComponent(q)}&key=${key}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!search.ok) return { video: null, reason: `search-${search.status}` };
  const ids = ((await search.json()).items || []).map((i) => i.id.videoId).filter(Boolean);
  if (!ids.length) return { video: null, reason: "not-found" };

  const details = await fetch(`${API}/videos?part=contentDetails,snippet&id=${ids.join(",")}&key=${key}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!details.ok) return { video: null, reason: `videos-${details.status}` };
  const candidates = ((await details.json()).items || []).map((v) => ({
    id: v.id,
    title: v.snippet.title,
    channel: v.snippet.channelTitle,
    duration: isoToSeconds(v.contentDetails.duration),
  }));

  const best = candidates.sort((a, b) => scoreCandidate(a, { duration, album }) - scoreCandidate(b, { duration, album }))[0];
  if (!best) return { video: null, reason: "not-found" };
  return { video: { ...best, quality: matchQuality(Math.abs(best.duration - duration)) }, reason: null };
}
