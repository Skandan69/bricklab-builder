/**
 * The challenge targets.
 *
 * Each one is a small structure a player has to reproduce. They are deliberately
 * modest — a timed copy of a 3,000-brick palace is not a game, it is a chore —
 * and they climb from "four walls and a roof" to something with a canopy on
 * columns, a colour scheme and a bit of symmetry to keep straight.
 *
 * Two rules the scorer imposes, so the targets have to respect them:
 *   - no baseplates: the floor is ignored when scoring, so a target that is
 *     mostly floor would be mostly unscored
 *   - only pieces in the builder's own palette, so every target is buildable
 *     with what the player actually has
 *   - no slopes, arches or ridge pieces: their look depends on which way they
 *     are turned, and a player who cannot tell the facing from a still image
 *     cannot copy them. Bricks, plates, tiles and round bricks read the same
 *     from any angle, so the target is unambiguous
 *
 *   node scripts/build-challenges.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";

const BRICK_H = 1.2;
const PLATE_H = 0.4;

const C = {
  red: "#c0392b", blue: "#2b6cb0", yellow: "#f0b429", white: "#f4f4f4",
  grey: "#8d9699", dark: "#2f3a48", green: "#3f8a3a", tan: "#e0cba6",
  brown: "#7a5230", glass: "#8ad7ef",
};

function maker() {
  const bricks = [];
  let id = 1;
  const put = (typeId, color, x, y, z, yaw = 0) => {
    const half = (yaw * Math.PI) / 360;
    bricks.push({
      id: id++, typeId, color,
      p: [x, Math.round(y * 1000) / 1000, z],
      q: [0, Math.round(Math.sin(half) * 1000) / 1000, 0, Math.round(Math.cos(half) * 1000) / 1000],
      on: true, doorOpen: false, use: "",
    });
  };
  return { bricks, put };
}

/* ----------------------------------------------------------- the targets */
const TARGETS = [];

function target(spec) { TARGETS.push(spec); }

/* 1 — a gatepost pair. Teaches stacking and symmetry, nothing else. */
target({
  id: "gateposts",
  name: "The Gateposts",
  brief: "Two matching posts either side of a gap, capped in yellow.",
  difficulty: 1,
  seconds: 180,
  build() {
    const { bricks, put } = maker();
    for (const x of [-4, 4]) {
      for (let c = 0; c < 5; c++) put("b2x2", C.red, x, c * BRICK_H, 0);
      put("t2x2", C.yellow, x, 5 * BRICK_H, 0);
    }
    return bricks;
  },
});

/* 2 — a hut. Walls, a doorway, a stepped roof. The first real shape. */
target({
  id: "hut",
  name: "Founder's Hut",
  brief: "A four-wall hut with a doorway, one window, and a red roof that steps in twice.",
  difficulty: 2,
  seconds: 300,
  build() {
    const { bricks, put } = maker();
    for (let c = 0; c < 3; c++) {
      const y = c * BRICK_H;
      put("b1x8", C.tan, 0, y, -3.5, 90);
      put("b1x6", C.tan, -3.5, y, 0);
      put("b1x6", C.tan, 3.5, y, 0);
      put("b1x2", C.tan, -3, y, 3.5, 90);
      put("b1x2", C.tan, 3, y, 3.5, 90);
    }
    put("door1x4", C.brown, 0, 0, 3.5, 90);
    put("win1x4", C.glass, -3.52, BRICK_H, 0);
    /* A roof that steps in twice. Reads the same from every angle, which a
       slope does not. */
    const eaves = 3 * BRICK_H;
    for (let x = -3; x <= 3; x += 2) {
      put("p2x8", C.red, x, eaves, 0);
    }
    for (let x = -2; x <= 2; x += 2) {
      put("p2x6", C.red, x, eaves + PLATE_H, 0);
    }
    put("p2x4", C.red, 0, eaves + PLATE_H * 2, 0);
    return bricks;
  },
});

