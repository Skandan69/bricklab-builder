/**
 * Generate public/worlds/indian-heritage-city.json.
 *
 * The old Indian Heritage City was 2,566 bricks generated in JavaScript inside
 * brickforge.html. It was decent, but it was a compound rather than a city and
 * it could not grow, because every brick was its own draw call.
 *
 * With the showcase batcher in place a locked world costs ~30 draw calls
 * whatever its size, so this builds the thing properly: a walled capital of
 * roughly 240 studs a side with a temple precinct, a palace, a bazaar, a
 * haveli quarter, a river with ghats, gardens, and processions moving along
 * the streets when you press Play.
 *
 * Every piece used is in the builder's own palette, so a player who copies
 * this world can rebuild any part of it from the same kit.
 *
 *   node scripts/build-indian-city.mjs
 */
import { writeFileSync } from "node:fs";

const BRICK_H = 1.2;
const PLATE_H = 0.4;
const MAX_BRICKS = 15000;

/* ------------------------------------------------------------------ colour */
const C = {
  sand:      "#d8b171",
  sandPale:  "#e6cd9c",
  sandDark:  "#bb9155",
  red:       "#b5543a",
  redDark:   "#8f3f2b",
  granite:   "#8d8478",
  graniteLt: "#a89e8f",
  marble:    "#f2ede2",
  marbleWarm:"#e8dcc6",
  gold:      "#e0b13c",
  teak:      "#6b4a2f",
  grass:     "#4f8f47",
  grassDark: "#3a6d35",
  hedge:     "#2f6b34",
  water:     "#3f8fbf",
  saffron:   "#e8892b",
  magenta:   "#a8397a",
  indigo:    "#33528f",
  emerald:   "#2f7d5a",
  cream:     "#efe3cc",
};
const FESTIVE = [C.saffron, C.magenta, C.indigo, C.emerald, C.gold, C.red];

/* ---------------------------------------------------------------- emitters */
const bricks = [];
let nextId = 6000;
const r3 = (n) => Math.round(n * 1000) / 1000;

function put(typeId, color, x, y, z, yaw = 0) {
  const half = (yaw * Math.PI) / 360;
  bricks.push({
    id: nextId++,
    typeId,
    color,
    p: [r3(x), r3(y), r3(z)],
    q: [0, r3(Math.sin(half)), 0, r3(Math.cos(half))],
    on: true,
    doorOpen: false,
    use: "",
  });
}

/** Tile a rectangle given in world coordinates, inclusive of both ends. */
function tile(typeId, color, x0, z0, x1, z1, step = 8, y = 0) {
  for (let x = x0; x <= x1; x += step) {
    for (let z = z0; z <= z1; z += step) put(typeId, color, x, y, z);
  }
}

/* A deterministic shuffle, so the city is the same every time it is generated
   but does not look like it was laid out on graph paper. */
let seed = 20260826;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const pick = (list) => list[Math.floor(rnd() * list.length)];

/* -------------------------------------------------------------------- plan */
const HALF = 120;              // the city wall
const IN = HALF - 4;
const GATE = 10;               // half-width of a gate opening

/* ------------------------------------------------------------------ ground */
function ground() {
  tile("p8x8", C.sandPale, -IN, -IN, IN, IN);
}

