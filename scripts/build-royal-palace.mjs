/**
 * Generate public/worlds/royal-palace.json.
 *
 * The card promises "a detailed walled palace with domes, chhatris, carved
 * screens, courtyards, gardens, a stepwell and market awnings". The hand-placed
 * version was 121 bricks and read as a white blob on a green field. This builds
 * the whole complex: a fortified perimeter with corner minarets and a
 * ceremonial gateway, a charbagh garden quartered by water channels, a tiered
 * palace on a plinth, a stepwell, and a bazaar street.
 *
 * Every piece is one the builder already offers, so the whole thing stays
 * editable after "Copy to My Town" — that is the point of a showcase world.
 *
 *   node scripts/build-royal-palace.mjs
 */
import { writeFileSync } from "node:fs";

/* ------------------------------------------------------------------ units */
const BRICK_H = 1.2;
const PLATE_H = 0.4;
const MAX_BRICKS = 5000; // the loader refuses anything larger

/* --------------------------------------------------------------- palette */
const C = {
  sand: "#d8b171",
  sandDark: "#c2965a",
  red: "#b5543a",
  redDark: "#94402c",
  marble: "#f2ede2",
  marbleWarm: "#e8dcc6",
  gold: "#e0b13c",
  grass: "#4f8f47",
  grassDark: "#3d7238",
  hedge: "#2f6b34",
  water: "#3f8fbf",
  stone: "#a9a29a",
  teak: "#6b4a2f",
  awningA: "#c4453c",
  awningB: "#e6c65a",
};

/* --------------------------------------------------------------- emitters */
const bricks = [];
let nextId = 2000;

/** Place one piece. `yaw` is degrees about Y; `y` is the piece's underside. */
function put(typeId, color, x, y, z, yaw = 0) {
  const half = (yaw * Math.PI) / 360;
  bricks.push({
    id: nextId++,
    typeId,
    color,
    p: [round(x), round(y), round(z)],
    q: [0, round(Math.sin(half)), 0, round(Math.cos(half))],
    on: true,
    doorOpen: false,
    use: "",
  });
}
const round = (n) => Math.round(n * 1000) / 1000;

/** A rectangle of 8×8 ground tiles, given in tile counts. */
function ground(typeId, color, x0, z0, cols, rows, y = 0) {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      put(typeId, color, x0 + i * 8, y, z0 + j * 8);
    }
  }
}

/** Tile a rectangle given in world coordinates, inclusive of both ends. */
function tile(typeId, color, x0, z0, x1, z1, step = 8, y = 0) {
  for (let x = x0; x <= x1; x += step) {
    for (let z = z0; z <= z1; z += step) put(typeId, color, x, y, z);
  }
}

/* ------------------------------------------------------------- the layout */
/* A 112-stud compound centred on the origin. The gateway is due south, the
   charbagh garden fills the southern half, the palace stands on the axis to
   the north, with the bazaar down the west edge and the stepwell to the east.
   Everything is sized off HALF so the whole plan scales from one number. */
const HALF = 92;
const IN = HALF - 4;          // the last tile inside the wall

const GARDEN_Z = -50;         // centre of the charbagh
const PALACE_Z = 14;          // centre of the palace block
const COURT_Z = 56;           // the reflecting pool court behind it

function compoundFloor() {
  ground("p8x8", C.sand, -IN, -IN, (IN * 2) / 8 + 1, (IN * 2) / 8 + 1);
}

