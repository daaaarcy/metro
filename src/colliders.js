// Static collision world shared by the player rig and the pedestrians.
// Solids become world AABBs when ~axis-aligned and OBBs when yaw-rotated
// (the L5/L6 box is rotated −0.30 rad — a rotated thin wall's AABB would
// sweep a huge diagonal swath and swallow the platform).
// A uniform XZ grid buckets solids so pedestrians only test nearby ones.
import * as THREE from 'three';
import { SOLIDS, WALKABLES } from './registry.js';

export const PED_RADIUS = 0.3;
export const CELL = 6;   // grid cell size, metres

export function buildColliders() {
  const solidAABBs = [], solidOBBs = [], floors = [], ramps = [];
  const fgrid = new Map();   // walkable surfaces, for the player's floorAt
  const b = new THREE.Box3();
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  const e = new THREE.Euler(), lc = new THREE.Vector3(), sz = new THREE.Vector3();

  const obbOf = m => {
    let lb;
    if (m.isInstancedMesh) {
      if (!m.boundingBox && m.computeBoundingBox) m.computeBoundingBox();
      lb = m.boundingBox;
    } else if (m.geometry) {
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      lb = m.geometry.boundingBox;
    }
    if (!lb) return null;
    m.matrixWorld.decompose(p, q, s);
    const yaw = e.setFromQuaternion(q, 'YXZ').y;
    lc.copy(lb.getCenter(sz)).applyMatrix4(m.matrixWorld);
    lb.getSize(sz);
    return {
      cx: lc.x, cz: lc.z,
      hx: Math.abs(sz.x * s.x) / 2 + 1e-3, hz: Math.abs(sz.z * s.z) / 2 + 1e-3,
      cos: Math.cos(yaw), sin: Math.sin(yaw),
    };
  };

  // spatial buckets: insert each solid under every cell its bounds touch
  const grid = new Map();
  const addTo = (map, bb, ent) => {
    for (let cx = Math.floor((bb.min.x - 0.5) / CELL); cx <= Math.floor((bb.max.x + 0.5) / CELL); cx++) {
      for (let cz = Math.floor((bb.min.z - 0.5) / CELL); cz <= Math.floor((bb.max.z + 0.5) / CELL); cz++) {
        const k = cx + ',' + cz;
        let arr = map.get(k);
        if (!arr) map.set(k, arr = []);
        arr.push(ent);
      }
    }
  };
  const add = (bb, ent) => addTo(grid, bb, ent);

  for (const m of SOLIDS) {
    m.updateWorldMatrix(true, false);
    if (m.isInstancedMesh && !m.boundingBox && m.computeBoundingBox) m.computeBoundingBox();
    b.setFromObject(m);
    if (b.isEmpty()) continue;
    m.matrixWorld.decompose(p, q, s);
    const yaw = e.setFromQuaternion(q, 'YXZ').y;
    if (Math.abs(Math.sin(2 * yaw)) < 0.03) {
      const rec = { x0: b.min.x, z0: b.min.z, x1: b.max.x, z1: b.max.z, y0: b.min.y, y1: b.max.y };
      solidAABBs.push(rec);
      add(b, { a: rec });
    } else {
      const o = obbOf(m);
      if (o) {
        // the local-frame test rect never changes — bake it once (lrect, not
        // rect — PSD bays already carry a world-space `rect`)
        const rec = { ...o, y0: b.min.y, y1: b.max.y, lrect: { x0: -o.hx, z0: -o.hz, x1: o.hx, z1: o.hz } };
        solidOBBs.push(rec);
        add(b, { o: rec });
      } else {
        const rec = { x0: b.min.x, z0: b.min.z, x1: b.max.x, z1: b.max.z, y0: b.min.y, y1: b.max.y };
        solidAABBs.push(rec);
        add(b, { a: rec });
      }
    }
  }
  for (const m of WALKABLES) {
    m.updateWorldMatrix(true, false);
    b.setFromObject(m);
    if (b.isEmpty()) continue;
    const w = m.userData.walkable || {};
    if (w.esc || w.ramp) {
      const rec = { run: w.esc || w.ramp, ...obbOf(m), carry: !!w.esc };
      ramps.push(rec);
      addTo(fgrid, b, { r: rec });
    } else {
      const rec = { x0: b.min.x, z0: b.min.z, x1: b.max.x, z1: b.max.z, top: b.max.y };
      floors.push(rec);
      addTo(fgrid, b, { f: rec });
    }
  }
  return { solidAABBs, solidOBBs, floors, ramps, grid, fgrid };
}

