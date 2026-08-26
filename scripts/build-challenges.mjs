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


/* 6 — a village well. Round pieces and a roof on posts. */
target({
  id: "well",
  name: "The Village Well",
  brief: "A round grey well with four brown posts and a small red roof over it.",
  difficulty: 1,
  seconds: 240,
  build() {
    const { bricks, put } = maker();
    for (let c = 0; c < 2; c++) put("r4x4", C.grey, 0, c * BRICK_H, 0);
    for (const x of [-2, 2]) {
      for (const z of [-2, 2]) {
        for (let c = 2; c < 5; c++) put("b1x1", C.brown, x, c * BRICK_H, z);
      }
    }
    put("p4x4", C.red, 0, 5 * BRICK_H, 0);
    put("t2x2", C.red, 0, 5 * BRICK_H + PLATE_H, 0);
    return bricks;
  },
});

/* 7 — a garden gate. Symmetry, a span, and planting either side. */
target({
  id: "gardengate",
  name: "Garden Gate",
  brief: "A white gateway with a green hedge on each side and a yellow lamp on top.",
  difficulty: 2,
  seconds: 240,
  build() {
    const { bricks, put } = maker();
    for (const x of [-3, 3]) {
      for (let c = 0; c < 4; c++) put("b2x2", C.white, x, c * BRICK_H, 0);
    }
    for (let x = -3; x <= 3; x += 2) put("p2x4", C.white, x, 4 * BRICK_H, 0);
    put("lampb", C.yellow, 0, 4 * BRICK_H + PLATE_H, 0);
    for (const x of [-7, 7]) {
      put("hedge4", C.green, x, 0, 0);
      put("bush2", C.green, x, 0, 3);
    }
    return bricks;
  },
});

/* 8 — a watchtower. A round shaft and a crenellated head. */
target({
  id: "watchtower",
  name: "Watchtower",
  brief: "A round grey tower six bricks high, with a wider dark top and a lamp.",
  difficulty: 3,
  seconds: 300,
  build() {
    const { bricks, put } = maker();
    for (let c = 0; c < 6; c++) put("r2x2", C.grey, 0, c * BRICK_H, 0);
    put("p4x4", C.dark, 0, 6 * BRICK_H, 0);
    for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) {
      put("b1x1", C.dark, x, 6 * BRICK_H + PLATE_H, z);
    }
    put("lampb", C.yellow, 0, 6 * BRICK_H + PLATE_H, 0);
    return bricks;
  },
});

/* 9 — a market row. Repetition, and three colours that have to line up. */
target({
  id: "market",
  name: "Market Row",
  brief: "Three stalls side by side with red, yellow and blue awnings.",
  difficulty: 3,
  seconds: 360,
  build() {
    const { bricks, put } = maker();
    const shades = [C.red, C.yellow, C.blue];
    shades.forEach((shade, i) => {
      const x = (i - 1) * 6;
      for (let c = 0; c < 2; c++) put("b2x4", C.brown, x, c * BRICK_H, 0, 90);
      put("p4x4", C.tan, x, 2 * BRICK_H, 0);
      for (const z of [-1.5, 1.5]) put("b1x1", C.brown, x + 1.5, 2 * BRICK_H + PLATE_H, z);
      put("p4x4", shade, x, 3 * BRICK_H + PLATE_H, 0);
    });
    return bricks;
  },
});

/* 10 — a garden pavilion. Heritage pieces on a built plinth. */
target({
  id: "pavilion",
  name: "Garden Pavilion",
  brief: "A white chhatri standing on a two-step sandstone plinth with a lamp at each corner.",
  difficulty: 4,
  seconds: 360,
  build() {
    const { bricks, put } = maker();
    for (let x = -2; x <= 2; x += 4) {
      for (let z = -2; z <= 2; z += 4) put("p4x4", C.tan, x, 0, z);
    }
    for (let x = -2; x <= 2; x += 4) {
      for (let z = -2; z <= 2; z += 4) put("p4x4", C.white, x, PLATE_H, z);
    }
    put("chhatri4", C.white, 0, PLATE_H * 2, 0);
    for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) put("lampb", C.yellow, x, 0, z);
    return bricks;
  },
});

/* 11 — an office block. A podium, a glass tower and rooftop plant. */
target({
  id: "office",
  name: "Glass Office",
  brief: "A dark podium under a blue glass tower, with rooftop plant and a mast.",
  difficulty: 4,
  seconds: 360,
  build() {
    const { bricks, put } = maker();
    put("tower8", C.dark, 0, 0, 0);
    put("towerGlass8", "#7fb6de", 0, BRICK_H * 6, 0);
    const top = BRICK_H * 6 + BRICK_H * 12;
    put("p8x8", C.grey, 0, top, 0);
    put("hvac4", C.dark, -2, top + PLATE_H, 2);
    put("antenna1", C.dark, 2, top + PLATE_H, -2);
    return bricks;
  },
});

