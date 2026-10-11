/**
 * YouTube IFrame Player API — carregada uma vez, sob demanda.
 * Termos do YouTube: o player precisa ficar VISÍVEL (mín. 200×200) — por isso
 * o vídeo aparece num cartão durante o jogo, nunca escondido.
 */
let loading = null;

export function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.onerror = () => {
        loading = null;
        reject(new Error("yt-load"));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Aceita link completo, youtu.be, shorts, embed ou o id puro. */
export function parseYouTubeId(input) {
  const v = (input || "").trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  try {
    const u = new URL(v);
    if (u.hostname.endsWith("youtu.be")) return u.pathname.slice(1, 12) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v").slice(0, 11);
    const m = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
