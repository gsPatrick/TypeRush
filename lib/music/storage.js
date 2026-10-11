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

export function getOffset(id) {
  return load().offsets[id] ?? 0;
}

export function setOffset(id, seconds) {
  const d = load();
  d.offsets[id] = Math.round(seconds * 10) / 10;
  save(d);
}

export function getRecent() {
  return load().recent;
}

export function pushRecent(track) {
  const d = load();
  const item = { id: track.id, track: track.track, artist: track.artist, album: track.album, duration: track.duration };
  d.recent = [item, ...d.recent.filter((r) => r.id !== track.id)].slice(0, 8);
  save(d);
}

/** Registra e devolve { best, isRecord, previous }. */
export function recordSong(id, result) {
  const d = load();
  const previous = d.best[id] ?? null;
  const isRecord = !previous || result.score > previous.score;
  if (isRecord) d.best[id] = { score: result.score, rank: result.rank, completion: result.completion, date: Date.now() };
  save(d);
  return { best: d.best[id], isRecord, previous };
}
