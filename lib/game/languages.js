import { WORDS_PT_BR } from "./words";
import { WORDS_EN } from "./wordsEn";
import { LONG_EN, LONG_PT_BR } from "./wordsLong";

const longOf = (base, extra) => [...new Set([...base.filter((w) => Array.from(w).length >= 7), ...extra])];

/** Idiomas disponíveis — vocabulário (+ longas da rampa) e atributo lang do documento. */
export const LANGUAGES = {
  pt: { code: "pt", htmlLang: "pt-BR", name: "Português", words: WORDS_PT_BR, long: longOf(WORDS_PT_BR, LONG_PT_BR) },
  en: { code: "en", htmlLang: "en", name: "English", words: WORDS_EN, long: longOf(WORDS_EN, LONG_EN) },
};

export const DEFAULT_LANG = "pt";

export function isLang(value) {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, value);
}
