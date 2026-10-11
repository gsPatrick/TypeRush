import { searchTracks } from "@/lib/music/server/lrclib";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2) return Response.json({ results: [] });
  try {
    const results = await searchTracks(q.slice(0, 100));
    return Response.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (e) {
    return Response.json({ results: [], error: e.status === 503 ? "busy" : "failed" }, { status: 502 });
  }
}
