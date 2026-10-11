"use client";

import { createContext, useContext, useMemo } from "react";
import { STRINGS } from "./strings";
import { DEFAULT_LANG } from "@/lib/game/languages";

const LocaleContext = createContext({ lang: DEFAULT_LANG, t: STRINGS[DEFAULT_LANG] });

export function LocaleProvider({ lang, children }) {
  // memo: sem isso cada tecla recriaria o valor e re-renderizaria todos os consumidores
  const value = useMemo(() => ({ lang, t: STRINGS[lang] }), [lang]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** `const { t, lang } = useLocale()` */
export function useLocale() {
  return useContext(LocaleContext);
}
