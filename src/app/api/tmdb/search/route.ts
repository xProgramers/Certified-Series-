import { popularTitles, searchTitles, type SearchType } from "@/lib/tmdb";

const TYPES: SearchType[] = ["all", "series", "movie"];

/** ?q=…&type=all|series|movie — an empty query returns this week's trending titles. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = params.get("q") ?? "";
  const type = TYPES.find((t) => t === params.get("type")) ?? "all";
  try {
    const results = q.trim() ? await searchTitles(q, type) : await popularTitles(type);
    // Same for every user, so a CDN in front can answer repeats without the function
    return Response.json({ results }, {
      // The browser keeps a search for 10 minutes; the cache in front, for an hour
      headers: { "Cache-Control": "public, max-age=600", "CDN-Cache-Control": "public, max-age=3600" },
    });
  } catch (e) {
    console.error("TMDB search failed", e);
    return Response.json({ results: [], error: "Não foi possível buscar agora." }, { status: 502 });
  }
}