/* -------------------------------------------------------------- city walls */
function cityWall() {
  const courses = 5;
  for (let i = -IN; i <= IN; i += 8) {
    const opening = Math.abs(i) <= GATE;
    for (let c = 0; c < courses; c++) {
      const y = c * BRICK_H * 2;
      for (const [x, z, yaw] of [
        [i, -HALF, 90], [i, HALF, 90], [-HALF, i, 0], [HALF, i, 0],
      ]) {
        if (opening) continue;
        put("heritageWall8", C.red, x, y, z, yaw);
      }
    }
    if (opening) continue;
    const cap = courses * BRICK_H * 2;
    put("battle8", C.redDark, i, cap, -HALF, 90);
    put("battle8", C.redDark, i, cap, HALF, 90);
    put("battle8", C.redDark, -HALF, cap, i, 0);
    put("battle8", C.redDark, HALF, cap, i, 0);
  }

  // bastions at the corners and at the quarter points of every run
  const drums = [-HALF, -60, 60, HALF];
  for (const a of drums) {
    for (const b of [-HALF, HALF]) {
      for (const [x, z] of [[a, b], [b, a]]) {
        for (let c = 0; c < 6; c++) put("r4x4", C.red, x, c * BRICK_H, z);
        if (Math.abs(x) === HALF && Math.abs(z) === HALF) {
          put("minaret4", C.sandPale, x, 6 * BRICK_H, z);
        } else {
          put("chhatri6", C.marble, x, 6 * BRICK_H, z);
        }
      }
    }
  }

  // four gates: the temple axis gets a gopuram, the others a ceremonial arch
  put("gopuram8", C.granite, 0, 0, -HALF, 90);
  put("gopuram8", C.granite, 0, 0, HALF, 90);
  put("torana8", C.red, -HALF, 0, 0, 0);
  put("torana8", C.red, HALF, 0, 0, 0);
  for (const s of [-1, 1]) {
    for (const [x, z] of [[s * (GATE + 6), -HALF], [s * (GATE + 6), HALF],
                          [-HALF, s * (GATE + 6)], [HALF, s * (GATE + 6)]]) {
      for (let c = 0; c < 6; c++) put("r4x4", C.redDark, x, c * BRICK_H, z);
      put("chhatri4", C.marble, x, 6 * BRICK_H, z);
      put("banner1", pick(FESTIVE), x, 6 * BRICK_H + BRICK_H * 8, z);
    }
  }
}

/* ------------------------------------------------------------------ streets */
/* Two processional avenues on the axes and a ring road inside the wall, all in
   heritage paving so the elephants, carriages and people have somewhere to
   walk when the world is played. */
function streets() {
  for (let t = -IN; t <= IN; t += 4) {
    for (const o of [-4, 0, 4]) {
      put("heritageRoad", C.sandDark, o, 0, t);
      put("heritageRoad", C.sandDark, t, 0, o, 90);
    }
  }
  const ring = 96;
  for (let t = -ring; t <= ring; t += 4) {
    for (const o of [-2, 2]) {
      put("heritageRoad", C.sandDark, t, 0, -ring + o);
      put("heritageRoad", C.sandDark, t, 0, ring + o);
      put("heritageRoad", C.sandDark, -ring + o, 0, t, 90);
      put("heritageRoad", C.sandDark, ring + o, 0, t, 90);
    }
  }
  // lamps and planting down the avenues
  for (let t = -IN + 8; t <= IN - 8; t += 16) {
    if (Math.abs(t) < 14) continue;
    for (const o of [-9, 9]) {
      put("lampPost", C.granite, o, PLATE_H, t);
      put("lampPost", C.granite, t, PLATE_H, o, 90);
      if (t % 32 === 0) {
        put("planter4", C.sandDark, o + (o > 0 ? 4 : -4), PLATE_H, t);
        put("tree4", C.grassDark, t, PLATE_H, o + (o > 0 ? 4 : -4));
      }
    }
  }
}

/* ------------------------------------------------------------ temple city -- */
/* The north-east quarter: a walled precinct entered through gopurams on all
   four sides, with a mandapa-lined processional path to a shikhara shrine, a
   bathing tank, and a festival chariot waiting on the street. */
