/**
 * Applies ./drizzle migrations. Runs before every Cloudflare deploy (`npm run cf:deploy`),
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
    // WORKERS_CI is set by Cloudflare's Git builds; CI by GitHub Actions and most others
    if (process.env.WORKERS_CI || process.env.CI || process.env.VERCEL) {
      throw new Error(
        "No database configured. Set DATABASE_URL and DATABASE_AUTH_TOKEN (Turso) " +
          "as build variables in the Cloudflare Worker (Settings → Build → Variables and secrets).",
      );
    }
    mkdirSync("./data", { recursive: true });
  }
  const db = drizzle(createClient({ url, authToken: dbAuthToken() }));
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`Migrations applied (${url.startsWith("file:") ? "local file" : "remote database"})`);
}

main().then(() => process.exit(0), (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
