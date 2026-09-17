import * as THREE from 'three';
import { M, lineMat, mosaicMat } from './builders/materials.js';
import {
  STATIONS, LEVELS, BOXES, ESCALATORS, EXITS, LIFTS, PLATFORMS, LINES,
  ESC, LIFT_SIZE, FLOOR_H, SLAB_T, WALL_T, GATE_ROWS,
  boxToWorld, escalatorRuns, liftWorldRect, levelById,
} from './station-data.js';
import {
  floorSlab, walls, columns, lightStrips,
  boxRect, rectSubtract, worldRectToLocal, box,
} from './builders/structure.js';
import { platformLevel, benches } from './builders/platforms.js';
import { escalatorRun, runWorldRect, exitShaft, exitDoor, liftShaft, footbridge } from './builders/circulation.js';
import { makeSign, hangingSign, platformSign, exitTotem } from './builders/signage.js';
import { gateBank, serviceBooth, shops, toilets, kiosk, hvac, restaurant, mallEntrance, sevenEleven } from './builders/props.js';
import { calligraphy, posters, postersEnd, binPair, fireCabinets, mapBoard } from './builders/decor.js';
import { tunnelTube, trackExtension } from './builders/tracks.js';
import { linkCorridor, LINK, mefSubway } from './builders/link.js';
import { FITTINGS, solid, STAIR_RUNS } from './registry.js';

const INTERIOR_H = FLOOR_H - SLAB_T - 0.5;
const lvlOf = (stn, type) => STATIONS[stn].levels.find(l => l.type === type);
const uidOf = (stn, lvl) => `${stn}:${lvl.id}`;   // raw level entry -> uid

