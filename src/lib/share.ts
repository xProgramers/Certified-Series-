import { formatRating, formatRuntime, formatYears, type CardData } from "./card-types";

/*
 * Words for a shared card (/card/[id]): its page, its link preview text and
 * its preview image. Link previews are fetched signed out, so a private card
 * is described by its work alone.
 */

/** "Série · 2008–2013 · 5 temporadas · Drama, Crime" */
export function workFacts(c: CardData) {
  return [
    c.contentType === "movie" ? "Filme" : "Série",
    formatYears(c.startYear, c.endYear),
    c.contentType === "series" && c.seasons ? `${c.seasons} ${c.seasons === 1 ? "temporada" : "temporadas"}` : null,
    c.contentType === "movie" && c.runtime ? formatRuntime(c.runtime) : null,
    c.genres.slice(0, 2).join(", ") || null,
  ].filter(Boolean) as string[];
}

export function shareDescription(c: CardData) {
  const work = workFacts(c).slice(0, 2).join(" · ");
  if (!c.isPublic) return `${work}. Veja onde assistir e adicione à sua coleção no Certified Series.`;
  if (c.status !== "completed" || c.rating == null) return `${work}. Em andamento na coleção de @${c.ownerUsername}.`;
  const verdict = `${formatRating(c.rating)}/10 · ${c.certification === "certified" ? "Certified" : "Not certified"}`;
  const quote = c.reflection ? ` “${clip(c.reflection, 140)}”` : "";
  return `${verdict}.${quote} Na coleção de @${c.ownerUsername}.`;
}

export function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}
