import { and, count, desc, eq, inArray } from "drizzle-orm";
import { getAnyDb, storageUnavailable } from "../../../db/client";
import { townLikes, towns } from "../../../db/schema";
import {
  LIST_LIMIT,
  checkTownData,
  cleanName,
  cleanThumb,
  cleanVisibility,
  currentViewer,
  ensureViewer,
  fail,
  isTownId,
  isVoterId,
  newTownId,
} from "./shared";
import { HOUR, LIMITS, ipHash, limitsSchemaReady, since, tooMany, townsFromAddress, townsOwnedBy } from "../limits";

export const dynamic = "force-dynamic";

/* Every column the app actually uses, named explicitly.
   A bare `.select()` expands to every column in the Drizzle schema, so the
   moment the schema gained `ip_hash` the list endpoint started asking a
   not-yet-migrated database for a column it did not have — a 500 on a public
   route. Naming the columns keeps code and schema independent, and stops the
   address hash leaving the server by accident. */
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

/* The address hash is for rate limiting and nothing else, so it is not part
   of the row shape the rest of this file works with. */
type TownRow = Omit<typeof towns.$inferSelect, "ipHash">;

/** Everything a gallery card needs — never the full town payload. */
function card(row: TownRow, likes: number, liked: boolean, mine: boolean) {
  return {
    id: row.id,
    name: row.name,
    ownerName: row.ownerName,
    brickCount: row.brickCount,
    thumb: row.thumb,
    visibility: row.visibility,
    updatedAt: row.updatedAt,
    likes,
    liked,
    mine,
  };
}

async function decorate(
  db: NonNullable<Awaited<ReturnType<typeof getAnyDb>>>,
  rows: TownRow[],
  voterId: string | null,
  ownerId: string | null,
) {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const counts = await db
    .select({ townId: townLikes.townId, value: count() })
    .from(townLikes)
    .where(inArray(townLikes.townId, ids))
    .groupBy(townLikes.townId);
  const byTown = new Map(counts.map((row) => [row.townId, row.value]));

  let mineLiked = new Set<string>();
  if (voterId) {
    const liked = await db
      .select({ townId: townLikes.townId })
      .from(townLikes)
      .where(and(inArray(townLikes.townId, ids), eq(townLikes.voterId, voterId)));
    mineLiked = new Set(liked.map((row) => row.townId));
  }
  return rows.map((row) =>
    card(row, byTown.get(row.id) ?? 0, mineLiked.has(row.id), !!ownerId && row.ownerId === ownerId),
  );
}

/** GET /api/towns?scope=public|mine&limit=&offset=&voterId= */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "mine" ? "mine" : "public";
  const voterIdParam = url.searchParams.get("voterId");
  const voterId = isVoterId(voterIdParam) ? voterIdParam : null;
  const limit = Math.min(LIST_LIMIT, Math.max(1, Number(url.searchParams.get("limit")) || 12));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  const viewer = await currentViewer();
  if (scope === "mine" && !viewer) return Response.json({ items: [], signedIn: false });

  const db = await getAnyDb();
  if (!db) return storageUnavailable();
  const rows = await db
    .select(TOWN_COLUMNS)
    .from(towns)
    .where(scope === "mine" ? eq(towns.ownerId, viewer!.ownerId) : eq(towns.visibility, "public"))
    .orderBy(desc(towns.updatedAt))
    .limit(limit)
    .offset(offset);

  return Response.json({
    items: await decorate(db, rows, voterId, viewer?.ownerId ?? null),
    signedIn: !!viewer,
  });
}

/** POST /api/towns — create or update one of the signed-in player's towns. */
export async function POST(request: Request) {
  const viewer = await ensureViewer();

  let body: {
    id?: unknown;
    name?: unknown;
    data?: unknown;
    thumb?: unknown;
    visibility?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const checked = checkTownData(body.data);
  if (!checked.ok) return fail(checked.error, checked.status);

  const db = await getAnyDb();
  if (!db) return storageUnavailable();
  const name = cleanName(body.name);
  const thumb = cleanThumb(body.thumb);
  const now = new Date().toISOString();

  if (body.id !== undefined && body.id !== null && body.id !== "") {
    if (!isTownId(body.id)) return fail("Invalid town id", 400);
    const [existing] = await db.select(TOWN_COLUMNS).from(towns).where(eq(towns.id, body.id)).limit(1);
    if (!existing) return fail("Town not found", 404);
    if (existing.ownerId !== viewer.ownerId) return fail("This town belongs to someone else", 403);

    await db
      .update(towns)
      .set({
        name,
        data: checked.text,
        brickCount: checked.bricks,
        thumb: thumb ?? existing.thumb,
        visibility: cleanVisibility(body.visibility, existing.visibility as never),
        ownerName: viewer.ownerName,
        updatedAt: now,
      })
      .where(eq(towns.id, body.id));

    return Response.json({ id: body.id, name, brickCount: checked.bricks, updated: true });
  }

  /* A new town, so this is where the storage actually grows. `ensureViewer`
     hands a cookie to anyone who asks, which is the point for a player and a
     hole for a script — so count by address as well as by owner. */
  const address = await ipHash(request);
  if (address && (await townsFromAddress(db, address, since(HOUR))) >= LIMITS.townsPerHourPerAddress) {
    return tooMany("new towns");
  }
  if ((await townsOwnedBy(db, viewer.ownerId)) >= LIMITS.townsPerOwner) {
    return fail(`You can keep ${LIMITS.townsPerOwner} towns. Delete one to save another.`, 409);
  }

  const id = newTownId();
  /* Naming ip_hash in the insert fails outright until 0003_limits has run, so
     only send the column once the schema is known to have it. Saving a town
     matters more than counting it. */
  const schemaReady = await limitsSchemaReady(db);
  await db.insert(towns).values({
    id,
    ownerId: viewer.ownerId,
    ...(schemaReady ? { ipHash: address } : {}),
    ownerName: viewer.ownerName,
    name,
    data: checked.text,
    brickCount: checked.bricks,
    thumb,
    visibility: cleanVisibility(body.visibility, "private"),
    createdAt: now,
    updatedAt: now,
  });

  return Response.json({ id, name, brickCount: checked.bricks, updated: false }, { status: 201 });
}
