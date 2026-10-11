/**
 * Normalização de texto para comparação.
 *
 * NFC junta "a" + acento combinante (U+0301) em "á", então a mesma letra
 * digitada por teclados/IME diferentes compara igual.
 */
export function normalize(value) {
  return value.normalize("NFC");
}

/** Divide em caracteres visíveis (code points), não em unidades UTF-16. */
export function toChars(value) {
  return Array.from(normalize(value));
}

/**
 * Estado de cada letra de uma palavra contra o que foi digitado.
 * Retorna { letters: [{char, state}], extra: string[] }
 *   state: "pending" | "correct" | "incorrect"
 */
export function diffWord(target, typed) {
  const t = toChars(target);
  const d = toChars(typed);

  const letters = t.map((char, i) => {
    if (i >= d.length) return { char, state: "pending" };
    return { char, state: d[i] === char ? "correct" : "incorrect" };
  });

  return { letters, extra: d.slice(t.length) };
}

export function isWordCorrect(target, typed) {
  return normalize(target) === normalize(typed);
}
