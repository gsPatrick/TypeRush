"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DuelEntry from "@/components/organisms/DuelEntry/DuelEntry";
import DuelRoom from "@/components/organisms/DuelRoom/DuelRoom";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { loadPrefs } from "@/lib/game/storage";
import { DEFAULT_LANG } from "@/lib/game/languages";
import { isHostOf, markHost, normalizeCode, saveName } from "@/lib/duel/room";

/**
 * /duel            → entrada (criar sala / entrar com código)
 * /duel?sala=CODE  → a sala. Quem criou tem a marca de anfitrião na sessão;
 *                    quem chega pelo link entra como convidado.
 */
export default function DuelApp() {
  const params = useSearchParams();
  const router = useRouter();
  const code = normalizeCode(params.get("sala") || "");
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [session, setSession] = useState(null); // {code, isHost, name, mode, lang}

  useEffect(() => {
    setLang(loadPrefs().lang);
  }, []);

  // chegou por link (ou recarregou): decide o papel pela marca de sessão
  useEffect(() => {
    if (!code) {
      setSession(null);
      return;
    }
    setSession((s) => (s?.code === code ? s : { code, isHost: isHostOf(code), name: null, mode: null }));
  }, [code]);

  const enter = ({ code: c, name, host, mode, lang: roomLang }) => {
    saveName(name);
    if (host) markHost(c);
    setSession({ code: c, isHost: host, name, mode, lang: roomLang });
    router.replace(`/duel?sala=${c}`);
  };

  const leave = () => {
    setSession(null);
    router.replace("/duel");
  };

  return (
    <LocaleProvider lang={session?.lang || lang}>
      {session && session.name ? (
        <DuelRoom key={session.code} {...session} onLeave={leave} />
      ) : (
        <DuelEntry
          lang={lang}
          onLangChange={setLang}
          presetCode={code}
          presetHost={session?.isHost}
          onEnter={enter}
        />
      )}
    </LocaleProvider>
  );
}
