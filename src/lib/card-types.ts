import type { CardBadge } from "./achievements";
import type { CardPalette, CertificationStatus, ContentType, EntryStatus, SeasonInfo } from "@/db/schema";

export type { CertificationStatus, ContentType, EntryStatus, SeasonInfo };

/** Everything the card renderer needs — serializable, no DB types. */
export type CardData = {
  entryId: string;
  contentType: ContentType;
  contentId: number;
  title: string;
  /** First air year (series) or release year (movie). */
  startYear: number | null;
  endYear: number | null;
  /** Series only. */
  seasons: number | null;
  /** Movies only, minutes. */
  runtime: number | null;
  genres: string[];
  posterPath: string | null;
  backdropPath: string | null;
  status: EntryStatus;
  /** 0–10 in 0.5 steps; null while in progress. */
  rating: number | null;
  certification: CertificationStatus | null;
  reflection: string;
  addedAt: string; // ISO
  completedAt: string | null; // ISO
  /** Exact moment the card was certified (completedAt only holds the day). */
  certifiedAt?: string | null; // ISO
  collectionNumber: number;
  viewingNumber: number;
  ownerName: string;
  ownerUsername: string;
  isFavorite: boolean;
  isPublic: boolean;
  palette: CardPalette | null;
  /** Series only: the seasons TMDB knows about. */
  seasonList?: SeasonInfo[] | null;
  /** Series only: seasons marked as finished (already resolved for legacy entries). */
  watchedSeasons?: number[] | null;
  /** Rated series whose card went back to black & white because a new season came out. */
  newSeason?: boolean;
  /** Achievement seals this card earned (at most two, most prestigious first). */
  badges?: CardBadge[];
};

export const HOUSE_PALETTE: CardPalette = {
  accent: "#c9b07a",
  base: "#121110",
  glow: "#4a3f2c",
};

/** The rule of the product: rating ≥ 5.0 certifies, below it does not. Exact value, never rounded. */
export const CERTIFICATION_THRESHOLD = 5;

export function certificationFor(rating: number): CertificationStatus {
  return rating >= CERTIFICATION_THRESHOLD ? "certified" : "not_certified";
}

export function formatRating(r: number) {
  return r.toFixed(1);
}

/** 148 → "2h 28m" */
export function formatRuntime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/**
 * "Mais recentes": the most recently certified first, by the completion day on
 * the card and then the exact moment of certification; works not certified
 * (yet) after them, the most recently added first.
 */
export function byMostRecent(a: CardData, b: CardData) {
  if (!!a.completedAt !== !!b.completedAt) return a.completedAt ? -1 : 1;
  if (a.completedAt && b.completedAt) {
    const day = b.completedAt.slice(0, 10).localeCompare(a.completedAt.slice(0, 10));
    if (day) return day;
    const at = (b.certifiedAt ?? b.completedAt).localeCompare(a.certifiedAt ?? a.completedAt);
    if (at) return at;
  } else {
    const at = b.addedAt.localeCompare(a.addedAt);
    if (at) return at;
  }
  return b.collectionNumber - a.collectionNumber;
}

/** Date shown on the card: completion, or when it joined the collection while in progress. */
export function cardDate(c: Pick<CardData, "completedAt" | "addedAt">) {
  return c.completedAt ?? c.addedAt;
}

/** Path of the title page for a work. */
export function titleHref(type: ContentType, id: number) {
  return `/${type === "movie" ? "movies" : "series"}/${id}`;
}

/** Public page of a card: the link people share. */
export function cardHref(entryId: string) {
  return `/card/${entryId}`;
}

export function personHref(id: string) {
  return `/person/${encodeURIComponent(id)}`;
}

export const TYPE_LABEL: Record<ContentType, { one: string; many: string }> = {
  series: { one: "série", many: "séries" },
  movie: { one: "filme", many: "filmes" },
};

export function formatCardDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
}

export function formatCollectionNumber(n: number) {
  return String(n).padStart(4, "0");
}

export function formatYears(a: number | null, b: number | null) {
  if (!a) return "";
  if (b && b !== a) return `${a}–${b}`;
  return String(a);
}

/**
 * Where a series stands against its released seasons. A series is only
 * finished (and its card in colour) while every released season is marked;
 * seasons still airing or announced never count.
 *   watched null = an entry from before season tracking: a completed one
 *   counts as having every released season.
 */
export function seasonProgress(list: SeasonInfo[] | null | undefined, watched: number[] | null | undefined, rated: boolean) {
  const released = (list ?? []).filter((s) => s.state === "released").map((s) => s.number);
  const marked = watched ?? (rated ? released : []);
  const missing = released.filter((n) => !marked.includes(n));
  const lastMarked = Math.max(0, ...marked);
  return {
    released,
    watched: marked,
    missing,
    done: missing.length === 0,
    // A season after everything the user had marked: something new came out
    newSeason: rated && missing.some((n) => n > lastMarked),
  };
}
