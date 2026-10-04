import { searchSeries } from "@/lib/tmdb";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    const results = await searchSeries(q);
    return Response.json({ results });
  } catch {
    return Response.json({ results: [], error: "Não foi possível buscar agora." }, { status: 502 });
  }
}
