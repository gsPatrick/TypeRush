/**
 * Regras do TypeRush — todos os números do jogo moram aqui.
 * Tempo sempre em milissegundos.
 */
export const GAME_CONFIG = {
  startMs: 30_000,
  maxMs: 60_000,
  correctBonusMs: 1_000,
  wrongPenaltyMs: 2_000,

  // Nova tentativa: Backspace no campo vazio volta à palavra recém-errada.
  // O "pagamento" é a penalidade do erro; o acerto na retry vale menos.
  retryBonusMs: 500,

  // Combo opcional: a cada N acertos seguidos, tempo extra.
  combo: {
    every: 10,
    bonusMs: 2_000,
  },

  // Overdrive: relógio acima de 35s — 5s de folga sobre o tempo inicial,
  // então só entra quem está realmente acumulando, não quem oscila em 30s.
  // graceMs absorve a oscilação de quem digita perto do limite (sem isso o
  // modo pisca liga/desliga a cada palavra); sessões menores que minBlastMs
  // saem sem explosão.
  overdrive: {
    thresholdMs: 35_000,
    graceMs: 600,
    minBlastMs: 1_500,
  },

  // Palavras geradas por lote; um novo lote entra quando faltam LOOKAHEAD.
  wordBatch: 80,
  wordLookahead: 40,

  // Janela móvel usada no WPM máximo (rajada) — 5s evita picos de 1 palavra.
  peakWindowSec: 5,

  // Faixas de tensão do cronômetro (ms restantes).
  tension: {
    warn: 10_000,
    danger: 5_000,
    critical: 3_000,
  },
};

export const CHARS_PER_WORD = 5;
