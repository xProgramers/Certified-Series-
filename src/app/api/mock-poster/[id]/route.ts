import { findMockByImageKey } from "@/lib/mock-catalog";
import { mockBackdrop, mockPoster } from "@/lib/mock-poster";

/**
 * Generates abstract art posters for the sample catalog (no TMDB token).
 * Pure SVG, deterministic per title. id is "1396" (series) or "m603" (movie).
 */
export async function GET(req: Request, ctx: RouteContext<"/api/mock-poster/[id]">) {
  const { id } = await ctx.params;
  const m = findMockByImageKey(id);
  if (!m) return new Response("Not found", { status: 404 });
  const kind = new URL(req.url).searchParams.get("kind") === "backdrop" ? "backdrop" : "poster";
  const svg = kind === "poster" ? mockPoster(m) : mockBackdrop(m);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
