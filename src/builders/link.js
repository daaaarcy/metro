// Central <-> Hong Kong Station pedestrian subway: a 260 m air-conditioned
// corridor with paired travellators, per the real paid-area link (Central
// concourse west end to the HK Station shops level). Built in world space;
// mouths portal through the CEN L1 west wall and the HOK L1 east wall.
import * as THREE from 'three';
import { M } from './materials.js';
import { solid, walkable, ESC_RUNS } from '../registry.js';
import { box } from './structure.js';
import { stairRun, registerStair } from './circulation.js';
import { hangingSign, makeSign } from './signage.js';
import { posters } from './decor.js';

// West mouth = CEN:L1's x0 wall (-1145); east mouth = HOK:L1's x1 wall
// (-1405). Both concourses sit at y -7, matching the corridor floor.
export const LINK = { xA: -1145, xB: -1405, z0: -0.5, z1: 6.5 };

// Vertical profile: flat / gentle dip / flat / rise / flat — the real subway
// is roughly level (a shallow sag under the harbourfront roads), mouting
// CEN:L1 (-7) to HOK:L1 (-7).
const SEGS = [
  { x0: LINK.xA, x1: -1210, y0: -7,    y1: -7 },
  { x0: -1210,   x1: -1250, y0: -7,    y1: -8.4 },
  { x0: -1250,   x1: -1320, y0: -8.4,  y1: -8.4 },
  { x0: -1320,   x1: -1360, y0: -8.4,  y1: -7 },
  { x0: -1360,   x1: LINK.xB, y0: -7,  y1: -7 },
];

// One travellator lane: low deck + glass side guides + yellow edge strips.
// The moving belt surface is instanced by anim/escalators.js — a flat run is
// just an escalator run with zero drop, so the carry + animation come free.
function travellator(run) {
  const g = new THREE.Group();
  const dx = run.x2 - run.x1, dz = run.z2 - run.z1;
  const L = Math.hypot(dx, dz), D = run.y1 - run.y2, w = run.w;
  const slope = Math.atan2(D, L);
  const slopeLen = Math.hypot(L, D);

  const deck = box(slopeLen + 0.5, 0.12, w - 0.04, M.stepMetal);
  deck.rotation.z = -slope;
  deck.position.set(L / 2, -D / 2 - 0.02, 0);
  g.add(walkable(deck, { esc: run }));

  for (const s of [-1, 1]) {
    const edge = box(slopeLen, 0.05, 0.07, M.tactile);
    edge.rotation.z = -slope;
    edge.position.set(L / 2, -D / 2 + 0.06, s * (w / 2 - 0.04));
    g.add(edge);
    const guide = box(slopeLen, 0.8, 0.05, M.balGlass);
    guide.rotation.z = -slope;
    guide.position.set(L / 2, -D / 2 + 0.55, s * (w / 2 + 0.03));
    const rail = box(slopeLen, 0.08, 0.09, M.signPost);
    rail.rotation.z = -slope;
    rail.position.set(L / 2, -D / 2 + 0.98, s * (w / 2 + 0.03));
    g.add(solid(guide), rail);
  }
  for (const [u, y] of [[-0.4, 0], [L + 0.4, -D]]) {
    const plate = box(0.9, 0.08, w + 0.15, M.steel);
    plate.position.set(u, y + 0.01, 0);
    g.add(walkable(plate));
  }
  g.position.set(run.x1, run.y1, run.z1);
  g.rotation.y = -Math.atan2(dz, dx);
  run.len = L; run.drop = D; run.slopeLen = slopeLen;
  run.dx = dx / L; run.dz = dz / L;
  ESC_RUNS.push(run);
  return g;
}

