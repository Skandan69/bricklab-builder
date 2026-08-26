/**
 * How close is this build to the target?
 *
 * Comparing two brick models is not string equality — a player who builds the
 * right thing one stud to the left, or facing the other way, has built the
 * right thing. So the comparison is:
 *
 *   1. voxelise    every brick becomes the cells it occupies, at stud
 *                  resolution across and plate resolution up
 *   2. normalise   both models move to their own bounding-box corner
 *   3. align       try all four quarter-turns and a small nudge in each
 *                  direction, keep whichever fits best
 *   4. score       shape first, piece and colour as bonuses on top
 *
 * Shape is Jaccard overlap — the cells both models share, over the cells
 * either uses. That matters: scoring shared-over-target would give 100% to
 * anyone who buried the target inside a huge block of bricks. Under Jaccard,
 * building too much costs exactly as much as building too little.
 *
 *   score = shape × (0.80 + 0.12 × pieceMatch + 0.08 × colourMatch)
 *
 * so a perfect silhouette in the wrong pieces and colours still scores 80,
 * and only an exact copy reaches 100.
 *
 * The bottom layer is ignored on both sides. A ground plate is 64 cells where
 * a wall brick is 24, so counting the floor made laying a baseplate worth ~39%
 * of a small house before a single wall went up — the easiest part of the build
 * paying the most. The plot supplies the ground; the challenge is what you put
 * on it. One rule, and it is easy to tell a player: the floor does not count.
 *
 * Dimensions come from the caller, because the piece catalogue lives in the
 * builder and this file should not carry a second copy of it that can drift.
 *
 *   BrickLabScore.compare(targetBricks, attemptBricks, TYPE_BY_ID)
 */
