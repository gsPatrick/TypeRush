import { GAME_CONFIG } from "./config";

/**
 * O cronômetro é um prazo absoluto (`deadline`, em ms de performance.now()),
 * não um contador decrementado por setInterval. Bônus e penalidades movem o
 * prazo; o tempo restante é sempre derivado de `deadline - agora`. Assim um
 * frame atrasado ou uma aba em segundo plano nunca "ganham" tempo.
 */
export function now() {
  return performance.now();
}

export function remainingMs(deadline, at = now()) {
  return Math.max(0, deadline - at);
}

/** Move o prazo em `deltaMs`, respeitando o teto. Retorna o novo prazo. */
export function shiftDeadline(deadline, deltaMs, at = now(), maxMs = GAME_CONFIG.maxMs) {
  const next = deadline + deltaMs;
  return Math.min(next, at + maxMs);
}

export function tensionLevel(ms, t = GAME_CONFIG.tension) {
  if (ms <= t.critical) return 3;
  if (ms <= t.danger) return 2;
  if (ms <= t.warn) return 1;
  return 0;
}
