import "server-only";
import { and, desc, eq, max, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { CardPalette, CertificationStatus, ContentType, EntryStatus } from "@/db/schema";
import type { CardData } from "./card-types";
import type { TitleDetail } from "./tmdb";

const { users, titles, watchEntries, favorites } = schema;

/** Insert or refresh the shared title cache from TMDB data. */
export async function upsertTitle(d: TitleDetail) {
  const values = {
    type: d.type,
    id: d.id,
    name: d.name,
    originalName: d.originalName,
    overview: d.overview,
    posterPath: d.posterPath,
    backdropPath: d.backdropPath,
    startYear: d.year,
    endYear: d.endYear,
    numberOfSeasons: d.numberOfSeasons,
    numberOfEpisodes: d.numberOfEpisodes,
    runtime: d.runtime,
    genres: d.genres,
    networks: d.networks,
    contentRating: d.contentRating,
    status: d.status,
  };
  await db
    .insert(titles)
    .values(values)
    .onConflictDoUpdate({ target: [titles.type, titles.id], set: { ...values, updatedAt: new Date() } });
}

const cardSelect = {
  entryId: watchEntries.id,
  contentType: watchEntries.contentType,
  contentId: watchEntries.contentId,
  collectionNumber: watchEntries.collectionNumber,
  viewingNumber: watchEntries.viewingNumber,
  status: watchEntries.status,
  ratingHalves: watchEntries.ratingHalves,
  certification: watchEntries.certificationStatus,
  reflection: watchEntries.reflection,
  isPublic: watchEntries.isPublic,
  palette: watchEntries.palette,
  addedAt: watchEntries.addedAt,
  completedAt: watchEntries.completedAt,
  title: titles.name,
  startYear: titles.startYear,
  endYear: titles.endYear,
  seasons: titles.numberOfSeasons,
  runtime: titles.runtime,
  genres: titles.genres,
  posterPath: titles.posterPath,
  backdropPath: titles.backdropPath,
  ownerName: users.displayName,
  ownerUsername: users.username,
  favId: favorites.contentId,
};

type Row = {
  entryId: string;
  contentType: ContentType;
  contentId: number;
  collectionNumber: number;
  viewingNumber: number;
  status: EntryStatus;
  ratingHalves: number | null;
  certification: CertificationStatus | null;
  reflection: string;
  isPublic: boolean;
  palette: CardPalette | null;
  addedAt: Date;
  completedAt: Date | null;
  title: string;
  startYear: number | null;
  endYear: number | null;
  seasons: number | null;
  runtime: number | null;
  genres: string[];
  posterPath: string | null;
  backdropPath: string | null;
  ownerName: string;
  ownerUsername: string;
  favId: number | null;
};

function toCard(r: Row): CardData {
  const completed = r.status === "completed" && r.ratingHalves != null;
  return {
    entryId: r.entryId,
    contentType: r.contentType,
    contentId: r.contentId,
    title: r.title,
    startYear: r.startYear,
    endYear: r.endYear,
    seasons: r.contentType === "series" ? r.seasons : null,
    runtime: r.contentType === "movie" ? r.runtime : null,
    genres: r.genres ?? [],
    posterPath: r.posterPath,
    backdropPath: r.backdropPath,
    status: completed ? "completed" : "in_progress",
    rating: completed ? r.ratingHalves! / 2 : null,
    // An incomplete work is never certified, whatever the row says
    certification: completed ? r.certification : null,
    reflection: r.reflection,
    addedAt: r.addedAt.toISOString(),
    completedAt: completed && r.completedAt ? r.completedAt.toISOString() : null,
    collectionNumber: r.collectionNumber,
    viewingNumber: r.viewingNumber,
    ownerName: r.ownerName,
    ownerUsername: r.ownerUsername,
    isFavorite: r.favId != null,
    isPublic: r.isPublic,
    palette: r.palette,
  };
}

function baseQuery() {
  return db
    .select(cardSelect)
    .from(watchEntries)
    .innerJoin(titles, and(eq(titles.type, watchEntries.contentType), eq(titles.id, watchEntries.contentId)))
    .innerJoin(users, eq(users.id, watchEntries.userId))
    .leftJoin(
      favorites,
      and(
        eq(favorites.userId, watchEntries.userId),
        eq(favorites.contentType, watchEntries.contentType),
        eq(favorites.contentId, watchEntries.contentId),
      ),
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

/** Latest viewing of a work by a user (rewatch-ready). */
export async function getLatestEntry(userId: string, type: ContentType, id: number) {
  const [row] = await baseQuery()
    .where(and(eq(watchEntries.userId, userId), eq(watchEntries.contentType, type), eq(watchEntries.contentId, id)))
    .orderBy(desc(watchEntries.viewingNumber))
    .limit(1);
  return row ? toCard(row) : null;
}

export async function getEntry(entryId: string) {
  const [row] = await baseQuery().where(eq(watchEntries.id, entryId)).limit(1);
  return row ? toCard(row) : null;
}

/** What the user already has of each work: "series:1396" → latest status and N°. */
export async function getOwnership(userId: string) {
  const rows = await db
    .select({
      type: watchEntries.contentType,
      id: watchEntries.contentId,
      status: watchEntries.status,
      n: watchEntries.collectionNumber,
      viewing: watchEntries.viewingNumber,
    })
    .from(watchEntries)
    .where(eq(watchEntries.userId, userId))
    .orderBy(watchEntries.viewingNumber);
  const out: Record<string, { status: EntryStatus; n: number }> = {};
  for (const r of rows) out[`${r.type}:${r.id}`] = { status: r.status, n: r.n };
  return out;
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

export async function nextViewingNumber(userId: string, type: ContentType, id: number) {
  const [r] = await db
    .select({ n: max(watchEntries.viewingNumber) })
    .from(watchEntries)
    .where(and(eq(watchEntries.userId, userId), eq(watchEntries.contentType, type), eq(watchEntries.contentId, id)));
  return (r?.n ?? 0) + 1;
}

/** Recent public, completed cards across all users (home). */
export async function getShowcase(limit = 9) {
  const rows = await baseQuery()
    .where(and(eq(watchEntries.isPublic, true), eq(watchEntries.status, "completed")))
    .orderBy(
      desc(sql`${watchEntries.ratingHalves} + (${favorites.contentId} is not null) * 2`),
      desc(watchEntries.completedAt),
    )
    .limit(limit);
  return rows.map(toCard);
}

export type CollectionStats = {
  total: number;
  series: number;
  movies: number;
  inProgress: number;
  certified: number;
  notCertified: number;
};

export function computeStats(cards: CardData[]): CollectionStats {
  return {
    total: cards.length,
    series: cards.filter((c) => c.contentType === "series").length,
    movies: cards.filter((c) => c.contentType === "movie").length,
    inProgress: cards.filter((c) => c.status === "in_progress").length,
    certified: cards.filter((c) => c.certification === "certified").length,
    notCertified: cards.filter((c) => c.certification === "not_certified").length,
  };
}
