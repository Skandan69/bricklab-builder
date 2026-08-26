/**
 * Pull the piece dimensions out of the builder into a plain JSON table.
 *
 * The catalogue lives inside public/brickforge.html, which the server cannot
 * read at request time. But the server has to be able to score a build — a
 * leaderboard whose numbers are computed on the player's own machine and taken
 * on trust is not a leaderboard, it is a text box.
 *
 * So the table is extracted here, at build time, from the one place it is
 * defined. Re-run this whenever pieces are added and the check below will fail
 * loudly if the two ever drift.
 *
 *   node scripts/extract-piece-dims.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync("public/brickforge.html", "utf8");
const dims = {};

/* The generated families: bricks, plates and tiles are emitted from arrays. */
const families = [
  { prefix: "b", h: "BRICK_H", pairs: [[1,1],[1,2],[1,3],[1,4],[1,6],[1,8],[1,10],[2,2],[2,3],[2,4],[2,6],[2,8],[2,10]] },
  { prefix: "p", h: "PLATE_H", pairs: [[1,2],[1,4],[1,6],[1,8],[2,2],[2,4],[2,6],[2,8],[4,4],[4,6],[4,8],[6,8],[8,8],[16,16]] },
  { prefix: "t", h: "PLATE_H", pairs: [[1,1],[1,2],[1,4],[2,2],[2,4],[4,4]] },
];
const BRICK_H = 1.2, PLATE_H = 0.4;
for (const fam of families) {
  for (const [w, d] of fam.pairs) {
    dims[`${fam.prefix}${w}x${d}`] = { w, d, h: fam.h === "BRICK_H" ? BRICK_H : PLATE_H };
  }
}

/* The individually declared pieces: T({ id:'x', ..., w:1, d:4, h:BRICK_H * 3, ... }) */
const evalHeight = (expr) =>
  Number(
    expr.replace(/BRICK_H/g, String(BRICK_H))
        .replace(/PLATE_H/g, String(PLATE_H))
        .split("*")
        .reduce((a, b) => a * Number(b.trim()), 1),
  );

/* Brace-balanced, not regex-to-the-first-brace: plenty of pieces carry a
   nested `town: { ... }` and a lazy `[^}]*?` silently dropped every one of
   them — thirty types short, which the check below caught. */
function declarations(text) {
  const out = [];
  let at = 0;
  for (;;) {
    const start = text.indexOf("T({", at);
    if (start < 0) break;
    let depth = 0, i = start + 1;
    for (; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") { depth--; if (!depth) break; }
    }
    const body = text.slice(start, i + 1);
    const id = body.match(/id:\s*'([A-Za-z0-9]+)'/);
    if (id) out.push({ id: id[1], body });
    at = i + 1;
  }
  return out;
}

for (const m of declarations(src)) {
  const body = m.body;
  const id = m.id;
  const w = body.match(/\bw:\s*([0-9.]+)/);
  const d = body.match(/\bd:\s*([0-9.]+)/);
  const h = body.match(/\bh:\s*([^,}]+)/);
  if (!w || !d || !h) continue;
  dims[id] = { w: Number(w[1]), d: Number(d[1]), h: Math.round(evalHeight(h[1]) * 1000) / 1000 };
}

mkdirSync("db", { recursive: true });
writeFileSync("db/piece-dims.json", JSON.stringify(dims));
console.log(`${Object.keys(dims).length} piece types written to db/piece-dims.json`);

/* A sanity check the next person will be glad of: every piece the challenge
   targets use must be in the table, or the server cannot score them. */
import { readdirSync } from "node:fs";
let missing = new Set();
for (const f of readdirSync("public/challenges").filter((f) => f.endsWith(".json") && f !== "index.json")) {
  const world = JSON.parse(readFileSync(`public/challenges/${f}`, "utf8"));
  for (const b of world.bricks) if (!dims[b.typeId]) missing.add(`${f}: ${b.typeId}`);
}
if (missing.size) {
  console.error("targets use pieces the table does not have:\n  " + [...missing].join("\n  "));
  process.exit(1);
}
console.log("every piece used by every target is in the table");
