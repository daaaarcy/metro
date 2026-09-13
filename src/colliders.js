// Static collision world shared by the player rig and the pedestrians.
// Solids become world AABBs when ~axis-aligned and OBBs when yaw-rotated
// (the L5/L6 box is rotated −0.30 rad — a rotated thin wall's AABB would
// sweep a huge diagonal swath and swallow the platform).
// A uniform XZ grid buckets solids so pedestrians only test nearby ones.
import * as THREE from 'three';
import { SOLIDS, WALKABLES } from './registry.js';

export const PED_RADIUS = 0.3;
const CELL = 6;   // grid cell size, metres

export function buildColliders() {
  const solidAABBs = [], solidOBBs = [], floors = [], ramps = [];
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
  const add = (bb, ent) => {
    for (let cx = Math.floor((bb.min.x - 0.5) / CELL); cx <= Math.floor((bb.max.x + 0.5) / CELL); cx++) {
      for (let cz = Math.floor((bb.min.z - 0.5) / CELL); cz <= Math.floor((bb.max.z + 0.5) / CELL); cz++) {
        const k = cx + ',' + cz;
        let arr = grid.get(k);
        if (!arr) grid.set(k, arr = []);
        arr.push(ent);
      }
    }
  };

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
        const rec = { ...o, y0: b.min.y, y1: b.max.y };
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
      ramps.push({ run: w.esc || w.ramp, ...obbOf(m), carry: !!w.esc });
    } else {
      floors.push({ x0: b.min.x, z0: b.min.z, x1: b.max.x, z1: b.max.z, top: b.max.y });
    }
  }
  return { solidAABBs, solidOBBs, floors, ramps, grid };
}

// push a circle out of solids near (px,pz) overlapping the band [feet, feet+h].
// World-space; one pass is enough for NPCs.
export function resolvePed(col, px, pz, feet, h, r = PED_RADIUS) {
  const c0x = Math.floor((px - r) / CELL), c1x = Math.floor((px + r) / CELL);
  const c0z = Math.floor((pz - r) / CELL), c1z = Math.floor((pz + r) / CELL);
  for (let cx = c0x; cx <= c1x; cx++) {
    for (let cz = c0z; cz <= c1z; cz++) {
      const arr = col.grid.get(cx + ',' + cz);
      if (!arr) continue;
      for (const ent of arr) {
        const s = ent.a || ent.o;
        if (s.y1 < feet + 0.25 || s.y0 > feet + h) continue;
        if (ent.a) {
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
          const lx = (px - s.cx) * s.cos - (pz - s.cz) * s.sin;
          const lz = (px - s.cx) * s.sin + (pz - s.cz) * s.cos;
          const nx = Math.max(-s.hx, Math.min(lx, s.hx));
          const nz = Math.max(-s.hz, Math.min(lz, s.hz));
          const dx = lx - nx, dz = lz - nz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= r * r) continue;
          let ox, oz;
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2);
            ox = nx + dx / d * r; oz = nz + dz / d * r;
          } else {
            const pushes = [
              [s.hx + r - lx, 1, 0], [lx + s.hx + r, -1, 0],
              [s.hz + r - lz, 0, 1], [lz + s.hz + r, 0, -1],
            ];
            pushes.sort((a, b2) => a[0] - b2[0]);
            ox = lx + pushes[0][1] * pushes[0][0];
            oz = lz + pushes[0][2] * pushes[0][0];
          }
          px = s.cx + ox * s.cos + oz * s.sin;
          pz = s.cz - ox * s.sin + oz * s.cos;
        }
      }
    }
  }
  return [px, pz];
}
