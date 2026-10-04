/**
 * DATABASE_URL wins; TURSO_DATABASE_URL is what the Turso ↔ Vercel integration sets.
 * Falls back to a local SQLite file for development.
 */
export function dbUrl() {
  return process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "file:./data/certified.db";
}

export function dbAuthToken() {
  return process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined;
}
