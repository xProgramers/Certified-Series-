/**
 * Same-origin proxy for TMDB images. Restricts sizes so the client never
 * downloads originals, and makes images CORS-safe for canvas color
 * extraction and PNG export.
 */
const SIZES = new Set(["w185", "w342", "w500", "w780", "w1280"]);
const PATH_RE = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const size = url.searchParams.get("s") ?? "w500";
  const path = url.searchParams.get("p") ?? "";
  if (!SIZES.has(size) || !PATH_RE.test(path)) {
    return new Response("Bad request", { status: 400 });
  }
  const upstream = await fetch(`https://image.tmdb.org/t/p/${size}${path}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
}
