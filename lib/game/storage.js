/**
 * Persistência local.
 *
 * - Preferências (idioma, combo, som, música) em uma chave própria.
 * - Recordes/totais POR IDIOMA: WPM em inglês e em português não são
 *   comparáveis, então cada vocabulário tem o próprio recorde.
 *   O português mantém a chave original (typerush:v1) — quem já jogava
 *   não perde o recorde.
 *
 * Toda leitura/escrita é protegida: aba anônima, cota cheia ou storage
 * bloqueado não podem derrubar o jogo.
 */
import { DEFAULT_LANG, isLang } from "./languages";

const PREFS_KEY = "typerush:prefs";
const profileKey = (lang) => (lang === "pt" ? "typerush:v1" : `typerush:v1:${lang}`);

const EMPTY = {
  best: null, // { words, wpm, accuracy, survivedMs, date }
  bestWpm: 0,
  bestStreak: 0,
  bestOverdriveMs: 0,
  totals: { games: 0, words: 0, errors: 0, playedMs: 0 },
};

function read(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sem storage: o jogo continua, só não lembra */
  }
}

export function loadPrefs() {
  const prefs = read(PREFS_KEY) || {};
  // versões antigas guardavam o combo dentro do perfil pt
  const legacyCombo = read(profileKey("pt"))?.combo;
  return {
    lang: isLang(prefs.lang) ? prefs.lang : DEFAULT_LANG,
    combo: typeof prefs.combo === "boolean" ? prefs.combo : legacyCombo ?? true,
    sound: typeof prefs.sound === "boolean" ? prefs.sound : true,
    music: typeof prefs.music === "boolean" ? prefs.music : true,
  };
}

export function savePrefs(patch) {
  write(PREFS_KEY, { ...loadPrefs(), ...patch });
}

export function loadProfile(lang) {
  const data = read(profileKey(lang));
  if (!data) return { ...EMPTY };
  return {
    best: data.best ?? null,
    bestWpm: data.bestWpm ?? 0,
    bestStreak: data.bestStreak ?? 0,
    bestOverdriveMs: data.bestOverdriveMs ?? 0,
    totals: { ...EMPTY.totals, ...data.totals },
  };
}

/**
 * Registra uma partida e devolve { profile, isRecord, previousBest }.
 * Recorde = mais palavras corretas; empate desempata por WPM.
 */
export function recordGame(result, lang) {
  const profile = loadProfile(lang);
  const previousBest = profile.best;

  const isRecord =
    result.correctWords > 0 &&
    (!previousBest ||
      result.correctWords > previousBest.words ||
      (result.correctWords === previousBest.words && result.wpm > previousBest.wpm));

  const next = {
    best: isRecord
      ? {
          words: result.correctWords,
          wpm: result.wpm,
          accuracy: result.accuracy,
          survivedMs: result.survivedMs,
          date: Date.now(),
        }
      : profile.best,
    bestWpm: Math.max(profile.bestWpm, result.wpm),
    bestStreak: Math.max(profile.bestStreak, result.bestStreak),
    bestOverdriveMs: Math.max(profile.bestOverdriveMs, result.overdrive?.bestMs ?? 0),
    totals: {
      games: profile.totals.games + 1,
      words: profile.totals.words + result.correctWords,
      errors: profile.totals.errors + result.errors,
      playedMs: profile.totals.playedMs + result.survivedMs,
    },
  };

  write(profileKey(lang), next);
  return { profile: next, isRecord, previousBest };
}
