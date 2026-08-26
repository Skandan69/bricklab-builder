#!/usr/bin/env python3
"""
Add the monumental heritage pieces the big Indian city needs.

The catalogue can already do domes, chhatris, jali and fort walls. What it
cannot do is *height with silhouette* — a gopuram, a shikhara, a pillared
hall, a temple tank — and those are exactly the forms that make a heritage
city read as one rather than as a walled compound with extra bricks.

Every piece here goes into the same TYPES catalogue the player's palette is
built from, so anything used in a showcase world is a piece anyone can place.

Run once; it refuses to run twice.
"""
import io
import sys

SRC = "public/brickforge.html"

CATALOGUE = """
/* --- monumental heritage: the forms a temple city is made of --- */
T({ id:'gopuram8', label:'gopuram gate tower 8×6', w:8, d:6, h:BRICK_H * 20, machine:'gopuram', tile:true, cat:'Heritage architecture' });
T({ id:'shikhara6', label:'temple spire 6×6', w:6, d:6, h:BRICK_H * 14, machine:'shikhara', tile:true, cat:'Heritage architecture' });
T({ id:'mandapa8', label:'pillared hall 8×8', w:8, d:8, h:BRICK_H * 6, machine:'mandapa', tile:true, cat:'Heritage architecture' });
T({ id:'templeTank8', label:'temple tank 8×8', w:8, d:8, h:BRICK_H * 2.6, machine:'tank', tile:true, cat:'Heritage architecture' });
T({ id:'haveli4', label:'haveli front 1×4', w:1, d:4, h:BRICK_H * 6, machine:'haveli', tile:true, cat:'Heritage architecture' });
T({ id:'victoryTower4', label:'victory tower 4×4', w:4, d:4, h:BRICK_H * 15, machine:'victory', tile:true, cat:'Heritage architecture' });
T({ id:'marketStall4', label:'market stall 4×4', w:4, d:4, h:BRICK_H * 4, machine:'stall', tile:true, cat:'Heritage architecture' });
T({ id:'templeChariot3', label:'temple chariot', w:3, d:4, h:BRICK_H * 8, machine:'ratha', tile:true, cat:'Heritage transport' });
"""

