import { getTrack } from "@/lib/music/server/lrclib";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) return Response.json({ error: "bad-id" }, { status: 400 });
  try {
    const track = await getTrack(id);
    if (!track) return Response.json({ error: "not-found" }, { status: 404 });
    return Response.json(track, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (e) {
    return Response.json({ error: e.status === 503 ? "busy" : "failed" }, { status: 502 });
  }
}