function outerWall() {
  const courses = 3;
  for (let i = -IN; i <= IN; i += 8) {
    const gateGap = Math.abs(i) <= 8;           // the opening, south face only
    for (let c = 0; c < courses; c++) {
      const y = c * BRICK_H * 2;
      if (!gateGap) put("heritageWall8", C.red, i, y, -HALF, 90);
      put("heritageWall8", C.red, i, y, HALF, 90);
      put("heritageWall8", C.red, -HALF, y, i, 0);
      put("heritageWall8", C.red, HALF, y, i, 0);
    }
    const cap = courses * BRICK_H * 2;
    if (!gateGap) put("battle8", C.redDark, i, cap, -HALF, 90);
    put("battle8", C.redDark, i, cap, HALF, 90);
    put("battle8", C.redDark, -HALF, cap, i, 0);
    put("battle8", C.redDark, HALF, cap, i, 0);
  }
  // bastions halfway along each run, so 112 studs of wall is not one flat line
  for (const s of [-1, 1]) {
    for (const along of [-56, -28, 28, 56]) {
      for (const [x, z] of [[along, s * HALF], [s * HALF, along]]) {
        for (let c = 0; c < 4; c++) put("r4x4", C.redDark, x, c * BRICK_H, z);
        put("chhatri4", C.marble, x, 4 * BRICK_H, z);
      }
    }
  }
}

function cornerTowers() {
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * HALF, z = sz * HALF;
      for (let c = 0; c < 5; c++) put("r4x4", C.red, x, c * BRICK_H, z);
      put("minaret4", C.marbleWarm, x, 5 * BRICK_H, z);
    }
  }
}

function gateway() {
  put("torana8", C.red, 0, 0, -HALF, 90);
  for (const sx of [-12, 12]) {
    for (let c = 0; c < 6; c++) put("r4x4", C.redDark, sx, c * BRICK_H, -HALF);
    put("chhatri6", C.marble, sx, 6 * BRICK_H, -HALF);
  }
  // the processional way in from the gate to the garden
  for (let z = -IN; z <= -46; z += 8) {
    for (const x of [-4, 4]) put("p8x8", C.marbleWarm, x, 0, z);
  }
  put("elephant3", C.stone, -8, 0, -44, 0);
  put("elephant3", C.stone, 8, 0, -44, 0);
  for (const sx of [-10, 10]) put("banner1", C.gold, sx, 0, -48);
}

/* ----------------------------------------------------------- charbagh -- */
function charbagh() {
  const z0 = GARDEN_Z - 16, z1 = GARDEN_Z + 16;

  // the cross of water, with a fountain where the two channels meet
  for (let z = z0; z <= z1; z += 8) put("channel8", C.water, 0, 0, z, 0);
  for (let x = -28; x <= 28; x += 8) {
    if (Math.abs(x) <= 4) continue;
    put("channel8", C.water, x, 0, GARDEN_Z, 90);
  }
  put("fountain4", C.marble, 0, 0, GARDEN_Z);

  // four planted quarters either side of the cross
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * 18, cz = GARDEN_Z + sz * 12;
      ground("grass8", C.grass, cx - 8, cz - 4, 3, 2);
      for (const ox of [-4, 4]) {
        for (const oz of [-4, 4]) put("parterre8", C.hedge, cx + ox, PLATE_H, cz + oz);
      }
      put("hedge4", C.hedge, cx - 11, PLATE_H, cz);
      put("hedge4", C.hedge, cx + 11, PLATE_H, cz);
      put("flowers2", C.gold, cx - 7, PLATE_H, cz - 8);
      put("flowers2", C.awningA, cx + 7, PLATE_H, cz + 8);
    }
  }

  // cypresses down both sides of every path
  for (let z = z0 + 2; z <= z1 - 2; z += 6) {
    put("cypress1", C.grassDark, -5, 0, z);
    put("cypress1", C.grassDark, 5, 0, z);
  }
  for (let x = -26; x <= 26; x += 6) {
    if (Math.abs(x) <= 6) continue;
    put("cypress1", C.grassDark, x, 0, GARDEN_Z - 5);
    put("cypress1", C.grassDark, x, 0, GARDEN_Z + 5);
  }

  put("pavilion6", C.marble, -32, 0, GARDEN_Z);
  put("pavilion6", C.marble, 32, 0, GARDEN_Z);
}

/* -------------------------------------------------------------- palace -- */
/* Three tiers on a stepped plinth: an arcaded ground storey, a jali-screened
   first floor, and a roof of domes and corner chhatris. */
