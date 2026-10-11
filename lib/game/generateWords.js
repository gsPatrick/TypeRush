import { WORDS_PT_BR } from "./words";

/**
 * Sorteia `count` palavras evitando repetir qualquer uma das últimas
 * `memory` — repetição próxima quebra o ritmo e parece bug.
 * `rng` com semente (lib/game/rng) torna a sequência reproduzível — é o que
 * dá a mesma lista aos dois jogadores de um duelo.
 */
export function generateWords(count, previous = [], pool = WORDS_PT_BR, memory = 6, rng = Math.random) {
  const out = [];
  const recent = previous.slice(-memory);

  while (out.length < count) {
    const word = pool[Math.floor(rng() * pool.length)];
    const window = [...recent, ...out].slice(-memory);
    if (window.includes(word)) continue;
    out.push(word);
  }
  return out;
}
