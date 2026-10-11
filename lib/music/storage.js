/** Recordes por música, ajuste de atraso por música e músicas recentes. */
const KEY = "typerush:music";

function load() {
  try {
    return { best: {}, offsets: {}, recent: [], ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { best: {}, offsets: {}, recent: [] };
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* sem storage: segue sem lembrar */
  }
}

export function getBest(id) {
  return load().best[id] ?? null;
}

/** Todos os recordes de uma vez (a lista de busca consulta vários). */
export function getAllBest() {
  return load().best;
}

// o atraso depende do PAR letra + vídeo (outro vídeo, outra introdução)
const offsetKey = (id, videoId) => `${id}:${videoId || "none"}`;

export function getOffset(id, videoId) {
  return load().offsets[offsetKey(id, videoId)] ?? 0;
}

export function setOffset(id, videoId, seconds) {
  const d = load();
  d.offsets[offsetKey(id, videoId)] = Math.round(seconds * 10) / 10;
  save(d);
}

export const bestKey = (id, mode) => (mode === "lives" ? `${id}:lives` : String(id));

const PREFS_KEY = "typerush:music:mode";
export function getMusicMode() {
  try {
    return localStorage.getItem(PREFS_KEY) === "lives" ? "lives" : "normal";
  } catch {
    return "normal";
  }
}
export function setMusicMode(mode) {
  try {
    localStorage.setItem(PREFS_KEY, mode);
  } catch {
    /* ok */
  }
}

export function getRecent() {
  return load().recent;
}

export function pushRecent(track) {
  const d = load();
  const item = {
    id: track.id,
    track: track.track,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    cover: track.cover ?? null,
  };
  d.recent = [item, ...d.recent.filter((r) => r.id !== track.id)].slice(0, 8);
  save(d);
}

/**
 * Registra e devolve { best, isRecord, previous }. Recorde é por modo; no
 * modo 3 vidas só conta música TERMINADA — falhar não vira recorde.
 */
export function recordSong(id, result) {
  const d = load();
  const key = bestKey(id, result.mode);
  const previous = d.best[key] ?? null;
  if (result.failed) return { best: previous, isRecord: false, previous };
  const isRecord = !previous || result.score > previous.score;
  if (isRecord) d.best[key] = { score: result.score, rank: result.rank, completion: result.completion, date: Date.now() };
  save(d);
  return { best: d.best[key], isRecord, previous };
}
