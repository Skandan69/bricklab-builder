import { desc } from "drizzle-orm";
import { getAnyDb } from "../../../db/client";
import { feedback } from "../../../db/schema";
import { currentViewer } from "../towns/identity";
import {
  DAY,
  HOUR,
  LIMITS,
  feedbackFromAddress,
  feedbackFromPlayer,
  ipHash,
  since,
  tooMany,
} from "../limits";

export const dynamic = "force-dynamic";

/* A public write endpoint, so everything below is a limit rather than a nicety.
   The caps are what keep a handful of alpha testers from becoming a bill. */
const GAMES = ["cities", "frontier", "worldforge", "plots"] as const;
const MAX_MESSAGE = 1200;
const MAX_CONTEXT = 2000;
const READ_LIMIT = 200;

const fail = (error: string, status: number) => Response.json({ error }, { status });

const clean = (value: unknown, cap: number) =>
  typeof value === "string"
    // keep newlines — the note is a transcript and reads as one — drop the rest
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, cap)
    : "";

/** POST /api/feedback — a note from a player, with whatever the game knew. */
export async function POST(request: Request) {
  // validate before reaching for storage: a malformed note should say so
  // plainly rather than blaming the database
  let body: { game?: unknown; rating?: unknown; message?: unknown; context?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("Invalid JSON body", 400);
  }

  const game =
    typeof body.game === "string" && (GAMES as readonly string[]).includes(body.game) ? body.game : null;
  if (!game) return fail("Unknown game", 400);

  const message = clean(body.message, MAX_MESSAGE);
  const rating =
    Number.isInteger(body.rating) && (body.rating as number) >= 1 && (body.rating as number) <= 5
      ? (body.rating as number)
      : null;
  // a rating on its own is still worth having; an empty note with no rating is not
  if (!message && rating === null) return fail("Say something, or leave a rating", 400);

  let context: string | null = null;
  if (body.context && typeof body.context === "object") {
    const text = JSON.stringify(body.context);
    context = text.length > MAX_CONTEXT ? text.slice(0, MAX_CONTEXT) : text;
  }

  const db = await getAnyDb();
  if (!db) return fail("Feedback needs a database — set TURSO_DATABASE_URL, then run the migration", 503);

  // the same cookie the towns API uses — not an identity, just a thread to pull
  const viewer = await currentViewer();
  const address = await ipHash(request);

  /* Anyone on the internet can reach this, so count what they have already
     sent. Both handles are weak on their own; the stricter one wins. */
  if (address && (await feedbackFromAddress(db, address, since(HOUR))) >= LIMITS.feedbackPerHourPerAddress) {
    return tooMany("feedback");
  }
  if (viewer && (await feedbackFromPlayer(db, viewer.ownerId, since(DAY))) >= LIMITS.feedbackPerDayPerPlayer) {
    return tooMany("feedback", 3600);
  }

  await db.insert(feedback).values({
    id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    game,
    rating,
    message,
    context,
    playerId: viewer?.ownerId ?? null,
    ipHash: address,
    createdAt: new Date().toISOString(),
  });

  return Response.json({ ok: true }, { status: 201 });
}

/**
 * GET /api/feedback?key=… — read it back.
 *
 * There are no accounts yet, so this is gated on a shared secret rather than on
 * who you are — the same ADMIN_KEY the moderation routes use. With it unset
 * nobody can read what players wrote, including you.
 */
export async function GET(request: Request) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || expected.length < 16) {
    return fail("Set ADMIN_KEY (16 characters or more) to read feedback", 503);
  }
  const key = new URL(request.url).searchParams.get("key");
  if (key !== expected) return fail("Not found", 404);

  const db = await getAnyDb();
  if (!db) return fail("Feedback needs a database — set TURSO_DATABASE_URL, then run the migration", 503);

  /* the address hash exists for rate limiting and nothing else — no reason to
     hand it back out again */
  const rows = await db
    .select({
      id: feedback.id,
      game: feedback.game,
      rating: feedback.rating,
      message: feedback.message,
      context: feedback.context,
      playerId: feedback.playerId,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .orderBy(desc(feedback.createdAt))
    .limit(READ_LIMIT);
  return Response.json({
    count: rows.length,
    items: rows.map((row) => ({
      ...row,
      context: (() => {
        try {
          return row.context ? JSON.parse(row.context) : null;
        } catch {
          return row.context;
        }
      })(),
    })),
  });
}
