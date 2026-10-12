import { WORDS_PT_BR } from "./words";

/**
 * Sorteia `count` palavras evitando repetir qualquer uma das últimas
 * `memory` — repetição próxima quebra o ritmo e parece bug.
 * `rng` com semente (lib/game/rng) torna a sequência reproduzível — é o que
 * dá a mesma lista aos dois jogadores de um duelo.
 * `long` = { pool, shareAt(index) }: fatia de palavras longas por posição.
 */
export function generateWords(count, previous = [], pool = WORDS_PT_BR, memory = 6, rng = Math.random, long = null) {
  const out = [];
  const recent = previous.slice(-memory);

  while (out.length < count) {
    // rampa: a chance de palavra longa depende da POSIÇÃO na lista
    const share = long ? long.shareAt(previous.length + out.length) : 0;
    const from = share > 0 && rng() < share ? long.pool : pool;
    const word = from[Math.floor(rng() * from.length)];
    const window = [...recent, ...out].slice(-memory);
    if (window.includes(word)) continue;
    out.push(word);
  }
  return out;
}
