import * as THREE from 'three';
import { M } from './materials.js';
import { FLOOR_H, SLAB_T, BED_HALF, TRACK_Z, SIDE_TRACK_Z, PLATFORMS } from '../station-data.js';
import { solid } from '../registry.js';
import { box } from './structure.js';
import { track } from './tracks.js';
import { canvasTex } from './decor.js';

const INTERIOR_H = FLOOR_H - SLAB_T - 0.5; // clear interior height ≈ 5.5
const DOOR_PITCH = 2.45;
export const BAY = 1.7;                     // clear opening at each doorway

// shared floor decal: queue arrows + "mind the gap" strip in front of a bay
const decalMat = new THREE.MeshBasicMaterial({
  map: canvasTex(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#43484f'; ctx.fillRect(0, 0, w, h);      // strip base
    ctx.fillStyle = '#e8c21e'; ctx.fillRect(0, 0, w, 14);     // yellow edge band
    ctx.fillStyle = '#e8c21e';
    // outward queue arrows at both flanks (passengers exit through the middle)
    for (const [ax, dir] of [[w * 0.22, -1], [w * 0.78, 1]]) {
      ctx.beginPath();
      ctx.moveTo(ax + dir * 26, h * 0.36);
      ctx.lineTo(ax + dir * 6, h * 0.52); ctx.lineTo(ax + dir * 6, h * 0.44);
      ctx.lineTo(ax - dir * 14, h * 0.44); ctx.lineTo(ax - dir * 14, h * 0.62);
      ctx.lineTo(ax + dir * 6, h * 0.62); ctx.lineTo(ax + dir * 6, h * 0.56);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#e8c21e';
    ctx.font = '600 17px "PingFang HK",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('請先落後上', w / 2, h * 0.78);
  }),
});

// Full-height platform screen doors (signature MTR look):
// fixed glass panels with REAL openings at each door bay, mullions,
// paired leaves that slide apart into the panels, header beam.
// Returns { group, doorSet } — doorSet = { doors, xs, leafX, leafDir, y, z }.
function screenDoors(x0, x1, z, y, faceDir) {
  const g = new THREE.Group();
  const len = x1 - x0, cx = (x0 + x1) / 2;
  const n = Math.floor(len / DOOR_PITCH);

  const header = box(len, 0.7, 0.25, M.signPost);
  header.position.set(cx, y + INTERIOR_H - 0.35, z);
  g.add(solid(header));

  // door bay centres
  const xs = [];
  for (let i = 0; i < n; i++) xs.push(x0 + 1.22 + i * DOOR_PITCH);

  // fixed glass panels between bays — per-panel solids so the door bays are
  // genuine gaps in the collision world (the train sim gates who may pass)
  const m4 = new THREE.Matrix4();
  for (let i = 0; i <= n; i++) {
    const l = i === 0 ? x0 : xs[i - 1] + BAY / 2;
    const r = i === n ? x1 : xs[i] - BAY / 2;
    const w = Math.max(r - l, 0.05);
    const p = box(w, INTERIOR_H - 0.7, 0.1, M.glass);
    p.position.set((l + r) / 2, y + (INTERIOR_H - 0.7) / 2, z);
    g.add(solid(p));
  }

  // mullions between bays
  const mulGeo = new THREE.BoxGeometry(0.09, INTERIOR_H - 0.7, 0.14);
  const muls = new THREE.InstancedMesh(mulGeo, M.steel, n + 1);
  for (let i = 0; i <= n; i++) {
    m4.identity().setPosition(x0 + i * DOOR_PITCH, y + (INTERIOR_H - 0.7) / 2, z);
    muls.setMatrixAt(i, m4);
  }
  muls.castShadow = true;
  g.add(muls);

  // two leaves per bay; they part to overlap the fixed panels when open
  const leafGeo = new THREE.BoxGeometry(BAY / 2 + 0.06, INTERIOR_H - 0.8, 0.07);
  const doors = new THREE.InstancedMesh(leafGeo, M.glassDark, n * 2);
  const leafX = [], leafDir = [];
  for (let i = 0; i < n; i++) {
    for (const s of [-1, 1]) {
      const j = i * 2 + (s + 1) / 2;
      leafX.push(xs[i] + s * BAY / 4);
      leafDir.push(s);
      m4.identity().setPosition(xs[i] + s * BAY / 4, y + (INTERIOR_H - 0.8) / 2, z + faceDir * 0.03);
      doors.setMatrixAt(j, m4);
    }
  }
  g.add(doors);

  // floor decals: queue arrows + gap-warning strip on the platform side
  const decals = new THREE.InstancedMesh(new THREE.PlaneGeometry(BAY + 0.25, 0.62), decalMat, n);
  const flip = new THREE.Matrix4().makeRotationY(Math.PI);
  for (let i = 0; i < n; i++) {
    m4.makeRotationX(-Math.PI / 2);
    if (faceDir < 0) m4.premultiply(flip);   // canvas top always faces the track
    m4.setPosition(xs[i], y + 0.015, z + faceDir * 1.05);
    decals.setMatrixAt(i, m4);
  }
  g.add(decals);

  return { group: g, doorSet: { doors, xs, leafX, leafDir, y: y + (INTERIOR_H - 0.8) / 2, z: z + faceDir * 0.03 } };
}

