import { popularTitles, searchTitles, type SearchType } from "@/lib/tmdb";

const TYPES: SearchType[] = ["all", "series", "movie"];

/** ?q=…&type=all|series|movie — an empty query returns this week's trending titles. */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = params.get("q") ?? "";
  const type = TYPES.find((t) => t === params.get("type")) ?? "all";
  try {
    const results = q.trim() ? await searchTitles(q, type) : await popularTitles(type);
    return Response.json({ results });
  } catch {
    return Response.json({ results: [], error: "Não foi possível buscar agora." }, { status: 502 });
  }
}