function templePrecinct() {
  const cx = 62, cz = -62, R = 40;

  tile("p8x8", C.graniteLt, cx - R, cz - R, cx + R, cz + R);

  // prakara wall with gopurams on the axes
  for (let i = -R; i <= R; i += 8) {
    if (Math.abs(i) <= 8) continue;
    for (let c = 0; c < 2; c++) {
      const y = c * BRICK_H * 2;
      put("heritageWall8", C.granite, cx + i, y, cz - R, 90);
      put("heritageWall8", C.granite, cx + i, y, cz + R, 90);
      put("heritageWall8", C.granite, cx - R, y, cz + i, 0);
      put("heritageWall8", C.granite, cx + R, y, cz + i, 0);
    }
  }
  put("gopuram8", C.sandDark, cx, 0, cz - R, 90);
  put("gopuram8", C.sandDark, cx, 0, cz + R, 90);
  put("gopuram8", C.granite, cx - R, 0, cz, 0);
  put("gopuram8", C.granite, cx + R, 0, cz, 0);

  // the shrine on a plinth at the centre
  for (let c = 0; c < 3; c++) {
    const s = 16 - c * 4;
    tile("p8x8", C.granite, cx - s, cz - s, cx + s, cz + s, 8, c * BRICK_H);
  }
  put("shikhara6", C.granite, cx, BRICK_H * 3, cz);
  for (const [ox, oz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
    put("shikhara6", C.sandDark, cx + ox, BRICK_H * 3, cz + oz);
  }
  // a processional hall of mandapas leading in from the south gopuram
  for (let z = cz + 32; z >= cz + 12; z -= 8) {
    put("mandapa8", C.granite, cx - 4, 0, z);
    put("mandapa8", C.granite, cx + 4, 0, z);
  }
  for (let x = cx - 28; x <= cx + 28; x += 8) {
    put("colonnade8", C.granite, x, 0, cz - 30, 90);
  }

  // the bathing tank in the north-west corner of the precinct
  for (const ox of [-4, 4]) {
    for (const oz of [-4, 4]) put("templeTank8", C.granite, cx - 26 + ox, 0, cz - 22 + oz);
  }
  for (let i = -12; i <= 12; i += 8) {
    put("ghat8", C.graniteLt, cx - 26 + i, 0, cz - 8, 0);
  }

  // the victory tower and the festival chariot on the approach
  put("victoryTower4", C.sandPale, cx + 26, 0, cz - 24);
  put("templeChariot3", C.teak, cx, 0, cz + 46, 0);
  for (const ox of [-6, 6]) put("elephant", C.granite, cx + ox, 0, cz + 52, 0);

  // pilgrims and guards
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, rr = 12 + rnd() * 26;
    put(pick(["resident", "merchant", "child"]), pick(FESTIVE),
      cx + Math.cos(a) * rr, PLATE_H, cz + Math.sin(a) * rr);
  }
  for (const [ox, oz] of [[-8, 38], [8, 38], [-38, -8], [38, 8]]) {
    put("palaceGuard", C.indigo, cx + ox, PLATE_H, cz + oz);
  }
}

/* ---------------------------------------------------------------- palace -- */
/* The north-west quarter: a walled palace of courtyards with a domed durbar
   hall, jali-screened ranges, minarets and a formal water garden. */
