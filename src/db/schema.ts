import { sql } from "drizzle-orm";
import {
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

/**
 * Local cache of TMDB metadata — one row per series, shared by every user.
 * Watch entries reference it instead of duplicating titles and image paths.
 */
export const series = sqliteTable("series", {
  id: integer("id").primaryKey(), // TMDB tv id
  name: text("name").notNull(),
  originalName: text("original_name"),
  overview: text("overview"),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  firstAirYear: integer("first_air_year"),
  lastAirYear: integer("last_air_year"),
  numberOfSeasons: integer("number_of_seasons"),
  numberOfEpisodes: integer("number_of_episodes"),
  genres: text("genres", { mode: "json" }).$type<string[]>().notNull().default([]),
  networks: text("networks", { mode: "json" }).$type<string[]>().notNull().default([]),
  status: text("status"),
  ...timestamps,
});

export type CardPalette = {
  /** Toned-down accent derived from the poster (hex). */
  accent: string;
  /** Very dark atmospheric base derived from the poster (hex). */
  base: string;
  /** Mid tone used for glows (hex). */
  glow: string;
};

/**
 * One viewing of a series by a user. A series can have several entries per
 * user (rewatches); rating and reflection belong to the viewing.
 */
export const watchEntries = sqliteTable(
  "watch_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id),
    /** Sequential number in the user's collection: N° 0001, N° 0002… */
    collectionNumber: integer("collection_number").notNull(),
    /** Rating stored in half points: 0–20 → 0.0–10.0 */
    ratingHalves: integer("rating_halves").notNull(),
    reflection: text("reflection").notNull().default(""),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
    /** 1 for the first viewing, 2 for the first rewatch… */
    viewingNumber: integer("viewing_number").notNull().default(1),
    palette: text("palette", { mode: "json" }).$type<CardPalette | null>(),
    watchedAt: integer("watched_at", { mode: "timestamp_ms" }).notNull(),
    ...timestamps,
  },
  (t) => [
    index("watch_entries_user_idx").on(t.userId, t.watchedAt),
    uniqueIndex("watch_entries_user_number_idx").on(t.userId, t.collectionNumber),
    index("watch_entries_series_idx").on(t.seriesId),
  ],
);

export const favorites = sqliteTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seriesId: integer("series_id")
      .notNull()
      .references(() => series.id),
    createdAt: timestamps.createdAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.seriesId] })],
);

export type User = typeof users.$inferSelect;
export type Series = typeof series.$inferSelect;
export type WatchEntry = typeof watchEntries.$inferSelect;
