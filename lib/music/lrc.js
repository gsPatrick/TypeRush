/**
 * Letras sincronizadas (formato LRC) → linhas digitáveis.
 *
 *   [00:12.28] Quando eu digo que deixei de te amar
 *
 * Normalização para digitar (o que aparece na tela É o que se digita):
 * - minúsculas, NFC (acentos compostos e decompostos comparam igual)
 * - sai: conteúdo entre parênteses (backing vocal sobreposto), pontuação
 * - hífen/travessão viram espaço; aspas curvas viram apóstrofo reto (que fica:
 *   "don't", "d'água" se digitam como são)
 * Pontuação na digitação é castigo, não habilidade — por isso sai.
 */

const TIME_TAG = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

export function parseLrc(lrc) {
  const lines = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const tags = [...raw.matchAll(TIME_TAG)];
    if (!tags.length) continue;
    const text = raw.replace(TIME_TAG, "").trim();
    for (const m of tags) {
      const frac = m[3] ? Number(`0.${m[3].padEnd(3, "0")}`) : 0;
      lines.push({ t: Number(m[1]) * 60 + Number(m[2]) + frac, text });
    }
  }
  return lines.sort((a, b) => a.t - b.t);
}

export function normalizeLyric(text) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[-‐-―]/g, " ")
    .replace(/[^\p{L}\p{N}' ]/gu, "")
    .replace(/(^|\s)'+|'+(?=\s|$)/g, "$1") // apóstrofo solto nas pontas
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Modo "sem acentos": tira acento, cedilha e apóstrofo. A tela mostra a letra
 * JÁ dobrada — o que aparece continua sendo exatamente o que se digita.
 *   "não é pão d'água" → "nao e pao dagua"
 */
export function foldLyric(text) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFC");
}

/**
 * Janela de cada linha: do tempo dela até a próxima, mas nunca maior que o
 * necessário — depois de um verso vem um solo de 30s, e a linha não pode
 * ficar 30s esperando. Linha vazia no LRC = pausa (fecha a janela).
 */
export function buildLines(parsed, { minWindow = 2.2, perChar = 0.42, slack = 2.5, relaxed = false } = {}) {
  const out = [];
  for (let i = 0; i < parsed.length; i++) {
    const { t, text } = parsed[i];
    const typed = relaxed ? foldLyric(normalizeLyric(text)) : normalizeLyric(text);
    if (!typed) continue;
    const next = parsed[i + 1]?.t ?? t + 8;
    const natural = Math.max(minWindow, Array.from(typed).length * perChar + slack);
    out.push({ t, end: Math.min(next, t + natural), text: typed, original: text });
  }
  // linhas com o mesmo tempo (dupla marcação) viram uma só
  return out.filter((l, i) => i === 0 || l.t !== out[i - 1].t || l.text !== out[i - 1].text);
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
