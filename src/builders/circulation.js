import * as THREE from 'three';
import { M } from './materials.js';
import { ESC, LIFT_SIZE, BRIDGE, FLOOR_H, SLAB_T } from '../station-data.js';
import { solid, walkable, ESC_RUNS, STAIR_RUNS } from '../registry.js';
import { box } from './structure.js';
import { exitFascia } from './signage.js';

// Inclined ramp + balustrades for one escalator run (world space).
// The moving steps are rendered separately by anim/escalators.js (instanced).
export function escalatorRun(run) {
  const g = new THREE.Group();
  const dx = run.x2 - run.x1, dz = run.z2 - run.z1;
  const L = Math.hypot(dx, dz), D = run.y1 - run.y2, w = run.w;
  const slope = Math.atan2(D, L);
  const slopeLen = Math.hypot(L, D);

  // under-truss wedge
  const truss = box(slopeLen * 0.98, 0.9, w, M.stepMetal);
  truss.rotation.z = -slope;
  truss.position.set(L / 2, -D / 2 - 0.75, 0);
  g.add(truss);

  // ramp surface the steps slide over — also what the player stands on
  const ramp = box(slopeLen + 0.6, 0.14, w - 0.08, M.stepMetal);
  ramp.rotation.z = -slope;
  ramp.position.set(L / 2, -D / 2 - 0.07, 0);
  g.add(walkable(ramp, { esc: run }));

  // yellow step-edge demarcation lines — the detail that makes it read
  // as an escalator from any angle
  for (const s of [-1, 1]) {
    const edge = box(slopeLen * 0.98, 0.03, 0.08, M.tactile);
    edge.rotation.z = -slope;
    edge.position.set(L / 2, -D / 2 + 0.04, s * (w / 2 - 0.05));
    g.add(edge);
  }

  // glass balustrades + steel handrails (clearer glass — adjacent bank
  // lanes stack panes, standard opacity milked into a solid wall)
  for (const s of [-1, 1]) {
    const bal = box(slopeLen, 0.95, 0.06, M.balGlass);
    bal.rotation.z = -slope;
    bal.position.set(L / 2, -D / 2 + 0.98, s * (w / 2 + 0.05));
    const rail = box(slopeLen, 0.09, 0.1, M.signPost);
    rail.rotation.z = -slope;
    rail.position.set(L / 2, -D / 2 + 1.52, s * (w / 2 + 0.05));
    g.add(solid(bal), rail);

    // skirt light along the balustrade base — real escalators glow here;
    // also the cue that keeps the open well readable at night
    const skirt = box(slopeLen * 0.94, 0.05, 0.05, M.lightStrip);
    skirt.rotation.z = -slope;
    skirt.position.set(L / 2, -D / 2 + 0.52, s * (w / 2 + 0.02));
    g.add(skirt);
  }

  // soffit strips on the lower level's ceiling at the well mouth — the lit
  // portal frame you see when looking up/down the shaft
  const soffitY = -D + FLOOR_H - SLAB_T - 0.12;
  for (const s of [-1, 1]) {
    const rim = box(L * 0.94, 0.05, 0.08, M.lightStrip);
    rim.position.set(L / 2, soffitY, s * (w / 2 + 0.28));
    g.add(rim);
  }

  // landing comb plates
  for (const [u, y] of [[-0.5, 0], [L + 0.5, -D]]) {
    const plate = box(1.05, 0.08, w + 0.2, M.steel);
    plate.position.set(u, y + 0.02, 0);
    g.add(walkable(plate));
  }

  g.position.set(run.x1, run.y1, run.z1);
  g.rotation.y = -Math.atan2(dz, dx);
  run.len = L; run.drop = D; run.slopeLen = slopeLen;
  run.dx = dx / L; run.dz = dz / L;
  ESC_RUNS.push(run);
  return g;
}

// Static staircase (exits): sawtooth steps + side stringers.
export function stairRun(run) {
  const g = new THREE.Group();
  const dx = run.x2 - run.x1, dz = run.z2 - run.z1;
  const L = Math.hypot(dx, dz), D = run.y1 - run.y2, w = run.w;
  run.len = L; run.drop = D; run.dx = dx / L; run.dz = dz / L;
  const N = Math.max(4, Math.round(D / 0.17));
  const d = L / N, h = D / N;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let i = 0; i < N; i++) {
    shape.lineTo((i + 1) * d, -i * h);
    shape.lineTo((i + 1) * d, -(i + 1) * h);
  }
  shape.lineTo(L, -D - 0.85);
  shape.lineTo(0, -1.6);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
  geo.translate(0, 0, -w / 2);
  const steps = new THREE.Mesh(geo, M.stepMetal);
  steps.castShadow = steps.receiveShadow = true;
  g.add(walkable(steps, { ramp: run }));

  const slope = Math.atan2(D, L);
  const slopeLen = Math.hypot(L, D) + 1.4;
  for (const s of [-1, 1]) {
    const bal = box(slopeLen, 0.95, 0.06, M.balGlass);
    bal.rotation.z = -slope;
    bal.position.set(L / 2, -D / 2 + 0.98, s * (w / 2 + 0.05));
    const rail = box(slopeLen, 0.09, 0.1, M.signPost);
    rail.rotation.z = -slope;
    rail.position.set(L / 2, -D / 2 + 1.52, s * (w / 2 + 0.05));
    g.add(solid(bal), rail);
  }

  // landing plates bridging the floor-opening margins at both ends
  for (const [u, y] of [[-0.45, 0], [L + 0.45, -D]]) {
    const plate = box(1.9, 0.12, w + 0.1, M.stepMetal);
    plate.position.set(u, y - 0.06, 0);
    g.add(walkable(plate));
  }

  g.position.set(run.x1, run.y1, run.z1);
  g.rotation.y = -Math.atan2(dz, dx);
  return g;
}