/* 3 — a signal tower. Height, a stepped taper, and a light on top. */
target({
  id: "tower",
  name: "Signal Tower",
  brief: "A stepped tower that narrows as it rises, with a lamp at the top.",
  difficulty: 3,
  seconds: 300,
  build() {
    const { bricks, put } = maker();
    let y = 0;
    for (let tier = 0; tier < 4; tier++) {
      const wide = tier < 2;
      for (let c = 0; c < 3; c++) {
        const yy = y + c * BRICK_H;
        if (wide) {
          put("b1x6", tier % 2 ? C.grey : C.white, 0, yy, -2.5, 90);
          put("b1x6", tier % 2 ? C.grey : C.white, 0, yy, 2.5, 90);
          put("b1x4", tier % 2 ? C.grey : C.white, -2.5, yy, 0);
          put("b1x4", tier % 2 ? C.grey : C.white, 2.5, yy, 0);
        } else {
          put("b1x4", tier % 2 ? C.grey : C.white, 0, yy, -1.5, 90);
          put("b1x4", tier % 2 ? C.grey : C.white, 0, yy, 1.5, 90);
          put("b1x2", tier % 2 ? C.grey : C.white, -1.5, yy, 0);
          put("b1x2", tier % 2 ? C.grey : C.white, 1.5, yy, 0);
        }
      }
      y += 3 * BRICK_H;
      put(wide ? "p4x4" : "p2x2", C.dark, 0, y, 0);
      y += PLATE_H;
    }
    put("lampb", C.yellow, 0, y, 0);
    return bricks;
  },
});

/* 4 — a bridge span. Two piers, a stepped haunch, a deck and railings. */
target({
  id: "bridge",
  name: "Stone Span",
  brief: "Two grey piers stepped in white, carrying a deck with brown railings and a lamp at each end.",
  difficulty: 4,
  seconds: 420,
  build() {
    const { bricks, put } = maker();
    for (const x of [-5, 5]) {
      for (let c = 0; c < 4; c++) put("b2x4", C.grey, x, c * BRICK_H, 0, 90);
    }
    /* The span is stepped rather than arched: the arch piece looks different
       depending on which way it faces, and this has to be copyable from a
       picture. */
    for (const x of [-3, 3]) {
      for (let c = 2; c < 4; c++) put("b2x2", C.white, x, c * BRICK_H, 0);
    }
    const deck = 4 * BRICK_H;
    for (let x = -6; x <= 6; x += 4) put("p4x4", C.tan, x, deck, 0);
    for (const z of [-1.5, 1.5]) {
      for (let x = -6; x <= 6; x += 4) put("b1x4", C.brown, x, deck + PLATE_H, z, 90);
    }
    for (const x of [-7, 7]) put("lampb", C.yellow, x, deck + PLATE_H, 0);
    return bricks;
  },
});

/* 5 — a small station. The hardest: a canopy on columns, platform, colour rules. */
target({
  id: "station",
  name: "Halt & Canopy",
  brief: "A platform under a canopy on four columns, with a bench and a lamp.",
  difficulty: 5,
  seconds: 480,
  build() {
    const { bricks, put } = maker();
    for (let x = -6; x <= 6; x += 4) put("p4x4", C.grey, x, 0, 0);
    for (const x of [-6, 6]) {
      for (const z of [-1.5, 1.5]) {
        for (let c = 0; c < 4; c++) put("b1x1", C.dark, x, PLATE_H + c * BRICK_H, z);
      }
    }
    const roof = PLATE_H + 4 * BRICK_H;
    for (let x = -6; x <= 6; x += 4) put("p4x4", C.blue, x, roof, 0);
    for (let x = -6; x <= 6; x += 4) put("t4x4", C.white, x, roof + PLATE_H, 0);
    put("bench2", C.brown, -2, PLATE_H, 0, 90);
    put("bench2", C.brown, 2, PLATE_H, 0, 90);
    put("lampb", C.yellow, 0, PLATE_H, -1.5);
    put("sign2", C.white, 0, PLATE_H, 1.5);
    return bricks;
  },
});

/* --------------------------------------------------------------- output */
mkdirSync("public/challenges", { recursive: true });

const manifest = TARGETS.map((t) => {
  const bricks = t.build();
  writeFileSync(
    `public/challenges/${t.id}.json`,
    JSON.stringify({
      app: "brickforge", v: 2, plotWidth: 2, blueprintIndex: 0,
      copyAllowed: true, attribution: "", customTypes: [], bricks,
    }),
  );
  return {
    id: t.id, name: t.name, brief: t.brief,
    difficulty: t.difficulty, seconds: t.seconds,
    pieces: bricks.length,
    file: `/challenges/${t.id}.json`,
    image: `/challenges/${t.id}.webp`,
  };
});

writeFileSync("public/challenges/index.json", JSON.stringify({ targets: manifest }, null, 2));
manifest.forEach((t) =>
  console.log(`${t.id.padEnd(12)} ${String(t.pieces).padStart(3)} pieces  difficulty ${t.difficulty}  ${t.seconds}s  ${t.name}`),
);