export function linkCorridor() {
  const g = new THREE.Group();
  const { z0, z1 } = LINK;
  const zc = (z0 + z1) / 2, W = z1 - z0;

  for (const s of SEGS) {
    const L = s.x0 - s.x1;                    // x0 is the EAST (higher-x) end
    const cx = (s.x0 + s.x1) / 2;
    const drop = s.y0 - s.y1, slopeLen = Math.hypot(L, drop), slope = Math.atan2(drop, L);
    const midY = (s.y0 + s.y1) / 2;

    // floor slab — a registered ramp so the player walks the gradient
    const fl = box(slopeLen + 0.4, 0.35, W, M.concFloor);
    fl.rotation.z = slope;
    fl.position.set(cx, midY - 0.2, zc);
    g.add(walkable(fl, {
      ramp: { x1: s.x0, z1: zc, y1: s.y0, x2: s.x1, z2: zc, y2: s.y1,
              len: L, drop, slopeLen, dx: -1, dz: 0 },
    }));

    // side walls + ceiling follow the same slope
    for (const zz of [z0 + 0.15, z1 - 0.15]) {
      const wall = box(slopeLen + 0.3, 7.2, 0.3, M.wall);
      wall.rotation.z = slope;
      wall.position.set(cx, midY + 3.1, zz);
      g.add(solid(wall));
    }
    const ceil = box(slopeLen + 0.4, 0.3, W, M.ceiling);
    ceil.rotation.z = slope;
    ceil.position.set(cx, midY + 3.55, zc);
    g.add(ceil);
    for (const lz of [zc - 1.3, zc + 1.3]) {
      const light = box(slopeLen * 0.75, 0.1, 0.45, M.lightStrip);
      light.rotation.z = slope;
      light.position.set(cx, midY + 3.3, lz);
      g.add(light);
    }

    // paired travellator lanes: centreline offset ±1.35, one each direction
    for (const [lz, toWest] of [[zc - 1.35, true], [zc + 1.35, false]]) {
      const run = toWest
        ? { x1: s.x0, z1: lz, y1: s.y0, x2: s.x1, z2: lz, y2: s.y1, w: 1.15, going: 'down' }
        : { x1: s.x1, z1: lz, y1: s.y1, x2: s.x0, z2: lz, y2: s.y0, w: 1.15, going: 'down' };
      g.add(travellator(run));
    }
  }

  // mouth signs at both ends
  const sA = hangingSign({ zh: '往香港站・機場快綫', en: 'To Hong Kong Station · Airport Express', w: 9, h: 1.4 },
    LINK.xA - 4, -4.4, zc, Math.PI / 2);
  const sB = hangingSign({ zh: '往中環站・荃灣綫/港島綫', en: 'To Central Station · Tsuen Wan / Island Lines', w: 9, h: 1.4 },
    LINK.xB + 4, -4.4, zc, Math.PI / 2);
  g.add(sA, sB);
  const end = makeSign({ zh: '行人通道 Pedestrian Subway', en: 'Central ↔ Hong Kong', w: 7, h: 1.5 });
  end.position.set((LINK.xA + LINK.xB) / 2, -5.6, z0 + 0.5);
  g.add(end);

  // ad lightboxes along the flat segments' walls, like the real poster run
  for (const s of SEGS.filter(s => s.y0 === s.y1)) {
    g.add(posters(s.x1 + 8, s.x0 - 8, z0 + 0.42, s.y0, 0, 26));
    g.add(posters(s.x1 + 8, s.x0 - 8, z1 - 0.42, s.y0, Math.PI, 26));
  }

  return g;
}

// ---------------------------------------------------------------- Mei Foo
// MEF's L1 subway: the long paid link between the TWL concourse (east
// mouth through MEF:L1's west wall at x 225) and the Tuen Ma line box —
// the corridor runs west under the estate plaza, ducks under the shed's
// east wall and ends at a stair that rises through the at-grade slab
// onto P1 (north platform, east end). Offset to local z -8 so the mouth
// lands inside the widened paid strip (gateZ ±12) and the stair lands
// on the platform band clear of the track troughs (±1.9..6.9).
export const MEF_LINK = { x0: 140, x1: 225, z0: -1851.5, z1: -1844.5 };