function palace() {
  const cx = -62, cz = -62, R = 40;

  tile("p8x8", C.sand, cx - R, cz - R, cx + R, cz + R);
  for (let i = -R; i <= R; i += 8) {
    if (Math.abs(i) <= 8) continue;
    for (let c = 0; c < 3; c++) {
      const y = c * BRICK_H * 2;
      put("heritageWall8", C.red, cx + i, y, cz - R, 90);
      put("heritageWall8", C.red, cx + i, y, cz + R, 90);
      put("heritageWall8", C.red, cx - R, y, cz + i, 0);
      put("heritageWall8", C.red, cx + R, y, cz + i, 0);
    }
    put("battle8", C.redDark, cx + i, BRICK_H * 6, cz - R, 90);
    put("battle8", C.redDark, cx + i, BRICK_H * 6, cz + R, 90);
  }
  for (const [ox, oz] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
    for (let c = 0; c < 5; c++) put("r4x4", C.red, cx + ox, c * BRICK_H, cz + oz);
    put("minaret4", C.marbleWarm, cx + ox, 5 * BRICK_H, cz + oz);
  }
  put("torana8", C.red, cx, 0, cz + R, 90);

  // the durbar hall: arcade, jali storey, domed roof
  const W = 20, D = 14, plinth = BRICK_H * 3;
  for (let c = 0; c < 3; c++) {
    tile("p8x8", C.sandDark, cx - (W + 4 - c * 2), cz - (D + 4 - c * 2),
                             cx + (W + 4 - c * 2), cz + (D + 4 - c * 2), 8, c * BRICK_H);
  }
  for (let x = -W; x <= W; x += 8) {
    for (const oz of [-D, D]) {
      put("cusp4", C.marbleWarm, cx + x - 2, plinth, cz + oz, 90);
      put("cusp4", C.marbleWarm, cx + x + 2, plinth, cz + oz, 90);
      put("heritageColumn2", C.marble, cx + x, plinth, cz + oz);
    }
  }
  const floor2 = plinth + BRICK_H * 4;
  tile("p8x8", C.marbleWarm, cx - W, cz - D, cx + W, cz + D, 8, floor2);
  for (let x = -W; x <= W; x += 8) {
    put("jali8", C.marble, cx + x, floor2 + PLATE_H, cz - D, 90);
    put("jali8", C.marble, cx + x, floor2 + PLATE_H, cz + D, 90);
    put("jharokha2", C.red, cx + x, floor2 + PLATE_H, cz - D - 1, 0);
  }
  const roof = floor2 + PLATE_H + BRICK_H * 3;
  tile("p8x8", C.marbleWarm, cx - W, cz - D, cx + W, cz + D, 8, roof);
  for (let x = -W; x <= W; x += 8) {
    put("parapet8", C.marble, cx + x, roof + PLATE_H, cz - D - 3, 90);
    put("parapet8", C.marble, cx + x, roof + PLATE_H, cz + D + 3, 90);
  }
  for (let c = 0; c < 3; c++) put("r4x4", C.marble, cx, roof + PLATE_H + c * BRICK_H, cz);
  put("onion6", C.marble, cx, roof + PLATE_H + BRICK_H * 3, cz);
  for (const ox of [-12, 12]) put("onion4", C.gold, cx + ox, roof + PLATE_H, cz);
  for (const ox of [-W, W]) {
    for (const oz of [-D, D]) put("chhatri4", C.marble, cx + ox, roof + PLATE_H, cz + oz);
  }

  // the water garden in front of the hall
  for (let x = -16; x <= 16; x += 8) {
    for (const oz of [22, 30]) put("pool8", C.water, cx + x, PLATE_H, cz + oz);
  }
  for (let x = -20; x <= 20; x += 8) {
    put("parapet8", C.marble, cx + x, PLATE_H, cz + 17, 90);
    put("parapet8", C.marble, cx + x, PLATE_H, cz + 35, 90);
  }
  for (let x = -24; x <= 24; x += 8) put("cypress1", C.grassDark, cx + x, 0, cz + 13);
  for (const ox of [-28, 28]) put("pavilion6", C.marble, cx + ox, 0, cz + 26);

  // the stables and the elephant lines along the west range
  for (let z = -24; z <= 24; z += 8) put("colonnade8", C.sandDark, cx - 30, 0, cz + z, 0);
  for (const oz of [-16, 0, 16]) put("elephant", C.graniteLt, cx - 22, 0, cz + oz, 90);
  for (const oz of [-8, 8]) put("horse", C.teak, cx - 22, 0, cz + oz, 90);
  for (let i = 0; i < 10; i++) {
    put("palaceGuard", C.indigo, cx - 34 + rnd() * 12, PLATE_H, cz - 30 + rnd() * 60);
  }
}

/* ---------------------------------------------------------------- bazaar -- */
/* The main east–west street: two facing rows of stalls under awnings, with
   traders, shoppers and a carriage working its way through. */
function bazaar() {
  /* The street stops short of the citadel mound on the west side — the fort
     sits astride that end of the avenue, which is where a citadel belongs. */
  for (let x = -40; x <= IN - 12; x += 8) {
    if (Math.abs(x) < 14) continue;
    for (const oz of [-12, 12]) {
      put("marketStall4", pick([C.teak, C.sandDark, C.redDark]), x, 0, oz, oz < 0 ? 0 : 180);
      put("awning4", pick(FESTIVE), x, BRICK_H * 4, oz + (oz < 0 ? 3 : -3), 0);
    }
    if (x % 24 === 0) {
      put("banner1", pick(FESTIVE), x, 0, -18);
      put("banner1", pick(FESTIVE), x, 0, 18);
    }
  }
  for (let i = 0; i < 60; i++) {
    const x = -40 + rnd() * (IN - 40 + 100);
    if (Math.abs(x) < 14) continue;
    put(pick(["merchant", "resident", "resident", "child"]), pick(FESTIVE),
      x, PLATE_H, -8 + rnd() * 16);
  }
  for (const x of [-30, 20, 60, 92]) put("carriage", C.teak, x, 0, 0, 90);
  for (const x of [-20, 76]) put("elephant", C.granite, x, 0, 0, 90);
  put("victoryTower4", C.sandPale, 0, 0, -32);
  put("victoryTower4", C.sandPale, 0, 0, 32);
}

