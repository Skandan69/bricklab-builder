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
    /* The web client speaks HTTP and nothing else, which is right for Turso.
       A `file:` URL is for running the real routes against a real database
       locally, and needs the node client instead. */
    const local = url.startsWith("file:");
    const { drizzle } = await import("drizzle-orm/libsql");
    /* Two separate awaits rather than a ternary inside Promise.all, which
       reads better and keeps the two drivers apart.
       Worth knowing: the production bundle aliases the bare specifier to the
       web build, so a `file:` URL will not work against a built server — only
       against a real libsql endpoint. Local testing of these routes has to go
       through the dev server or straight at the database. */
    let createClient;
        if (local) ({ createClient } = await import("@libsql/client"));
    else ({ createClient } = await import("@libsql/client/web"));
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
