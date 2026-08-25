import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

export type BrickLabDb = BaseSQLiteDatabase<"async", unknown, typeof schema>;

/**
 * The database for whichever target is running.
 *
 * - Turso / libSQL when `TURSO_DATABASE_URL` is set — this is what Vercel uses.
 * - Cloudflare D1 otherwise, imported dynamically so `cloudflare:workers`
 *   never reaches a Vercel bundle.
 * - `null` when neither is configured, so callers can answer politely instead
 *   of throwing a 500 at the player.
 */
export async function getAnyDb(): Promise<BrickLabDb | null> {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    const [{ drizzle }, { createClient }] = await Promise.all([
      import("drizzle-orm/libsql"),
      import("@libsql/client/web"),
    ]);
    const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    return drizzle(client, { schema }) as unknown as BrickLabDb;
  }

  if (process.env.VERCEL) return null;

  try {
    const { getDb } = await import("./index");
    return getDb() as unknown as BrickLabDb;
  } catch {
    return null;
  }
}

export const storageUnavailable = () =>
  Response.json(
    {
      error:
        "Saved towns need a database. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, then run `node scripts/migrate-turso.mjs`.",
    },
    { status: 503 },
  );