/* -------------------------------------------------------------- havelis -- */
/* The south-west quarter: narrow lanes of carved townhouses. */
function haveliQuarter() {
  const cx = -62, cz = 58;
  tile("p8x8", C.sandDark, cx - 40, cz - 32, cx + 40, cz + 40);
  for (let lane = 0; lane < 3; lane++) {
    const z = cz - 24 + lane * 26;
    for (let t = -36; t <= 36; t += 4) put("heritageRoad", C.sand, cx + t, 0, z);
    for (let x = -36; x <= 36; x += 4) {
      for (const oz of [-7, 7]) {
        put("haveli4", pick([C.cream, C.sandPale, C.sand, C.marbleWarm]),
          cx + x, 0, z + oz, oz < 0 ? 0 : 180);
      }
    }
    for (let x = -32; x <= 32; x += 16) {
      put("lampPost", C.granite, cx + x, PLATE_H, z + 4);
      put("bench2", C.teak, cx + x + 6, PLATE_H, z - 4, 90);
    }
    for (let i = 0; i < 10; i++) {
      put(pick(["resident", "child", "merchant"]), pick(FESTIVE),
        cx - 34 + rnd() * 68, PLATE_H, z + (rnd() - 0.5) * 6);
    }
  }
  // a neighbourhood well and shrine at the top of the quarter
  put("templeTank8", C.granite, cx - 4, 0, cz - 34);
  put("templeTank8", C.granite, cx + 4, 0, cz - 34);
  put("shikhara6", C.sandDark, cx + 26, 0, cz - 34);
  put("mandapa8", C.granite, cx + 26, 0, cz - 24);
}

/* --------------------------------------------------------------- river --- */
/* The south-east: the river, its ghats, and the gardens above them. */
function riverAndGardens() {
  const cx = 62, cz = 62;

  // water along the south-east edge, with steps down to it
  tile("water8", C.water, cx - 40, cz + 20, cx + 40, cz + 44, 8, PLATE_H);
  for (let x = -40; x <= 40; x += 8) {
    put("ghat8", C.graniteLt, cx + x, 0, cz + 14, 0);
    put("ghat8", C.granite, cx + x, 0, cz + 10, 0);
    put("parapet8", C.granite, cx + x, PLATE_H, cz + 6, 90);
  }
  for (let i = 0; i < 24; i++) {
    put(pick(["resident", "child", "merchant"]), pick(FESTIVE),
      cx - 38 + rnd() * 76, PLATE_H, cz + 8 + rnd() * 6);
  }
  for (const ox of [-30, -6, 18, 34]) {
    put("pavilion6", C.marble, cx + ox, 0, cz + 2);
    put("banner1", pick(FESTIVE), cx + ox, 0, cz - 4);
  }

  // a formal garden between the river and the bazaar
  tile("grass8", C.grass, cx - 36, cz - 34, cx + 36, cz - 6);
  for (let x = -32; x <= 32; x += 8) put("channel8", C.water, cx + x, 0, cz - 20, 90);
  for (const oz of [-30, -10]) {
    for (let x = -28; x <= 28; x += 8) put("parterre8", C.hedge, cx + x, PLATE_H, cz + oz);
  }
  for (let x = -32; x <= 32; x += 8) {
    put("cypress1", C.grassDark, cx + x, 0, cz - 25);
    put("cypress1", C.grassDark, cx + x, 0, cz - 15);
  }
  put("fountain4", C.marble, cx, PLATE_H, cz - 20);
  for (const ox of [-24, 24]) {
    put("pavilion6", C.marble, cx + ox, 0, cz - 20);
    put("palm2", C.grassDark, cx + ox, 0, cz - 30);
  }
  for (let i = 0; i < 14; i++) {
    put(pick(["tree4", "bush2"]), C.grassDark,
      cx - 34 + rnd() * 68, PLATE_H, cz - 34 + rnd() * 10);
  }
}

/* --------------------------------------------------------- the outer belt - */
/* Orchards, wells and small shrines filling the ground between the quarters
   and the wall, so the city has a rim rather than a bare margin. */
