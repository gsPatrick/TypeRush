import { WORDS_PT_BR } from "./words";
import { WORDS_EN } from "./wordsEn";

/** Idiomas disponíveis — vocabulário + atributo lang do documento. */
export const LANGUAGES = {
  pt: { code: "pt", htmlLang: "pt-BR", name: "Português", words: WORDS_PT_BR },
  en: { code: "en", htmlLang: "en", name: "English", words: WORDS_EN },
};

export const DEFAULT_LANG = "pt";

export function isLang(value) {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, value);
}
