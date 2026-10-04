import type { CardPalette } from "@/db/schema";

/** Everything the card renderer needs — serializable, no DB types. */
export type CardData = {
  entryId: string;
  seriesId: number;
  title: string;
  firstAirYear: number | null;
  lastAirYear: number | null;
  seasons: number | null;
  genres: string[];
  posterPath: string | null;
  backdropPath: string | null;
  rating: number; // 0–10 in 0.5 steps
  reflection: string;
  watchedAt: string; // ISO
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

export function formatRating(r: number) {
  return r.toFixed(1);
}

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