GEOMETRY = """  } else if (t.machine === 'gopuram') {
    /* A tapering stack of tiers over a gate, each tier set back and ridged,
       crowned with a barrel vault and pot finials — the tallest thing in a
       temple city and the reason it reads as one from a distance. */
    const baseH = h * 0.22;
    parts.push(boxAt(w - 0.04, baseH, d - 0.04, 0, baseH / 2, 0));
    // the gate opening, cut by building the jambs rather than the whole wall
    parts.push(boxAt(w * 0.26, baseH, d - 0.04, -w * 0.37, baseH / 2, 0));
    parts.push(boxAt(w * 0.26, baseH, d - 0.04, w * 0.37, baseH / 2, 0));
    parts.push(boxAt(w - 0.04, baseH * 0.28, d - 0.04, 0, baseH * 0.86, 0));
    const tiers = 7, topY = h * 0.9, span = topY - baseH;
    for (let i = 0; i < tiers; i++) {
      const f = i / tiers;
      const sw = (w - 0.04) * (1 - f * 0.62);
      const sd = (d - 0.04) * (1 - f * 0.55);
      const y = baseH + f * span;
      const th = span / tiers;
      parts.push(boxAt(sw, th * 0.78, sd, 0, y + th * 0.39, 0));
      parts.push(boxAt(sw + 0.34, th * 0.2, sd + 0.34, 0, y + th * 0.88, 0));
      // little shrine cells along the front of every tier
      const cells = Math.max(2, 5 - i);
      for (let c = 0; c < cells; c++) {
        const cx = -sw / 2 + (c + 0.5) * (sw / cells);
        parts.push(boxAt(sw / cells * 0.5, th * 0.42, 0.3, cx, y + th * 0.4, sd / 2 + 0.1));
        parts.push(boxAt(sw / cells * 0.5, th * 0.42, 0.3, cx, y + th * 0.4, -sd / 2 - 0.1));
      }
    }
    // the barrel-vaulted crown
    const crownW = (w - 0.04) * 0.4, crownD = (d - 0.04) * 0.48;
    const ribs = 7, crownH = h - topY;
    for (let i = 0; i < ribs; i++) {
      const f = (i + 0.5) / ribs;
      const lift = Math.sin(f * Math.PI) * crownH * 0.7;
      parts.push(boxAt(crownW, crownH * 0.3 + lift, crownD / ribs + 0.02, 0, topY + (crownH * 0.3 + lift) / 2, -crownD / 2 + f * crownD));
    }
    for (const kx of [-1, 0, 1]) {
      parts.push(latheOf(FINIAL_PROFILE, 0.26, crownH * 0.5, 12, topY + crownH * 0.5));
      parts.push(boxAt(0.36, crownH * 0.5, 0.36, kx * crownW * 0.42, topY + crownH * 0.5, 0));
    }
  } else if (t.machine === 'shikhara') {
    /* A curvilinear spire: square courses shrinking on a curve, ribbed at the
       corners, capped with the ribbed disc and pot that finish one. */
    const baseH = h * 0.24;
    parts.push(boxAt(w - 0.04, baseH, d - 0.04, 0, baseH / 2, 0));
    parts.push(boxAt(w + 0.24, baseH * 0.16, d + 0.24, 0, baseH * 0.92, 0));
    const courses = 14, towerH = h * 0.56;
    for (let i = 0; i < courses; i++) {
      const f = i / courses;
      const curve = Math.pow(f, 1.45);            // slow at the base, fast at the top
      const s = 1 - curve * 0.74;
      const y = baseH + f * towerH;
      parts.push(boxAt((w - 0.1) * s, towerH / courses + 0.03, (d - 0.1) * s, 0, y + towerH / courses / 2, 0));
      // corner ribs, which is what makes a shikhara read as curved not stepped
      for (const kx of [-1, 1]) {
        for (const kz of [-1, 1]) {
          parts.push(boxAt(0.3, towerH / courses + 0.05, 0.3,
            kx * (w - 0.1) * s * 0.42, y + towerH / courses / 2, kz * (d - 0.1) * s * 0.42));
        }
      }
    }
    const capY = baseH + towerH;
    const amalaka = new THREE.CylinderGeometry(w * 0.22, w * 0.19, h * 0.07, 16);
    amalaka.translate(0, capY + h * 0.035, 0);
    parts.push(amalaka);
    parts.push(ringOf(w * 0.23, 0.13, capY, h * 0.07, 16));
    parts.push(latheOf(FINIAL_PROFILE, w * 0.13, h - capY - h * 0.07, 14, capY + h * 0.07));
  } else if (t.machine === 'mandapa') {
    /* An open pillared hall: a grid of columns on a plinth under a flat,
       corbelled roof. Placed in a row it becomes a colonnaded street. */
    const plinth = BRICK_H * 0.7;
    parts.push(boxAt(w - 0.04, plinth, d - 0.04, 0, plinth / 2, 0));
    parts.push(boxAt(w + 0.2, plinth * 0.3, d + 0.2, 0, plinth * 0.15, 0));
    const colH = h - plinth - BRICK_H * 1.3;
    const n = 3;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === 1 && j === 1) continue;         // leave the centre open
        const x = -(w - 2.6) / 2 + i * ((w - 2.6) / (n - 1));
        const z = -(d - 2.6) / 2 + j * ((d - 2.6) / (n - 1));
        parts.push(columnAt(0.32, colH, plinth, x, z));
        // corbel brackets under the beam
        parts.push(boxAt(0.9, 0.22, 0.26, x, plinth + colH - 0.11, z));
        parts.push(boxAt(0.26, 0.22, 0.9, x, plinth + colH - 0.11, z));
      }
    }
    const beam = plinth + colH;
    parts.push(boxAt(w - 0.04, BRICK_H * 0.5, d - 0.04, 0, beam + BRICK_H * 0.25, 0));
    parts.push(boxAt(w + 0.5, BRICK_H * 0.3, d + 0.5, 0, beam + BRICK_H * 0.65, 0));
    parts.push(boxAt(w - 1.6, BRICK_H * 0.3, d - 1.6, 0, beam + BRICK_H * 0.95, 0));
  } else if (t.machine === 'tank') {
    /* A stepped bathing tank: a square of descending treads with water at the
       bottom. Wider and shallower than the stepwell, and it holds water. */
    const treads = 4;
    for (let i = 0; i < treads; i++) {
      const f = i / treads;
      const side = (w - 0.04) * (1 - f * 0.22);
      const wall = side * 0.11 + 0.24;
      const height = h * (1 - f * 0.26);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ax, az]) => {
        parts.push(boxAt(ax ? wall : side, height, az ? wall : side,
          ax * (side / 2 - wall / 2), height / 2, az * (side / 2 - wall / 2)));
      });
    }
    parts.push(boxAt(w * 0.42, h * 0.3, d * 0.42, 0, h * 0.15, 0));
    // a shrine on a pillar in the middle, the way these tanks usually have
    parts.push(boxAt(0.5, h * 0.8, 0.5, 0, h * 0.4, 0));
    parts.push(boxAt(1.5, h * 0.16, 1.5, 0, h * 0.86, 0));
    parts.push(latheOf(DOME_PROFILE, 0.7, h * 0.4, 14, h * 0.94));
  } else if (t.machine === 'haveli') {
    /* A townhouse front: arched ground floor, a projecting carved balcony
       above, a bracketed eave. A row of them is a heritage street. */
    const th = w - 0.06;
    parts.push(boxAt(th, h, d - 0.02, 0, h / 2, 0));
    const archH = h * 0.3;
    for (let i = 0; i < 2; i++) {
      const z = -d / 2 + (i + 0.5) * (d / 2);
      parts.push(boxAt(th + 0.14, archH * 0.7, d / 2 - 0.8, 0, archH * 0.45, z));
    }
    // the jharokha: a bay window on brackets
    parts.push(boxAt(th + 1.0, h * 0.26, d * 0.55, th * 0.5, h * 0.55, 0));
    for (const oz of [-1, 1]) {
      parts.push(boxAt(0.8, 0.26, 0.26, th * 0.5, h * 0.41, oz * d * 0.22));
    }
    const bal = 5;
    for (let i = 0; i < bal; i++) {
      const z = -d * 0.27 + (i + 0.5) * (d * 0.54 / bal);
      parts.push(boxAt(0.16, h * 0.14, 0.16, th * 0.5 + 0.45, h * 0.72, z));
    }
    parts.push(boxAt(th + 1.2, 0.22, d * 0.6, th * 0.5, h * 0.8, 0));
    // bracketed eave and a parapet
    for (let i = 0; i < 4; i++) {
      const z = -d / 2 + (i + 0.5) * (d / 4);
      parts.push(boxAt(th + 0.7, 0.2, 0.24, th * 0.35, h * 0.9, z));
    }
    parts.push(boxAt(th + 0.9, 0.28, d - 0.02, th * 0.2, h - 0.14, 0));
  } else if (t.machine === 'victory') {
    /* A free-standing commemorative tower: a fluted shaft in bands, a gallery
       partway up, an open cupola on top. */
    const baseH = h * 0.1;
    parts.push(boxAt(w - 0.02, baseH, d - 0.02, 0, baseH / 2, 0));
    parts.push(boxAt(w + 0.4, baseH * 0.3, d + 0.4, 0, baseH * 0.15, 0));
    const shaftH = h * 0.66, bands = 6;
    for (let i = 0; i < bands; i++) {
      const f = i / bands;
      const r = (w / 2 - 0.3) * (1 - f * 0.28);
      const seg = new THREE.CylinderGeometry(r * 0.94, r, shaftH / bands, 12);
      seg.translate(0, baseH + f * shaftH + shaftH / bands / 2, 0);
      parts.push(seg);
      parts.push(ringOf(r + 0.1, 0.14, baseH + f * shaftH, 0.22, 12));
      // niches around each band
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + f;
        parts.push(boxAt(0.34, shaftH / bands * 0.45, 0.34,
          Math.cos(a) * r, baseH + f * shaftH + shaftH / bands * 0.5, Math.sin(a) * r));
      }
    }
    const galY = baseH + shaftH;
    parts.push(ringOf(w * 0.42, 0.2, galY, 0.4, 16));
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      parts.push(boxAt(0.14, 0.5, 0.14, Math.cos(a) * w * 0.42, galY + 0.4, Math.sin(a) * w * 0.42));
    }
    parts.push(boxAt(w * 0.9, 0.24, d * 0.9, 0, galY + 0.95, 0));
    const capH = h - galY - 1.1;
    parts.push(latheOf(DOME_PROFILE, w * 0.3, capH * 0.7, 16, galY + 1.1));
    parts.push(latheOf(FINIAL_PROFILE, 0.18, capH * 0.3, 12, galY + 1.1 + capH * 0.7));
  } else if (t.machine === 'stall') {
    /* A bazaar stall: a counter, a sloping cloth awning on poles, and goods
       piled on top. Placed in a row it makes a market street. */
    parts.push(boxAt(w - 0.4, h * 0.34, d - 0.6, 0, h * 0.17, 0));
    parts.push(boxAt(w - 0.1, 0.2, d - 0.3, 0, h * 0.36, 0));
    for (const kx of [-1, 1]) {
      for (const kz of [-1, 1]) {
        const pole = new THREE.CylinderGeometry(0.11, 0.13, h * 0.9, 8);
        pole.translate(kx * (w / 2 - 0.35), h * 0.45, kz * (d / 2 - 0.35));
        parts.push(pole);
      }
    }
    const ribs = 6;
    for (let i = 0; i < ribs; i++) {
      const f = (i + 0.5) / ribs;
      parts.push(boxAt(w + 0.5, 0.16, (d + 0.5) / ribs + 0.02, 0, h * 0.9 + f * h * 0.12, -d / 2 + f * d));
    }
    // goods on the counter
    for (let i = 0; i < 3; i++) {
      const s = new THREE.SphereGeometry(0.3, 8, 6);
      s.scale(1, 0.7, 1);
      s.translate(-w * 0.26 + i * (w * 0.26), h * 0.44, 0);
      parts.push(s);
    }
    parts.push(boxAt(w * 0.34, h * 0.16, d * 0.3, w * 0.2, h * 0.44, -d * 0.2));
  } else if (t.machine === 'ratha') {
    /* A festival temple chariot: a wheeled platform under a tiered tower. */
    const wheelR = h * 0.11;
    for (const kx of [-1, 1]) {
      for (const kz of [-1, 1]) {
        const wheel = new THREE.CylinderGeometry(wheelR, wheelR, 0.22, 14);
        wheel.rotateZ(Math.PI / 2);
        wheel.translate(kx * (w / 2 - 0.1), wheelR, kz * (d / 2 - 0.8));
        parts.push(wheel);
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI;
          parts.push(boxAt(0.24, wheelR * 1.7, 0.12, kx * (w / 2 - 0.1), wheelR, kz * (d / 2 - 0.8)));
        }
      }
    }
    const deck = wheelR * 2;
    parts.push(boxAt(w - 0.1, BRICK_H * 0.5, d - 0.1, 0, deck + BRICK_H * 0.25, 0));
    parts.push(boxAt(w + 0.3, 0.2, d + 0.3, 0, deck + BRICK_H * 0.55, 0));
    const towerY = deck + BRICK_H * 0.65, towerH = h - towerY - BRICK_H;
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const f = i / tiers, s = 1 - f * 0.6;
      parts.push(boxAt((w - 0.3) * s, towerH / tiers * 0.8, (d - 0.3) * s, 0, towerY + f * towerH + towerH / tiers * 0.4, 0));
      parts.push(boxAt((w - 0.3) * s + 0.3, towerH / tiers * 0.2, (d - 0.3) * s + 0.3, 0, towerY + f * towerH + towerH / tiers * 0.9, 0));
    }
    parts.push(latheOf(FINIAL_PROFILE, 0.24, BRICK_H, 12, towerY + towerH));
    // the draw pole at the front
    parts.push(boxAt(0.24, 0.24, d * 0.5, 0, deck + 0.2, d * 0.7));
"""


def main():
    src = io.open(SRC, encoding="utf-8").read()
    if "id:'gopuram8'" in src:
        print("already applied — nothing to do")
        return 0

    anchor_cat = "T({ id:'shopfront4', label:'shopfront 1×4', w:1, d:4, h:BRICK_H * 4, machine:'shopfront', tile:true, cat:'City modules' });"
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
    print("added 8 monumental heritage pieces")
    return 0


if __name__ == "__main__":
    sys.exit(main())
