import { CHARS_PER_WORD, GAME_CONFIG } from "./config";

/**
 * WPM no padrão de mercado: caracteres de palavras corretas (incluindo o espaço
 * que as separa) ÷ 5, por minuto.
 */
export function wpm(correctChars, elapsedMs) {
  if (elapsedMs <= 0) return 0;
  return correctChars / CHARS_PER_WORD / (elapsedMs / 60_000);
}

export function accuracy(correctKeys, incorrectKeys) {
  const total = correctKeys + incorrectKeys;
  if (total === 0) return 100;
  return (correctKeys / total) * 100;
}

/**
 * Pico de WPM numa janela móvel de N segundos.
 * `samples[i]` = caracteres corretos acumulados ao fim do segundo i+1.
 * Partidas mais curtas que a janela usam a média da partida inteira.
 */
export function peakWpm(samples, windowSec = GAME_CONFIG.peakWindowSec) {
  if (samples.length === 0) return 0;
  if (samples.length < windowSec) {
    return wpm(samples[samples.length - 1], samples.length * 1000);
  }

  let best = 0;
  for (let i = windowSec - 1; i < samples.length; i++) {
    const before = i - windowSec >= 0 ? samples[i - windowSec] : 0;
    best = Math.max(best, wpm(samples[i] - before, windowSec * 1000));
  }
  return best;
}

/** WPM por segundo para o gráfico de resultado (janela móvel suaviza ruído). */
export function wpmSeries(samples, windowSec = 3) {
  return samples.map((chars, i) => {
    const span = Math.min(i + 1, windowSec);
    const before = i - span >= 0 ? samples[i - span] : 0;
    return Math.round(wpm(chars - before, span * 1000));
  });
}
