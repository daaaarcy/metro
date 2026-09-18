import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Shared person figure used for static occupants (diners, staff, customers).
// One merged mesh per figure — parts get their colour as a vertex attribute.

export const SKIN_TONES = [0xf2d2b6, 0xe8c39e, 0xd9a878, 0xb97f56, 0x9a6a44];
export const HAIR_DARK  = [0x191009, 0x2c1c12, 0x42281a, 0x584134, 0x14161c];
export const HAIR_GREY  = [0x8a8680, 0xb0aca4, 0xd4d0c8];
export const SHIRTS = [0x3a6ea5, 0xc65b4e, 0x4e8a5a, 0x8a6db0, 0xbf9b30, 0x555b62,
  0x9e5f7e, 0x2e8a8a, 0xd8dde2, 0x2a2e35, 0xd47a9e, 0x7a5230, 0xe8a03a, 0x6ea5c8];
export const PANTS  = [0x2b3242, 0x4a4038, 0x62666e, 0x365a7d, 0x1e2126, 0x7a7468];
export const SKIRTS = [0x8a3040, 0x3a4a6e, 0x5e3a5e, 0x2e2e34, 0xa86848];
export const SHOES  = [0x1c1a18, 0x2e2620, 0x3a3f4a, 0x554535, 0x26262c, 0x6e3b2a];

const pick = a => a[Math.floor(Math.random() * a.length)];

// per-person appearance, shared by instanced commuters and static figures
export function rollAppearance() {
  const r = Math.random();
  const kind = r < 0.42 ? 'man' : r < 0.84 ? 'woman' : r < 0.93 ? 'child' : 'elder';
  const skirted = kind === 'woman' && Math.random() < 0.55;
  return {
    kind,
    scale: kind === 'child' ? 0.58 + Math.random() * 0.14
      : kind === 'elder' ? 0.86 + Math.random() * 0.08
      : 0.94 + Math.random() * 0.1,
    hunch: kind === 'elder' ? 0.08 + Math.random() * 0.14 : 0,
    skirted,
    bun: kind === 'woman' && Math.random() < 0.5,
    skin:  pick(SKIN_TONES),
    hair:  kind === 'elder' ? pick(HAIR_GREY) : pick(HAIR_DARK),
    shirt: pick(SHIRTS),
    pants: pick(PANTS),
    skirt: pick(SKIRTS),
    shoes: pick(SHOES),
    speedK: kind === 'child' ? 0.8 : kind === 'elder' ? 0.62 : 1,
  };
}

// ---- shared part geometries (unit person, ~1.7 m, faces +Z) -----------------
const _leg = new THREE.BoxGeometry(0.13, 0.88, 0.15);   _leg.translate(0, -0.44, 0);
const _arm = new THREE.BoxGeometry(0.09, 0.6, 0.11);    _arm.translate(0, -0.28, 0);
// palm + three finger boxes — one merged part keeps the draw-call count flat
const _hand = mergeGeometries([
  new THREE.BoxGeometry(0.08, 0.07, 0.1).translate(0, -0.565, 0),
  new THREE.BoxGeometry(0.02, 0.05, 0.085).translate(-0.022, -0.625, 0),
  new THREE.BoxGeometry(0.02, 0.05, 0.085).translate(0, -0.625, 0),
  new THREE.BoxGeometry(0.02, 0.05, 0.085).translate(0.022, -0.625, 0),
]);
const _foot = new THREE.BoxGeometry(0.13, 0.09, 0.24);  _foot.translate(0, -0.835, 0.045);
const _footC = new THREE.BoxGeometry(0.13, 0.09, 0.24); // centred, placed directly for seated figures
const _torso = new THREE.CylinderGeometry(0.155, 0.19, 0.6, 8); _torso.translate(0, 0.3, 0);
const _head = new THREE.SphereGeometry(0.115, 8, 6);    _head.translate(0, 0.13, 0);
const _hair = new THREE.SphereGeometry(0.128, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62);
_hair.translate(0, 0.14, -0.015);
const _bun = new THREE.SphereGeometry(0.06, 6, 5);
const _skirt = new THREE.CylinderGeometry(0.19, 0.27, 0.44, 8); _skirt.translate(0, -0.2, 0);

// face features baked into head-pivot space — head centre sits +0.13 above the
// pivot with r=0.115, so these offsets land features on the sphere's surface
const _faceDark = mergeGeometries([
  new THREE.BoxGeometry(0.024, 0.026, 0.014).translate(0.047, 0.15, 0.099),   // eyes
  new THREE.BoxGeometry(0.024, 0.026, 0.014).translate(-0.047, 0.15, 0.099),
  new THREE.BoxGeometry(0.05, 0.012, 0.014).translate(0, 0.062, 0.09),        // mouth
]);
const _faceSkin = mergeGeometries([
  new THREE.BoxGeometry(0.02, 0.032, 0.024).translate(0, 0.105, 0.114),       // nose
  new THREE.BoxGeometry(0.02, 0.038, 0.028).translate(0.112, 0.115, 0),       // ears
  new THREE.BoxGeometry(0.02, 0.038, 0.028).translate(-0.112, 0.115, 0),
]);
const FACE_DARK = 0x2a2019;