/* 12 — a level crossing. Road, rail and the furniture around them. */
target({
  id: "crossing",
  name: "Level Crossing",
  brief: "A road crossing a railway, with a signal on one side and a lamp on the other.",
  difficulty: 4,
  seconds: 360,
  build() {
    const { bricks, put } = maker();
    for (let x = -6; x <= 6; x += 4) put("road", C.dark, x, 0, 0);
    for (let z = -6; z <= 6; z += 4) {
      if (Math.abs(z) < 2) continue;
      put("rail", C.grey, 0, 0, z, 90);
    }
    put("signal1", C.dark, -4, PLATE_H, -4);
    put("lampb", C.yellow, 4, PLATE_H, 4);
    for (const z of [-4, 4]) put("barrier4", C.red, 4, PLATE_H, z, 90);
    return bricks;
  },
});

/* 13 — a temple shrine. A plinth, a hall and a spire on the axis. */
target({
  id: "shrine",
  name: "Temple Shrine",
  brief: "A granite spire on a stepped plinth, with a pillared hall in front of it.",
  difficulty: 5,
  seconds: 480,
  build() {
    const { bricks, put } = maker();
    for (let c = 0; c < 2; c++) {
      const s = 6 - c * 2;
      for (let x = -s; x <= s; x += 4) {
        for (let z = -s; z <= s; z += 4) put("p4x4", C.grey, x, c * PLATE_H, z);
      }
    }
    put("shikhara6", C.grey, 0, PLATE_H * 2, -2);
    put("mandapa8", C.tan, 0, PLATE_H * 2, 8);
    for (const x of [-6, 6]) put("lampb", C.yellow, x, PLATE_H * 2, 8);
    return bricks;
  },
});

/* 14 — a fountain court. Four-fold symmetry, which is easy to get almost right. */
target({
  id: "fountain",
  name: "Fountain Court",
  brief: "A fountain in the middle, four green beds on the diagonals, a bench on each side.",
  difficulty: 5,
  seconds: 420,
  build() {
    const { bricks, put } = maker();
    put("fountain4", C.white, 0, 0, 0);
    for (const x of [-6, 6]) {
      for (const z of [-6, 6]) put("parterre8", C.green, x, 0, z);
    }
    put("bench2", C.brown, 0, 0, -6, 90);
    put("bench2", C.brown, 0, 0, 6, 90);
    put("bench2", C.brown, -6, 0, 0);
    put("bench2", C.brown, 6, 0, 0);
    for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) put("lampPost", C.dark, x, 0, z);
    return bricks;
  },
});

/* 15 — a clock tower. The tallest, and the one where a mistake near the bottom
   throws everything above it out of line. */
target({
  id: "clocktower",
  name: "Clock Tower",
  brief: "A tall tan tower banded in white, with a clock near the top and a lamp above it.",
  difficulty: 6,
  seconds: 540,
  build() {
    const { bricks, put } = maker();
    let y = 0;
    for (let band = 0; band < 5; band++) {
      for (let c = 0; c < 3; c++) {
        const yy = y + c * BRICK_H;
        put("b1x4", C.tan, 0, yy, -1.5, 90);
        put("b1x4", C.tan, 0, yy, 1.5, 90);
        put("b1x2", C.tan, -1.5, yy, 0);
        put("b1x2", C.tan, 1.5, yy, 0);
      }
      y += 3 * BRICK_H;
      put("p4x4", C.white, 0, y, 0);
      y += PLATE_H;
    }
    put("clock2", C.dark, 0, y - BRICK_H * 3, -2);
    put("p4x4", C.dark, 0, y, 0);
    put("lampb", C.yellow, 0, y + PLATE_H, 0);
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

/* The server has to be able to re-score a submitted attempt, and it cannot read
   public/ at request time, so the target geometry is emitted here as a module
   the API can import. Same source, one build step, no second copy to drift. */
mkdirSync("db", { recursive: true });
const serverTargets = {};
TARGETS.forEach((t) => { serverTargets[t.id] = { seconds: t.seconds, bricks: t.build() }; });
writeFileSync("db/challenge-targets.json", JSON.stringify(serverTargets));
console.log(`${Object.keys(serverTargets).length} targets written for the server too`);
manifest.forEach((t) =>
  console.log(`${t.id.padEnd(12)} ${String(t.pieces).padStart(3)} pieces  difficulty ${t.difficulty}  ${t.seconds}s  ${t.name}`),
);
