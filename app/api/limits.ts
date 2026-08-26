import { and, count, eq, gt } from "drizzle-orm";
import type { BrickLabDb } from "../../db/client";
import { feedback, towns } from "../../db/schema";

/**
 * What stops one visitor from filling the database.
 *
 * There are no accounts yet, so there is no strong identity to limit against.
 * A cookie is trivially cleared and an address is trivially shared, so neither
 * alone is enough — both are counted and the stricter one wins. This is a speed
 * bump for the careless and the casually malicious, not a defence against
 * someone determined. Worth saying plainly rather than implying otherwise.
 */
export const LIMITS = {
  feedbackPerHourPerAddress: 10,
  feedbackPerDayPerPlayer: 25,
  townsPerHourPerAddress: 12,
  townsPerOwner: 40,
} as const;

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
export const since = (ms: number) => new Date(Date.now() - ms).toISOString();

/** A stable, non-reversible handle for the caller's address. */
export async function ipHash(request: Request): Promise<string | null> {
  const header =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip");
  const first = header?.split(",")[0]?.trim();
  if (!first) return null;
  const bytes = new TextEncoder().encode(`bricklab-ip:${first}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export const tooMany = (what: string, retryAfterSeconds = 300) =>
  Response.json(
    { error: `That is a lot of ${what} in a short time. Try again shortly.` },
    { status: 429, headers: { "retry-after": String(retryAfterSeconds) } },
  );

export async function feedbackFromAddress(db: BrickLabDb, hash: string, from: string) {
  const [row] = await db
    .select({ value: count() })
    .from(feedback)
    .where(and(eq(feedback.ipHash, hash), gt(feedback.createdAt, from)));
  return row?.value ?? 0;
}

export async function feedbackFromPlayer(db: BrickLabDb, playerId: string, from: string) {
  const [row] = await db
    .select({ value: count() })
    .from(feedback)
    .where(and(eq(feedback.playerId, playerId), gt(feedback.createdAt, from)));
  return row?.value ?? 0;
}

export async function townsFromAddress(db: BrickLabDb, hash: string, from: string) {
  const [row] = await db
    .select({ value: count() })
    .from(towns)
    .where(and(eq(towns.ipHash, hash), gt(towns.createdAt, from)));
  return row?.value ?? 0;
}

export async function townsOwnedBy(db: BrickLabDb, ownerId: string) {
  const [row] = await db.select({ value: count() }).from(towns).where(eq(towns.ownerId, ownerId));
  return row?.value ?? 0;
}
