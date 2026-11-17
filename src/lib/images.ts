/**
 * Image paths are either TMDB paths ("/abc.jpg") or sample-catalog paths
 * ("mock:1396").
 *
 * TMDB images load straight from TMDB's CDN (image.tmdb.org): a poster that
 * went through our own server was one request to the hosting plan per poster
 * view, and that is what used up the Vercel limits. Only palette extraction
 * reads pixels on a canvas, which needs a same-origin copy: `paletteUrl`.
 */
export type ImageSize = "w92" | "w185" | "w342" | "w500" | "w780" | "w1280";

const TMDB_IMG = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null | undefined, size: ImageSize = "w500") {
  return imageUrl(path, size, "poster");
}

export function backdropUrl(path: string | null | undefined, size: ImageSize = "w1280") {
  return imageUrl(path, size, "backdrop");
}

function imageUrl(path: string | null | undefined, size: ImageSize, kind: "poster" | "backdrop") {
  if (!path) return null;
  if (path.startsWith("mock:")) return `/api/mock-poster/${path.slice(5)}?kind=${kind}`;
  return `${TMDB_IMG}/${size}${path}`;
}

/**
 * A small poster the browser can read pixels from (same origin, through
 * /api/img), for the card's colour palette. Used only when a palette isn't
 * stored yet, so it's rare.
 */
export function paletteUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("mock:")) return `/api/mock-poster/${path.slice(5)}?kind=poster`;
  return `/api/img?s=w185&p=${encodeURIComponent(path)}`;
}

export function profileUrl(path: string | null | undefined) {
  return imageUrl(path, "w185", "poster");
}

/** Streaming service logo (TMDB), shown at ~18px. */
export function logoUrl(path: string | null | undefined) {
  return imageUrl(path, "w92", "poster");
}
