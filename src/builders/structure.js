import * as THREE from 'three';
import { M } from './materials.js';
import { FLOOR_H, SLAB_T, WALL_T, BOXES, worldToBox } from '../station-data.js';
import { solid, walkable } from '../registry.js';

// ---------- rect helpers (all rects are {x0,z0,x1,z1} in a level's LOCAL frame)

export function rectSubtract(rect, holes) {
  let out = [rect];
  for (const h of holes) {
    const next = [];
    for (const r of out) {
      if (h.x1 <= r.x0 || h.x0 >= r.x1 || h.z1 <= r.z0 || h.z0 >= r.z1) { next.push(r); continue; }
      if (h.x0 > r.x0) next.push({ x0: r.x0, z0: r.z0, x1: h.x0, z1: r.z1 });
      if (h.x1 < r.x1) next.push({ x0: h.x1, z0: r.z0, x1: r.x1, z1: r.z1 });
      const ix0 = Math.max(r.x0, h.x0), ix1 = Math.min(r.x1, h.x1);
      if (h.z0 > r.z0) next.push({ x0: ix0, z0: r.z0, x1: ix1, z1: h.z0 });
      if (h.z1 < r.z1) next.push({ x0: ix0, z0: h.z1, x1: ix1, z1: r.z1 });
    }
    out = next;
  }
  return out.filter(r => r.x1 - r.x0 > 0.01 && r.z1 - r.z0 > 0.01);
}

export function pointInRects(x, z, rects) {
  return rects.some(h => x > h.x0 - 0.6 && x < h.x1 + 0.6 && z > h.z0 - 0.6 && z < h.z1 + 0.6);
}

// world-space AABB of a run/shaft -> local rect of the given box frame
export function worldRectToLocal(box, wr) {
  const pts = [
    worldToBox(box, wr.x0, wr.z0), worldToBox(box, wr.x1, wr.z0),
    worldToBox(box, wr.x0, wr.z1), worldToBox(box, wr.x1, wr.z1),
  ];
  return {
    x0: Math.min(...pts.map(p => p.x)), x1: Math.max(...pts.map(p => p.x)),
    z0: Math.min(...pts.map(p => p.z)), z1: Math.max(...pts.map(p => p.z)),
    sides: wr.sides,
  };
}

export function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------- floor slab: pieces tiling `rect` minus `holes`, top surface at y
export function floorSlab(rect, holes, y, finishMat, opts = {}) {
  const g = new THREE.Group();
  const pieces = rectSubtract(rect, holes);
  const subT = SLAB_T - 0.14;
  for (const r of pieces) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const base = box(w, subT, d, M.slabEdge); base.position.set(cx, y - SLAB_T + subT / 2, cz);
    const top = box(w, 0.14, d, finishMat);  top.position.set(cx, y - 0.07, cz);
    g.add(base, top);
    if (opts.walkable !== false) walkable(top);
  }
  // well kerbs: low parapet around each opening (only on sides listed in h.sides)
  if (opts.kerbs !== false) {
    for (const h of holes) {
      g.add(kerb(h, y));
    }
  }
  return g;
}

function kerb(h, y) {
  const g = new THREE.Group();
  const t = 0.12, kh = 0.55;
  const sideSpans = {
    z0: [h.x0, h.z0, h.x1, h.z0], z1: [h.x0, h.z1, h.x1, h.z1],
    x0: [h.x0, h.z0, h.x0, h.z1], x1: [h.x1, h.z0, h.x1, h.z1],
  };
  const sides = h.sides ?? ['z0', 'z1', 'x0', 'x1'];
  for (const s of sides) {
    const [x0, z0, x1, z1] = sideSpans[s];
    const w = Math.max(Math.abs(x1 - x0), t), d = Math.max(Math.abs(z1 - z0), t);
    const k = box(w, kh, d, M.glass);
    k.position.set((x0 + x1) / 2, y + kh / 2, (z0 + z1) / 2);
    g.add(solid(k));
  }
  return g;
}

