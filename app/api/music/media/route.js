import { findVideo } from "@/lib/music/server/youtube";
import { findCover, spotifySearchUrl } from "@/lib/music/server/credits";

export const dynamic = "force-dynamic";

/** Capa + link do Spotify + vídeo do YouTube casado pela duração. */
export async function GET(request) {
  const p = new URL(request.url).searchParams;
  const artist = p.get("artist") || "";
  const track = p.get("track") || "";
  const duration = Number(p.get("duration") || 0);
  const album = p.get("album") || "";
  if (!artist || !track) return Response.json({ error: "bad-request" }, { status: 400 });

  const [cover, yt] = await Promise.all([
    findCover({ artist, track }),
    findVideo({ artist, track, duration, album }).catch(() => ({ video: null, reason: "failed" })),
  ]);

  return Response.json(
    {
      cover: cover?.cover ?? null,
      spotify: spotifySearchUrl(artist, track),
      video: yt.video,
      videoReason: yt.reason,
    },
    // sem chave do YouTube não cacheia: assim que a chave entrar, vale na hora
    { headers: { "Cache-Control": yt.reason === "no-key" ? "no-store" : "public, s-maxage=86400, stale-while-revalidate=604800" } }
  );
}