function palace() {
  const cz = PALACE_Z;
  const W = 24, D = 12;
  const plinthTop = BRICK_H * 3;

  for (let c = 0; c < 3; c++) {
    const w = W + 4 - c * 2, d = D + 4 - c * 2;
    for (let x = -w; x <= w; x += 8) {
      for (let z = cz - d; z <= cz + d; z += 8) put("p8x8", C.sandDark, x, c * BRICK_H, z);
    }
  }
  for (const x of [-4, 4]) put("steps8", C.sandDark, x, 0, cz - D - 8, 0);

  // ground storey: a cusped arcade, columns on the bay lines
  for (let x = -W; x <= W; x += 8) {
    for (const oz of [-D, D]) {
      put("cusp4", C.marbleWarm, x - 2, plinthTop, cz + oz, 90);
      put("cusp4", C.marbleWarm, x + 2, plinthTop, cz + oz, 90);
    }
    put("heritageColumn2", C.marble, x, plinthTop, cz - D);
    put("heritageColumn2", C.marble, x, plinthTop, cz + D);
  }
  for (let z = cz - D + 8; z <= cz + D - 8; z += 8) {
    for (const ox of [-W, W]) {
      put("cusp4", C.marbleWarm, ox, plinthTop, z - 2, 0);
      put("cusp4", C.marbleWarm, ox, plinthTop, z + 2, 0);
    }
  }

  const floor2 = plinthTop + BRICK_H * 4;
  for (let x = -W; x <= W; x += 8) {
    for (let z = cz - D; z <= cz + D; z += 8) put("p8x8", C.marbleWarm, x, floor2, z);
  }

  // first storey: jali screens between the piers, balconies on the long faces
  for (let x = -W; x <= W; x += 8) {
    put("jali8", C.marble, x, floor2 + PLATE_H, cz - D, 90);
    put("jali8", C.marble, x, floor2 + PLATE_H, cz + D, 90);
  }
  for (let z = cz - D + 8; z <= cz + D - 8; z += 8) {
    put("jali8", C.marble, -W, floor2 + PLATE_H, z, 0);
    put("jali8", C.marble, W, floor2 + PLATE_H, z, 0);
  }
  for (const x of [-16, 0, 16]) {
    put("jharokha2", C.red, x, floor2 + PLATE_H, cz - D - 1, 0);
    put("jharokha2", C.red, x, floor2 + PLATE_H, cz + D + 1, 0);
  }

  const roof = floor2 + PLATE_H + BRICK_H * 3;
  for (let x = -W; x <= W; x += 8) {
    for (let z = cz - D; z <= cz + D; z += 8) put("p8x8", C.marbleWarm, x, roof, z);
  }
  for (let x = -W; x <= W; x += 8) {
    put("parapet8", C.marble, x, roof + PLATE_H, cz - D - 3, 90);
    put("parapet8", C.marble, x, roof + PLATE_H, cz + D + 3, 90);
  }
  for (let z = cz - D; z <= cz + D; z += 8) {
    put("parapet8", C.marble, -W - 3, roof + PLATE_H, z, 0);
    put("parapet8", C.marble, W + 3, roof + PLATE_H, z, 0);
  }

  /* The crown. The dome needs something to stand on or the roof reads as a
     blank white field, so a square drum steps up out of the middle first. */
  const drum = roof + PLATE_H;
  for (let c = 0; c < 3; c++) {
    const y = drum + c * BRICK_H * 2;
    for (const ox of [-8, 0, 8]) {
      put("heritageWall8", C.marbleWarm, ox, y, cz - 8, 90);
      put("heritageWall8", C.marbleWarm, ox, y, cz + 8, 90);
    }
    for (const oz of [-8, 0, 8]) {
      put("heritageWall8", C.marbleWarm, -12, y, cz + oz, 0);
      put("heritageWall8", C.marbleWarm, 12, y, cz + oz, 0);
    }
  }
  const drumTop = drum + BRICK_H * 6;
  for (const ox of [-8, 0, 8]) {
    for (const oz of [-8, 0, 8]) put("p8x8", C.marble, ox, drumTop, cz + oz);
  }
  for (const ox of [-8, 0, 8]) {
    put("parapet8", C.marble, ox, drumTop + PLATE_H, cz - 11, 90);
    put("parapet8", C.marble, ox, drumTop + PLATE_H, cz + 11, 90);
  }
  for (let c = 0; c < 2; c++) put("r4x4", C.marble, 0, drumTop + PLATE_H + c * BRICK_H, cz);
  put("onion6", C.marble, 0, drumTop + PLATE_H + BRICK_H * 2, cz);
  for (const ox of [-8, 8]) {
    for (const oz of [-8, 8]) put("onion4", C.gold, ox, drumTop + PLATE_H, cz + oz);
  }
  for (const sx of [-16, 16]) put("chhatri6", C.marble, sx, drum, cz);
  for (const sx of [-W, W]) {
    for (const sz of [cz - D, cz + D]) put("chhatri4", C.marble, sx, drum, sz);
  }
}

