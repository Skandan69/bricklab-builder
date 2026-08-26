import { and, count, eq } from "drizzle-orm";
import { getAnyDb, storageUnavailable } from "../../../../../db/client";
import { townLikes, towns } from "../../../../../db/schema";
import { fail, isTownId, isVoterId } from "../../shared";

export const dynamic = "force-dynamic";

/**
 * Count the likes on a town.
 *
 * This used to return `storageUnavailable()` — a Response — from inside a
 * function whose other branch returns a plain object, and the caller passed
 * whatever came back to `Response.json()`. Serialising a Response is not a
 * thing, so a missing database turned into an unexplained 500. Now it returns
 * null and the caller decides.
 */
async function tally(townId: string, voterId: string | null) {
  const db = await getAnyDb();
  if (!db) return null;
  const [total] = await db
    .select({ value: count() })
    .from(townLikes)
    .where(eq(townLikes.townId, townId));
  let liked = false;
  if (voterId) {
    const rows = await db
      .select({ id: townLikes.id })
      .from(townLikes)
      .where(and(eq(townLikes.townId, townId), eq(townLikes.voterId, voterId)))
      .limit(1);
    liked = rows.length > 0;
  }
  return { count: total?.value ?? 0, liked };
}

/** Never let a database problem leave the caller with an empty 500 body. */
async function respond(townId: string, voterId: string | null) {
  try {
    const result = await tally(townId, voterId);
    if (!result) return storageUnavailable();
    return Response.json(result);
  } catch (error) {
    return fail(`Likes are unavailable: ${(error as Error)?.message ?? "unknown error"}`.slice(0, 200), 503);
  }
}

/** GET /api/towns/:id/like?voterId= */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isTownId(id)) return fail("Invalid town id", 400);
  const voterIdParam = new URL(request.url).searchParams.get("voterId");
  return respond(id, isVoterId(voterIdParam) ? voterIdParam : null);
}

/** POST /api/towns/:id/like { voterId, liked } */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isTownId(id)) return fail("Invalid town id", 400);

  let body: { voterId?: unknown; liked?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("Invalid JSON body", 400);
  }
  if (!isVoterId(body.voterId) || typeof body.liked !== "boolean") {
    return fail("Invalid like request", 400);
  }

  const db = await getAnyDb();
  if (!db) return storageUnavailable();
  const [town] = await db.select({ id: towns.id, visibility: towns.visibility }).from(towns).where(eq(towns.id, id)).limit(1);
  if (!town) return fail("Town not found", 404);
  if (town.visibility === "private") return fail("This town is private", 403);

  const rowId = `${id}:${body.voterId}`;
  try {
    if (body.liked) {
      await db
        .insert(townLikes)
        .values({ id: rowId, townId: id, voterId: body.voterId })
        .onConflictDoNothing();
    } else {
      await db.delete(townLikes).where(eq(townLikes.id, rowId));
    }
  } catch (error) {
    return fail(`Could not record that like: ${(error as Error)?.message ?? "unknown error"}`.slice(0, 200), 503);
  }
  return respond(id, body.voterId);
}