(function (global) {
  'use strict';

  var PLATE_H = 0.4;         // the shortest piece, and so the vertical unit
  var NUDGE = 2;             // studs of translation searched in x and z
  var LIFT = 1;              // plate layers searched up and down

  /** Yaw in quarter-turns, read out of the quaternion the builder stores. */
  function quarterTurns(q) {
    if (!q || q.length !== 4) return 0;
    var yaw = 2 * Math.atan2(q[1] || 0, q[3] === undefined ? 1 : q[3]);
    var turns = Math.round(yaw / (Math.PI / 2)) % 4;
    return (turns + 4) % 4;
  }

  /**
   * The cells one brick fills. Pieces are placed by their centre in x and z
   * and by their underside in y, which is what the builder's own placement
   * code assumes.
   */
  function cellsOf(brick, types) {
    var t = (types && types[brick.typeId]) || null;
    var w = t && t.w ? t.w : 1;
    var d = t && t.d ? t.d : 1;
    var h = t && t.h ? t.h : PLATE_H;
    if (quarterTurns(brick.q) % 2 === 1) { var s = w; w = d; d = s; }

    var out = [];
    var x0 = Math.round(brick.p[0] - w / 2);
    var z0 = Math.round(brick.p[2] - d / 2);
    var y0 = Math.round(brick.p[1] / PLATE_H);
    var layers = Math.max(1, Math.round(h / PLATE_H));
    for (var i = 0; i < w; i++) {
      for (var j = 0; j < d; j++) {
        for (var k = 0; k < layers; k++) out.push([x0 + i, y0 + k, z0 + j]);
      }
    }
    return out;
  }

  /** A model becomes a map of cell -> what fills it. First brick wins a cell. */
  function voxelise(bricks, types, keepGround) {
    var map = new Map();
    var minX = Infinity, minY = Infinity, minZ = Infinity;
    for (var b = 0; b < bricks.length; b++) {
      var brick = bricks[b];
      if (!brick || !brick.p || brick.p.length !== 3) continue;
      var cells = cellsOf(brick, types);
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        var key = cell[0] + ',' + cell[1] + ',' + cell[2];
        if (map.has(key)) continue;
        map.set(key, { x: cell[0], y: cell[1], z: cell[2], type: brick.typeId, color: (brick.color || '').toLowerCase() });
        if (cell[0] < minX) minX = cell[0];
        if (cell[1] < minY) minY = cell[1];
        if (cell[2] < minZ) minZ = cell[2];
      }
    }
    if (!map.size) return { cells: [], index: new Map(), floor: 0 };

    /* Move to the model's own corner so two builds made in different parts of
       the plot can still be compared, and drop the floor unless asked to keep
       it — see the note at the top of the file. */
    var cells = [], index = new Map(), floor = 0;
    map.forEach(function (v) {
      var nx = v.x - minX, ny = v.y - minY, nz = v.z - minZ;
      if (!keepGround && ny === 0) { floor++; return; }
      var entry = { x: nx, y: ny, z: nz, type: v.type, color: v.color };
      cells.push(entry);
      index.set(nx + ',' + ny + ',' + nz, entry);
    });
    /* Re-seat on the lowest surviving layer so a target authored on a plate and
       an attempt built straight on the ground still line up. */
    if (cells.length) {
      var lift = Infinity;
      for (var q = 0; q < cells.length; q++) if (cells[q].y < lift) lift = cells[q].y;
      if (lift > 0) {
        index.clear();
        for (var r = 0; r < cells.length; r++) {
          cells[r].y -= lift;
          index.set(cells[r].x + ',' + cells[r].y + ',' + cells[r].z, cells[r]);
        }
      }
    }
    return { cells: cells, index: index, floor: floor };
  }

  /** Rotate a normalised cell list by whole quarter-turns about Y. */
  function turn(cells, turns) {
    if (!turns) return cells;
    var out = new Array(cells.length);
    var minX = Infinity, minZ = Infinity;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i], x = c.x, z = c.z, nx, nz;
      if (turns === 1) { nx = c.z; nz = -c.x; }
      else if (turns === 2) { nx = -c.x; nz = -c.z; }
      else { nx = -c.z; nz = c.x; }
      out[i] = { x: nx, y: c.y, z: nz, type: c.type, color: c.color };
      if (nx < minX) minX = nx;
      if (nz < minZ) minZ = nz;
    }
    for (var j = 0; j < out.length; j++) { out[j].x -= minX; out[j].z -= minZ; }
    return out;
  }

  function overlapAt(cells, index, dx, dy, dz) {
    var shared = 0, piece = 0, colour = 0;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var hit = index.get((c.x + dx) + ',' + (c.y + dy) + ',' + (c.z + dz));
      if (!hit) continue;
      shared++;
      if (hit.type === c.type) piece++;
      if (hit.color === c.color) colour++;
    }
    return { shared: shared, piece: piece, colour: colour };
  }

  /**
   * Compare an attempt against a target.
   *
   * Returns percentages plus the raw cell counts, so a UI can say "you placed
   * 240 of the 300 cells and 32 of them are the wrong piece" rather than only
   * showing a number the player cannot act on.
   */
  function compare(targetBricks, attemptBricks, types, options) {
    var keepGround = !!(options && options.countFloor);
    var target = voxelise(targetBricks || [], types, keepGround);
    var attempt = voxelise(attemptBricks || [], types, keepGround);

    var empty = {
      score: 0, shape: 0, pieceMatch: 0, colourMatch: 0,
      targetCells: target.cells.length, attemptCells: attempt.cells.length,
      shared: 0, missing: target.cells.length, extra: attempt.cells.length,
      rotation: 0,
    };
    if (!target.cells.length || !attempt.cells.length) return empty;

    /* The search is four turns by 5 x 5 x 3 offsets — 300 passes over every
       cell. On a small build that is nothing; on a very large one it was
       seconds. So find the offset on a sample and then score that offset in
       full: same answer, a fraction of the work. */
    var stride = attempt.cells.length > 4000 ? Math.ceil(attempt.cells.length / 2000) : 1;
    var best = null;
    for (var turns = 0; turns < 4; turns++) {
      var spun = turn(attempt.cells, turns);
      var sample = spun;
      if (stride > 1) {
        sample = [];
        for (var si = 0; si < spun.length; si += stride) sample.push(spun[si]);
      }
      for (var dx = -NUDGE; dx <= NUDGE; dx++) {
        for (var dz = -NUDGE; dz <= NUDGE; dz++) {
          for (var dy = -LIFT; dy <= LIFT; dy++) {
            var hit = overlapAt(sample, target.index, dx, dy, dz);
            if (!best || hit.shared > best.shared) {
              best = { shared: hit.shared, piece: hit.piece, colour: hit.colour,
                       turns: turns, dx: dx, dy: dy, dz: dz };
            }
          }
        }
      }
    }
    if (stride > 1) {
      var full = overlapAt(turn(attempt.cells, best.turns), target.index, best.dx, best.dy, best.dz);
      best.shared = full.shared; best.piece = full.piece; best.colour = full.colour;
    }

    var union = target.cells.length + attempt.cells.length - best.shared;
    var shape = union ? best.shared / union : 0;
    var pieceMatch = best.shared ? best.piece / best.shared : 0;
    var colourMatch = best.shared ? best.colour / best.shared : 0;
    var score = shape * (0.80 + 0.12 * pieceMatch + 0.08 * colourMatch);

    return {
      score: Math.round(score * 1000) / 10,
      shape: Math.round(shape * 1000) / 10,
      pieceMatch: Math.round(pieceMatch * 1000) / 10,
      colourMatch: Math.round(colourMatch * 1000) / 10,
      targetCells: target.cells.length,
      attemptCells: attempt.cells.length,
      shared: best.shared,
      missing: target.cells.length - best.shared,
      extra: attempt.cells.length - best.shared,
      rotation: best.turns * 90,
      floorIgnored: target.floor + attempt.floor,
    };
  }

  var api = { compare: compare, voxelise: voxelise, PLATE_H: PLATE_H };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.BrickLabScore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