/* ------------------------------------------------------------- stepwell -- */
function stepwell() {
  const x = 60, z = 4;
  ground("p8x8", C.stone, x - 12, z - 12, 4, 4);
  for (const ox of [-4, 4]) {
    for (const oz of [-4, 4]) put("stepwell8", C.stone, x + ox, PLATE_H, z + oz);
  }
  put("colonnade8", C.sandDark, x - 13, 0, z - 4, 0);
  put("colonnade8", C.sandDark, x - 13, 0, z + 4, 0);
  put("pavilion6", C.sand, x, 0, z + 18);
  for (const ox of [-10, 10]) put("palm2", C.grassDark, x + ox, 0, z + 20);
}

/* --------------------------------------------------------------- bazaar -- */
function bazaar() {
  const x = -62;
  for (let z = -20; z <= 44; z += 8) {
    put("shopfront4", C.sand, x - 6, 0, z, 0);
    put("shopfront4", C.sand, x + 6, 0, z, 0);
    const flip = z % 16 === 0;
    put("awning4", flip ? C.awningA : C.awningB, x - 4, BRICK_H * 3, z, 0);
    put("awning4", flip ? C.awningB : C.awningA, x + 4, BRICK_H * 3, z, 0);
    put("bench2", C.teak, x - 2, 0, z + 3);
    put("bench2", C.teak, x + 2, 0, z - 3);
  }
  for (let z = -16; z <= 40; z += 16) {
    put("parasol1", C.awningB, x, 0, z);
    put("lampPost", C.stone, x - 3, 0, z + 8);
  }
  put("torana8", C.sand, x, 0, -28, 90);
}

/* ---------------------------------------------------------- north court -- */
function northCourt() {
  const z = COURT_Z;
  for (let x = -16; x <= 16; x += 8) {
    for (const oz of [-4, 4]) put("pool8", C.water, x, PLATE_H, z + oz);
  }
  for (let x = -24; x <= 24; x += 8) {
    put("parapet8", C.marble, x, PLATE_H, z - 9, 90);
    put("parapet8", C.marble, x, PLATE_H, z + 9, 90);
  }
  for (const sx of [-30, 30]) {
    put("pavilion6", C.marble, sx, 0, z);
    put("cypress1", C.grassDark, sx, 0, z - 9);
    put("cypress1", C.grassDark, sx, 0, z + 9);
  }
  put("ghat8", C.stone, 0, 0, z - 14, 0);
}

/* ----------------------------------------------------------- east court -- */
/* The compound was mostly empty sand on this side. A pillared durbar hall and
   a run of stables give the east half something to be. */
function eastCourt() {
  const x = 58, z = -50;
  ground("p8x8", C.sandDark, x - 12, z - 16, 4, 5);
  // durbar hall: a colonnade square under a tiered roof
  for (let oz = -12; oz <= 12; oz += 8) {
    put("colonnade8", C.red, x - 10, 0, z + oz, 0);
    put("colonnade8", C.red, x + 10, 0, z + oz, 0);
  }
  for (let ox = -8; ox <= 8; ox += 8) {
    for (let oz = -12; oz <= 12; oz += 8) put("p8x8", C.sand, x + ox, BRICK_H * 5, z + oz);
  }
  for (let ox = -8; ox <= 8; ox += 8) {
    put("heritageRoof8", C.redDark, x + ox, BRICK_H * 5 + PLATE_H, z - 8);
    put("heritageRoof8", C.redDark, x + ox, BRICK_H * 5 + PLATE_H, z + 8);
    put("parapet8", C.marble, x + ox, BRICK_H * 5 + PLATE_H, z - 15, 90);
  }
  put("chhatri6", C.marble, x, BRICK_H * 5 + PLATE_H, z);
  put("elephant3", C.stone, x - 14, 0, z + 20, 0);
  put("elephant3", C.stone, x + 2, 0, z + 20, 0);
  for (const ox of [-14, 14]) put("banner1", C.awningA, x + ox, 0, z - 16);
}