function outskirts() {
  const spots = [];
  for (let x = -IN + 6; x <= IN - 6; x += 10) {
    for (let z = -IN + 6; z <= IN - 6; z += 10) {
      const inQuarter =
        (Math.abs(Math.abs(x) - 62) < 46 && Math.abs(Math.abs(z) - 62) < 46);
      const onStreet = Math.abs(x) < 14 || Math.abs(z) < 14 ||
        Math.abs(Math.abs(x) - 96) < 6 || Math.abs(Math.abs(z) - 96) < 6;
      if (inQuarter || onStreet) continue;
      spots.push([x, z]);
    }
  }
  spots.forEach(([x, z], i) => {
    const roll = rnd();
    if (roll < 0.5) {
      put("tree4", C.grassDark, x, PLATE_H, z);
      put("bush2", C.grass, x + 4, PLATE_H, z + 3);
    } else if (roll < 0.72) {
      put("grass8", C.grass, x, 0, z);
      put("parterre8", C.hedge, x, PLATE_H, z);
    } else if (roll < 0.86) {
      put("rock3", C.granite, x, PLATE_H, z);
      put("palm2", C.grassDark, x + 3, 0, z - 2);
    } else if (i % 2) {
      put("mandapa8", C.sandDark, x, 0, z);
    } else {
      put("templeTank8", C.granite, x, 0, z);
    }
  });
}


/* ------------------------------------------------------------- the lake -- */
/* South of the bazaar: a tank the size of a small lake with a pleasure palace
   on an island, reached by a causeway. Every capital of this kind had one. */
function lakePalace() {
  const cx = 0, cz = 74;
  tile("water8", C.water, cx - 44, cz - 24, cx + 44, cz + 24, 8, PLATE_H);
  for (let x = -48; x <= 48; x += 8) {
    put("ghat8", C.graniteLt, cx + x, 0, cz - 28, 0);
    put("ghat8", C.graniteLt, cx + x, 0, cz + 28, 180);
    put("parapet8", C.marble, cx + x, PLATE_H, cz - 33, 90);
    put("parapet8", C.marble, cx + x, PLATE_H, cz + 33, 90);
  }
  // the causeway in from the north shore
  for (let z = cz - 26; z <= cz - 10; z += 4) put("heritageRoad", C.marbleWarm, cx, PLATE_H, z);
  for (let z = cz - 26; z <= cz - 10; z += 8) {
    put("parapet8", C.marble, cx - 3, PLATE_H, z, 0);
    put("parapet8", C.marble, cx + 3, PLATE_H, z, 0);
  }
  // the island
  for (let c = 0; c < 3; c++) {
    tile("p8x8", C.marbleWarm, cx - (16 - c * 4), cz - (12 - c * 4), cx + (16 - c * 4), cz + (12 - c * 4), 8, c * BRICK_H);
  }
  const y = BRICK_H * 3;
  for (let x = -8; x <= 8; x += 8) {
    put("cusp4", C.marble, cx + x - 2, y, cz - 8, 90);
    put("cusp4", C.marble, cx + x + 2, y, cz - 8, 90);
    put("cusp4", C.marble, cx + x - 2, y, cz + 8, 90);
    put("cusp4", C.marble, cx + x + 2, y, cz + 8, 90);
    put("heritageColumn2", C.marble, cx + x, y, cz - 8);
    put("heritageColumn2", C.marble, cx + x, y, cz + 8);
  }
  const deck = y + BRICK_H * 4;
  tile("p8x8", C.marble, cx - 8, cz - 8, cx + 8, cz + 8, 8, deck);
  for (let x = -8; x <= 8; x += 8) {
    put("jali8", C.marble, cx + x, deck + PLATE_H, cz - 8, 90);
    put("jali8", C.marble, cx + x, deck + PLATE_H, cz + 8, 90);
  }
  const roof = deck + PLATE_H + BRICK_H * 3;
  tile("p8x8", C.marble, cx - 8, cz - 8, cx + 8, cz + 8, 8, roof);
  put("onion6", C.marble, cx, roof + PLATE_H, cz);
  for (const ox of [-8, 8]) {
    for (const oz of [-8, 8]) put("chhatri4", C.gold, cx + ox, roof + PLATE_H, cz + oz);
  }
  for (const ox of [-40, -20, 20, 40]) {
    put("pavilion6", C.marble, cx + ox, 0, cz - 30);
    put("palm2", C.grassDark, cx + ox, 0, cz - 36);
  }
  for (let i = 0; i < 22; i++) {
    put(pick(["resident", "child", "merchant"]), pick(FESTIVE),
      cx - 44 + rnd() * 88, PLATE_H, cz - 32 + rnd() * 6);
  }
}

