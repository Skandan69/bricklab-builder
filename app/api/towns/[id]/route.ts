import { count, eq } from "drizzle-orm";
import { getAnyDb, storageUnavailable } from "../../../../db/client";
import { townLikes, towns } from "../../../../db/schema";
import {
  checkTownData,
  cleanName,
  cleanThumb,
  cleanVisibility,
  currentViewer,
  fail,
  isTownId,
  needSignIn,
} from "../shared";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/towns/:id — the full town, if the viewer is allowed to see it. */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  if (!isTownId(id)) return fail("Invalid town id", 400);

  const db = await getAnyDb();
  if (!db) return storageUnavailable();
  const [row] = await db.select().from(towns).where(eq(towns.id, id)).limit(1);
  if (!row) return fail("Town not found", 404);

  const viewer = await currentViewer();
  const mine = !!viewer && viewer.ownerId === row.ownerId;
  if (row.visibility === "private" && !mine) return fail("This town is private", 403);

  const [likes] = await db
    .select({ value: count() })
    .from(townLikes)
    .where(eq(townLikes.townId, id));

  let data: unknown = null;
  try {
    data = JSON.parse(row.data);
  } catch {
    return fail("Stored town data is corrupt", 500);
  }

  return Response.json({
    id: row.id,
    name: row.name,
    ownerName: row.ownerName,
    brickCount: row.brickCount,
    visibility: row.visibility,
    updatedAt: row.updatedAt,
    likes: likes?.value ?? 0,
    mine,
    data,
  });
}

/** PATCH /api/towns/:id — rename, re-share, or replace the thumbnail. */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  if (!isTownId(id)) return fail("Invalid town id", 400);

  const viewer = await currentViewer();
  if (!viewer) return needSignIn();

  const db = await getAnyDb();
  if (!db) return storageUnavailable();
  const [row] = await db.select().from(towns).where(eq(towns.id, id)).limit(1);
  if (!row) return fail("Town not found", 404);
  if (row.ownerId !== viewer.ownerId) return fail("This town belongs to someone else", 403);

  let body: { name?: unknown; visibility?: unknown; thumb?: unknown; data?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.name !== undefined) patch.name = cleanName(body.name, row.name);
  if (body.visibility !== undefined) {
    patch.visibility = cleanVisibility(body.visibility, row.visibility as never);
  }
  if (body.thumb !== undefined) {
    const thumb = cleanThumb(body.thumb);
    if (thumb) patch.thumb = thumb;
  }
  if (body.data !== undefined) {
    const checked = checkTownData(body.data);
    if (!checked.ok) return fail(checked.error, checked.status);
    patch.data = checked.text;
    patch.brickCount = checked.bricks;
  }

  await db.update(towns).set(patch).where(eq(towns.id, id));
  return Response.json({ id, ok: true });
}

/** DELETE /api/towns/:id */
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  if (!isTownId(id)) return fail("Invalid town id", 400);

  const viewer = await currentViewer();
  if (!viewer) return needSignIn();

  const db = await getAnyDb();
  if (!db) return storageUnavailable();
  const [row] = await db.select().from(towns).where(eq(towns.id, id)).limit(1);
  if (!row) return fail("Town not found", 404);
  if (row.ownerId !== viewer.ownerId) return fail("This town belongs to someone else", 403);

  await db.delete(townLikes).where(eq(townLikes.townId, id));
  await db.delete(towns).where(eq(towns.id, id));
  return Response.json({ id, deleted: true });
}