/* Planting inside the wall, so the perimeter is not a bare sand margin. */
function perimeterPlanting() {
  for (let i = -IN + 4; i <= IN - 4; i += 16) {
    for (const [x, z] of [[i, -IN + 2], [i, IN - 2], [-IN + 2, i], [IN - 2, i]]) {
      if (Math.abs(x) < 14 && z < 0) continue;   // keep the processional way clear
      put(Math.abs(i) % 32 === 0 ? "palm2" : "tree4", C.grassDark, x, 0, z);
    }
  }
}


/* ------------------------------------------------------------- the lake -- */
/* A pleasure lake behind the palace with a marble pavilion on an island,
   reached by a causeway — the piece of a royal compound that says leisure
   rather than administration. */
function lake() {
  const cx = 52, cz = 56;
  tile("water8", C.water, cx - 24, cz - 20, cx + 24, cz + 20, 8, PLATE_H);
  for (let x = -28; x <= 28; x += 8) {
    put("ghat8", C.stone, cx + x, 0, cz - 24, 0);
    put("parapet8", C.marble, cx + x, PLATE_H, cz + 24, 90);
  }
  for (let z = cz - 22; z <= cz - 8; z += 4) put("p8x8", C.marbleWarm, cx, PLATE_H, z);
  for (let c = 0; c < 2; c++) {
    tile("p8x8", C.marbleWarm, cx - (8 - c * 4), cz - (8 - c * 4), cx + (8 - c * 4), cz + (8 - c * 4), 8, c * BRICK_H);
  }
  put("pavilion6", C.marble, cx, BRICK_H * 2, cz);
  for (const ox of [-8, 8]) put("chhatri4", C.gold, cx + ox, BRICK_H * 2, cz);
  for (const ox of [-26, 26]) {
    put("palm2", C.grassDark, cx + ox, 0, cz - 20);
    put("palm2", C.grassDark, cx + ox, 0, cz + 20);
  }
}

/* ------------------------------------------------------ the outer courts - */
/* The working half of a palace: kitchens, stores, barracks and the elephant
   lines, in a colonnaded court along the west wall. */
function serviceCourt() {
  const cx = -60, cz = -20;
  ground("p8x8", C.sandDark, cx - 20, cz - 24, 6, 7);
  for (let z = -20; z <= 20; z += 8) {
    put("colonnade8", C.sandDark, cx - 18, 0, cz + z, 0);
    put("colonnade8", C.sandDark, cx + 14, 0, cz + z, 0);
  }
  for (let x = -12; x <= 8; x += 8) {
    put("mandapa8", C.sand, cx + x, 0, cz - 22);
    put("mandapa8", C.sand, cx + x, 0, cz + 22);
  }
  for (const oz of [-12, 0, 12]) put("elephant", C.stone, cx, 0, cz + oz, 90);
  for (const oz of [-18, 18]) put("horse", C.teak, cx, 0, cz + oz, 90);
  for (let i = 0; i < 12; i++) put("palaceGuard", "#33528f", cx - 16, PLATE_H, cz - 20 + i * 3.5);
}

/* --------------------------------------------------------- the orchards -- */
function orchards() {
  for (const [cx, cz] of [[-66, 66], [66, -70], [-66, -70]]) {
    ground("grass8", C.grass, cx - 12, cz - 12, 4, 4);
    for (let x = -10; x <= 10; x += 5) {
      for (let z = -10; z <= 10; z += 5) put("tree4", C.grassDark, cx + x, PLATE_H, cz + z);
    }
    put("pool8", C.water, cx, PLATE_H, cz);
  }
}

