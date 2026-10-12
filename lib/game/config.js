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

  // Sequência: a partir de 5 acertos seguidos liga o groove (batida contínua
  // + medidor na tela) e cada fase adiciona camadas; errar quebra tudo.
  streak: {
    tiers: [5, 10, 25, 50], // início das fases 1…4
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

  // Rampa de dificuldade. Sem ela, quem passa de ~60 WPM ganha tempo mais
  // rápido do que o relógio gasta e só para quando cansa.
  // - nível sobe a cada `secPerLevel` de partida (por TEMPO: quem digita mais
  //   rápido segue ganhando mais por segundo e vai mais longe);
  // - `bonus`/`penalty`: fator sobre o +1s / −2s em cada nível (o último vale
  //   dali em diante);
  // - dentro do overdrive o bônus vale `overdriveBonus` (segurar o topo custa);
  // - palavras longas: fatia `longShare` por bloco de `wordsPerTier` palavras.
  //   Vai pelo ÍNDICE da palavra (não pelo tempo) para a lista continuar
  //   igual para os dois jogadores de um duelo.
  // Calibrado por simulação (média de 20 partidas, 4% de erro por palavra):
  //   40 WPM ~66s (igual a antes) · 60 ~2 min · 80 ~3,5 min · 100 ~4,4 min ·
  //   150 ~7 min — ninguém fica para sempre, e quem é mais rápido vai mais longe.
  ramp: {
    secPerLevel: 20,
    bonus: [1, 1, 0.95, 0.92, 0.89, 0.86, 0.83, 0.8, 0.77, 0.74, 0.71, 0.68, 0.65, 0.62, 0.59, 0.56, 0.53, 0.5],
    penalty: [1, 1, 1, 1, 1.25],
    overdriveBonus: 0.6,
    wordsPerTier: 30,
    longShare: [0, 0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3],
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

/** Fase do groove para uma sequência: 0 (desligado) … 4. */
export function streakTier(streak, tiers = GAME_CONFIG.streak.tiers) {
  let tier = 0;
  for (let i = 0; i < tiers.length; i++) if (streak >= tiers[i]) tier = i + 1;
  return tier;
}