// circle-vs-rect overlap in XZ
const hitRect = (s, x, z, r) => {
  const nx = Math.max(s.x0, Math.min(x, s.x1));
  const nz = Math.max(s.z0, Math.min(z, s.z1));
  const dx = x - nx, dz = z - nz;
  return dx * dx + dz * dz < r * r;
};

// Axis-separated swept clamp: apply the x move, test, clamp at the face it
// would cross; then the z move. A step can never jump past a face it started
// outside of — thin glass/panels stay solid at any speed — and diagonal moves
// still slide along the free axis.
// results land in module scratches — callers destructure immediately, so a
// shared pair keeps the per-ped collision pass allocation-free
const _cl = [0, 0], _co = [0, 0], _rp = [0, 0];
export function clampRect(s, ox, oz, nx, nz, r) {
  if (hitRect(s, nx, oz, r) && !hitRect(s, ox, oz, r)) {
    nx = nx > ox ? Math.min(nx, s.x0 - r) : Math.max(nx, s.x1 + r);
  }
  if (hitRect(s, nx, nz, r) && !hitRect(s, nx, oz, r)) {
    nz = nz > oz ? Math.min(nz, s.z0 - r) : Math.max(nz, s.z1 + r);
  }
  _cl[0] = nx; _cl[1] = nz;
  return _cl;
}

// same clamp against one OBB ({cx,cz,hx,hz,cos,sin}) — used for dynamic
// barriers like PSD door bays that live in rotated level frames
export function clampOBB(o, ox, oz, nx, nz, r) {
  const rect = o.lrect || (o.lrect = { x0: -o.hx, z0: -o.hz, x1: o.hx, z1: o.hz });
  const lox = (ox - o.cx) * o.cos - (oz - o.cz) * o.sin;
  const loz = (ox - o.cx) * o.sin + (oz - o.cz) * o.cos;
  let lnx = (nx - o.cx) * o.cos - (nz - o.cz) * o.sin;
  let lnz = (nx - o.cx) * o.sin + (nz - o.cz) * o.cos;
  const [cx, cz] = clampRect(rect, lox, loz, lnx, lnz, r);
  if (cx === lnx && cz === lnz) { _co[0] = nx; _co[1] = nz; return _co; }
  _co[0] = o.cx + cx * o.cos + cz * o.sin;
  _co[1] = o.cz - cx * o.sin + cz * o.cos;
  return _co;
}

// Swept clamp against full AABB/OBB lists (controls.js keeps plain lists —
// pedestrians use the grid in resolvePed instead). extras = dynamic rects
// (closed gate flaps) with y0/y1 for the height band test.
export function sweepMove(aabbs, obbs, extras, ox, oz, nx, nz, feet, h, r, out = [0, 0]) {
  for (const s of aabbs) {
    if (s.y1 < feet + 0.25 || s.y0 > feet + h) continue;
    [nx, nz] = clampRect(s, ox, oz, nx, nz, r);
  }
  for (const s of extras) {
    if (s.y1 < feet + 0.25 || s.y0 > feet + h) continue;
    [nx, nz] = clampRect(s, ox, oz, nx, nz, r);
  }
  for (const s of obbs) {
    if (s.y1 < feet + 0.25 || s.y0 > feet + h) continue;
    const rect = s.lrect || (s.lrect = { x0: -s.hx, z0: -s.hz, x1: s.hx, z1: s.hz });
    const lox = (ox - s.cx) * s.cos - (oz - s.cz) * s.sin;
    const loz = (ox - s.cx) * s.sin + (oz - s.cz) * s.cos;
    let lnx = (nx - s.cx) * s.cos - (nz - s.cz) * s.sin;
    let lnz = (nx - s.cx) * s.sin + (nz - s.cz) * s.cos;
    if (hitRect(rect, lnx, lnz, r) && !hitRect(rect, lox, loz, r)) {
      [lnx, lnz] = clampRect(rect, lox, loz, lnx, lnz, r);
      nx = s.cx + lnx * s.cos + lnz * s.sin;
      nz = s.cz - lnx * s.sin + lnz * s.cos;
    }
  }
  out[0] = nx; out[1] = nz;
  return out;
}

