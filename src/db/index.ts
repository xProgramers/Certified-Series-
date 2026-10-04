import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { dbAuthToken, dbUrl } from "./url";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  libsql?: ReturnType<typeof createClient>;
};

const client =
  globalForDb.libsql ??
  createClient({
    url: dbUrl(),
    authToken: dbAuthToken(),
  });

if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export { schema };
