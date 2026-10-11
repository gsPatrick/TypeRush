import { GAME_CONFIG } from "@/lib/game/config";

/**
 * Modos de duelo. Cada um é (a) uma configuração do motor — o mesmo motor do
 * modo solo, só com números diferentes — e (b) uma condição de vitória que o
 * juiz (o anfitrião da sala) aplica.
 *
 *   win: "survive"  → quem zerar o relógio primeiro perde
 *        "overdrive"→ primeiro a somar `goalMs` em overdrive vence; zerar perde
 *        "score"    → tempo fixo para os dois; mais palavras certas vence
 */
const SUDDEN_DEATH_MS = 1e9; // penalidade que zera qualquer relógio

export const DUEL_MODES = {
  survival: {
    id: "survival",
    win: "survive",
    config: GAME_CONFIG,
    name: { pt: "Sobrevivência", en: "Survival" },
    rule: {
      pt: "Regras clássicas. Quem zerar o relógio primeiro perde.",
      en: "Classic rules. First clock to hit zero loses.",
    },
  },
  overdrive: {
    id: "overdrive",
    win: "overdrive",
    goalMs: 10_000,
    config: GAME_CONFIG,
    name: { pt: "Overdrive", en: "Overdrive" },
    rule: {
      pt: "Primeiro a somar 10s em overdrive vence. Zerar o relógio ainda perde.",
      en: "First to bank 10s in overdrive wins. Hitting zero still loses.",
    },
  },
  free: {
    id: "free",
    win: "score",
    config: {
      ...GAME_CONFIG,
      startMs: 60_000,
      maxMs: 60_000,
      correctBonusMs: 0,
      wrongPenaltyMs: 0,
      retryBonusMs: 0,
      combo: { ...GAME_CONFIG.combo, bonusMs: 0 },
      overdrive: { ...GAME_CONFIG.overdrive, thresholdMs: Infinity },
    },
    name: { pt: "Livre", en: "Free" },
    rule: {
      pt: "60 segundos fixos, sem bônus nem penalidade. Mais palavras certas vence.",
      en: "Fixed 60 seconds, no bonus or penalty. Most correct words wins.",
    },
  },
  sudden: {
    id: "sudden",
    win: "survive",
    config: { ...GAME_CONFIG, wrongPenaltyMs: SUDDEN_DEATH_MS },
    name: { pt: "Morte súbita", en: "Sudden death" },
    rule: {
      pt: "Um erro e acabou. Quem errar (ou zerar) primeiro perde.",
      en: "One miss and you're out. First to miss (or hit zero) loses.",
    },
  },
};

export const DUEL_MODE_ORDER = ["survival", "overdrive", "free", "sudden"];
export const DEFAULT_MODE = "survival";