// ---- openings: which slabs/ceilings each circulation element pierces --------
export function computeOpenings() {
  const open = {};
  const add = (key, r) => (open[key] ??= []).push(r);

  for (const e of ESCALATORS) {
    // one open well per bank (union of the lanes' footprints) — kerbs on the
    // outer edges + the deep end only; the boarding end stays open to walk on.
    const horiz = Math.abs(e.dir[0]) >= Math.abs(e.dir[1]);
    const lat = horiz ? ['z0', 'z1'] : ['x0', 'x1'];
    const u = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
    let deepEnd = null, shallowEnd = null;
    for (const r of escalatorRuns(e)) {
      const wr = runWorldRect(r);
      u.x0 = Math.min(u.x0, wr.x0); u.x1 = Math.max(u.x1, wr.x1);
      u.z0 = Math.min(u.z0, wr.z0); u.z1 = Math.max(u.z1, wr.z1);
      deepEnd = horiz ? (r.x2 > r.x1 ? 'x1' : 'x0') : (r.z2 > r.z1 ? 'z1' : 'z0');
      shallowEnd = horiz ? (r.x2 > r.x1 ? 'x0' : 'x1') : (r.z2 > r.z1 ? 'z0' : 'z1');
    }
    if (levelById(e.to).y > levelById(e.from).y) {
      // ascending run (elevated platforms, e.g. CHW): the ramp pierces the
      // lower level's ceiling and emerges through the upper level's floor —
      // kerb the edge where the ramp dives away below the upper slab.
      add(e.from + ':ceil', { ...u, sides: lat });
      add(e.to, { ...u, sides: [...lat, shallowEnd] });
    } else {
      add(e.from, { ...u, sides: [...lat, deepEnd] });
      add(e.to + ':ceil', { ...u, sides: lat });
    }
  }
  for (const ex of EXITS) {
    const stn = STATIONS[ex.stn];
    const gLvl = lvlOf(ex.stn, 'ground') || lvlOf(ex.stn, 'checkin');
    const cLvl = lvlOf(ex.stn, 'concourse');
    if (!gLvl || !cLvl) continue;
    if (gLvl.type === 'checkin' || ex.door) continue;   // door exits pierce no slab
    const bx = BOXES[gLvl.box];
    const wx = bx.cx + ex.x;
    const dir = ex.side, cz = bx.cz + ex.side * ex.exitZ, half = ESC.runLen / 2;
    const run = { x1: wx, z1: cz - dir * half, x2: wx, z2: cz + dir * half, w: 2.4 };
    const wr = { ...runWorldRect(run, 0.9), sides: ['x0', 'x1'] };
    if (cLvl.y > gLvl.y) {
      // elevated concourse (HFC): the stair rises from the street onto the
      // deck — the opening is a slot in the deck floor, street slab stays whole
      add(uidOf(ex.stn, cLvl), wr);
    } else {
      add(uidOf(ex.stn, gLvl), wr);
      add(uidOf(ex.stn, cLvl) + ':ceil', wr);
    }
  }
  // arbitrary slab cuts (e.g. HFC's at-grade platform box cut from the apron)
  for (const stn of Object.values(STATIONS)) {
    for (const [lvlId, rects] of Object.entries(stn.slabCuts || {})) {
      const bx = BOXES[stn.levels.find(l => l.id === lvlId).box];
      for (const r of rects) {
        const a = boxToWorld(bx, r.x0, r.z0), b = boxToWorld(bx, r.x1, r.z1);
        add(`${stn.id}:${lvlId}`, {
          x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x),
          z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z), sides: [],
        });
      }
    }
  }
  for (const l of LIFTS) {
    const p = liftWorldRect(l);
    // kerb-free edge on the door face — the landing doors seal it instead
    const doorSide = (l.door ?? -(Math.sign(l.z) || 1)) > 0 ? 'z1' : 'z0';
    const wr = {
      x0: p.x - LIFT_SIZE.w / 2 - 0.2, x1: p.x + LIFT_SIZE.w / 2 + 0.2,
      z0: p.z - LIFT_SIZE.d / 2 - 0.2, z1: p.z + LIFT_SIZE.d / 2 + 0.2,
      sides: ['x0', 'x1', 'z0', 'z1'].filter(s => s !== doorSide),
    };
    // the shaft stands on the LOWEST landing's floor and pierces every
    // slab above it (incl. the top landing — the car emerges through it);
    // ceilings pierce below the top landing. Order l.levels by height so
    // ascending lifts (CHW's U1->U2) behave like descending ones.
    const byY = [...l.levels].sort((a, b) => levelById(b).y - levelById(a).y);
    byY.slice(0, -1).forEach(id => add(id, wr));       // pierced floor slabs
    byY.slice(1).forEach(id => add(id + ':ceil', wr)); // pierced ceilings
    // when the top landing IS the station's topmost level the shaft
    // overruns through its roof slab (elevated termini / HFC's deck)
    const topLvl = levelById(byY[0]);
    const above = LEVELS.some(l2 => l2.station === topLvl.station && l2.y > topLvl.y);
    if (!above) add(byY[0] + ':ceil', wr);
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

// ============================================================ level dressing
function dressPlatform(g, stn, lvl, spec, rect, floorHoles) {
  const single = spec.kind === 'single';
  const ps = single ? spec.single.side : 0;    // single-platform side (+z/-z)
  const liv = lvl.livery ?? stn.livery;
  const livMat = liv ? lineMat(liv) : M.column;
  // wall colour bands per face (each face's line on its platform-side wall)
  for (const f of spec.faces) {
    const band = box(rect.x1 - rect.x0 - 1, 1.1, 0.08, lineMat(LINES[f.line].color));
    band.position.set(0, 2.6, f.side * (Math.abs(rect.z1) - 0.55));
    g.add(band);
  }
  if (single) {
    // band on the track-side wall too — seen across the track
    const band = box(rect.x1 - rect.x0 - 1, 1.1, 0.08, lineMat(LINES[spec.faces[0].line].color));
    band.position.set(0, 2.6, -ps * (Math.abs(rect.z1) - 0.55));
    g.add(band);
  }
  const colZ = spec.kind === 'island' ? [0] : single ? [ps * 5.2] : [-10, 10];
  g.add(columns(rect, 0, colZ, 15, floorHoles, livMat));
  g.add(lightStrips(rect, 0, spec.kind === 'island' ? [0, -8.6, 8.6] : single ? [-4, 4.5] : [-10, 0, 10]));
  g.add(hvac(rect, 0, spec.kind === 'island' ? [0] : single ? [4] : [-10, 10]));
  // platform signage every ~38 m on each face, over the platform side
  const edge = spec.kind === 'island' ? 5.3 : single ? 1.6 : 7.6;
  for (const f of spec.faces) {
    for (const x of [-57, -19, 19, 57]) {
      const s = platformSign(f);
      s.position.set(x, 0, f.side * edge);
      s.rotation.y = f.side < 0 ? 0 : Math.PI;
      g.add(s);
    }
  }
  // level id plate on an end wall
  const end = makeSign({ zh: `${lvl.id}  ${lvl.zh}`, en: lvl.en, w: 9, h: 1.8 });
  end.position.set(-rect.x1 + 1.2, 3.2, 0);
  end.rotation.y = Math.PI / 2;
  g.add(end);
  g.add(calligraphy(rect, 0, stn, liv));
  for (const s of [-1, 1]) {
    g.add(posters(rect.x0 + 34, rect.x1 - 34, s * (Math.abs(rect.z1) - 0.62), 0, s < 0 ? 0 : Math.PI, 38));
    g.add(fireCabinets(rect.x0, rect.x1, s * (Math.abs(rect.z1) - 0.68), 0, 56));
    for (const mx of [rect.x0 + 20, rect.x1 - 20]) {
      g.add(mapBoard(mx, s * (Math.abs(rect.z1) - 0.62), 0, s < 0 ? 0 : Math.PI, 4.25));
    }
  }
  const binZ = spec.kind === 'island' ? 1.5 : single ? ps * 5 : 10.9;
  for (const bx of [-50, -20, 10, 40]) g.add(binPair(bx, binZ, 0));
}

function dressConcourse(g, stn, lvl, rect, floorHoles, bx) {
  const tint = (r, mat) => {
    const t = box(r.x1 - r.x0, 0.02, r.z1 - r.z0, mat);
    t.position.set((r.x0 + r.x1) / 2, 0.02, (r.z0 + r.z1) / 2);
    g.add(t);
  };
  const gateRows = stn.gateRows || [];
  const gateZ = gateRows.length ? Math.abs(gateRows[0].z) : 9.4;
  // where the paid strip ends in x: 'wall' runs the gate lines into the end
  // wall (the CEN/HOK subway mouths sit inside paid); otherwise the strip is
  // capped at the outermost gate bank and the unpaid band wraps the end —
  // the yellow ring around the paid blob on the official plans
  const ge = stn.gateEnds || {};
  const open0 = ge.x0 === 'wall', open1 = ge.x1 === 'wall';
  const capX0 = !gateRows.length ? rect.x0 + 0.6
    : open0 ? rect.x0 + 0.6 : (ge.x0 ?? Math.min(...gateRows.map(r => r.x0)));
  const capX1 = !gateRows.length ? rect.x1 - 0.6
    : open1 ? rect.x1 - 0.6 : (ge.x1 ?? Math.max(...gateRows.map(r => r.x1)));
  for (const r of rectSubtract({ x0: capX0 + (open0 ? 1.4 : 0.25), x1: capX1 - (open1 ? 1.4 : 0.25), z0: -gateZ + 0.4, z1: gateZ - 0.4 }, floorHoles)) tint(r, M.paid);
  for (const s of [-1, 1]) {
    const a = s * (gateZ - 2.75), b = s * (Math.abs(rect.z1) - 0.8);
    for (const r of rectSubtract({ x0: rect.x0 + 2, x1: rect.x1 - 2, z0: Math.min(a, b), z1: Math.max(a, b) }, floorHoles)) tint(r, M.unpaid);
  }
  // unpaid tint wraps the strip's ends where the caps fall short of the walls
  for (const [xa, xb] of [[rect.x0 + 2, capX0 - 0.25], [capX1 + 0.25, rect.x1 - 2]]) {
    if (xb - xa < 0.6) continue;
    for (const r of rectSubtract({ x0: xa, x1: xb, z0: -gateZ + 0.4, z1: gateZ - 0.4 }, floorHoles)) tint(r, M.unpaid);
  }
  // shop rows skip exit stairs + reserved units on each side, plus any lift
  // shaft standing in that side's unpaid band (Wan Chai's street lift)
  const exitsHere = EXITS.filter(e => e.stn === stn.id && !e.door);
  const liftsHere = LIFTS.filter(l => l.stn === stn.id && l.levels.includes(lvl.uid) && Math.abs(l.z) > gateZ);
  const reserved = (stn.restaurants || []).concat(stn.mall ? [stn.mall] : [], stn.seven ? [stn.seven] : []);
  for (const s of [-1, 1]) {
    const gaps = {
      exits: exitsHere.filter(e => e.side === s).map(e => e.x)
        .concat(liftsHere.filter(l => Math.sign(l.z) === s).map(l => l.x)),
      reserved: reserved.filter(r => r.side === s),
    };
    g.add(shops(rect.x0 + 8, rect.x1 - 10, s * (Math.abs(rect.z1) - 3.4), 0, -s, gaps));
  }
  for (const r of gateRows) g.add(gateBank(r.x0, r.x1, r.z, 0, bx, lvl.uid));
  // glass railings seal the rest of each gate line — wall to wall between and
  // beyond the banks — so the only way through is a gate lane
  const rail = (x0, z0, x1, z1) => {
    if (x1 - x0 < 0.4 && z1 - z0 < 0.4) return;
    const w = Math.max(x1 - x0, 0.16), d = Math.max(z1 - z0, 0.16);
    const pane = box(w, 1.02, d, M.balGlass);
    pane.position.set((x0 + x1) / 2, 0.55, (z0 + z1) / 2);
    const top = box(w, 0.09, d, M.signPost);
    top.position.set((x0 + x1) / 2, 1.11, (z0 + z1) / 2);
    g.add(solid(pane), solid(top));
  };
  // a rail never spans a floor opening (escalator wells crossing the line)
  const clipRail = (isX, fixed, a0, a1) => {
    let segs = [[a0, a1]];
    for (const h of floorHoles) {
      const lo = isX ? h.z0 : h.x0, hi = isX ? h.z1 : h.x1;
      if (!(lo < fixed && fixed < hi)) continue;
      const h0 = (isX ? h.x0 : h.z0) - 0.4, h1 = (isX ? h.x1 : h.z1) + 0.4;
      segs = segs.flatMap(([s0, s1]) =>
        h1 <= s0 || h0 >= s1 ? [[s0, s1]] : [[s0, h0], [h1, s1]].filter(([a, b]) => b - a > 0.5));
    }
    return segs;
  };
  const byZ = new Map();
  for (const r of gateRows) byZ.set(r.z, [...(byZ.get(r.z) || []), r]);
  for (const [zf, rows] of byZ) {
    rows.sort((a, b) => a.x0 - b.x0);
    let cur = capX0;
    for (const r of rows) {
      for (const [a, b] of clipRail(true, zf, cur, r.x0)) rail(a, zf - 0.08, b, zf + 0.08);
      cur = Math.max(cur, r.x1);
    }
    for (const [a, b] of clipRail(true, zf, cur, capX1)) rail(a, zf - 0.08, b, zf + 0.08);
  }
  // end caps close the strip where it stops short of a wall — the unpaid
  // band wraps around them, like the yellow blob on the official plans
  for (const [xf, open] of [[capX0, open0 || !gateRows.length], [capX1, open1 || !gateRows.length]]) {
    if (open) continue;
    for (const [a, b] of clipRail(false, xf, -gateZ, gateZ)) rail(xf - 0.08, a, xf + 0.08, b);
  }
  // dedicated tenants (Admiralty's restaurant row / mall / 7-Eleven)
  for (const r of stn.restaurants || []) g.add(restaurant(r, r.side * (Math.abs(rect.z1) - 3.4), 0, -r.side));
  if (stn.mall) g.add(mallEntrance(stn.mall.x, stn.mall.side * (Math.abs(rect.z1) - 3.4), 0, -stn.mall.side, stn.mall));
  if (stn.seven) g.add(sevenEleven(stn.seven.x, stn.seven.side * (Math.abs(rect.z1) - 3.4), 0, -stn.seven.side));
  // kiosk / booth / toilet positions dodge the exit stair shafts that
  // descend into the concourse (shaft x = exit.x ±1.7, z = ±exitZ∓6.3)
  const kioskXs = stn.kioskXs ?? (stn.id === 'ADM' ? [-52, -14, 33, 48] : [-40, -5, 35]);
  for (const [i, x] of kioskXs.entries()) g.add(kiosk(x, -(gateZ + 3.8), 0, i + 2));
  for (const [i, x] of (stn.kioskXsS ?? (stn.id === 'ADM' ? [-60, -20, 25, 62] : [-50, 15, 58])).entries()) g.add(kiosk(x, gateZ + 3.8, 0, i + 5));
  g.add(serviceBooth(0, gateZ + 3.6, 0));
  g.add(serviceBooth(-36, -(gateZ + 3.6), 0));
  g.add(hangingSign({ zh: '客務中心', en: 'Customer Service', w: 5.5, h: 1.2 }, 0, 3.0, gateZ + 3.6));
  g.add(hangingSign({ zh: '客務中心', en: 'Customer Service', w: 5.5, h: 1.2 }, -36, 3.0, -(gateZ + 3.6)));
  g.add(toilets(stn.id === 'CEN' ? rect.x0 + 18.5 : rect.x0 + 15, -(gateZ + 4.6), 0));
  // end-wall ads + system map + bins + fire cabinets
  g.add(postersEnd(rect, 0, -1, rect.z0 + 4, rect.z1 - 4, 12));
  g.add(postersEnd(rect, 0, 1, rect.z0 + 4, 0, 12));
  g.add(mapBoard(rect.x1 - 0.7, 9, 0, -Math.PI / 2));
  g.add(mapBoard(rect.x1 - 0.7, -4, 0, -Math.PI / 2));
  g.add(mapBoard(rect.x0 + 0.7, 8, 0, Math.PI / 2));
  for (const s of [-1, 1]) {
    g.add(fireCabinets(rect.x0, rect.x1, s * (Math.abs(rect.z1) - 0.68), 0, 60));
    // bins dodge that side's exit stair shafts too (they descend into the band)
    const shaftXs = exitsHere.filter(e => e.side === s).map(e => e.x);
    for (const bx2 of [-56, -4, 56]) {
      if (shaftXs.some(x => Math.abs(x - bx2) < 3.4)) continue;
      g.add(binPair(bx2, s * (gateZ + 2.4), 0));
    }
  }
  // keep columns out of the exit stair shafts (they land inside the concourse)
  // and out of lift shafts that stand on this floor without piercing it
  const exitHoles = exitsHere.map(ex => {
    const cz = ex.side * ex.exitZ, half = ESC.runLen / 2;
    return { x0: ex.x - 2.2, x1: ex.x + 2.2, z0: cz - half - 0.6, z1: cz + half + 0.6 };
  }).concat(liftsHere.map(l => {
    const p = liftWorldRect(l);
    return worldRectToLocal(bx, {
      x0: p.x - LIFT_SIZE.w / 2 - 0.4, x1: p.x + LIFT_SIZE.w / 2 + 0.4,
      z0: p.z - LIFT_SIZE.d / 2 - 0.4, z1: p.z + LIFT_SIZE.d / 2 + 0.4,
    });
  }));
  // station-colour columns + a mosaic fascia band along both long walls —
  // the way real MTR concourses carry the station livery without tiling
  // every surface
  const livMat = stn.livery ? lineMat(stn.livery) : M.column;
  for (const s of [-1, 1]) {
    const band = box(rect.x1 - rect.x0 - 1, 0.9, 0.08,
      mosaicMat(stn.livery || '#8a9096', Math.max(2, Math.round((rect.x1 - rect.x0) / 9.6)), 1));
    band.position.set(0, 4.75, s * (Math.abs(rect.z1) - 0.56));
    g.add(band);
  }
  g.add(columns(rect, 0, [-16, -5.5, 5.5, 16], 16, [...floorHoles, ...exitHoles], livMat));
  g.add(lightStrips(rect, 0, [-15, -5, 5, 15]));
  g.add(hvac(rect, 0, [-10, 0, 10]));
  // line chips this station serves
  const chips = [];
  for (const spec of Object.values(stn.platforms || {}))
    for (const f of spec.faces)
      if (!chips.some(c => c.text === f.line)) chips.push({ text: f.line, color: LINES[f.line].color });
  for (const x of [-52, 0, 52]) {
    const s = makeSign({ zh: '往各月台', en: 'To Platforms', chips, w: 8, h: 1.5 });
    s.position.set(x, 3.6, -6);
    g.add(s);
  }
  const letters = stn.exitLetters || [];
  for (const [x, z] of [[-20, 8], [30, -8]]) {
    const exitSign = makeSign({
      zh: '出口', en: 'Exits',
      chips: letters.map(t => ({ text: t, color: '#e2231a' })),
      w: 11, h: 1.5,
    });
    exitSign.position.set(x, 3.6, z);
    g.add(exitSign);
  }
  // Central's west end opens onto the HK Station travellator subway
  if (stn.id === 'CEN') {
    const s = makeSign({
      zh: '往香港站・機場快綫/東涌綫', en: 'Subway to Hong Kong Station · AEX / TCL',
      chips: [{ text: 'AEX', color: LINES.AEX.color }, { text: 'TCL', color: LINES.TCL.color }],
      w: 10, h: 1.5,
    });
    s.position.set(rect.x0 + 6, 3.6, 3);
    s.rotation.y = Math.PI / 2;
    g.add(s);
  }
}

// Admiralty L4 transfer lobby (paid corridor feeding the EAL/SIL shaft)
function dressLobby(g, stn, lvl, rect, floorHoles) {
  for (const r of rectSubtract({ x0: rect.x0 + 2, x1: rect.x1 - 2, z0: -11, z1: 11 }, floorHoles)) {
    const t = box(r.x1 - r.x0, 0.02, r.z1 - r.z0, M.paid);
    t.position.set((r.x0 + r.x1) / 2, 0.02, (r.z0 + r.z1) / 2);
    g.add(t);
  }
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
  g.add(mapBoard(rect.x0 + 0.7, -10, 0, Math.PI / 2));
  g.add(mapBoard(rect.x0 + 0.7, 10, 0, Math.PI / 2));
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

// HK Station ground-level in-town check-in hall: glazed walls with doorway
// exits, airline check-in counter rows, baggage drops and shop pods.
function dressCheckin(g, stn, lvl, rect, floorHoles, bx) {
  // check-in counter rows down the hall — twin counters + baggage belts
  const ctr = new THREE.Group();
  for (const z of [-10, -4, 4, 10]) {
    for (let x = rect.x0 + 26; x < rect.x1 - 30; x += 26) {
      const desk = box(9, 1.05, 1.4, M.booth);
      desk.position.set(x, 0.55, z);
      const belt = box(9, 0.5, 0.8, M.stepMetal);
      belt.position.set(x, 0.3, z + 1.35);
      ctr.add(solid(desk), solid(belt));
      const scr = box(0.5, 0.42, 0.06, M.signPost);
      scr.position.set(x - 3.4, 1.45, z);
      ctr.add(scr);
    }
  }
  g.add(ctr);
  // overhead airline-style signs
  for (const x of [-50, 0, 50]) {
    const s = makeSign({
      zh: '市區預辦登機 In-town Check-in', en: 'Drop bags · Board Airport Express',
      chips: [{ text: 'AEX', color: LINES.AEX.color }],
      w: 11, h: 1.5,
    });
    s.position.set(x, 3.8, 0);
    g.add(s);
  }
  for (const [i, x] of [-58, -18, 22, 58].entries()) g.add(kiosk(x, 14.5, 0, i + 3));
  g.add(serviceBooth(0, -14.5, 0));
  g.add(hangingSign({ zh: '客務中心', en: 'Customer Service', w: 5.5, h: 1.2 }, 0, 3.0, -14.5));
  g.add(toilets(rect.x0 + 14, -14.5, 0));
  for (const s of [-1, 1]) {
    g.add(posters(rect.x0 + 30, rect.x1 - 30, s * (Math.abs(rect.z1) - 0.62), 0, s < 0 ? 0 : Math.PI, 34));
    g.add(mapBoard(rect.x1 - 0.7, s * 8, 0, -Math.PI / 2));
    for (const bx2 of [-40, 0, 40]) g.add(binPair(bx2, s * 16.5, 0));
  }
  g.add(columns(rect, 0, [-16, 0, 16], 20, floorHoles));
  g.add(lightStrips(rect, 0, [-20, -7, 7, 20], 16));
  g.add(hvac(rect, 0, [-12, 0, 12]));
}

// ============================================================== main build
export function buildStation() {
  const root = new THREE.Group();
  const openings = computeOpenings();
  const levelGroups = {};   // level uid -> group (visibility toggling)
  const togglables = {};    // level uid -> extra world-space objects
  const labels = [];
  const liftDefs = [];      // world-space lift shafts -> anim/lifts.js cars

  for (const lvl of LEVELS) {
    togglables[lvl.uid] = [];
    if (lvl.type === 'bridge') {
      const g = footbridge();
      levelGroups[lvl.uid] = g;
      root.add(g);
      labels.push({ level: lvl.uid, pos: new THREE.Vector3(0, lvl.y + 3, -36), cls: 'lvl', html: `${lvl.id} ${lvl.zh} ${lvl.en}` });
      continue;
    }

    const bx = BOXES[lvl.box];
    const stn = STATIONS[lvl.station];
    const g = new THREE.Group();
    g.position.set(bx.cx, lvl.y, bx.cz);
    g.rotation.y = bx.rot;
    const rect = boxRect(bx);
    const floorHoles = localHoles(openings, lvl.uid, bx);
    const ceilHoles = localHoles(openings, lvl.uid + ':ceil', bx);

    // circulation that STANDS on this slab without piercing it — escalator
    // arrivals AND (for ascending runs) boarding mouths, plus lift-shaft
    // bases. Columns must dodge these too or they sprout mid-well on island
    // platforms. (Exit stairs are dodged separately via exitHoles —
    // STAIR_RUNS fills lazily during this loop.)
    const standHoles = [...floorHoles];
    for (const e of ESCALATORS) {
      const arrives = e.to === lvl.uid;
      const boardsUp = e.from === lvl.uid && levelById(e.to).y > lvl.y;
      if (!arrives && !boardsUp) continue;
      for (const r of escalatorRuns(e))
        standHoles.push(worldRectToLocal(bx, runWorldRect(r, 1.1)));
    }
    for (const l of LIFTS) {
      // the shaft stands on its lowest landing's floor
      const lowest = l.levels.reduce((a, b) => levelById(a).y <= levelById(b).y ? a : b);
      if (lowest !== lvl.uid) continue;
      const p = liftWorldRect(l);
      standHoles.push(worldRectToLocal(bx, {
        x0: p.x - LIFT_SIZE.w / 2 - 0.4, x1: p.x + LIFT_SIZE.w / 2 + 0.4,
        z0: p.z - LIFT_SIZE.d / 2 - 0.4, z1: p.z + LIFT_SIZE.d / 2 + 0.4,
      }));
    }

    // ---- platform levels: troughs + PSD + markings
    let trackRects = [];
    if (lvl.type === 'platform') {
      const built = platformLevel(lvl, rect);
      trackRects = built.trackRects;
      g.add(built.fittings);
      FITTINGS[lvl.uid] = { doorSets: built.doorSets };
    }

    const floorMat = lvl.type === 'platform' ? M.platFloor
      : lvl.type === 'concourse' || lvl.type === 'checkin' ? M.concFloor
      : lvl.type === 'ground' ? M.pavement : M.floor;
    g.add(floorSlab(rect, [...floorHoles, ...trackRects], 0, floorMat, { kerbs: lvl.type !== 'ground' }));

    if (lvl.type !== 'ground') {
      const portalsX = trackRects.map(tr => ({ z0: tr.z0 + 0.2, z1: tr.z1 - 0.2, h: 4.4 }));
      // pedestrian-link portals on the levels the subway mouths into
      if (lvl.uid === 'CEN:L1') portalsX.push({ z0: LINK.z0 + 0.15, z1: LINK.z1 - 0.15, h: 3.4, end: 'x0' });
      if (lvl.uid === 'HOK:L1') portalsX.push({ z0: LINK.z0 + 0.15, z1: LINK.z1 - 0.15, h: 3.4, end: 'x1' });
      // MEF's L1 subway mouths through the TWL concourse west wall
      if (lvl.uid === 'MEF:L1') portalsX.push({ z0: -11.5, z1: -4.5, h: 3.4, end: 'x0' });
      if (lvl.type === 'checkin') {
        // glazed hall — street doorway openings in the glazed frontage
        const doorsZ = stn.exits.map(ex => ({
          x0: ex.x - 2.6, x1: ex.x + 2.6, h: 3.0, side: ex.side < 0 ? 'z0' : 'z1',
        }));
        g.add(walls(rect, 0, INTERIOR_H, M.glassDark, portalsX, doorsZ));
      } else {
        // platform levels get the station's mosaic-tile livery on every wall
        // (that's the surface the calligraphy plates sit on); other levels
        // keep neutral panels — concourses carry colour via columns/bands
        const liv = lvl.type === 'platform' ? (lvl.livery ?? stn.livery) : null;
        // street-door mouths for at-grade boxes (MEF's TML shed) — the
        // `door` exits list them; the frames/totems build in the exit loop
        const doorsZ = EXITS.filter(e => e.door && e.stn === stn.id && e.box === lvl.box)
          .map(ex => ({ x0: ex.x - 2.3, x1: ex.x + 2.3, h: 3.2, side: ex.side < 0 ? 'z0' : 'z1' }));
        g.add(walls(rect, 0, INTERIOR_H, M.wall, portalsX, doorsZ, liv));
      }
      g.add(ceilingWithHoles(rect, ceilHoles, 0));
      for (const tr of trackRects) {
        if (lvl.y < -0.5) {          // underground — bored tubes past the portals
          g.add(tunnelTube(tr, 0, 1));
          g.add(tunnelTube(tr, 0, -1));
        } else {                     // at-grade/elevated — open track continues
          const tail = PLATFORMS[lvl.uid]?.tail ?? 0;   // buffered overrun end
          g.add(trackExtension(tr, 0, 1, lvl.y, { buffer: tail === 1, len: tail === 1 ? 88 : 52 }));
          g.add(trackExtension(tr, 0, -1, lvl.y, { buffer: tail === -1, len: tail === -1 ? 88 : 52 }));
        }
      }
    }

    // ---- per-level dressing (columns dodge slabs' holes AND arrivals)
    if (lvl.type === 'platform') dressPlatform(g, stn, lvl, PLATFORMS[lvl.uid], rect, standHoles);
    else if (lvl.type === 'concourse') dressConcourse(g, stn, lvl, rect, standHoles, bx);
    else if (lvl.type === 'lobby') dressLobby(g, stn, lvl, rect, standHoles);
    else if (lvl.type === 'checkin') dressCheckin(g, stn, lvl, rect, standHoles, bx);

    // elevated slab support: 'podium' = an inset station block under the
    // slab (down to grade) plus a colonnade at the slab edge so the
    // cantilevered gallery reads as held up (CHW's building-under-viaduct)
    if (lvl.podium != null && lvl.y > 0) {
      const inset = lvl.podium, top = -SLAB_T, bot = -lvl.y;
      const h = top - bot, cy = bot + h / 2;
      const zi = Math.abs(rect.z1) - inset, xi = rect.x1 - inset;
      for (const s of [-1, 1]) {
        const wz = box(xi * 2, h, WALL_T, M.wallDark);
        wz.position.set((rect.x0 + rect.x1) / 2, cy, s * zi);
        g.add(solid(wz));
        const wx = box(WALL_T, h, zi * 2, M.wallDark);
        wx.position.set(s * xi, cy, 0);
        g.add(solid(wx));
        // colonnade under the cantilevered slab edge — skip exit slots
        const exitsSide = (stn.exits || []).filter(ex => Math.sign(ex.side) === s).map(ex => ex.x);
        for (let x = rect.x0 + 7; x < rect.x1 - 4; x += 16) {
          if (exitsSide.some(ex => Math.abs(x - ex) < 4.2)) continue;
          const c = box(0.7, h - 0.4, 0.7, M.column);
          c.position.set(x, bot + h / 2 - 0.2, s * (Math.abs(rect.z1) - 0.9));
          g.add(solid(c));
        }
      }
    }

    levelGroups[lvl.uid] = g;
    root.add(g);

    // slab edge hover target + level label anchor at NE corner (world)
    const corner = boxToWorld(bx, rect.x1, rect.z0);
    labels.push({ level: lvl.uid, pos: new THREE.Vector3(corner.x, lvl.y + 1.2, corner.z), cls: 'lvl', html: `${lvl.id} ${lvl.zh} ${lvl.en}` });
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
    const stn = STATIONS[ex.stn];
    const gLvl = lvlOf(ex.stn, 'ground') || lvlOf(ex.stn, 'checkin');
    const cLvl = lvlOf(ex.stn, 'concourse');
    // `door` exits (MEF's TML shed) hang on the level owning their box
    const dLvl = ex.door ? LEVELS.find(l => l.station === ex.stn && l.box === ex.box) : gLvl;
    const bx = BOXES[ex.door ? ex.box : gLvl.box];
    const wx = bx.cx + ex.x;                       // boxes are all unrotated
    const cz = bx.cz + ex.side * ex.exitZ;
    const gUid = uidOf(ex.stn, gLvl);
    if (gLvl.type === 'checkin' || ex.door) {
      // street doorway in the hall/shed's glazed frontage (at the wall)
      const dz = bx.cz + ex.side * (bx.wid / 2);
      const d = exitDoor({ ...ex, x: wx, z: dz }, dLvl.y, dLvl.uid ?? uidOf(ex.stn, dLvl));
      root.add(d.group);
      togglables[dLvl.uid ?? uidOf(ex.stn, dLvl)].push(d.group);
      const totem = exitTotem({ ...ex, x: wx });
      totem.position.set(wx + 5.5, dLvl.y, dz + ex.side * 1.6);
      root.add(totem);
      togglables[dLvl.uid ?? uidOf(ex.stn, dLvl)].push(totem);
      labels.push({ level: dLvl.uid ?? uidOf(ex.stn, dLvl), pos: new THREE.Vector3(wx, dLvl.y + 4.6, dz + ex.side * 1.6), cls: 'exit', html: `出 ${ex.id} ${ex.en}` });
      continue;
    }
    const s = exitShaft({ ...ex, x: wx, z: cz }, gLvl.y, cLvl.y, gUid, uidOf(ex.stn, cLvl));
    root.add(s.group);
    togglables[gUid].push(s.group);
    // `up` exits (elevated concourse, e.g. HFC) put the street mouth at the
    // far end of the shaft; underground exits put it at the near end
    const mz = cz + ex.side * (ESC.runLen / 2 + 0.5) * (cLvl.y > gLvl.y ? 1 : -1);
    const totem = exitTotem({ ...ex, x: wx });
    totem.position.set(wx + 5.5, gLvl.y, mz);
    root.add(totem);
    togglables[gUid].push(totem);
    // stagger adjacent exits so the floating tags don't overlap each other
    const ly = gLvl.y + 5.4 + (i % 2) * 1.6;
    labels.push({ level: gUid, pos: new THREE.Vector3(wx, ly, mz), cls: 'exit', html: `出 ${ex.id} ${ex.en}` });
  }
  for (const l of LIFTS) {
    const p = liftWorldRect(l);
    const levels = l.levels.map(id => ({ uid: id, y: levelById(id).y }))
      .sort((a, b) => b.y - a.y);   // LiftSim expects landings top→bottom
    // doorway faces the box centre unless the entry says otherwise
    const door = l.door ?? -(Math.sign(l.z) || 1);
    const ys = levels.map(l2 => l2.y);
    const shaft = liftShaft(p.x, p.z, Math.max(...ys), Math.min(...ys), door, ys);
    root.add(shaft);
    togglables[l.levels[0]].push(shaft);
    liftDefs.push({ x: p.x, z: p.z, door, levels });
  }

  // ---- Central <-> HK Station travellator subway (tagged to CEN:L1)
  const link = linkCorridor();
  root.add(link);
  togglables['CEN:L1'].push(link);

  // ---- Mei Foo TWL <-> Tuen Ma subway (tagged to MEF:L1)
  const mefLink = mefSubway();
  root.add(mefLink);
  togglables['MEF:L1'].push(mefLink);

  // ---- ground context: a road strip along each station's ground slab
  for (const lvl of LEVELS.filter(l => l.type === 'ground' || l.type === 'checkin')) {
    const bx = BOXES[lvl.box];
    const road = box(bx.len + 60, 0.1, 16, M.ground);
    const rc = boxToWorld(bx, 0, (bx.wid / 2 - 6) * (STATIONS[lvl.station].roadSide ?? 1));
    road.position.set(rc.x, lvl.y + 0.03, rc.z);
    road.rotation.y = bx.rot;
    root.add(road);
  }

  // ---- platform face labels
  for (const lvl of LEVELS) {
    const spec = PLATFORMS[lvl.uid];
    if (!spec) continue;
    const bx = BOXES[lvl.box];
    for (const f of spec.faces) {
      const edge = spec.kind === 'island' ? 4.4 : spec.kind === 'single' ? 1.2 : 8.6;
      const w = boxToWorld(bx, 0, f.side * edge);
      const line = LINES[f.line];
      labels.push({
        level: lvl.uid,
        pos: new THREE.Vector3(w.x, lvl.y + 2.6, w.z),
        cls: 'plat',
        html: `<b>${f.num}</b> ${f.to.zh} ${f.to.en}`,
        css: `--c:${line.color}`,
      });
    }
  }

  return { root, levelGroups, togglables, labels, liftDefs };
}