// push a circle out of solids near (px,pz) overlapping the band [feet, feet+h].
// World-space; one pass is enough for NPCs. (ox,oz) = previous resolved
// position — lets the swept clamp block thin walls a big step would jump.
export function resolvePed(col, px, pz, feet, h, r = PED_RADIUS, ox = px, oz = pz) {
  const c0x = Math.floor((Math.min(px, ox) - r) / CELL), c1x = Math.floor((Math.max(px, ox) + r) / CELL);
  const c0z = Math.floor((Math.min(pz, oz) - r) / CELL), c1z = Math.floor((Math.max(pz, oz) + r) / CELL);
  for (let cx = c0x; cx <= c1x; cx++) {
    for (let cz = c0z; cz <= c1z; cz++) {
      const arr = col.grid.get(cx + ',' + cz);
      if (!arr) continue;
      for (const ent of arr) {
        const s = ent.a || ent.o;
        if (s.y1 < feet + 0.25 || s.y0 > feet + h) continue;
        if (ent.a) {
          [px, pz] = clampRect(s, ox, oz, px, pz, r);   // swept: block face crossings
          const nx = Math.max(s.x0, Math.min(px, s.x1));
          const nz = Math.max(s.z0, Math.min(pz, s.z1));
          const dx = px - nx, dz = pz - nz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= r * r) continue;
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2);
            px = nx + dx / d * r; pz = nz + dz / d * r;
          } else {
            const pushes = [
              [s.x1 + r - px, 1, 0], [px - (s.x0 - r), -1, 0],
              [s.z1 + r - pz, 0, 1], [pz - (s.z0 - r), 0, -1],
            ];
            pushes.sort((a, b2) => a[0] - b2[0]);
            px += pushes[0][1] * pushes[0][0];
            pz += pushes[0][2] * pushes[0][0];
          }
        } else {
          let lx = (px - s.cx) * s.cos - (pz - s.cz) * s.sin;
          let lz = (px - s.cx) * s.sin + (pz - s.cz) * s.cos;
          const rect = s.lrect || (s.lrect = { x0: -s.hx, z0: -s.hz, x1: s.hx, z1: s.hz });
          const lox = (ox - s.cx) * s.cos - (oz - s.cz) * s.sin;
          const loz = (ox - s.cx) * s.sin + (oz - s.cz) * s.cos;
          [lx, lz] = clampRect(rect, lox, loz, lx, lz, r);
          px = s.cx + lx * s.cos + lz * s.sin;
          pz = s.cz - lx * s.sin + lz * s.cos;
          const nx = Math.max(-s.hx, Math.min(lx, s.hx));
          const nz = Math.max(-s.hz, Math.min(lz, s.hz));
          const dx = lx - nx, dz = lz - nz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= r * r) continue;
          let ex, ez;
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2);
            ex = nx + dx / d * r; ez = nz + dz / d * r;
          } else {
            const pushes = [
              [s.hx + r - lx, 1, 0], [lx + s.hx + r, -1, 0],
              [s.hz + r - lz, 0, 1], [lz + s.hz + r, 0, -1],
            ];
            pushes.sort((a, b2) => a[0] - b2[0]);
            ex = lx + pushes[0][1] * pushes[0][0];
            ez = lz + pushes[0][2] * pushes[0][0];
          }
          px = s.cx + ex * s.cos + ez * s.sin;
          pz = s.cz - ex * s.sin + ez * s.cos;
        }
      }
    }
  }
  _rp[0] = px; _rp[1] = pz;
  return _rp;
}
