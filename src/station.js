import * as THREE from 'three';
import { M, lineMat } from './builders/materials.js';
import {
  LEVELS, BOXES, ESCALATORS, EXITS, LIFTS, PLATFORMS, LINES,
  ESC, EXIT_Z, LIFT_SIZE, FLOOR_H, SLAB_T,
  boxToWorld, escalatorRuns, liftWorldRect, levelById,
} from './station-data.js';
import {
  floorSlab, walls, columns, lightStrips,
  boxRect, rectSubtract, worldRectToLocal, box,
} from './builders/structure.js';
import { platformLevel, benches } from './builders/platforms.js';
import { escalatorRun, runWorldRect, exitShaft, liftShaft, footbridge } from './builders/circulation.js';
import { makeSign, hangingSign, platformSign, exitTotem } from './builders/signage.js';
import { gateBank, serviceBooth, shops, toilets, kiosk, hvac, restaurant, mallEntrance, sevenEleven } from './builders/props.js';
import { calligraphy, posters, postersEnd, binPair, fireCabinets, mapBoard } from './builders/decor.js';
import { tunnelTube } from './builders/tracks.js';
import { GATE_ROWS, RESTAURANTS, MALL, SEVEN } from './station-data.js';
import { FITTINGS } from './registry.js';

const INTERIOR_H = FLOOR_H - SLAB_T - 0.5;

// ---- openings: which slabs/ceilings each circulation element pierces --------
export function computeOpenings() {
  const open = {};
  const add = (key, r) => (open[key] ??= []).push(r);

  for (const e of ESCALATORS) {
    // lateral kerbs on both sides; the run's boarding end stays open to walk on,
    // and the far end gets a kerb too — there the ramp is already ~7 m below the
    // upper floor, so an open edge would be a hidden drop
    const lat = Math.abs(e.dir[0]) >= Math.abs(e.dir[1]) ? ['z0', 'z1'] : ['x0', 'x1'];
    for (const r of escalatorRuns(e)) {
      const deepEnd = Math.abs(e.dir[0]) >= Math.abs(e.dir[1])
        ? (r.x2 > r.x1 ? 'x1' : 'x0')
        : (r.z2 > r.z1 ? 'z1' : 'z0');
      add(e.from, { ...runWorldRect(r), sides: [...lat, deepEnd] });
      add(e.to + ':ceil', { ...runWorldRect(r), sides: lat });
    }
  }
  for (const ex of EXITS) {
    const dir = ex.side, cz = ex.side * EXIT_Z, half = ESC.runLen / 2;
    const run = { x1: ex.x, z1: cz - dir * half, x2: ex.x, z2: cz + dir * half, w: 2.4 };
    const wr = { ...runWorldRect(run, 0.9), sides: ['x0', 'x1'] };
    add('G', wr);
    add('L1:ceil', wr);
  }
  for (const l of LIFTS) {
    const p = liftWorldRect(l);
    const wr = {
      x0: p.x - LIFT_SIZE.w / 2 - 0.2, x1: p.x + LIFT_SIZE.w / 2 + 0.2,
      z0: p.z - LIFT_SIZE.d / 2 - 0.2, z1: p.z + LIFT_SIZE.d / 2 + 0.2,
    };
    l.levels.slice(0, -1).forEach(id => add(id, wr));       // pierced floor slabs
    l.levels.slice(1).forEach(id => add(id + ':ceil', wr)); // pierced ceilings
  }
  return open;
}

function localHoles(open, key, box) {
  return (open[key] || []).map(wr => worldRectToLocal(box, wr));
}

// ceiling pieces tiling rect minus holes
function ceilingWithHoles(rect, holes, y) {
  const g = new THREE.Group();
  const h = 0.45, cy = y + FLOOR_H - SLAB_T - h / 2 - 0.02;
  for (const r of rectSubtract(rect, holes)) {
    const m = box(r.x1 - r.x0, h, r.z1 - r.z0, M.ceiling);
    m.position.set((r.x0 + r.x1) / 2, cy, (r.z0 + r.z1) / 2);
    g.add(m);
  }
  return g;
}

