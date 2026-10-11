import { accuracy, wpm } from "@/lib/game/scoring";

/** Resumo enxuto de uma partida para mandar pela rede. */
export function summarize(result) {
  return {
    words: result.correctWords,
    errors: result.errors,
    wpm: result.wpm,
    accuracy: result.accuracy,
    survivedMs: Math.round(result.survivedMs),
    bestStreak: result.bestStreak,
    odBestMs: Math.round(result.overdrive?.bestMs ?? 0),
  };
}

/** Mesmo resumo, mas de uma partida em andamento (estado ao vivo). */
export function liveSummary(engine, at) {
  const s = engine.state;
  const elapsed = s.status === "idle" ? 0 : (s.status === "over" ? s.endAt : at) - s.startAt;
  return {
    words: s.correctWords,
    errors: s.errors,
    wpm: Math.round(wpm(s.correctChars, Math.max(elapsed, 1000))),
    accuracy: Math.round(accuracy(s.correctKeys, s.incorrectKeys) * 10) / 10,
    survivedMs: Math.round(elapsed),
    bestStreak: s.bestStreak,
    odBestMs: Math.round(s.odBestMs),
  };
}
