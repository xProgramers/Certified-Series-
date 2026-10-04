import type { CardPalette, CertificationStatus, ContentType, EntryStatus } from "@/db/schema";

export type { CertificationStatus, ContentType, EntryStatus };

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
  collectionNumber: number;
  viewingNumber: number;
  ownerName: string;
  ownerUsername: string;
  isFavorite: boolean;
  isPublic: boolean;
  palette: CardPalette | null;
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

/** Date shown on the card: completion, or when it joined the collection while in progress. */
export function cardDate(c: Pick<CardData, "completedAt" | "addedAt">) {
  return c.completedAt ?? c.addedAt;
}

/** Path of the title page for a work. */
export function titleHref(type: ContentType, id: number) {
  return `/${type === "movie" ? "movies" : "series"}/${id}`;
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
