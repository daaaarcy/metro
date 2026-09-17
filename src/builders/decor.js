// Real-station dressing: calligraphy wall plates, six-sheet ad lightboxes,
// bins, fire cabinets, the system map board — the details the actual
// Admiralty platforms/concourse are full of.
import * as THREE from 'three';
import { M } from './materials.js';
import { solid } from '../registry.js';
import { box } from './structure.js';

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---- platform calligraphy: giant station-name characters + EN on the tiled
// wall behind the tracks — the signature MTR platform-wall treatment. The
// plate takes the station's mosaic livery; glyphs go white on dark tile,
// charcoal on light tile (e.g. Admiralty's EAL/SIL expansion halls).
export function calligraphy(rect, y, stn = { zh: '金鐘', en: 'ADMIRALTY' }, livery = '#122a4e') {
  const g = new THREE.Group();
  const c = new THREE.Color(livery);
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  const ink = lum > 0.55 ? '#2b343c' : '#ffffff';
  const tex = canvasTex(640, 200, (ctx, w, h) => {
    ctx.fillStyle = livery; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = lum > 0.55 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';
    for (let x = 0; x < w; x += 26) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let yy = 0; yy < h; yy += 26) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); }
    ctx.fillStyle = ink;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 128px "PingFang HK","Songti SC","STSong",serif';
    ctx.fillText(stn.zh, w / 2, h * 0.40);
    ctx.font = '600 30px sans-serif';
    ctx.fillText(stn.en.toUpperCase().split('').join(' '), w / 2, h * 0.82);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const geo = new THREE.PlaneGeometry(6.6, 2.06);
  const wallZ = Math.abs(rect.z1) - 0.56;   // just inside the inner wall face
  for (const s of [-1, 1]) {
    for (let x = rect.x0 + 22; x < rect.x1 - 18; x += 38) {
      const p = new THREE.Mesh(geo, mat);
      p.position.set(x, y + 4.55, s * wallZ);
      p.rotation.y = s < 0 ? 0 : Math.PI;
      g.add(p);
    }
  }
  return g;
}

// ---- six-sheet poster lightboxes (lit ad frames) along a wall run ----------
const ADS = [
  { bg: '#f2a541', fg: '#122a4e', t: 'MTR Malls', s: '港鐵商場' },
  { bg: '#1f7a8c', fg: '#ffffff', t: 'Travel',    s: '旅遊優惠' },
  { bg: '#bf4e30', fg: '#ffe8d6', t: 'NEW OPENING', s: '全新開幕' },
  { bg: '#273469', fg: '#e4d9ff', t: 'Octopus',   s: '八達通' },
  { bg: '#e0e1dd', fg: '#d62828', t: 'SALE',      s: '大減價' },
];
function posterTex(i) {
  const a = ADS[i % ADS.length];
  return canvasTex(160, 240, (ctx, w, h) => {
    ctx.fillStyle = a.bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(w * 0.12, h * 0.12, w * 0.76, h * 0.4);
    ctx.fillStyle = a.fg;
    ctx.textAlign = 'center';
    ctx.font = `700 ${w * 0.16}px sans-serif`;
    ctx.fillText(a.s, w / 2, h * 0.68);
    ctx.font = `600 ${w * 0.09}px sans-serif`;
    ctx.fillText(a.t, w / 2, h * 0.8);
  });
}
const posterMats = ADS.map((_, i) => new THREE.MeshBasicMaterial({ map: posterTex(i) }));

// row of lightboxes on a wall at (x..x, z) facing direction `ry` (0 = +Z)
export function posters(x0, x1, z, y, ry = 0, step = 24) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1.3, 1.85);
  let i = 0;
  for (let x = x0 + step / 2; x < x1 - 1; x += step, i++) {
    const f = box(1.5, 2.0, 0.1, M.signPost);
    f.position.set(0, y + 2.1, 0);
    const p = new THREE.Mesh(geo, posterMats[i]);
    p.position.set(0, y + 2.1, 0.06);
    const u = new THREE.Group();
    u.add(f, p);
    u.position.set(x, 0, z);
    u.rotation.y = ry;
    g.add(u);
  }
  return g;
}

// same but on the end walls (faces ±X)
export function postersEnd(rect, y, side, z0, z1, step = 22) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1.3, 1.85);
  const wx = side > 0 ? rect.x1 - 0.56 : rect.x0 + 0.56;
  let i = side > 0 ? 2 : 0;
  for (let z = z0 + step / 2; z < z1 - 1; z += step, i++) {
    const f = box(1.5, 2.0, 0.1, M.signPost);
    f.position.set(0, y + 2.1, 0);
    const p = new THREE.Mesh(geo, posterMats[i]);
    p.position.set(0, y + 2.1, 0.06);
    const u = new THREE.Group();
    u.add(f, p);
    u.position.set(wx, 0, z);
    u.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(u);
  }
  return g;
}

// ---- bins: general waste + recycling pair ----------------------------------
export function binPair(x, z, y, ry = 0) {
  const g = new THREE.Group();
  const mats = [M.signPost, new THREE.MeshStandardMaterial({ color: 0x2b6cb0, roughness: 0.7 })];
  for (const [i, m] of mats.entries()) {
    const b = box(0.5, 0.85, 0.42, m);
    b.position.set(i * 0.58 - 0.29, 0.43, 0);
    g.add(solid(b));
  }
  g.position.set(x, y, z);
  g.rotation.y = ry;
  return g;
}

// ---- fire extinguisher / hose reel cabinets on walls ------------------------
const fireMat = new THREE.MeshStandardMaterial({ color: 0xc0272d, roughness: 0.5 });
export function fireCabinets(x0, x1, z, y, step = 44) {
  const g = new THREE.Group();
  for (let x = x0 + 8; x < x1 - 4; x += step) {
    const cab = box(0.72, 1.0, 0.24, fireMat);
    cab.position.set(x, y + 1.35, z);
    const glass = box(0.5, 0.7, 0.03, M.glass);
    glass.position.set(x, y + 1.38, z + 0.14);
    g.add(cab, glass);
  }
  return g;
}

// ---- MTR system map lightbox ------------------------------------------------
// Official MTR route map (港鐵路綫圖), rasterised from the published PDF:
//   https://www.mtr.com.hk/archive/en/services/routemap.pdf
// Served locally from public/mtr-system-map.jpg — a remote URL would taint the
// WebGL texture.
const systemMapTex = new THREE.TextureLoader().load('/mtr-system-map.jpg');
systemMapTex.colorSpace = THREE.SRGBColorSpace;
systemMapTex.anisotropy = 8;
const systemMapMat = new THREE.MeshBasicMaterial({ map: systemMapTex });
const MAP_ASPECT = 2000 / 1347;
export function mapBoard(x, z, y, ry = 0, cy = 2.3) {
  const w = 2.9, h = w / MAP_ASPECT;
  const g = new THREE.Group();
  const frame = box(w + 0.2, h + 0.2, 0.12, M.signPost);
  frame.position.set(0, cy, 0);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), systemMapMat);
  p.position.set(0, cy, 0.07);
  g.add(solid(frame), p);
  g.position.set(x, y, z);
  g.rotation.y = ry;
  return g;
}
