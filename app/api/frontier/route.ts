import { eq, sql } from "drizzle-orm";
import { getAnyDb, storageUnavailable } from "../../../db/client";
import { towns } from "../../../db/schema";
import { hashId } from "../towns/identity";
import { cleanName, fail } from "../towns/shared";
import { HOUR, LIMITS, ipHash, limitsSchemaReady, since, tooMany, townsFromAddress } from "../limits";

export const dynamic = "force-dynamic";

/**
 * Where a Frontier world lives when the browser cannot be trusted to keep it.
 *
 * Frontier is served inside a cross-site iframe on devaigames.com, and the
 * guest cookie the rest of this app identifies people by is `SameSite=Lax` —
 * which is never sent in that position, in any browser. Safari goes further and
 * denies third-party frames storage at all, so even localStorage can vanish.
 * Cookie identity therefore cannot work here, and pretending otherwise would
 * mint a fresh anonymous owner on every save.
 *
 * So the account is a code the player holds: 16 characters, ~80 bits, generated
 * on their device and never derived from anything about them. Whoever presents
 * the code owns the save — the same model as an unguessable link. That is the
 * right trade for a free game with no sign-in, but it is a real trade and worth
 * naming: the code is the only secret, and anyone given it can overwrite the
 * world it points at.
 */

/* Crockford-style alphabet: no i, l, o, u, 0 or 1, because these get read off a
   screen and typed on a phone. */
const CODE_RE = /^[a-hjkmnp-tv-z2-9]{16}$/;
const isCode = (value: unknown): value is string =>
  typeof value === "string" && CODE_RE.test(value);

/* A Frontier world is edits plus counters, not bricks, so it needs its own
   check rather than the BrickForge one next door. The ceiling matches the
   towns one for the same reason: D1 caps a single value at 2 MB and this has
   to leave room for the rest of the row. A late-game frontier at the maximum
   territory is nowhere near it, but a save that would be silently truncated is
   worse than one that is honestly refused. */
const MAX_SAVE_BYTES = 1_200_000;

type SaveCheck =
  | { ok: true; text: string; blocks: number }
  | { ok: false; error: string; status: 400 | 413 };

function checkSave(value: unknown): SaveCheck {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "A frontier save must be an object", status: 400 };
  }
  const world = value as { seed?: unknown; edits?: unknown };
  if (!Number.isFinite(world.seed)) {
    return { ok: false, error: "That save has no world seed", status: 400 };
  }
  if (!Array.isArray(world.edits)) {
    return { ok: false, error: "That save has no edits list", status: 400 };
  }
  const text = JSON.stringify(value);
  const size = new TextEncoder().encode(text).length;
  if (size > MAX_SAVE_BYTES) {
    return { ok: false, error: "That frontier is too large to store", status: 413 };
  }
  return { ok: true, text, blocks: world.edits.length };
}

/* One row per code, addressed by the code itself, so saving is update-or-insert
   with no lookup by owner and no way to accumulate duplicates. */
const rowIdFor = (owner: string) => `f${owner.slice(0, 20)}`;

/** GET /api/frontier?code=… — hand back the world this code points at. */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!isCode(code)) return fail("A frontier code is 16 letters and numbers", 400);

  const db = await getAnyDb();
  if (!db) return storageUnavailable();

  const owner = await hashId(`frontier:${code}`);
  const [row] = await db
    .select({
      name: towns.name,
      data: towns.data,
      brickCount: towns.brickCount,
      updatedAt: towns.updatedAt,
    })
    .from(towns)
    .where(eq(towns.id, rowIdFor(owner)))
    .limit(1);

  if (!row) return Response.json({ found: false });

  let save: unknown;
  try {
    save = JSON.parse(row.data);
  } catch {
    /* A row we cannot parse is worse than no row: answer honestly rather than
       handing the game something it will crash on. */
    return fail("That saved frontier could not be read", 500);
  }
  return Response.json({
    found: true,
    name: row.name,
    blocks: row.brickCount,
    updatedAt: row.updatedAt,
    save,
  });
}

/** POST /api/frontier — put this world under this code, replacing what was there. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("That request body was not JSON", 400);
  }
  const { code, name, save } = (body ?? {}) as { code?: unknown; name?: unknown; save?: unknown };
  if (!isCode(code)) return fail("A frontier code is 16 letters and numbers", 400);

  const checked = checkSave(save);
  if (!checked.ok) return fail(checked.error, checked.status);

  const db = await getAnyDb();
  if (!db) return storageUnavailable();

  const owner = await hashId(`frontier:${code}`);
  const id = rowIdFor(owner);
  const now = new Date().toISOString();

  const [existing] = await db
    .select({ id: towns.id })
    .from(towns)
    .where(eq(towns.id, id))
    .limit(1);

  if (existing) {
    await db
      .update(towns)
      .set({
        name: cleanName(name, "A frontier"),
        data: checked.text,
        brickCount: checked.blocks,
        updatedAt: now,
      })
      .where(eq(towns.id, id));
    return Response.json({ ok: true, created: false, updatedAt: now });
  }

  /* Only a brand new code costs anything, so the address limit belongs here and
     not on the update path — otherwise a player who saves often would lock
     themselves out of their own world. */
  const ready = await limitsSchemaReady(db);
  const ip = ready ? await ipHash(request) : null;
  if (ip) {
    const recent = await townsFromAddress(db, ip, since(HOUR));
    if (recent >= LIMITS.townsPerHourPerAddress) return tooMany("new worlds");
  }

  const worldName = cleanName(name, "A frontier");

  /* Drizzle names every column in the schema on an insert, `ip_hash` included,
     so on a database where 0003_limits has not been applied yet the statement
     fails on a column that is not there. The towns route next door already
     carries a hand-written fallback for exactly this; a Frontier save needs the
     same one, or saving 500s everywhere the migration is behind the deploy —
     which is precisely what production did. */
  if (ready) {
    await db.insert(towns).values({
      id,
      ownerId: owner,
      ownerName: "Frontier player",
      name: worldName,
      data: checked.text,
      brickCount: checked.blocks,
      thumb: null,
      visibility: "private",
      createdAt: now,
      updatedAt: now,
      ipHash: ip,
    });
  } else {
    await db.run(sql`
      insert into towns
        (id, owner_id, owner_name, name, data, brick_count, thumb, visibility, created_at, updated_at)
      values
        (${id}, ${owner}, ${"Frontier player"}, ${worldName}, ${checked.text},
         ${checked.blocks}, ${null}, ${"private"}, ${now}, ${now})
    `);
  }
  return Response.json({ ok: true, created: true, updatedAt: now });
}