// register a staircase for pedestrian pathing — normalized to a top end
// (level `from`) and bottom end (level `to`) plus the unit vector top→bot
function registerStair(run, from, to) {
  const top = run.y1 >= run.y2 ? { x: run.x1, z: run.z1, y: run.y1 }
                               : { x: run.x2, z: run.z2, y: run.y2 };
  const bot = run.y1 >= run.y2 ? { x: run.x2, z: run.z2, y: run.y2 }
                               : { x: run.x1, z: run.z1, y: run.y1 };
  const h = Math.hypot(bot.x - top.x, bot.z - top.z);
  STAIR_RUNS.push({
    top, bot, ux: (bot.x - top.x) / h, uz: (bot.z - top.z) / h,
    horiz: h, drop: top.y - bot.y, slope: Math.hypot(h, top.y - bot.y),
    from, to,
  });
}

// world AABB of a run's plan footprint (+margin), used for floor openings
export function runWorldRect(run, margin = 0.55) {
  return {
    x0: Math.min(run.x1, run.x2) - margin, x1: Math.max(run.x1, run.x2) + margin,
    z0: Math.min(run.z1, run.z2) - margin, z1: Math.max(run.z1, run.z2) + margin,
  };
}

// Exit stair shaft: stair run G -> L1 + glazed pavilion on top.
export function exitShaft(exit, yG, yL1) {
  const g = new THREE.Group();
  const dir = exit.side;
  const cz = exit.z;
  const half = ESC.runLen / 2;
  const run = {
    x1: exit.x, z1: cz - dir * half, y1: yG,
    x2: exit.x, z2: cz + dir * half, y2: yL1,
    w: 2.4,
  };
  g.add(stairRun(run));
  registerStair(run, 'G', 'L1');

  // pavilion: glazed canopy over the stair mouth — the entry end
  // (facing the station core, at the stair top) is left open
  const pavW = 8, pavD = ESC.runLen * 0.55, pavH = 3.6;
  const px = exit.x, pz = cz - dir * 2.8;
  for (const s of [-1, 1]) {
    const side = box(0.08, pavH, pavD, M.glass);
    side.position.set(px + s * pavW / 2, yG + pavH / 2, pz);
    g.add(solid(side));
  }
  const endGlass = box(pavW, pavH, 0.08, M.glass);
  endGlass.position.set(px, yG + pavH / 2, pz + dir * pavD / 2);
  g.add(solid(endGlass));
  // open entry face: corner posts + lintel over the doorway
  const entryZ = pz - dir * pavD / 2;
  for (const s of [-1, 1]) {
    const post = box(0.16, pavH, 0.16, M.steel);
    post.position.set(px + s * pavW / 2, yG + pavH / 2, entryZ);
    g.add(solid(post));
  }
  const lintel = box(pavW, 0.5, 0.2, M.steel);
  lintel.position.set(px, yG + pavH - 0.25, entryZ);
  g.add(lintel);
  const frame = box(8.4, 0.5, ESC.runLen * 0.58, M.steel);
  frame.position.set(px, yG + 3.4, pz);
  // plinth rim around the stairwell opening (entry end stays open)
  const rimD = ESC.runLen * 0.58;
  for (const s of [-1, 1]) {
    const rimX = box(0.4, 0.3, rimD, M.pavilion);
    rimX.position.set(px + s * (pavW / 2 + 0.1), yG + 0.12, pz);
    g.add(rimX);
  }
  const roof = box(9, 0.35, ESC.runLen * 0.62, M.signPost);
  roof.position.set(px, yG + 3.75, pz);
  // named fascia band over the open entry face
  const fascia = exitFascia(exit);
  fascia.position.set(px, yG + 2.55, entryZ - dir * 0.07);
  fascia.rotation.y = dir === -1 ? 0 : Math.PI;
  // guard rail across the stairwell's far edge so G-level walkers can't fall in
  const guard = box(3.2, 0.95, 0.1, M.steel);
  guard.position.set(px, yG + 0.5, run.z2 + dir * 0.9);
  g.add(frame, roof, fascia, solid(guard));
  return { group: g, run };
}

