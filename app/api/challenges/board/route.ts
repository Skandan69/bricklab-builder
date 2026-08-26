import { sql } from "drizzle-orm";
import { getAnyDb } from "../../../../db/client";
import { currentViewer } from "../../towns/identity";
import targets from "../../../../db/challenge-targets.json";

export const dynamic = "force-dynamic";

/**
 * The overall boards — the ones that rank a player across every challenge
 * rather than inside one.
 *
 *   cleared    how many different structures you have taken to 90% or better
 *   accuracy   your average best score across the challenges you have tried
 *   speed      your average time per structure cleared
 *
 * Two rules make these mean something.
 *
 * A run only counts as *cleared* at 90% or better. Without a bar, the speed
 * board belongs to whoever places one brick and stops the clock — the fastest
 * way to finish anything is not to build it. Ninety is high enough that the
 * shape has to be right and low enough that a missing lamp does not cost you
 * the run.
 *
 * Accuracy and speed need three challenges before you appear. A single lucky
 * target should not outrank someone who has played half the set, and a board
 * topped by one-hit entries stops being a ranking of players.
 *
 * Speed is an average per clear, not a total. Ranking on total time makes
 * clearing fewer structures the winning move — someone who cleared three in
 * six minutes would outrank someone who cleared five in ten.
 */
const CLEAR_AT = 90;
const MIN_FOR_AVERAGE = 3;
const BOARD_LIMIT = 25;
const TARGET_COUNT = Object.keys(targets as Record<string, unknown>).length;

type Row = { player_id: string; player_name: string | null; value: number; extra: number | null };

const fail = (error: string, status: number) => Response.json({ error }, { status });

/** The best score a player has on each target — the basis of every board. */
const bestPerTarget = sql`
  select player_id, target_id, max(score) as s
  from challenge_scores group by player_id, target_id
`;

/** Whatever name they used on their single highest-scoring run. */
const names = sql`
  select r.player_id, r.player_name from challenge_scores r
  join (select player_id, max(score) as top from challenge_scores group by player_id) t
    on t.player_id = r.player_id and r.score = t.top
  group by r.player_id
`;

export async function GET(request: Request) {
  const board = new URL(request.url).searchParams.get("board") || "cleared";
  if (!["cleared", "accuracy", "speed"].includes(board)) return fail("Unknown board", 400);

  const db = await getAnyDb();
  if (!db) return Response.json({ board, items: [], you: null, storage: false });

  /* The table is created by the scores route on first submission. Until anyone
     has played, it does not exist — which is an empty board, not an error. */
  const [exists] = await db.all<{ n: number }>(
    sql`select count(*) as n from sqlite_master where type='table' and name='challenge_scores'`,
  );
  if (!exists?.n) return Response.json({ board, items: [], you: null, storage: true, played: 0 });

  let rows: Row[] = [];
  if (board === "cleared") {
    rows = await db.all<Row>(sql`
      select b.player_id, n.player_name,
             count(*) as value,
             (select count(*) from (${bestPerTarget}) x where x.player_id = b.player_id) as extra
      from (${bestPerTarget}) b
      left join (${names}) n on n.player_id = b.player_id
      where b.s >= ${CLEAR_AT}
      group by b.player_id
      order by value desc, extra asc
      limit ${BOARD_LIMIT}
    `);
  } else if (board === "accuracy") {
    rows = await db.all<Row>(sql`
      select b.player_id, n.player_name,
             round(avg(b.s), 1) as value,
             count(*) as extra
      from (${bestPerTarget}) b
      left join (${names}) n on n.player_id = b.player_id
      group by b.player_id
      having count(*) >= ${MIN_FOR_AVERAGE}
      order by value desc, extra desc
      limit ${BOARD_LIMIT}
    `);
  } else {
    /* Fastest clearing run on each target, summed. A slow first attempt does
       not count against you — only the run that actually cleared it does. */
    rows = await db.all<Row>(sql`
      select f.player_id, n.player_name,
             round(sum(f.t) * 1.0 / count(*)) as value,
             count(*) as extra
      from (
        select player_id, target_id, min(seconds) as t
        from challenge_scores
        where score >= ${CLEAR_AT} and seconds is not null
        group by player_id, target_id
      ) f
      left join (${names}) n on n.player_id = f.player_id
      group by f.player_id
      having count(*) >= ${MIN_FOR_AVERAGE}
      order by value asc
      limit ${BOARD_LIMIT}
    `);
  }

  const viewer = await currentViewer();
  const mineIndex = viewer ? rows.findIndex((r) => r.player_id === viewer.ownerId) : -1;
  const items = rows.map((r, i) => ({
    rank: i + 1,
    name: r.player_name || "Builder",
    value: r.value,
    extra: r.extra,
    you: i === mineIndex,
  }));

  /* Where the viewer stands, including when they are below the cut — a board
     that cannot tell you your own position is half a board. */
  let you: { rank: number | null; value: number; extra: number | null; listed: boolean } | null = null;
  if (mineIndex >= 0) {
    you = { rank: mineIndex + 1, value: items[mineIndex].value, extra: items[mineIndex].extra, listed: true };
  } else if (viewer) {
    const [stat] = await db.all<{ cleared: number; average: number | null; tried: number; total: number }>(sql`
      select
        (select count(*) from (${bestPerTarget}) x where x.player_id = ${viewer.ownerId} and x.s >= ${CLEAR_AT}) as cleared,
        (select round(avg(x.s), 1) from (${bestPerTarget}) x where x.player_id = ${viewer.ownerId}) as average,
        (select count(*) from (${bestPerTarget}) x where x.player_id = ${viewer.ownerId}) as tried,
        (select coalesce(round(avg(t)), 0) from (
           select min(seconds) as t from challenge_scores
           where player_id = ${viewer.ownerId} and score >= ${CLEAR_AT} and seconds is not null
           group by target_id) y) as total
    `);
    if (stat && stat.tried > 0) {
      you = {
        rank: null,
        listed: false,
        value: board === "cleared" ? stat.cleared : board === "accuracy" ? (stat.average ?? 0) : stat.total,
        extra: board === "speed" ? stat.cleared : stat.tried,
      };
    }
  }

  return Response.json({
    board, items, you, storage: true,
    clearAt: CLEAR_AT, minForAverage: MIN_FOR_AVERAGE, targetCount: TARGET_COUNT,
  });
}
