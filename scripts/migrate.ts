/**
 * Applies ./drizzle migrations. Runs on every Vercel build (see vercel.json),
 * so a fresh Turso database gets its tables automatically.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdirSync } from "node:fs";
import { dbAuthToken, dbUrl } from "../src/db/url";

async function main() {
  const url = dbUrl();
  if (url.startsWith("file:")) {
    if (process.env.VERCEL) {
      throw new Error(
        "No database configured. Connect a Turso database to this Vercel project " +
          "(Storage → Turso) or set DATABASE_URL and DATABASE_AUTH_TOKEN.",
      );
    }
    mkdirSync("./data", { recursive: true });
  }
  const db = drizzle(createClient({ url, authToken: dbAuthToken() }));
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`Migrations applied (${url.startsWith("file:") ? "local file" : "remote database"})`);
}

main().then(() => process.exit(0), (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
