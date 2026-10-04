import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date()),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    bio: text("bio"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("users_username_idx").on(t.username),
    uniqueIndex("users_email_idx").on(t.email),
  ],
);

export type ContentType = "series" | "movie";
export const CONTENT_TYPES = ["series", "movie"] as const;

/**
 * One season of a series as TMDB reports it (specials / season 0 excluded).
 *   released → every episode has aired; it counts toward finishing the series
 *   airing   → some episodes are out, more are coming
 *   upcoming → announced with a date, nothing aired yet
 */
export type SeasonInfo = {
  number: number;
  name: string;
  episodes: number;
  /** Episodes already aired. */
  aired: number;
  year: number | null;
  state: "released" | "airing" | "upcoming";
};

export type EntryStatus = "in_progress" | "completed";
export type CertificationStatus = "certified" | "not_certified";

/**
 * Local cache of TMDB metadata — one row per work (series or movie), shared by
 * every user. TMDB ids are only unique per media type, hence the composite key.
 * Watch entries reference it instead of duplicating titles and image paths.
 */
export const titles = sqliteTable(
  "titles",
  {
    type: text("type").$type<ContentType>().notNull(),
    id: integer("id").notNull(), // TMDB tv id or movie id
    name: text("name").notNull(),
    originalName: text("original_name"),
    overview: text("overview"),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    /** First air year (series) or release year (movie). */
    startYear: integer("start_year"),
    /** Last air year of an ended series; null for movies. */
    endYear: integer("end_year"),
    numberOfSeasons: integer("number_of_seasons"),
    numberOfEpisodes: integer("number_of_episodes"),
    /** Movie runtime in minutes. */
    runtime: integer("runtime"),
    genres: text("genres", { mode: "json" }).$type<string[]>().notNull().default([]),
    /** TV networks or movie studios. */
    networks: text("networks", { mode: "json" }).$type<string[]>().notNull().default([]),
    /** Age rating (classificação indicativa), e.g. "16". */
    contentRating: text("content_rating"),
    status: text("status"),
    /** Seasons of a series, refreshed from TMDB so new seasons are noticed. */
    seasonList: text("season_list", { mode: "json" }).$type<SeasonInfo[] | null>(),
    /** When seasonList was last fetched from TMDB. */
    seasonsCheckedAt: integer("seasons_checked_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.type, t.id] })],
);

export type CardPalette = {
  /** Toned-down accent derived from the poster (hex). */
  accent: string;
  /** Very dark atmospheric base derived from the poster (hex). */
  base: string;
  /** Mid tone used for glows (hex). */
  glow: string;
};

/**
 * One viewing of a work by a user. It joins the collection when added
 * (in_progress, no rating) and is certified once completed and rated.
 * A work can have several entries per user (rewatches).
 */
export const watchEntries = sqliteTable(
  "watch_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contentType: text("content_type").$type<ContentType>().notNull(),
    contentId: integer("content_id").notNull(),
    /** Sequential number in the user's collection: N° 0001, N° 0002… */
    collectionNumber: integer("collection_number").notNull(),
    status: text("status").$type<EntryStatus>().notNull().default("in_progress"),
    /** Rating stored in half points: 0–20 → 0.0–10.0. Null until completed. */
    ratingHalves: integer("rating_halves"),
    /** Derived from the rating on completion: ≥ 5.0 certified, < 5.0 not certified. */
    certificationStatus: text("certification_status").$type<CertificationStatus>(),
    reflection: text("reflection").notNull().default(""),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    /** 1 for the first viewing, 2 for the first rewatch… */
    viewingNumber: integer("viewing_number").notNull().default(1),
    palette: text("palette", { mode: "json" }).$type<CardPalette | null>(),
    /**
     * Series only: season numbers the user marked as finished. The card has
     * colour only while every released season is in here. Null on entries
     * created before seasons existed, until the first season refresh fills it.
     */
    watchedSeasons: text("watched_seasons", { mode: "json" }).$type<number[] | null>(),
    addedAt: integer("added_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    /**
     * The exact moment the card got its certificate (completed with a rating,
     * or every season marked again after a new one). completed_at only holds
     * the day, so this orders cards finished on the same day.
     */
    certifiedAt: integer("certified_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [
    index("watch_entries_user_idx").on(t.userId, t.addedAt),
    uniqueIndex("watch_entries_user_number_idx").on(t.userId, t.collectionNumber),
    index("watch_entries_content_idx").on(t.contentType, t.contentId),
    // A work can be in progress only once at a time per user
    uniqueIndex("watch_entries_one_in_progress_idx")
      .on(t.userId, t.contentType, t.contentId)
      .where(sql`status = 'in_progress'`),
    foreignKey({ columns: [t.contentType, t.contentId], foreignColumns: [titles.type, titles.id] }),
  ],
);

export const favorites = sqliteTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contentType: text("content_type").$type<ContentType>().notNull(),
    contentId: integer("content_id").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.contentType, t.contentId] }),
    foreignKey({ columns: [t.contentType, t.contentId], foreignColumns: [titles.type, titles.id] }),
  ],
);

export type User = typeof users.$inferSelect;
export type Title = typeof titles.$inferSelect;
export type WatchEntry = typeof watchEntries.$inferSelect;
