import * as THREE from 'three';
import { M } from './materials.js';
import { BED_HALF, GAUGE, TRACK_DROP } from '../station-data.js';
import { solid, walkable } from '../registry.js';
import { box } from './structure.js';

// Track trough for one track: floor at y-TRACK_DROP, rails + sleepers.
// rect = trough rect in local frame.
export function track(rect, y, { buffers = false } = {}) {
  const g = new THREE.Group();
  const w = rect.x1 - rect.x0, d = rect.z1 - rect.z0;
  const cx = (rect.x0 + rect.x1) / 2, cz = (rect.z0 + rect.z1) / 2;
  const floorY = y - TRACK_DROP;

  const bed = box(w, 0.25, d, M.bed);
  bed.position.set(cx, floorY + 0.125 - 0.25, cz); // top at floorY
  g.add(walkable(bed));

  // rails
  for (const s of [-1, 1]) {
    const rail = box(w, 0.16, 0.09, M.rail);
    rail.position.set(cx, floorY + 0.22, cz + s * GAUGE / 2);
    g.add(rail);
  }
  // sleepers
  const slGeo = new THREE.BoxGeometry(0.22, 0.08, GAUGE + 0.7);
  const n = Math.floor(w / 1.1);
  const inst = new THREE.InstancedMesh(slGeo, M.sleeper, n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    m4.setPosition(rect.x0 + 0.6 + i * 1.1, floorY + 0.1, cz);
    inst.setMatrixAt(i, m4);
  }
  inst.receiveShadow = true;
  g.add(inst);

  // buffer stops (terminus end, -X)
  if (buffers) {
    const buf = box(1.2, 1.1, GAUGE + 1.2, M.buffer);
    buf.position.set(rect.x0 + 2.2, floorY + 0.75, cz);
    const lamp = box(0.25, 0.25, 0.25, new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 2 }));
    lamp.position.set(rect.x0 + 2.2, floorY + 1.5, cz);
    g.add(solid(buf), lamp);
  }
  return g;
}

// Bored tunnel continuing past the end wall: dark tube + track inside.
// dir = +1 extends beyond x1, -1 beyond x0 (local frame).
export function tunnelTube(rect, y, dir, len = 42) {
  const g = new THREE.Group();
  const floorY = y - TRACK_DROP;
  const cx = (rect.x0 + rect.x1) / 2, cz = (rect.z0 + rect.z1) / 2;
  const edgeX = dir > 0 ? rect.x1 : rect.x0;
  const midX = edgeX + dir * len / 2;

  const h = 5.2, w = rect.z1 - rect.z0;
  // tube walls + roof (interior faces the platform opening)
  for (const s of [-1, 1]) {
    const wall = box(len, h, 0.3, M.wallDark);
    wall.position.set(midX, floorY + h / 2, cz + s * (w / 2 - 0.15));
    g.add(solid(wall));
  }
  const roof = box(len, 0.4, w, M.wallDark);
  roof.position.set(midX, floorY + h + 0.2, cz);
  g.add(solid(roof));
  const tubeBed = box(len, 0.25, w, M.bed);
  tubeBed.position.set(midX, floorY - 0.125, cz);
  g.add(walkable(tubeBed));
  // rails continue into the tube
  for (const s of [-1, 1]) {
    const rail = box(len, 0.16, 0.09, M.rail);
    rail.position.set(midX, floorY + 0.22, cz + s * GAUGE / 2);
    g.add(rail);
  }
  // black cap far inside so you can't see through
  const cap = box(0.3, h, w, new THREE.MeshBasicMaterial({ color: 0x04060a }));
  cap.position.set(edgeX + dir * (len - 0.2), floorY + h / 2, cz);
  g.add(cap);
  return g;
}
