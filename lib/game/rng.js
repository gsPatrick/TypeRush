/**
 * Aleatório com semente — os dois jogadores de um duelo geram exatamente a
 * mesma sequência de palavras a partir do mesmo número.
 */

/** mulberry32: rápido, 32 bits, boa distribuição para sorteio de palavras. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}
