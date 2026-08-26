#!/usr/bin/env python3
"""
Add the pieces the five showcase worlds need.

The catalogue already covers bricks, plates, slopes, roads and a good heritage
set. What it has no way to express is height (a minaret, a tower that reads as
a tower rather than a stack), water, formal planting, and the civic furniture
that makes a station or a plaza look built rather than sketched. Each entry
below is a `T({...})` catalogue line plus one branch in buildGeom.

Everything is original geometry from the primitives already in the file. Run
once; it refuses to run twice.
"""
import io
import sys

SRC = "public/brickforge.html"

CATALOGUE = """
/* --- height, water and planting: the pieces the showcase worlds needed --- */
T({ id:'minaret4', label:'minaret 4×4', w:4, d:4, h:BRICK_H * 18, machine:'minaret', tile:true, cat:'Heritage architecture' });
T({ id:'torana8', label:'ceremonial gateway 2×8', w:2, d:8, h:BRICK_H * 9, machine:'torana', tile:true, cat:'Heritage architecture' });
T({ id:'colonnade8', label:'colonnade 2×8', w:2, d:8, h:BRICK_H * 5, machine:'colonnade', tile:true, cat:'Heritage architecture' });
T({ id:'pavilion6', label:'garden pavilion 6×6', w:6, d:6, h:BRICK_H * 7, machine:'pavilion', tile:true, cat:'Heritage architecture' });
T({ id:'parapet8', label:'carved parapet 1×8', w:1, d:8, h:BRICK_H * 1.3, machine:'parapet', tile:true, cat:'Heritage architecture' });
T({ id:'stepwell8', label:'stepwell 8×8', w:8, d:8, h:BRICK_H * 3, machine:'stepwell', tile:true, cat:'Heritage architecture' });
T({ id:'ghat8', label:'river steps 8×4', w:8, d:4, h:BRICK_H * 2.5, machine:'ghat', tile:true, cat:'Heritage architecture' });
T({ id:'elephant3', label:'ceremonial elephant', w:3, d:5, h:BRICK_H * 4, machine:'elephant', tile:true, cat:'Heritage architecture' });
T({ id:'banner1', label:'banner pole', w:1, d:1, h:BRICK_H * 7, machine:'banner', tile:true, cat:'Heritage architecture' });

T({ id:'pool8', label:'reflecting pool 8×8', w:8, d:8, h:PLATE_H * 2, machine:'pool', tile:true, fixedColor:'#3f8fbf', fixedAlpha:0.78, cat:'Landscape' });
T({ id:'channel8', label:'water channel 2×8', w:2, d:8, h:PLATE_H * 2, machine:'channel', tile:true, fixedColor:'#3f8fbf', fixedAlpha:0.78, cat:'Landscape' });
T({ id:'cypress1', label:'cypress tree', w:1, d:1, h:BRICK_H * 6, machine:'cypress', tile:true, cat:'Landscape' });
T({ id:'palm2', label:'palm tree', w:2, d:2, h:BRICK_H * 7, machine:'palm', tile:true, cat:'Landscape' });
T({ id:'parterre8', label:'formal garden bed 8×8', w:8, d:8, h:PLATE_H * 2, machine:'parterre', tile:true, cat:'Landscape' });

T({ id:'towerGlass8', label:'glass tower 8×8', w:8, d:8, h:BRICK_H * 12, machine:'glasstower', tile:true, cat:'City modules' });
T({ id:'canopy8', label:'station canopy 8×8', w:8, d:8, h:BRICK_H * 4, machine:'canopy', tile:true, cat:'City modules' });
T({ id:'plaza8', label:'plaza paving 8×8', w:8, d:8, h:PLATE_H, machine:'plaza', tile:true, cat:'City modules' });
T({ id:'hvac4', label:'rooftop plant 4×4', w:4, d:4, h:BRICK_H * 1.6, machine:'hvac', tile:true, cat:'City modules' });
T({ id:'antenna1', label:'roof mast', w:1, d:1, h:BRICK_H * 9, machine:'antenna', tile:true, cat:'City modules' });
T({ id:'shopfront4', label:'shopfront 1×4', w:1, d:4, h:BRICK_H * 4, machine:'shopfront', tile:true, cat:'City modules' });
"""