/* ------------------------------------------------------ the caravanserai - */
/* North of the bazaar: the traders' courtyard, ringed by colonnades and stalls,
   with the animals resting in the middle. */
function caravanserai() {
  const cx = 0, cz = -74;
  tile("p8x8", C.sandDark, cx - 36, cz - 24, cx + 36, cz + 24);
  for (let x = -32; x <= 32; x += 8) {
    put("colonnade8", C.sand, cx + x, 0, cz - 22, 90);
    put("colonnade8", C.sand, cx + x, 0, cz + 22, 90);
  }
  for (let z = -16; z <= 16; z += 8) {
    put("colonnade8", C.sand, cx - 34, 0, cz + z, 0);
    put("colonnade8", C.sand, cx + 34, 0, cz + z, 0);
  }
  for (const [ox, oz] of [[-34, -22], [34, -22], [-34, 22], [34, 22]]) {
    for (let c = 0; c < 4; c++) put("r4x4", C.sandDark, cx + ox, c * BRICK_H, cz + oz);
    put("chhatri4", C.marble, cx + ox, 4 * BRICK_H, cz + oz);
  }
  put("torana8", C.sand, cx, 0, cz + 24, 90);
  for (let x = -24; x <= 24; x += 12) {
    put("marketStall4", C.teak, cx + x, 0, cz - 10, 0);
    put("marketStall4", C.teak, cx + x, 0, cz + 10, 180);
    put("banner1", pick(FESTIVE), cx + x, 0, cz);
  }
  for (const ox of [-18, 0, 18]) put("elephant", C.granite, cx + ox, 0, cz + 2, 90);
  for (const ox of [-26, -8, 8, 26]) put("horse", C.teak, cx + ox, 0, cz - 4, 90);
  put("templeTank8", C.granite, cx - 30, 0, cz);
  put("templeTank8", C.granite, cx + 30, 0, cz);
  for (let i = 0; i < 20; i++) {
    put(pick(["merchant", "resident"]), pick(FESTIVE),
      cx - 32 + rnd() * 64, PLATE_H, cz - 18 + rnd() * 36);
  }
}

/* ---------------------------------------------------------- the orchards - */
/* Rows of trees filling the four corners inside the wall, so the city has
   cultivation around it rather than empty paving. */
function orchards() {
  const corners = [[-92, -92], [92, -92], [-92, 92], [92, 92]];
  for (const [cx, cz] of corners) {
    tile("grass8", C.grass, cx - 16, cz - 16, cx + 16, cz + 16);
    for (let x = -14; x <= 14; x += 7) {
      for (let z = -14; z <= 14; z += 7) {
        put(rnd() < 0.72 ? "tree4" : "palm2", C.grassDark, cx + x, PLATE_H, cz + z);
      }
    }
    put("templeTank8", C.granite, cx, 0, cz);
    put("mandapa8", C.sandDark, cx + (cx > 0 ? -20 : 20), 0, cz);
  }
}


/* --------------------------------------------------------------- the fort */
/* West of the bazaar: the citadel, raised on a terraced mound so it stands
   over the city the way a hill fort does, with a ramped approach. */
