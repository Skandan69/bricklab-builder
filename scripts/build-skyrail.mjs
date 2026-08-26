/**
 * Generate public/worlds/skyrail-district.json.
 *
 * The card promises "a glass-tower neighbourhood with streets, landscaped park,
 * homes, station and a working elevated passenger railway". The hand-placed
 * version had 275 bricks and read as three grey slabs on a lawn. This lays a
 * real street grid, puts a downtown cluster on it, and runs the railway over
 * the avenue on piers with a station where people would actually board.
 *
 *   node scripts/build-skyrail.mjs
 */
import { writeFileSync } from "node:fs";

const BRICK_H = 1.2;
const PLATE_H = 0.4;
const MAX_BRICKS = 5000;

const C = {
  asphalt: "#4a4f57",
  paving: "#c9ccd2",
  glassA: "#7fb6de",
  glassB: "#9fd0e8",
  steel: "#b9bfc7",
  steelDark: "#7d848d",
  concrete: "#d5d7da",
  brickRed: "#b4483c",
  brickTan: "#e0cba6",
  roofA: "#8c3f36",
  roofB: "#3a5a80",
  wallA: "#efe6d6",
  wallB: "#dfe7ef",
  lawn: "#63a844",
  trim: "#2f3a48",
  accent: "#f0a92c",
};

const bricks = [];
let nextId = 4000;
const round = (n) => Math.round(n * 1000) / 1000;

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

function fill(typeId, color, x0, z0, x1, z1, step, y = 0) {
  for (let x = x0; x <= x1; x += step) {
    for (let z = z0; z <= z1; z += step) put(typeId, color, x, y, z);
  }
}

/* ------------------------------------------------------------------ plan */
const EDGE = 60;                       // the district runs -60..60 both ways
const AVENUES = [-48, -24, 0, 24, 48]; // road centre lines, 24 studs apart
const BLOCKS = [-36, -12, 12, 36];     // block centres between them
const RAIL_Z = 24;                     // the elevated line runs east–west here
const RAIL_Y = BRICK_H * 7;

const isAvenue = (v) => AVENUES.some((a) => Math.abs(v - a) < 2.1);

/* Blocks need a surface of their own, or the district reads as buildings
   dropped on an empty lawn between strips of road. */
function blockGround() {
  for (const bx of BLOCKS) {
    for (const bz of BLOCKS) {
      const park = bx < 0 && bz > 0;
      const homes = bx < 0 && bz < 0;
      fill(park || homes ? "grass8" : "p8x8", park || homes ? C.lawn : C.paving,
        bx - 8, bz - 8, bx + 8, bz + 8, 8);
    }
  }
}

/* --------------------------------------------------------------- streets */
function streets() {
  for (const a of AVENUES) {
    for (let t = -EDGE; t <= EDGE; t += 4) {
      if (isAvenue(t)) continue;                    // junctions are placed once, below
      put("road", C.asphalt, a, 0, t, 0);
      put("road", C.asphalt, t, 0, a, 90);
    }
  }
  for (const a of AVENUES) {
    for (const b of AVENUES) put("roadx", C.asphalt, a, 0, b);
  }
  // crossings on the approach to every junction, and kerbs down the main avenue
  for (const a of AVENUES) {
    for (const b of AVENUES) {
      put("roadz", C.asphalt, a, 0, b - 4, 0);
      put("roadz", C.asphalt, a - 4, 0, b, 90);
    }
  }
  for (let t = -EDGE; t <= EDGE; t += 4) {
    for (const side of [-3, 3]) {
      put("kerb4", C.paving, side, PLATE_H, t, 0);
      put("kerb4", C.paving, t, PLATE_H, side, 90);
    }
  }
}

/* ---------------------------------------------------------------- towers */
/* Each tower is a stack of glass modules on a solid podium, capped with plant
   and a mast — so the skyline has silhouette rather than being flat-topped. */
function tower(x, z, floors, glass, trim) {
  fill("p8x8", C.concrete, x - 4, z - 4, x + 4, z + 4, 8);
  let y = PLATE_H;
  // podium
  put("tower8", trim, x - 4, y, z - 4);
  put("tower8", trim, x + 4, y, z - 4);
  put("tower8", trim, x - 4, y, z + 4);
  put("tower8", trim, x + 4, y, z + 4);
  y += BRICK_H * 6;
  for (let i = 0; i < floors; i++) {
    put("towerGlass8", glass, x - 4, y, z - 4);
    put("towerGlass8", glass, x + 4, y, z - 4);
    put("towerGlass8", glass, x - 4, y, z + 4);
    put("towerGlass8", glass, x + 4, y, z + 4);
    y += BRICK_H * 12;
  }
  fill("p8x8", C.steel, x - 4, z - 4, x + 4, z + 4, 8, y);
  put("hvac4", C.steelDark, x - 4, y + PLATE_H, z + 4);
  put("hvac4", C.steelDark, x + 4, y + PLATE_H, z - 4);
  put("antenna1", C.steelDark, x, y + PLATE_H, z);
  for (const [ox, oz] of [[-4, -4], [4, 4]]) put("lamp", C.accent, x + ox, y + PLATE_H, z + oz);
}