export const PART_GEO = {
  leg: _leg, arm: _arm, torso: _torso, head: _head, hair: _hair, bun: _bun, skirt: _skirt,
  faceDark: _faceDark, faceSkin: _faceSkin, hand: _hand, foot: _foot,
};
export { FACE_DARK };

const _m = new THREE.Matrix4();
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

function coloredPart(geo, color, px, py, pz, rx = 0, sx = 1, sy = 1, sz = 1) {
  const g = geo.clone();
  _q.setFromEuler(_e.set(rx, 0, 0));
  _m.compose(_v.set(px, py, pz), _q, new THREE.Vector3(sx, sy, sz));
  g.applyMatrix4(_m);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  const c = new THREE.Color(color);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.deleteAttribute('uv');
  return g;
}

const figureMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });

// pose: 'stand' | 'sit'. yaw: facing. Returns a single merged mesh.
export function personFigure({ appearance = null, pose = 'stand', yaw = 0 } = {}) {
  const a = appearance || rollAppearance();
  const parts = [];
  const legC = a.skirted ? a.skin : a.pants;

  if (pose === 'sit') {
    // thighs forward, shins down from the knee, torso upright — on a ~0.45 stool
    parts.push(coloredPart(_leg, legC, -0.105, 0.46, 0.06, -Math.PI / 2 * 0.92, 1, 0.48, 1));
    parts.push(coloredPart(_leg, legC, 0.105, 0.46, 0.06, -Math.PI / 2 * 0.92, 1, 0.48, 1));
    parts.push(coloredPart(_leg, legC, -0.105, 0.45, 0.47, 0, 1, 0.5, 1));
    parts.push(coloredPart(_leg, legC, 0.105, 0.45, 0.47, 0, 1, 0.5, 1));
    parts.push(coloredPart(_torso, a.shirt, 0, 0.42, 0, a.hunch));
    parts.push(coloredPart(_head, a.skin, 0, 1.02, 0, a.hunch * 0.6));
    parts.push(coloredPart(_hair, a.hair, 0, 1.02, 0, a.hunch * 0.6));
    parts.push(coloredPart(_faceDark, FACE_DARK, 0, 1.02, 0, a.hunch * 0.6));
    parts.push(coloredPart(_faceSkin, a.skin, 0, 1.02, 0, a.hunch * 0.6));
    parts.push(coloredPart(_arm, a.shirt, -0.185, 0.98, 0.05, -0.5));
    parts.push(coloredPart(_arm, a.shirt, 0.185, 0.98, 0.05, -0.5));
    parts.push(coloredPart(_hand, a.skin, -0.185, 0.98, 0.05, -0.5));
    parts.push(coloredPart(_hand, a.skin, 0.185, 0.98, 0.05, -0.5));
    parts.push(coloredPart(_footC, a.shoes, -0.105, 0.045, 0.52));
    parts.push(coloredPart(_footC, a.shoes, 0.105, 0.045, 0.52));
    if (a.bun) parts.push(coloredPart(_bun, a.hair, 0, 1.14, -0.1));
  } else {
    parts.push(coloredPart(_leg, legC, -0.105, 0.88, 0));
    parts.push(coloredPart(_leg, legC, 0.105, 0.88, 0));
    parts.push(coloredPart(_torso, a.shirt, 0, 0.84, 0, a.hunch));
    parts.push(coloredPart(_head, a.skin, 0, 1.44, 0, a.hunch * 0.7));
    parts.push(coloredPart(_hair, a.hair, 0, 1.44, 0, a.hunch * 0.7));
    parts.push(coloredPart(_faceDark, FACE_DARK, 0, 1.44, 0, a.hunch * 0.7));
    parts.push(coloredPart(_faceSkin, a.skin, 0, 1.44, 0, a.hunch * 0.7));
    parts.push(coloredPart(_arm, a.shirt, -0.185, 1.35, 0, a.hunch));
    parts.push(coloredPart(_arm, a.shirt, 0.185, 1.35, 0, a.hunch));
    parts.push(coloredPart(_hand, a.skin, -0.185, 1.35, 0, a.hunch));
    parts.push(coloredPart(_hand, a.skin, 0.185, 1.35, 0, a.hunch));
    parts.push(coloredPart(_foot, a.shoes, -0.105, 0.88, 0));
    parts.push(coloredPart(_foot, a.shoes, 0.105, 0.88, 0));
    if (a.skirted) parts.push(coloredPart(_skirt, a.skirt, 0, 0.88, 0));
    if (a.bun) parts.push(coloredPart(_bun, a.hair, 0, 1.6, -0.09));
  }

  const merged = mergeGeometries(parts, false);
  const mesh = new THREE.Mesh(merged, figureMat);
  mesh.scale.setScalar(a.scale);
  mesh.rotation.y = yaw;
  mesh.castShadow = true;
  return mesh;
}