// yellow tactile strip + white edge line along a platform edge
function edgeMarkings(x0, x1, z, y, side) {
  const g = new THREE.Group();
  const len = x1 - x0, cx = (x0 + x1) / 2;
  const tactile = box(len, 0.03, 0.55, M.tactile);
  tactile.position.set(cx, y + 0.02, z + side * 0.9);
  const edge = box(len, 0.02, 0.1, M.ceiling);
  edge.position.set(cx, y + 0.02, z + side * 0.12);
  g.add(tactile, edge);
  return g;
}

export function benches(x0, x1, z, y) {
  const g = new THREE.Group();
  for (let x = x0 + 18; x < x1 - 10; x += 30) {
    const b = box(3.2, 0.45, 0.9, M.steel);
    b.position.set(x, y + 0.45, z);
    g.add(solid(b));
  }
  return g;
}

// Build a platform level's fittings. Returns { fittings:Group, trackRects, doorSets }.
// Everything in the level's LOCAL frame. rect = floor rect.
export function platformLevel(levelDef, rect) {
  const g = new THREE.Group();
  const y = 0; // local floor surface = 0 (group is positioned at level.y)
  const spec = PLATFORMS[levelDef.uid];
  const trackRects = [];
  const doorSets = [];

  const addFace = (tr, edgeZ, faceDir, face) => {
    const sd = screenDoors(tr.x0, tr.x1, edgeZ, y, faceDir);
    g.add(sd.group);
    sd.doorSet.face = face;
    sd.doorSet.track = tr;
    sd.doorSet.level = levelDef.uid;
    sd.doorSet.terminus = !!spec.terminus;
    sd.doorSet.kind = spec.kind;
    doorSets.push(sd.doorSet);
    g.add(edgeMarkings(tr.x0, tr.x1, edgeZ, y, faceDir));
  };

  if (spec.kind === 'island') {
    for (const [i, s] of [-1, 1].entries()) {
      const zc = s * TRACK_Z;
      const tr = { x0: rect.x0 + 1.5, z0: zc - BED_HALF, x1: rect.x1 - 1.5, z1: zc + BED_HALF, sides: [] };
      trackRects.push(tr);
      g.add(track(tr, y, { buffers: !!spec.terminus }));
      addFace(tr, s * (TRACK_Z - BED_HALF) - s * 0.06, -s, spec.faces[i]);
    }
    g.add(benches(rect.x0 + 12, rect.x1 - 12, 0, y));
  } else if (spec.kind === 'single') {
    // one track + one side platform (Central L2/L4, HK L2):
    // single.track = which side the track sits on, single.side = platform side
    const ts = spec.single.track, ps = spec.single.side;
    const zc = ts * SIDE_TRACK_Z;
    const tr = { x0: rect.x0 + 1.5, z0: zc - BED_HALF, x1: rect.x1 - 1.5, z1: zc + BED_HALF, sides: [] };
    trackRects.push(tr);
    g.add(track(tr, y));
    // platform edge = far side of the bed; doors/decals face the platform
    addFace(tr, zc - ts * BED_HALF - ts * 0.06, ps, spec.faces[0]);
    g.add(benches(rect.x0 + 12, rect.x1 - 12, ps * (Math.abs(rect.z1) - 3.4), y));
  } else {
    // side platforms: tracks in the middle, platforms along both walls
    for (const [i, s] of [-1, 1].entries()) {
      const zc = s * SIDE_TRACK_Z;
      const tr = { x0: rect.x0 + 1.5, z0: zc - BED_HALF, x1: rect.x1 - 1.5, z1: zc + BED_HALF, sides: [] };
      trackRects.push(tr);
      g.add(track(tr, y));
      addFace(tr, s * (SIDE_TRACK_Z + BED_HALF) + s * 0.06, s, spec.faces[i]);
      g.add(benches(rect.x0 + 12, rect.x1 - 12, s * 11.2, y));
    }
  }
  return { fittings: g, trackRects, doorSets };
}