export function mefSubway() {
  const g = new THREE.Group();
  const { x0, x1, z0, z1 } = MEF_LINK;
  const zc = (z0 + z1) / 2, W = z1 - z0, L = x1 - x0, cx = (x0 + x1) / 2;
  const FL = -7;

  const fl = box(L + 0.4, 0.35, W, M.concFloor);
  fl.position.set(cx, FL - 0.2, zc);
  g.add(walkable(fl));

  // side walls run the full length, capped just under the apron slab
  for (const zz of [z0 + 0.15, z1 - 0.15]) {
    const wall = box(L + 0.3, 5.95, 0.3, M.wall);
    wall.position.set(cx, FL + 5.95 / 2 - 1.0, zz);
    g.add(solid(wall));
  }
  // west cap wall under the stair's top landing — seals the dead end
  const cap = box(0.3, 5.95, W, M.wall);
  cap.position.set(x0 + 0.15, FL + 5.95 / 2 - 1.0, zc);
  g.add(solid(cap));

  // ceiling stops east of the stair shaft (x 154) — the shaft is open
  // to the slab cut above
  const ceilL = x1 - 154;
  const ceil = box(ceilL + 0.4, 0.3, W, M.ceiling);
  ceil.position.set(154 + ceilL / 2, FL + 5.2, zc);
  g.add(ceil);
  for (const lz of [zc - 1.6, zc + 1.6]) {
    const light = box(ceilL * 0.8, 0.1, 0.45, M.lightStrip);
    light.position.set(154 + ceilL / 2, FL + 4.9, lz);
    g.add(light);
  }

  // stair up through the TML slab — top lands on P1 (north platform)
  const run = { x1: 140, z1: -1849, y1: 0, x2: 154, z2: -1849, y2: FL, w: 2.4 };
  g.add(stairRun(run));
  registerStair(run, 'MEF:P', 'MEF:L1');

  const sA = hangingSign({ zh: '往屯馬綫月台', en: 'To Tuen Ma Line Platforms', w: 8, h: 1.4 },
    x1 - 6, -4.4, zc, Math.PI / 2);
  const sB = hangingSign({ zh: '往荃灣綫大堂・月台', en: 'To Tsuen Wan Line Concourse', w: 8, h: 1.4 },
    x0 + 18, -4.4, zc, Math.PI / 2);
  g.add(sA, sB);
  const end = makeSign({ zh: '轉綫通道 Interchange Subway', en: 'Tsuen Wan Line ↔ Tuen Ma Line', w: 7, h: 1.5 });
  end.position.set((x0 + x1) / 2, -5.6, z0 + 0.5);
  g.add(end);

  g.add(posters(x0 + 20, x1 - 8, z0 + 0.42, FL, 0, 26));
  g.add(posters(x0 + 20, x1 - 8, z1 - 0.42, FL, Math.PI, 26));

  return g;
}

// ---------------------------------------------------------------- Kwai Fong
// Exit E: the covered footbridge off P1's north edge to Metroplaza. A deck
// at platform height (y 8) mouths through the U1 box's north wall door,
// runs 18 m north over the apron, then a stair drops to street level. The
// real bridge lands inside the mall; here it ends on the apron north band.
export const KWF_LINK = { x: 414, zWall: -2092, zEnd: -2110, zLand: -2124 };

export function kwfFootbridge() {
  const g = new THREE.Group();
  const { x, zWall, zEnd, zLand } = KWF_LINK;
  const Y = 8, W = 4;

  // deck — walkable slab at platform height
  const deckLen = zWall - zEnd;
  const deck = box(W, 0.3, deckLen + 0.4, M.concFloor);
  deck.position.set(x, Y - 0.15, (zWall + zEnd) / 2);
  g.add(walkable(deck));
  // glass parapets + a light roof on slim posts (covered walkway)
  for (const s of [-1, 1]) {
    const parapet = box(0.08, 1.1, deckLen, M.balGlass);
    parapet.position.set(x + s * (W / 2 - 0.04), Y + 0.55, (zWall + zEnd) / 2);
    g.add(solid(parapet));
    const post = box(0.12, 2.6, 0.12, M.signPost);
    post.position.set(x + s * (W / 2 - 0.1), Y + 1.3, (zWall + zEnd) / 2 + s * 4);
    g.add(solid(post));
  }
  const roof = box(W + 0.8, 0.18, deckLen + 1.2, M.ceiling);
  roof.position.set(x, Y + 2.75, (zWall + zEnd) / 2);
  g.add(roof);

  // stair down to the apron — north end of the deck to street
  const run = { x1: x, z1: zEnd, y1: Y, x2: x, z2: zLand, y2: 0, w: W - 0.8 };
  g.add(stairRun(run));
  registerStair(run, 'KWF:U1', 'KWF:G');

  const s = hangingSign({ zh: '新都會廣場 Metroplaza', en: 'Footbridge to Metroplaza', w: 7, h: 1.3 },
    x, Y - 0.6, zWall - 2, 0);
  g.add(s);
  return g;
}
