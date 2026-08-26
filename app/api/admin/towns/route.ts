import { desc, eq } from "drizzle-orm";
import { getAnyDb } from "../../../../db/client";
import { townLikes, towns } from "../../../../db/schema";

/* Named columns, not `.select()` — see the note in ../route.ts: a bare select
   expands to the whole schema and breaks against a database that has not run
   the latest migration yet. */
const TOWN_COLUMNS = {
  id: towns.id,
  ownerId: towns.ownerId,
  ownerName: towns.ownerName,
  name: towns.name,
  data: towns.data,
  brickCount: towns.brickCount,
  thumb: towns.thumb,
  visibility: towns.visibility,
  createdAt: towns.createdAt,
  updatedAt: towns.updatedAt,
};

export const dynamic = "force-dynamic";

/**
 * The takedown path.
 *
 * The community gallery is open to anyone with a browser and there are no
 * accounts yet, so there needs to be some way to remove something you would
 * not want on your front page. Until real sign-in exists that gate is a shared
 * secret in `ADMIN_KEY`; with it unset these routes refuse everyone, including
 * you, which is the safe way round.
 */
const fail = (error: string, status: number) => Response.json({ error }, { status });

function guard(request: Request): Response | null {
  const expected = process.env.ADMIN_KEY;
  if (!expected || expected.length < 16) {
    return fail("Set ADMIN_KEY (16 characters or more) to moderate towns", 503);
  }
  const key = new URL(request.url).searchParams.get("key");
  // a wrong key and a missing route should look the same from outside
  if (key !== expected) return fail("Not found", 404);
  return null;
}

/** GET /api/admin/towns?key=… — the most recently updated public towns. */
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  const db = await getAnyDb();
  if (!db) return fail("Moderation needs a database — set TURSO_DATABASE_URL", 503);

  const rows = await db
    .select({
      id: towns.id,
      name: towns.name,
      ownerName: towns.ownerName,
      ownerId: towns.ownerId,
      brickCount: towns.brickCount,
      visibility: towns.visibility,
      updatedAt: towns.updatedAt,
    })
    .from(towns)
    .where(eq(towns.visibility, "public"))
    .orderBy(desc(towns.updatedAt))
    .limit(100);

  return Response.json({ count: rows.length, items: rows });
}

/**
 * POST /api/admin/towns?key=… — take one down.
 *
 * `unlist` is the lighter hand: the town stays with its owner but leaves the
 * gallery. `delete` removes it and its likes for good.
 */
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  let body: { id?: unknown; action?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const id = typeof body.id === "string" && /^[a-z0-9]{6,24}$/i.test(body.id) ? body.id : null;
  if (!id) return fail("Invalid town id", 400);
  const action = body.action === "delete" ? "delete" : body.action === "unlist" ? "unlist" : null;
  if (!action) return fail("Action must be unlist or delete", 400);

  const db = await getAnyDb();
  if (!db) return fail("Moderation needs a database — set TURSO_DATABASE_URL", 503);

  const [existing] = await db.select(TOWN_COLUMNS).from(towns).where(eq(towns.id, id)).limit(1);
  if (!existing) return fail("Town not found", 404);

  if (action === "unlist") {
    await db.update(towns).set({ visibility: "private" }).where(eq(towns.id, id));
    return Response.json({ id, action, name: existing.name, ok: true });
  }

  await db.delete(townLikes).where(eq(townLikes.townId, id));
  await db.delete(towns).where(eq(towns.id, id));
  return Response.json({ id, action, name: existing.name, ok: true });
}
