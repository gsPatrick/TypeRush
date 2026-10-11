import { findCover } from "@/lib/music/server/credits";

export const dynamic = "force-dynamic";

/** Capa sob demanda (lista de busca e recentes antigos). Cache longo na CDN. */
export async function GET(request) {
  const p = new URL(request.url).searchParams;
  const artist = p.get("artist") || "";
  const track = p.get("track") || "";
  if (!artist || !track) return Response.json({ cover: null }, { status: 400 });
  const c = await findCover({ artist, track });
  return Response.json(
    { cover: c?.thumb ?? null },
    { headers: { "Cache-Control": c ? "public, s-maxage=604800, stale-while-revalidate=2592000" : "public, s-maxage=3600" } }
  );
}