function hillFort() {
  const cx = -74, cz = 0;
  const terraces = 5;
  for (let c = 0; c < terraces; c++) {
    const s = 30 - c * 5;
    tile("p8x8", c % 2 ? C.sandDark : C.sand, cx - s, cz - s, cx + s, cz + s, 8, c * BRICK_H * 2);
    // a revetment wall around each terrace
    for (let i = -s; i <= s; i += 8) {
      if (Math.abs(i) <= 6) continue;
      put("heritageWall8", C.redDark, cx + i, c * BRICK_H * 2, cz - s, 90);
      put("heritageWall8", C.redDark, cx + i, c * BRICK_H * 2, cz + s, 90);
      put("heritageWall8", C.redDark, cx - s, c * BRICK_H * 2, cz + i, 0);
      put("heritageWall8", C.redDark, cx + s, c * BRICK_H * 2, cz + i, 0);
    }
    // the ramp up the east face
    put("steps8", C.sandDark, cx + s + 4, c * BRICK_H * 2, cz, 90);
  }
  const top = terraces * BRICK_H * 2;
  // the keep
  for (let i = -8; i <= 8; i += 8) {
    for (let c = 0; c < 3; c++) {
      put("heritageWall8", C.red, cx + i, top + c * BRICK_H * 2, cz - 8, 90);
      put("heritageWall8", C.red, cx + i, top + c * BRICK_H * 2, cz + 8, 90);
      put("heritageWall8", C.red, cx - 8, top + c * BRICK_H * 2, cz + i, 0);
      put("heritageWall8", C.red, cx + 8, top + c * BRICK_H * 2, cz + i, 0);
    }
    put("battle8", C.redDark, cx + i, top + BRICK_H * 6, cz - 8, 90);
    put("battle8", C.redDark, cx + i, top + BRICK_H * 6, cz + 8, 90);
  }
  tile("p8x8", C.marbleWarm, cx - 8, cz - 8, cx + 8, cz + 8, 8, top + BRICK_H * 6);
  put("dome6", C.gold, cx, top + BRICK_H * 6 + PLATE_H, cz);
  for (const ox of [-8, 8]) {
    for (const oz of [-8, 8]) {
      for (let c = 0; c < 3; c++) put("r4x4", C.red, cx + ox, top + c * BRICK_H, cz + oz);
      put("chhatri4", C.marble, cx + ox, top + BRICK_H * 3, cz + oz);
    }
  }
  put("banner1", C.saffron, cx, top + BRICK_H * 6 + PLATE_H + BRICK_H * 3, cz);
  put("victoryTower4", C.sandPale, cx, 0, cz + 40);
  for (let i = 0; i < 14; i++) {
    put("palaceGuard", C.indigo, cx - 28 + rnd() * 56, PLATE_H, cz - 28 + rnd() * 56);
  }
}

/* ------------------------------------------------------ the craft quarter */
/* East of the bazaar: workshops, kilns and drying yards, so the city is seen
   to make the things the bazaar sells. */
function craftQuarter() {
  const cx = 74, cz = 0;
  tile("p8x8", C.sandDark, cx - 26, cz - 34, cx + 26, cz + 34);
  for (let z = -28; z <= 28; z += 14) {
    for (const ox of [-16, 16]) {
      put("mandapa8", C.sand, cx + ox, 0, cz + z);
      put("marketStall4", C.teak, cx + ox + (ox > 0 ? -8 : 8), 0, cz + z, ox > 0 ? 90 : 270);
    }
    for (let t = -22; t <= 22; t += 4) put("heritageRoad", C.sand, cx + t, 0, cz + z + 7, 90);
  }
  for (const oz of [-30, 0, 30]) {
    put("templeTank8", C.granite, cx, 0, cz + oz);
    put("banner1", pick(FESTIVE), cx + 8, 0, cz + oz);
  }
  for (let i = 0; i < 24; i++) {
    put(pick(["merchant", "resident", "child"]), pick(FESTIVE),
      cx - 22 + rnd() * 44, PLATE_H, cz - 30 + rnd() * 60);
  }
  for (const oz of [-20, 20]) put("horse", C.teak, cx, 0, cz + oz, 90);
}

/* ------------------------------------------------------------------ build */
ground();
cityWall();
streets();
templePrecinct();
palace();
bazaar();
haveliQuarter();
riverAndGardens();
lakePalace();
caravanserai();
hillFort();
craftQuarter();
orchards();
outskirts();

if (bricks.length > MAX_BRICKS) {
  console.error(`too many bricks: ${bricks.length} > ${MAX_BRICKS}`);
  process.exit(1);
}

writeFileSync(
  "public/worlds/indian-heritage-city.json",
  JSON.stringify({
    app: "brickforge",
    v: 2,
    plotWidth: 16,
    blueprintIndex: 0,
    copyAllowed: true,
    attribution: "",
    customTypes: [],
    bricks,
  }),
);

const counts = bricks.reduce((m, b) => ((m[b.typeId] = (m[b.typeId] || 0) + 1), m), {});
const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log(`indian-heritage-city.json — ${bricks.length} bricks, ${Object.keys(counts).length} piece types`);
console.log("  " + top.map(([k, v]) => `${k}×${v}`).join("  "));