GEOMETRY = """  } else if (t.machine === 'minaret') {
    /* A tapered shaft with two balconies and a capped dome — height the
       catalogue could not previously express in one piece. */
    const r = w / 2 - 0.15;
    const shaftH = h * 0.72;
    const shaft = new THREE.CylinderGeometry(r * 0.62, r, shaftH, 16);
    shaft.translate(0, shaftH / 2, 0);
    parts.push(shaft);
    parts.push(boxAt(w - 0.05, BRICK_H * 0.5, d - 0.05, 0, BRICK_H * 0.25, 0));
    [0.34, 0.62].forEach((f) => {
      const rr = r * (1 - f * 0.36) + 0.34;
      parts.push(ringOf(rr, 0.18, shaftH * f, 0.34, 18));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        parts.push(boxAt(0.13, 0.42, 0.13, Math.cos(a) * rr, shaftH * f + 0.34, Math.sin(a) * rr));
      }
    });
    const capR = r * 0.68, capY = shaftH;
    const capH = Math.min(h - capY - BRICK_H, capR * 1.15);
    parts.push(latheOf(DOME_PROFILE, capR, capH, 20, capY));
    parts.push(latheOf(FINIAL_PROFILE, 0.2, h - capY - capH, 12, capY + capH));
  } else if (t.machine === 'torana') {
    /* Two piers carrying a cusped lintel — the entrance a walled complex needs. */
    const pierW = w - 0.06, pierD = 1.3, legH = h * 0.66;
    [-1, 1].forEach((k) => {
      parts.push(boxAt(pierW, legH, pierD, 0, legH / 2, k * (d / 2 - pierD / 2)));
      parts.push(boxAt(pierW + 0.3, 0.3, pierD + 0.3, 0, 0.15, k * (d / 2 - pierD / 2)));
      parts.push(boxAt(pierW + 0.26, 0.26, pierD + 0.26, 0, legH - 0.13, k * (d / 2 - pierD / 2)));
    });
    const span = d - pierD * 2, cusps = 7;
    for (let i = 0; i < cusps; i++) {
      const f = (i + 0.5) / cusps;
      const z = -span / 2 + f * span;
      const lift = Math.sin(f * Math.PI) * BRICK_H * 1.5;
      parts.push(boxAt(pierW * 0.86, BRICK_H * 0.6 + lift, span / cusps + 0.02, 0, legH + (BRICK_H * 0.6 + lift) / 2, z));
    }
    parts.push(boxAt(pierW + 0.4, 0.34, d - 0.04, 0, legH + BRICK_H * 2.2, 0));
    parts.push(boxAt(pierW, BRICK_H * 0.9, d - 1.6, 0, legH + BRICK_H * 2.8, 0));
    parts.push(latheOf(FINIAL_PROFILE, 0.3, h - legH - BRICK_H * 3.3, 12, legH + BRICK_H * 3.3));
  } else if (t.machine === 'colonnade') {
    /* Four columns and an architrave, so a courtyard edge is one placement. */
    const plinth = BRICK_H * 0.4;
    parts.push(boxAt(w - 0.04, plinth, d - 0.04, 0, plinth / 2, 0));
    const colH = h - plinth - BRICK_H * 0.8;
    for (let i = 0; i < 4; i++) {
      const z = -d / 2 + 1 + (i / 3) * (d - 2);
      parts.push(columnAt(0.34, colH, plinth, 0, z));
    }
    parts.push(boxAt(w - 0.04, BRICK_H * 0.45, d - 0.04, 0, h - BRICK_H * 0.62, 0));
    parts.push(boxAt(w + 0.16, BRICK_H * 0.28, d + 0.1, 0, h - BRICK_H * 0.14, 0));
  } else if (t.machine === 'pavilion') {
    const deck = BRICK_H * 0.5, colH = h * 0.44, inset = w / 2 - 0.85;
    parts.push(boxAt(w - 0.02, deck, d - 0.02, 0, deck / 2, 0));
    [[-inset, -inset], [inset, -inset], [-inset, inset], [inset, inset]].forEach(([x, z]) => {
      parts.push(columnAt(0.3, colH, deck, x, z));
    });
    parts.push(boxAt(w - 0.2, 0.3, d - 0.2, 0, deck + colH + 0.15, 0));
    /* a square tiered roof rather than a dome, so it reads apart from a chhatri */
    const roofY = deck + colH + 0.3;
    const tiers = 4, roofH = h - roofY - BRICK_H * 0.9;
    for (let i = 0; i < tiers; i++) {
      const f = i / tiers, s = 1 - f * 0.78;
      parts.push(boxAt((w - 0.1) * s, roofH / tiers + 0.04, (d - 0.1) * s, 0, roofY + f * roofH + roofH / tiers / 2, 0));
    }
    parts.push(latheOf(FINIAL_PROFILE, 0.24, BRICK_H * 0.9, 12, roofY + roofH));
  } else if (t.machine === 'parapet') {
    const th = w - 0.08;
    parts.push(boxAt(th, 0.26, d - 0.02, 0, 0.13, 0));
    parts.push(boxAt(th + 0.14, 0.24, d - 0.02, 0, h - 0.12, 0));
    const n = Math.max(4, Math.round(d * 1.2));
    for (let i = 0; i < n; i++) {
      const z = -d / 2 + (i + 0.5) * (d / n);
      const bal = new THREE.CylinderGeometry(th * 0.3, th * 0.38, h - 0.5, 8);
      bal.translate(0, 0.26 + (h - 0.5) / 2, z);
      parts.push(bal);
    }
  } else if (t.machine === 'stepwell') {
    /* Concentric square frames, tallest on the outside, so it reads as a pit
       stepping down to a small floor while still being built upward. */
    const tiers = 4;
    const frame = (side, y, height) => {
      const wall = side * 0.16;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ax, az]) => {
        parts.push(boxAt(ax ? wall : side, height, az ? wall : side,
          ax * (side / 2 - wall / 2), y + height / 2, az * (side / 2 - wall / 2)));
      });
    };
    for (let i = 0; i < tiers; i++) {
      const f = i / tiers;
      frame((w - 0.06) * (1 - f * 0.2), 0, h * (1 - f * 0.24));
    }
    parts.push(boxAt(w * 0.26, h * 0.14, d * 0.26, 0, h * 0.07, 0));
  } else if (t.machine === 'ghat') {
    const treads = 6;
    for (let i = 0; i < treads; i++) {
      const f = i / treads;
      parts.push(boxAt(w - 0.04, h * (1 - f), (d - 0.04) / treads + 0.02, 0, h * (1 - f) / 2, -d / 2 + (i + 0.5) * (d / treads)));
    }
  } else if (t.machine === 'elephant') {
    /* Stylised and blocky on purpose — a silhouette for a procession, not a model. */
    const bodyH = h * 0.42;
    parts.push(boxAt(w - 0.5, bodyH, d * 0.62, 0, h * 0.5, -d * 0.05));
    parts.push(boxAt(w - 0.9, h * 0.3, d * 0.26, 0, h * 0.62, d * 0.34));
    [-1, 1].forEach((k) => {
      parts.push(boxAt(0.12, h * 0.24, d * 0.2, k * (w * 0.4), h * 0.66, d * 0.32));
      [0.24, -0.24].forEach((zf) => {
        parts.push(boxAt(w * 0.2, h * 0.3, w * 0.2, k * (w * 0.26), h * 0.15, zf * d));
      });
    });
    for (let i = 0; i < 4; i++) {
      const f = i / 4;
      parts.push(boxAt(w * 0.16 * (1 - f * 0.4), h * 0.12, w * 0.16 * (1 - f * 0.4), 0, h * 0.5 - f * h * 0.12, d * 0.46 + f * d * 0.05));
    }
    parts.push(boxAt(w - 0.4, h * 0.08, d * 0.5, 0, h * 0.72, -d * 0.05));
  } else if (t.machine === 'banner') {
    const pole = new THREE.CylinderGeometry(0.09, 0.11, h, 10);
    pole.translate(0, h / 2, 0);
    parts.push(pole);
    parts.push(boxAt(0.5, 0.2, 0.5, 0, 0.1, 0));
    parts.push(boxAt(0.06, h * 0.36, 1.5, 0.28, h * 0.74, 0.75));
    parts.push(latheOf(FINIAL_PROFILE, 0.14, BRICK_H * 0.7, 10, h - BRICK_H * 0.7));
  } else if (t.machine === 'pool' || t.machine === 'channel') {
    const rim = 0.34;
    parts.push(boxAt(w - 0.04, h * 0.62, d - 0.04, 0, h * 0.31, 0));
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ax, az]) => {
      parts.push(boxAt(ax ? rim : w - 0.04, h, az ? rim : d - 0.04,
        ax * (w / 2 - rim / 2 - 0.02), h / 2, az * (d / 2 - rim / 2 - 0.02)));
    });
  } else if (t.machine === 'cypress') {
    const trunk = new THREE.CylinderGeometry(0.1, 0.14, h * 0.16, 8);
    trunk.translate(0, h * 0.08, 0);
    parts.push(trunk);
    for (let i = 0; i < 4; i++) {
      const f = i / 4;
      const cone = new THREE.CylinderGeometry((0.44 - f * 0.34) * w, (0.5 - f * 0.3) * w, h * 0.24, 12);
      cone.translate(0, h * (0.16 + f * 0.21) + h * 0.12, 0);
      parts.push(cone);
    }
  } else if (t.machine === 'palm') {
    const seg = 5;
    for (let i = 0; i < seg; i++) {
      const f = i / seg;
      const s = new THREE.CylinderGeometry(0.16, 0.2, h * 0.62 / seg + 0.04, 8);
      s.translate(Math.sin(f * 1.5) * 0.28, h * 0.62 * (f + 0.5) / seg, 0);
      parts.push(s);
    }
    const topX = Math.sin(1.5) * 0.28, topY = h * 0.62;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const frond = new THREE.SphereGeometry(0.5, 8, 6);
      frond.scale(1.9, 0.16, 0.5);
      frond.rotateY(-a);
      frond.translate(topX + Math.cos(a) * 1.15, topY + h * 0.1 - (i % 2) * 0.18, Math.sin(a) * 1.15);
      parts.push(frond);
    }
    parts.push(boxAt(0.5, 0.24, 0.5, topX, topY, 0));
  } else if (t.machine === 'parterre') {
    parts.push(boxAt(w - 0.04, h * 0.5, d - 0.04, 0, h * 0.25, 0));
    const cells = 3;
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const x = -w / 2 + (i + 0.5) * (w / cells);
        const z = -d / 2 + (j + 0.5) * (d / cells);
        parts.push(boxAt(w / cells - 0.5, h * 0.8, d / cells - 0.5, x, h * 0.4, z));
        if ((i + j) % 2 === 0) {
          const bud = new THREE.SphereGeometry(0.3, 8, 6);
          bud.scale(1, 0.7, 1);
          bud.translate(x, h * 0.8 + 0.14, z);
          parts.push(bud);
        }
      }
    }
  } else if (t.machine === 'glasstower') {
    /* A whole tower in one piece: core, curtain wall, floor bands, crown. */
    parts.push(boxAt(w - 0.5, h, d - 0.5, 0, h / 2, 0));
    const bands = Math.round(h / BRICK_H);
    for (let i = 1; i < bands; i++) {
      parts.push(boxAt(w - 0.02, 0.14, d - 0.02, 0, i * (h / bands), 0));
    }
    [-1, 1].forEach((k) => {
      parts.push(boxAt(0.3, h, d - 0.02, k * (w / 2 - 0.15), h / 2, 0));
      parts.push(boxAt(w - 0.02, h, 0.3, 0, h / 2, k * (d / 2 - 0.15)));
    });
    parts.push(boxAt(w + 0.2, BRICK_H * 0.4, d + 0.2, 0, h - BRICK_H * 0.2, 0));
    parts.push(boxAt(w - 2.4, BRICK_H * 0.7, d - 2.4, 0, h + BRICK_H * 0.35, 0));
  } else if (t.machine === 'canopy') {
    const postH = h - BRICK_H * 1.2, inset = w / 2 - 0.7;
    [[-inset, -inset], [inset, -inset], [-inset, inset], [inset, inset]].forEach(([x, z]) => {
      const p = new THREE.CylinderGeometry(0.16, 0.2, postH, 10);
      p.translate(x, postH / 2, z);
      parts.push(p);
    });
    parts.push(boxAt(w - 0.4, 0.22, d - 0.4, 0, postH + 0.11, 0));
    /* a shallow barrel roof, so a platform is not just a flat slab */
    const ribs = 9;
    for (let i = 0; i < ribs; i++) {
      const f = (i + 0.5) / ribs;
      const lift = Math.sin(f * Math.PI) * BRICK_H * 0.75;
      parts.push(boxAt(w + 0.3, 0.2, (d + 0.3) / ribs + 0.02, 0, postH + 0.3 + lift, -d / 2 + f * d));
    }
  } else if (t.machine === 'plaza') {
    parts.push(boxAt(w - 0.04, h * 0.7, d - 0.04, 0, h * 0.35, 0));
    const cells = 4;
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        if ((i + j) % 2) continue;
        parts.push(boxAt(w / cells - 0.16, h, d / cells - 0.16,
          -w / 2 + (i + 0.5) * (w / cells), h * 0.5, -d / 2 + (j + 0.5) * (d / cells)));
      }
    }
  } else if (t.machine === 'hvac') {
    parts.push(boxAt(w - 0.2, h * 0.2, d - 0.2, 0, h * 0.1, 0));
    parts.push(boxAt(w * 0.5, h * 0.8, d * 0.42, -w * 0.2, h * 0.5, -d * 0.2));
    parts.push(boxAt(w * 0.3, h * 0.55, d * 0.3, w * 0.26, h * 0.38, d * 0.22));
    const fan = new THREE.CylinderGeometry(w * 0.16, w * 0.16, h * 0.3, 12);
    fan.translate(w * 0.26, h * 0.8, -d * 0.24);
    parts.push(fan);
    for (let i = 0; i < 4; i++) {
      parts.push(boxAt(w * 0.5, 0.08, 0.09, -w * 0.2, h * 0.28 + i * h * 0.13, -d * 0.42));
    }
  } else if (t.machine === 'antenna') {
    const mast = new THREE.CylinderGeometry(0.05, 0.13, h, 8);
    mast.translate(0, h / 2, 0);
    parts.push(mast);
    parts.push(boxAt(0.7, 0.24, 0.7, 0, 0.12, 0));
    [0.3, 0.55, 0.78].forEach((f) => parts.push(boxAt(0.5, 0.09, 0.5, 0, h * f, 0)));
    const lamp = new THREE.SphereGeometry(0.11, 8, 6);
    lamp.translate(0, h - 0.1, 0);
    parts.push(lamp);
  } else if (t.machine === 'shopfront') {
    const th = w - 0.06;
    parts.push(boxAt(th, h, d - 0.02, 0, h / 2, 0));
    /* recessed window and a striped awning over the pavement */
    parts.push(boxAt(th + 0.16, h * 0.42, d - 1.1, 0, h * 0.34, 0));
    const ribs = 7;
    for (let i = 0; i < ribs; i++) {
      const f = (i + 0.5) / ribs;
      parts.push(boxAt(1.5, 0.16, (d - 0.6) / ribs + 0.02, th / 2 + 0.6, h * 0.72, -d / 2 + 0.3 + f * (d - 0.6)));
    }
    parts.push(boxAt(1.7, 0.2, d - 0.4, th / 2 + 0.7, h * 0.7, 0));
    parts.push(boxAt(th + 0.1, 0.22, d - 0.02, 0, h - 0.11, 0));
"""


def main():
    src = io.open(SRC, encoding="utf-8").read()
    if "id:'minaret4'" in src:
        print("already applied — nothing to do")
        return 0

    anchor_cat = "T({ id:'jharokha2', label:'balcony 2×2', w:2, d:2, h:BRICK_H * 3, machine:'jharokha', tile:true, cat:'Heritage architecture' });"
    if src.count(anchor_cat) != 1:
        print("catalogue anchor not found exactly once", file=sys.stderr)
        return 1
    src = src.replace(anchor_cat, anchor_cat + "\n" + CATALOGUE.strip() + "\n", 1)

    anchor_geom = "  } else if (t.wedge) {"
    if src.count(anchor_geom) != 1:
        print("geometry anchor not found exactly once", file=sys.stderr)
        return 1
    src = src.replace(anchor_geom, GEOMETRY.rstrip() + "\n" + anchor_geom, 1)

    io.open(SRC, "w", encoding="utf-8").write(src)
    print("added 20 piece types")
    return 0


if __name__ == "__main__":
    sys.exit(main())
