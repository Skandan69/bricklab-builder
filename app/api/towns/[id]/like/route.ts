import { and, count, eq } from "drizzle-orm";
import { getAnyDb, storageUnavailable } from "../../../../../db/client";
import { townLikes, towns } from "../../../../../db/schema";
import { fail, isTownId, isVoterId } from "../../shared";

export const dynamic = "force-dynamic";

async function tally(townId: string, voterId: string | null) {
  const db = await getAnyDb();
  if (!db) return storageUnavailable();
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

/** GET /api/towns/:id/like?voterId= */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isTownId(id)) return fail("Invalid town id", 400);
  const voterIdParam = new URL(request.url).searchParams.get("voterId");
  return Response.json(await tally(id, isVoterId(voterIdParam) ? voterIdParam : null));
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
  if (body.liked) {
    await db
      .insert(townLikes)
      .values({ id: rowId, townId: id, voterId: body.voterId })
      .onConflictDoNothing();
  } else {
    await db.delete(townLikes).where(eq(townLikes.id, rowId));
  }
  return Response.json(await tally(id, body.voterId));
}
