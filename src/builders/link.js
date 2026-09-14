// Central <-> Hong Kong Station pedestrian subway: a 260 m air-conditioned
// corridor with paired travellators, per the real paid-area link (Central
// concourse west end to the HK Station shops level). Built in world space;
// mouths portal through the CEN L1 west wall and the HOK L1 east wall.
import * as THREE from 'three';
import { M } from './materials.js';
import { solid, walkable, ESC_RUNS } from '../registry.js';
import { box } from './structure.js';
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