// ---------- perimeter walls: 4 sides of rect, from y up `height`
// portalsX: [{z0,z1,h,end}] openings in the X-end walls (train tracks,
// link corridors). end: 'x0' | 'x1' | 'both' (default) selects the wall(s).
// portalsZ: [{x0,x1,h,side}] openings in the Z-side walls (street doorways).
// side: 'z0' | 'z1' | 'both' (default).
export function walls(rect, y, height = FLOOR_H - SLAB_T - 0.5, mat = M.wall, portalsX = [], portalsZ = []) {
  const g = new THREE.Group();
  const t = WALL_T, cy = y + height / 2;
  const mk = (w, d, cx, cz, h = height) => {
    const m = box(w, h, d, mat); m.position.set(cx, y + h / 2, cz); g.add(solid(m));
  };
  for (const zSide of [rect.z0, rect.z1]) {
    const sideKey = zSide === rect.z0 ? 'z0' : 'z1';
    const openings = portalsZ.filter(p => !p.side || p.side === 'both' || p.side === sideKey);
    const zw = zSide + (zSide === rect.z0 ? t / 2 : -t / 2);
    const xs = [{ x0: rect.x0, x1: rect.x1 }];
    for (const p of openings) {
      const i = xs.findIndex(s => s.x0 <= p.x0 && s.x1 >= p.x1);
      if (i < 0) continue;
      const s = xs.splice(i, 1)[0];
      if (p.x0 > s.x0) xs.push({ x0: s.x0, x1: p.x0 });
      if (p.x1 < s.x1) xs.push({ x0: p.x1, x1: s.x1 });
    }
    for (const s of xs) mk(s.x1 - s.x0, t, (s.x0 + s.x1) / 2, zw);
    for (const p of openings) {
      const lh = height - p.h;
      if (lh <= 0) continue;
      const m = box(p.x1 - p.x0, lh, t, mat);
      m.position.set((p.x0 + p.x1) / 2, y + p.h + lh / 2, zw);
      g.add(solid(m));
    }
  }
  for (const xSide of [rect.x0, rect.x1]) {
    const endKey = xSide === rect.x0 ? 'x0' : 'x1';
    const openings = portalsX.filter(p => !p.end || p.end === 'both' || p.end === endKey);
    const xw = xSide + (xSide === rect.x0 ? t / 2 : -t / 2);
    // solid segments between portal openings
    const zs = [{ z0: rect.z0, z1: rect.z1 }];
    for (const p of openings) {
      const i = zs.findIndex(s => s.z0 <= p.z0 && s.z1 >= p.z1);
      if (i < 0) continue;
      const s = zs.splice(i, 1)[0];
      if (p.z0 > s.z0) zs.push({ z0: s.z0, z1: p.z0 });
      if (p.z1 < s.z1) zs.push({ z0: p.z1, z1: s.z1 });
    }
    for (const s of zs) mk(t, s.z1 - s.z0, xw, (s.z0 + s.z1) / 2);
    // lintels above each portal
    for (const p of openings) {
      const lh = height - p.h;
      if (lh <= 0) continue;
      const m = box(t, lh, p.z1 - p.z0, mat);
      m.position.set(xw, y + p.h + lh / 2, (p.z0 + p.z1) / 2);
      g.add(solid(m));
    }
  }
  return g;
}

// line-colour band along two long walls (platform levels)
export function wallBand(rect, y, hexColor) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(hexColor), roughness: 0.5 });
  for (const s of [-1, 1]) {
    const band = box(rect.x1 - rect.x0 - 1, 1.1, 0.08, mat);
    band.position.set((rect.x0 + rect.x1) / 2, y + 2.6, s * (Math.abs(rect.z1) - WALL_T - 0.04));
    g.add(band);
  }
  return g;
}

// ---------- ceiling slab: cover rect at interior top (y + FLOOR_H - SLAB_T)
export function ceiling(rect, y, mat = M.ceiling) {
  const h = 0.45;
  const m = box(rect.x1 - rect.x0, h, rect.z1 - rect.z0, mat);
  m.position.set((rect.x0 + rect.x1) / 2, y + FLOOR_H - SLAB_T - h / 2 - 0.02, (rect.z0 + rect.z1) / 2);
  return m;
}

// ---------- columns on a grid, skipping floor openings
export function columns(rect, y, zs, spacing, holes = []) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(0.9, FLOOR_H - SLAB_T - 0.5, 0.9);
  for (const z of zs) {
    for (let x = rect.x0 + spacing / 2; x < rect.x1 - 1; x += spacing) {
      if (pointInRects(x, z, holes)) continue;
      const c = new THREE.Mesh(geo, M.column);
      c.position.set(x, y + (FLOOR_H - SLAB_T - 0.5) / 2, z);
      c.castShadow = c.receiveShadow = true;
      g.add(solid(c));
    }
  }
  return g;
}

// ---------- emissive ceiling light strips
export function lightStrips(rect, y, zs, spacing = 13) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(spacing * 0.62, 0.12, 0.5);
  const cy = y + FLOOR_H - SLAB_T - 0.55;
  for (const z of zs) {
    for (let x = rect.x0 + spacing / 2; x < rect.x1; x += spacing) {
      const s = new THREE.Mesh(geo, M.lightStrip);
      s.position.set(x, cy, z);
      g.add(s);
    }
  }
  return g;
}

export function boxRect(box) {
  return { x0: -box.len / 2, z0: -box.wid / 2, x1: box.len / 2, z1: box.wid / 2 };
}