function downtown() {
  const spec = [
    /* One or two glass modules each. Three made a 58-stud monolith that
       dwarfed the rest of the district and read as a wall, not a skyline. */
    [12, -36, 2, C.glassA, C.trim],
    [36, -36, 1, C.glassB, C.steelDark],
    [12, -12, 2, C.glassB, C.trim],
    [36, -12, 1, C.glassA, C.steelDark],
    [36, 12, 1, C.glassA, C.trim],
  ];
  for (const [x, z, floors, glass, trim] of spec) tower(x, z, floors, glass, trim);
  // a paved plaza between the towers, with planting and seating
  fill("plaza8", C.paving, 12 - 4, 12 - 4, 12 + 4, 12 + 4, 8, 0);
  for (const [ox, oz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
    put("tree4", C.lawn, 12 + ox, PLATE_H, 12 + oz);
  }
  put("fountain4", C.paving, 12, PLATE_H, 12);
  for (const oz of [-8, 8]) {
    put("bench2", C.steelDark, 8, PLATE_H, 12 + oz, 90);
    put("bench2", C.steelDark, 16, PLATE_H, 12 + oz, 90);
  }
}

/* ------------------------------------------------------------------ park */
function park() {
  for (const bx of [-36, -12]) {
    for (const bz of [12, 36]) fill("grass8", C.lawn, bx - 8, bz - 8, bx + 8, bz + 8, 8);
  }
  // a pond with a planted edge
  fill("water8", C.glassA, -28, 28, -12, 44, 8, 0);
  for (let x = -36; x <= -4; x += 8) {
    put("bush2", C.lawn, x, PLATE_H, 20);
    put("bush2", C.lawn, x, PLATE_H, 52);
  }
  for (const [x, z] of [[-40, 16], [-24, 20], [-8, 16], [-40, 48], [-24, 52], [-8, 48], [-44, 32], [-4, 32]]) {
    put("tree4", C.lawn, x, PLATE_H, z);
  }
  // a path across the park, with lamps and benches along it
  for (let x = -44; x <= -4; x += 4) put("t4x4", C.paving, x, PLATE_H, 24);
  for (let x = -44; x <= -4; x += 12) {
    put("lampPost", C.steelDark, x, PLATE_H, 21);
    put("bench2", C.steelDark, x + 4, PLATE_H, 21, 90);
  }
  put("pavilion6", C.wallA, -20, PLATE_H, 44);
  for (let x = -46; x <= -2; x += 4) put("fence1x4", C.steelDark, x, PLATE_H, 2, 90);
}

/* ----------------------------------------------------------------- homes */
/* A compact terrace: walls, a door, windows, a pitched roof and a garden. */
function house(x, z, wall, roof) {
  fill("p8x8", C.lawn, x - 4, z - 4, x + 4, z + 4, 8);
  for (let r = 0; r < 4; r++) {
    const y = PLATE_H + r * BRICK_H;
    put("b1x8", wall, x, y, z - 3.5, 90);
    put("b1x8", wall, x, y, z + 3.5, 90);
    put("b1x6", wall, x - 3.5, y, z);
    put("b1x6", wall, x + 3.5, y, z);
  }
  put("door1x4", roof, x, PLATE_H, z + 3.5, 90);
  put("win1x4", C.glassB, x - 3, PLATE_H + BRICK_H, z + 3.52, 90);
  put("win1x4", C.glassB, x + 3, PLATE_H + BRICK_H, z + 3.52, 90);
  put("win1x4", C.glassB, x - 3.52, PLATE_H + BRICK_H, z);
  const eaves = PLATE_H + BRICK_H * 4;
  fill("p8x8", roof, x, z, x, z, 8, eaves);
  for (const oz of [-2, 2]) {
    put("s2x4", roof, x - 2, eaves + PLATE_H, z + oz, oz < 0 ? 0 : 180);
    put("s2x4", roof, x + 2, eaves + PLATE_H, z + oz, oz < 0 ? 0 : 180);
  }
  put("ridge8", roof, x, eaves + PLATE_H + BRICK_H, z, 90);
  put("chimney1", C.brickRed, x + 3, eaves + PLATE_H + BRICK_H, z - 2);
  put("bush2", C.lawn, x - 3, PLATE_H, z + 6);
  put("tree4", C.lawn, x + 4, PLATE_H, z + 6);
}

function homes() {
  const palette = [
    [C.wallA, C.roofA],
    [C.wallB, C.roofB],
    [C.brickTan, C.roofA],
    [C.wallA, C.roofB],
  ];
  let i = 0;
  for (const bz of [-36, -12]) {
    for (const bx of [-36, -12]) {
      for (const ox of [-6, 6]) {
        const [wall, roof] = palette[i++ % palette.length];
        house(bx + ox, bz, wall, roof);
      }
    }
  }
  // corner shops facing the avenue
  for (const z of [-36, -12]) {
    put("shopfront4", C.brickTan, -3, PLATE_H, z, 0);
    put("awning4", C.accent, -5, BRICK_H * 3, z, 0);
  }
}

/* ------------------------------------------------------- elevated railway */
function railway() {
  const y = RAIL_Y;
  for (let x = -EDGE; x <= EDGE; x += 4) {
    put("bridge4", C.steel, x, y, RAIL_Z);
    put("rail", C.steelDark, x, y + BRICK_H, RAIL_Z);
    if (x % 16 === 0) {
      for (const oz of [-1.5, 1.5]) {
        put("pier2", C.concrete, x, 0, RAIL_Z + oz);
        put("pier2", C.concrete, x, BRICK_H * 4, RAIL_Z + oz);
      }
    }
    for (const oz of [-2.5, 2.5]) put("fence1x4", C.steelDark, x, y + BRICK_H, RAIL_Z + oz, 90);
  }
  // the train itself, so "working railway" is literally true when you press Play
  for (let i = 0; i < 3; i++) put("bogie", C.accent, -20 + i * 8, y + BRICK_H + PLATE_H, RAIL_Z, 90);

  // station: platforms either side, a canopy over them, stairs down to the street
  for (let x = -12; x <= 12; x += 8) {
    put("platform8", C.paving, x, y + BRICK_H, RAIL_Z - 4, 90);
    put("platform8", C.paving, x, y + BRICK_H, RAIL_Z + 4, 90);
    put("canopy8", C.trim, x, y + BRICK_H + PLATE_H, RAIL_Z - 6);
    put("canopy8", C.trim, x, y + BRICK_H + PLATE_H, RAIL_Z + 6);
  }
  /* Access towers rather than a ramp: six stacked 4×4 steps overlapped into a
     white wedge that read as a landslide. */
  for (const ox of [-16, 16]) {
    for (let c = 0; c < 6; c++) put("b2x4", C.concrete, ox, c * BRICK_H, RAIL_Z - 8, 90);
    put("steps4", C.concrete, ox, 0, RAIL_Z - 12, 0);
    put("lamp", C.accent, ox + 4, PLATE_H, RAIL_Z - 12);
  }
  put("signal1", C.trim, 20, y + BRICK_H, RAIL_Z - 3);
  put("signal1", C.trim, -20, y + BRICK_H, RAIL_Z + 3);
}

/* ------------------------------------------------------------ street life */
function streetFurniture() {
  for (const a of AVENUES) {
    for (let t = -EDGE + 8; t <= EDGE - 8; t += 16) {
      if (isAvenue(t)) continue;
      put("lampPost", C.steelDark, a + 3.5, PLATE_H, t);
      put("lampPost", C.steelDark, t, PLATE_H, a + 3.5, 90);
    }
  }
  // a little traffic, so the streets are not empty when the world loads
  const cars = [
    [-24, -40, 0], [-24, 8, 0], [0, -44, 0], [0, 40, 0],
    [24, -20, 0], [48, 16, 0], [-40, 0, 90], [16, 48, 90], [-8, -24, 90], [40, -48, 90],
  ];
  const paint = ["#c0392b", "#2980b9", "#f0a92c", "#ecf0f1", "#27ae60"];
  cars.forEach(([x, z, yaw], i) => put("car", paint[i % paint.length], x, PLATE_H, z, yaw));
}

/* ----------------------------------------------------------------- build */
blockGround();
streets();
downtown();
park();
homes();
railway();
streetFurniture();

if (bricks.length > MAX_BRICKS) {
  console.error(`too many bricks: ${bricks.length} > ${MAX_BRICKS}`);
  process.exit(1);
}

writeFileSync(
  "public/worlds/skyrail-district.json",
  JSON.stringify({
    app: "brickforge",
    v: 2,
    plotWidth: 10,
    blueprintIndex: 0,
    copyAllowed: true,
    attribution: "",
    customTypes: [],
    bricks,
  }),
);

const counts = bricks.reduce((m, b) => ((m[b.typeId] = (m[b.typeId] || 0) + 1), m), {});
const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log(`skyrail-district.json — ${bricks.length} bricks, ${Object.keys(counts).length} piece types`);
console.log("  " + top.map(([k, v]) => `${k}×${v}`).join("  "));