// ---------------------------------------------------------------------------
export function buildStation() {
  const root = new THREE.Group();
  const openings = computeOpenings();
  const levelGroups = {};   // levelId -> group (visibility toggling)
  const togglables = {};    // levelId -> extra world-space objects (circulation)
  const labels = [];

  for (const lvl of LEVELS) {
    togglables[lvl.id] = [];
    if (lvl.type === 'bridge') {
      const g = footbridge();
      levelGroups[lvl.id] = g;
      root.add(g);
      labels.push({ level: 'U1', pos: new THREE.Vector3(0, lvl.y + 3, -36), cls: 'lvl', html: `U1 ${lvl.zh} ${lvl.en}` });
      continue;
    }

    const bx = BOXES[lvl.box];
    const g = new THREE.Group();
    g.position.set(bx.cx, lvl.y, bx.cz);
    g.rotation.y = bx.rot;
    const rect = boxRect(bx);
    const floorHoles = localHoles(openings, lvl.id, bx);
    const ceilHoles = localHoles(openings, lvl.id + ':ceil', bx);

    // ---- platform levels: troughs + PSD + markings
    let trackRects = [];
    if (lvl.type === 'platform') {
      const built = platformLevel(lvl, rect);
      trackRects = built.trackRects;
      g.add(built.fittings);
      FITTINGS[lvl.id] = { doorSets: built.doorSets };
    }

    const floorMat = lvl.type === 'platform' ? M.platFloor
      : lvl.type === 'concourse' ? M.concFloor
      : lvl.type === 'ground' ? M.pavement : M.floor;
    g.add(floorSlab(rect, [...floorHoles, ...trackRects], 0, floorMat, { kerbs: lvl.id !== 'G' }));

    if (lvl.type !== 'ground') {
      const portalsX = trackRects.map(tr => ({ z0: tr.z0 + 0.2, z1: tr.z1 - 0.2, h: 4.4 }));
      g.add(walls(rect, 0, INTERIOR_H, M.wall, portalsX));
      g.add(ceilingWithHoles(rect, ceilHoles, 0));
      for (const tr of trackRects) {
        g.add(tunnelTube(tr, 0, 1));
        g.add(tunnelTube(tr, 0, -1));
      }
    }

    // ---- per-level dressing
    if (lvl.type === 'platform') {
      const spec = PLATFORMS[lvl.id];
      const lines = spec.faces;
      // wall colour bands per side (each wall serves that side's platform)
      for (const f of lines) {
        const mat = lineMat(LINES[f.line].color);
        const band = box(rect.x1 - rect.x0 - 1, 1.1, 0.08, mat);
        band.position.set(0, 2.6, f.side * (Math.abs(rect.z1) - 0.55));
        g.add(band);
      }
      // columns down the island / side platforms
      if (spec.kind === 'island') g.add(columns(rect, 0, [0], 15, floorHoles));
      else g.add(columns(rect, 0, [-10, 10], 15, floorHoles));
      g.add(lightStrips(rect, 0, spec.kind === 'island' ? [0, -8.6, 8.6] : [-10, 0, 10]));
      g.add(hvac(rect, 0, spec.kind === 'island' ? [0] : [-10, 10]));
      // platform signage every ~38 m on each face
      for (const f of lines) {
        const edge = spec.kind === 'island' ? 5.3 : 7.6;
        for (const x of [-57, -19, 19, 57]) {
          const s = platformSign(f);
          s.position.set(x, 0, f.side * edge);
          s.rotation.y = f.side < 0 ? 0 : Math.PI;
          g.add(s);
        }
      }
      // level id plate on end walls
      const end = makeSign({ zh: `${lvl.id}  ${lvl.zh}`, en: lvl.en, w: 9, h: 1.8 });
      end.position.set(-rect.x1 + 1.2, 3.2, 0);
      end.rotation.y = Math.PI / 2;
      g.add(end);
      // real-station dressing: calligraphy across the tracks, ad lightboxes,
      // fire cabinets on the walls, bins beside the benches
      g.add(calligraphy(rect, 0));
      for (const s of [-1, 1]) {
        g.add(posters(rect.x0 + 34, rect.x1 - 34, s * (Math.abs(rect.z1) - 0.62), 0, s < 0 ? 0 : Math.PI, 38));
        g.add(fireCabinets(rect.x0, rect.x1, s * (Math.abs(rect.z1) - 0.68), 0, 56));
      }
      for (const bx of [-50, -20, 10, 40]) {
        g.add(binPair(bx, spec.kind === 'island' ? 1.5 : 10.9, 0));
      }
    }

    if (lvl.type === 'concourse') {
      // paid (blue) / unpaid (yellow) floor tint like the diagram
      const paid = box(rect.x1 - rect.x0 - 4, 0.02, 18, M.paid);
      paid.position.set(0, 0.02, 0);
      g.add(paid);
      for (const s of [-1, 1]) {
        const un = box(rect.x1 - rect.x0 - 4, 0.02, 9.5, M.unpaid);
        un.position.set(0, 0.02, s * 15.4);
        g.add(un);
        g.add(shops(rect.x0 + 8, rect.x1 - 10, s * 19.6, 0, -s));
      }
      for (const r of GATE_ROWS) g.add(gateBank(r.x0, r.x1, r.z, 0));
      for (const r of RESTAURANTS) g.add(restaurant(r, r.side * 19.6, 0, -r.side));
      g.add(mallEntrance(MALL.x, MALL.side * 19.6, 0, -MALL.side));
      g.add(sevenEleven(SEVEN.x, SEVEN.side * 19.6, 0, -SEVEN.side));
      for (const [i, x] of [-48, -14, 40, 55].entries()) g.add(kiosk(x, -13.2, 0, i + 2));
      for (const [i, x] of [-60, -20, 25, 62].entries()) g.add(kiosk(x, 13.2, 0, i + 5));
      g.add(serviceBooth(0, 13, 0));
      g.add(serviceBooth(-30, -13, 0));
      g.add(hangingSign({ zh: '客務中心', en: 'Customer Service', w: 5.5, h: 1.2 }, 0, 3.0, 13));
      g.add(hangingSign({ zh: '客務中心', en: 'Customer Service', w: 5.5, h: 1.2 }, -30, 3.0, -13));
      g.add(toilets(-70, -14, 0));
      // end-wall ads + system map + bins + fire cabinets
      g.add(postersEnd(rect, 0, -1, rect.z0 + 4, rect.z1 - 4, 12));
      g.add(postersEnd(rect, 0, 1, rect.z0 + 4, 0, 12));
      g.add(mapBoard(rect.x1 - 0.7, 9, 0, -Math.PI / 2));
      for (const s of [-1, 1]) {
        g.add(fireCabinets(rect.x0, rect.x1, s * (Math.abs(rect.z1) - 0.68), 0, 60));
        for (const bx of [-56, -4, 56]) g.add(binPair(bx, s * 11.8, 0));
      }
      // keep columns out of the exit stair shafts (they land inside the concourse)
      const exitHoles = EXITS.map(ex => {
        const cz = ex.side * EXIT_Z, half = ESC.runLen / 2;
        return { x0: ex.x - 2.2, x1: ex.x + 2.2, z0: cz - half - 0.6, z1: cz + half + 0.6 };
      });
      g.add(columns(rect, 0, [-16, -5.5, 5.5, 16], 16, [...floorHoles, ...exitHoles]));
      g.add(lightStrips(rect, 0, [-15, -5, 5, 15]));
      g.add(hvac(rect, 0, [-10, 0, 10]));
      for (const x of [-52, 0, 52]) {
        const s = makeSign({
          zh: '往各月台', en: 'To Platforms',
          chips: [{ text: 'TWL', color: LINES.TWL.color }, { text: 'ISL', color: LINES.ISL.color },
                  { text: 'EAL', color: LINES.EAL.color }, { text: 'SIL', color: LINES.SIL.color }],
          w: 8, h: 1.5,
        });
        s.position.set(x, 3.6, -6);
        g.add(s);
      }
      // wayfinding with exit-letter chips like the real concourse signs
      const exitSign = makeSign({
        zh: '出口', en: 'Exits',
        chips: ['A', 'B', 'C', 'D', 'E', 'F'].map(t => ({ text: t, color: '#e2231a' })),
        w: 11, h: 1.5,
      });
      exitSign.position.set(-20, 3.6, 8);
      g.add(exitSign);
      const exitSign2 = makeSign({
        zh: '出口', en: 'Exits',
        chips: ['A', 'B', 'C', 'D', 'E', 'F'].map(t => ({ text: t, color: '#e2231a' })),
        w: 11, h: 1.5,
      });
      exitSign2.position.set(30, 3.6, -8);
      g.add(exitSign2);
    }

    if (lvl.type === 'lobby') {
      // paid transfer corridor tint + wall accent bands so the lobby isn't bare
      const paid = box(rect.x1 - rect.x0 - 4, 0.02, 22, M.paid);
      paid.position.set(0, 0.02, 0);
      g.add(paid);
      for (const s of [-1, 1]) {
        const band = box(rect.x1 - rect.x0 - 1, 1.1, 0.08, lineMat(LINES.EAL.color));
        band.position.set(0, 2.6, s * (Math.abs(rect.z1) - 0.55));
        g.add(band);
      }
      g.add(benches(rect.x0 + 14, rect.x1 - 14, -14.5, 0));
      g.add(benches(rect.x0 + 14, rect.x1 - 14, 14.5, 0));
      g.add(serviceBooth(-35, 13, 0));
      g.add(hangingSign({ zh: '客務中心', en: 'Customer Service', w: 5.5, h: 1.2 }, -35, 3.0, 13));
      g.add(posters(rect.x0 + 8, rect.x1 - 8, rect.z1 - 0.62, 0, Math.PI, 20));
      for (const bx of [-30, 0, 30, 60]) g.add(binPair(bx, -15.2, 0));
      for (const [i, x] of [-12, 30].entries()) g.add(kiosk(x, -13.4, 0, i + 9));
      g.add(columns(rect, 0, [-9, 9], 16, floorHoles));
      g.add(lightStrips(rect, 0, [-10, 0, 10]));
      g.add(hvac(rect, 0, [-6, 6]));
      for (const x of [-30, 10, 45]) {
        const s = makeSign({
          zh: '往東鐵綫・南港島綫月台', en: 'To East Rail / South Island Line Platforms',
          chips: [{ text: 'EAL', color: LINES.EAL.color }, { text: 'SIL', color: LINES.SIL.color }],
          w: 9, h: 1.5,
        });
        s.position.set(x, 3.5, 0);
        g.add(s);
      }
      const end = makeSign({ zh: `${lvl.id}  ${lvl.zh}`, en: lvl.en, w: 9, h: 1.8 });
      end.position.set(rect.x0 + 1.2, 3.2, 0);
      end.rotation.y = Math.PI / 2;
      g.add(end);
    }

    levelGroups[lvl.id] = g;
    root.add(g);

    // slab edge hover target + level label anchor at NE corner (world)
    const corner = boxToWorld(bx, rect.x1, rect.z0);
    labels.push({ level: lvl.id, pos: new THREE.Vector3(corner.x, lvl.y + 1.2, corner.z), cls: 'lvl', html: `${lvl.id} ${lvl.zh} ${lvl.en}` });
  }

  // ---- circulation (world space, tagged to its `from` level for toggling)
  for (const e of ESCALATORS) {
    for (const r of escalatorRuns(e)) {
      const esc = escalatorRun(r);
      root.add(esc);
      togglables[e.from].push(esc);
    }
  }
  for (const [i, ex] of EXITS.entries()) {
    const cz = ex.side * EXIT_Z;
    const s = exitShaft({ ...ex, z: cz }, 0, -7);
    root.add(s.group);
    togglables.G.push(s.group);
    const totem = exitTotem(ex);
    totem.position.set(ex.x + 5.5, 0, cz - ex.side * (ESC.runLen / 2 + 0.5));
    root.add(totem);
    togglables.G.push(totem);
    // stagger adjacent exits so the floating tags don't overlap each other
    const ly = 5.4 + (i % 2) * 1.6;
    labels.push({ level: 'G', pos: new THREE.Vector3(ex.x, ly, cz - ex.side * (ESC.runLen / 2 + 0.5)), cls: 'exit', html: `出 ${ex.id} ${ex.en}` });
  }
  for (const l of LIFTS) {
    const p = liftWorldRect(l);
    const ys = l.levels.map(id => levelById(id).y);
    const shaft = liftShaft(p.x, p.z, Math.max(...ys), Math.min(...ys));
    root.add(shaft);
    togglables[l.levels[0]].push(shaft);
  }

  // ---- ground context: road strip south of the site
  const road = box(240, 0.1, 16, M.ground);
  road.position.set(0, 0.03, 34);
  root.add(road);

  // ---- platform face labels
  for (const lvl of LEVELS) {
    const spec = PLATFORMS[lvl.id];
    if (!spec) continue;
    const bx = BOXES[lvl.box];
    for (const f of spec.faces) {
      const edge = spec.kind === 'island' ? 4.4 : 8.6;
      const w = boxToWorld(bx, 0, f.side * edge);
      const line = LINES[f.line];
      labels.push({
        level: lvl.id,
        pos: new THREE.Vector3(w.x, lvl.y + 2.6, w.z),
        cls: 'plat',
        html: `<b>${f.num}</b> ${f.to.zh} ${f.to.en}`,
        css: `--c:${line.color}`,
      });
    }
  }

  return { root, levelGroups, togglables, labels };
}