// Glazed lift shaft through several levels.
export function liftShaft(wx, wz, yTop, yBot) {
  const g = new THREE.Group();
  const h = yTop - yBot + FLOOR_H - 1;
  const cy = (yTop + FLOOR_H - 1 + yBot) / 2;
  const glass = box(LIFT_SIZE.w, h, LIFT_SIZE.d, M.glass);
  glass.position.set(wx, cy, wz);
  g.add(solid(glass));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const post = box(0.18, h, 0.18, M.steel);
    post.position.set(wx + sx * LIFT_SIZE.w / 2, cy, wz + sz * LIFT_SIZE.d / 2);
    g.add(solid(post));
  }
  const car = box(LIFT_SIZE.w - 0.5, 2.4, LIFT_SIZE.d - 0.5, M.glassDark);
  car.position.set(wx, yBot + 1.4, wz);
  g.add(car);
  return g;
}

const planterMat = new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 0.9 });

// U1 footbridge: decks, parapets, towers down to G, neighbouring buildings.
export function footbridge() {
  const g = new THREE.Group();
  const y = BRIDGE.y;
  const mk = (r, gaps = []) => {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const deck = box(w, 0.4, d, M.bridgeDeck);
    deck.position.set(cx, y - 0.2, cz);
    g.add(walkable(deck));
    for (const [zz, side] of [[r.z0 + 0.06, 'z0'], [r.z1 - 0.06, 'z1']]) {
      // parapet segments split around any gaps (stair mouths)
      const cuts = gaps.filter(gp => gp.side === side).sort((a, b) => a.a - b.a);
      let sx = r.x0;
      for (const gp of cuts) {
        if (gp.a > sx) {
          const p = box(gp.a - sx, 1.1, 0.08, M.glass);
          p.position.set((sx + gp.a) / 2, y + 0.55, zz);
          g.add(solid(p));
        }
        sx = Math.max(sx, gp.b);
      }
      if (sx < r.x1) {
        const p = box(r.x1 - sx, 1.1, 0.08, M.glass);
        p.position.set((sx + r.x1) / 2, y + 0.55, zz);
        g.add(solid(p));
      }
    }
    for (let x = r.x0 + 6; x < r.x1 - 3; x += 18) {
      const c = box(0.5, y, 0.5, M.column);
      c.position.set(x, y / 2 - 0.2, cz);
      g.add(solid(c));
    }
  };
  // stair mouth on the spine's south edge beside the east tower
  const STAIR_X = 66.5;
  mk(BRIDGE.spine, [{ side: 'z1', a: STAIR_X - 1.7, b: STAIR_X + 1.7 }]);
  mk(BRIDGE.connector);

  // G -> U1 stair: drops 8 m south of the deck onto the ground slab
  const fbRun = {
    x1: STAIR_X, z1: BRIDGE.spine.z1, y1: y,
    x2: STAIR_X, z2: BRIDGE.spine.z1 + 14.6, y2: 0, w: 3,
  };
  g.add(stairRun(fbRun));
  registerStair(fbRun, 'U1', 'G');

  // planters along the spine parapet + a bench on the connector deck
  for (const px of [-64, -32, 20, 44]) {
    const pot = box(1.6, 0.55, 0.7, M.signPost);
    pot.position.set(px, y + 0.27, BRIDGE.spine.z1 - 0.55);
    const bush = box(1.5, 0.4, 0.6, planterMat);
    bush.position.set(px, y + 0.72, BRIDGE.spine.z1 - 0.55);
    g.add(solid(pot), bush);
  }
  const bench = box(2.4, 0.12, 0.55, M.steel);
  bench.position.set(15, y + 0.46, -32.7);
  const benchLegs = box(2.2, 0.42, 0.4, M.signPost);
  benchLegs.position.set(15, y + 0.21, -32.7);
  g.add(solid(bench), solid(benchLegs));

  for (const tx of BRIDGE.towers) {
    const tz = (BRIDGE.spine.z0 + BRIDGE.spine.z1) / 2;
    const shaft = box(4, y + 0.4, 4, M.glass);
    shaft.position.set(tx, y / 2, tz);
    const cap = box(4.6, 0.5, 4.6, M.signPost);
    cap.position.set(tx, y + 0.45, tz);
    g.add(solid(shaft), cap);
  }

  for (const b of BRIDGE.buildings) {
    const w = b.x1 - b.x0, d = b.z1 - b.z0;
    const m = box(w, b.h, d, M.wallDark);
    m.position.set((b.x0 + b.x1) / 2, b.h / 2, (b.z0 + b.z1) / 2);
    g.add(solid(m));
    const link = box(w * 0.5, 0.4, Math.abs(BRIDGE.spine.z0 - b.z1) + 0.4, M.bridgeDeck);
    link.position.set((b.x0 + b.x1) / 2, y - 0.2, (BRIDGE.spine.z0 + b.z1) / 2);
    g.add(walkable(link));
  }
  return g;
}
