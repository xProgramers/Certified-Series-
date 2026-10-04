import { defineConfig } from "drizzle-kit";
import { dbAuthToken, dbUrl } from "./src/db/url";

try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: { url: dbUrl(), authToken: dbAuthToken() },
});
