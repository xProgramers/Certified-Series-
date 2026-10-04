/**
 * Image paths are either TMDB paths ("/abc.jpg") or sample-catalog paths
 * ("mock:1396"). Both are served from our own origin so the card renderer can
 * read pixels (color extraction) and export to PNG without CORS issues.
 */
export type ImageSize = "w185" | "w342" | "w500" | "w780" | "w1280";

export function posterUrl(path: string | null | undefined, size: ImageSize = "w500") {
  return imageUrl(path, size, "poster");
}

export function backdropUrl(path: string | null | undefined, size: ImageSize = "w1280") {
  return imageUrl(path, size, "backdrop");
}

function imageUrl(path: string | null | undefined, size: ImageSize, kind: "poster" | "backdrop") {
  if (!path) return null;
  if (path.startsWith("mock:")) return `/api/mock-poster/${path.slice(5)}?kind=${kind}`;
  return `/api/img?s=${size}&p=${encodeURIComponent(path)}`;
}

export function profileUrl(path: string | null | undefined) {
  return imageUrl(path, "w185", "poster");
}
