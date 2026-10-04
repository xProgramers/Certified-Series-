import "server-only";
import { and, desc, eq, max, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { CardPalette } from "@/db/schema";
import type { CardData } from "./card-types";
import type { SeriesDetail } from "./tmdb";

const { users, series, watchEntries, favorites } = schema;

/** Insert or refresh the shared series cache from TMDB data. */
export async function upsertSeries(d: SeriesDetail) {
  const values = {
    id: d.id,
    name: d.name,
    originalName: d.originalName,
    overview: d.overview,
    posterPath: d.posterPath,
    backdropPath: d.backdropPath,
    firstAirYear: d.firstAirYear,
    lastAirYear: d.lastAirYear,
    numberOfSeasons: d.numberOfSeasons,
    numberOfEpisodes: d.numberOfEpisodes,
    genres: d.genres,
    networks: d.networks,
    status: d.status,
  };
  await db
    .insert(series)
    .values(values)
    .onConflictDoUpdate({ target: series.id, set: { ...values, updatedAt: new Date() } });
}

const cardSelect = {
  entryId: watchEntries.id,
  seriesId: watchEntries.seriesId,
  collectionNumber: watchEntries.collectionNumber,
  viewingNumber: watchEntries.viewingNumber,
  ratingHalves: watchEntries.ratingHalves,
  reflection: watchEntries.reflection,
  isPublic: watchEntries.isPublic,
  palette: watchEntries.palette,
  watchedAt: watchEntries.watchedAt,
  title: series.name,
  firstAirYear: series.firstAirYear,
  lastAirYear: series.lastAirYear,
  seasons: series.numberOfSeasons,
  genres: series.genres,
  posterPath: series.posterPath,
  backdropPath: series.backdropPath,
  ownerName: users.displayName,
  ownerUsername: users.username,
  favSeries: favorites.seriesId,
};

type Row = {
  entryId: string;
  seriesId: number;
  collectionNumber: number;
  viewingNumber: number;
  ratingHalves: number;
  reflection: string;
  isPublic: boolean;
  palette: CardPalette | null;
  watchedAt: Date;
  title: string;
  firstAirYear: number | null;
  lastAirYear: number | null;
  seasons: number | null;
  genres: string[];
  posterPath: string | null;
  backdropPath: string | null;
  ownerName: string;
  ownerUsername: string;
  favSeries: number | null;
};

function toCard(r: Row): CardData {
  return {
    entryId: r.entryId,
    seriesId: r.seriesId,
    title: r.title,
    firstAirYear: r.firstAirYear,
    lastAirYear: r.lastAirYear,
    seasons: r.seasons,
    genres: r.genres ?? [],
    posterPath: r.posterPath,
    backdropPath: r.backdropPath,
    rating: r.ratingHalves / 2,
    reflection: r.reflection,
    watchedAt: r.watchedAt.toISOString(),
    collectionNumber: r.collectionNumber,
    viewingNumber: r.viewingNumber,
    ownerName: r.ownerName,
    ownerUsername: r.ownerUsername,
    isFavorite: r.favSeries != null,
    isPublic: r.isPublic,
    palette: r.palette,
  };
}

function baseQuery() {
  return db
    .select(cardSelect)
    .from(watchEntries)
    .innerJoin(series, eq(series.id, watchEntries.seriesId))
    .innerJoin(users, eq(users.id, watchEntries.userId))
    .leftJoin(
      favorites,
      and(eq(favorites.userId, watchEntries.userId), eq(favorites.seriesId, watchEntries.seriesId)),
    );
}

export async function getCollection(userId: string, opts: { includePrivate: boolean }) {
  const where = opts.includePrivate
    ? eq(watchEntries.userId, userId)
    : and(eq(watchEntries.userId, userId), eq(watchEntries.isPublic, true));
  const rows = await baseQuery()
    .where(where)
    .orderBy(desc(watchEntries.collectionNumber));
  return rows.map(toCard);
}

/** Latest viewing of a series by a user (rewatch-ready). */
export async function getLatestEntry(userId: string, seriesId: number) {
  const [row] = await baseQuery()
    .where(and(eq(watchEntries.userId, userId), eq(watchEntries.seriesId, seriesId)))
    .orderBy(desc(watchEntries.viewingNumber))
    .limit(1);
  return row ? toCard(row) : null;
}

export async function getEntry(entryId: string) {
  const [row] = await baseQuery().where(eq(watchEntries.id, entryId)).limit(1);
  return row ? toCard(row) : null;
}

export async function getUserByUsername(username: string) {
  return db.query.users.findFirst({
    where: eq(users.username, username.toLowerCase()),
    columns: { id: true, username: true, displayName: true, bio: true, createdAt: true },
  });
}

export async function nextCollectionNumber(userId: string) {
  const [r] = await db
    .select({ n: max(watchEntries.collectionNumber) })
    .from(watchEntries)
    .where(eq(watchEntries.userId, userId));
  return (r?.n ?? 0) + 1;
}

export async function nextViewingNumber(userId: string, seriesId: number) {
  const [r] = await db
    .select({ n: max(watchEntries.viewingNumber) })
    .from(watchEntries)
    .where(and(eq(watchEntries.userId, userId), eq(watchEntries.seriesId, seriesId)));
  return (r?.n ?? 0) + 1;
}

/** Recent public cards across all users (home hero). */
export async function getShowcase(limit = 9) {
  const rows = await baseQuery()
    .where(eq(watchEntries.isPublic, true))
    .orderBy(desc(sql`${watchEntries.ratingHalves} + (${favorites.seriesId} is not null) * 2`), desc(watchEntries.watchedAt))
    .limit(limit);
  return rows.map(toCard);
}

export type CollectionStats = {
  total: number;
  average: number | null;
  topGenre: string | null;
  favorites: number;
  seasons: number;
  masterpieces: number;
};

export function computeStats(cards: CardData[]): CollectionStats {
  const total = cards.length;
  const average = total ? cards.reduce((a, c) => a + c.rating, 0) / total : null;
  const genreCount = new Map<string, number>();
  for (const c of cards) for (const g of c.genres) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
  const topGenre = [...genreCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    total,
    average,
    topGenre,
    favorites: cards.filter((c) => c.isFavorite).length,
    seasons: cards.reduce((a, c) => a + (c.seasons ?? 0), 0),
    masterpieces: cards.filter((c) => c.rating >= 9.5).length,
  };
}