/* -------------------------------------------------------------- the court */
/* People, so the compound is inhabited rather than empty. */
let seed = 20260826;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

function courtLife() {
  /* Scattered inside the wall, from a seeded sequence so the compound is the
     same every time it is generated. The first pass put half of them outside
     the wall — the x term was subtracting IN twice. */
  for (let i = 0; i < 46; i++) {
    const x = (rnd() * 2 - 1) * (IN - 8);
    const z = (rnd() * 2 - 1) * (IN - 8);
    put(["resident", "merchant", "child", "palaceGuard"][i % 4],
      ["#e8892b", "#a8397a", "#33528f", "#2f7d5a"][i % 4], x, PLATE_H, z);
  }
  for (const [x, z] of [[0, -70], [0, 70], [-70, 0], [70, 0]]) {
    put("carriage", C.teak, x, 0, z, Math.abs(x) > Math.abs(z) ? 90 : 0);
  }
}


/* Whatever is still bare paving gets a use: small tanks, tree courts and
   shaded pavilions on a grid, skipping anything already built on. */
function fillTheCourt() {
  const built = (x, z) =>
    (Math.abs(x) < 34 && z > -8 && z < 40) ||           // the palace block
    (Math.abs(x - 60) < 20 && Math.abs(z - 4) < 24) ||  // the stepwell
    (Math.abs(x + 62) < 14 && z > -28 && z < 52) ||     // the bazaar
    (Math.abs(x - 58) < 22 && Math.abs(z + 50) < 24) || // the durbar hall
    (Math.abs(x - 52) < 30 && Math.abs(z - 56) < 26) || // the lake
    (Math.abs(x + 60) < 24 && Math.abs(z + 20) < 28) || // the service court
    (Math.abs(z - GARDEN_Z) < 22 && Math.abs(x) < 40) || // the charbagh
    (Math.abs(z - COURT_Z) < 14 && Math.abs(x) < 36);    // the pool court
  for (let x = -IN + 8; x <= IN - 8; x += 16) {
    for (let z = -IN + 8; z <= IN - 8; z += 16) {
      if (built(x, z)) continue;
      const roll = rnd();
      if (roll < 0.34) {
        put("tree4", C.grassDark, x, PLATE_H, z);
        put("bush2", C.grass, x + 4, PLATE_H, z + 3);
      } else if (roll < 0.56) {
        put("grass8", C.grass, x, 0, z);
        put("parterre8", C.hedge, x, PLATE_H, z);
      } else if (roll < 0.72) {
        put("pool8", C.water, x, PLATE_H, z);
        put("parapet8", C.marble, x, PLATE_H, z - 5, 90);
      } else if (roll < 0.86) {
        put("pavilion6", C.marble, x, 0, z);
      } else {
        put("mandapa8", C.sandDark, x, 0, z);
      }
    }
  }
}

/* ------------------------------------------------------------------ build */
compoundFloor();
outerWall();
cornerTowers();
gateway();
charbagh();
palace();
stepwell();
bazaar();
northCourt();
eastCourt();
lake();
serviceCourt();
orchards();
courtLife();
fillTheCourt();
perimeterPlanting();

if (bricks.length > MAX_BRICKS) {
  console.error(`too many bricks: ${bricks.length} > ${MAX_BRICKS}`);
  process.exit(1);
}

const world = {
  app: "brickforge",
  v: 2,
  plotWidth: 10,
  blueprintIndex: 0,
  copyAllowed: true,
  attribution: "",
  customTypes: [],
  bricks,
};
writeFileSync("public/worlds/royal-palace.json", JSON.stringify(world));

const counts = bricks.reduce((m, b) => ((m[b.typeId] = (m[b.typeId] || 0) + 1), m), {});
const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log(`royal-palace.json — ${bricks.length} bricks, ${Object.keys(counts).length} piece types`);
console.log("  " + top.map(([k, v]) => `${k}×${v}`).join("  "));
