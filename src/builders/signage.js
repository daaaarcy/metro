import * as THREE from 'three';
import { M } from './materials.js';
import { box } from './structure.js';
import { FLOOR_H, SLAB_T, LINES } from '../station-data.js';

// Canvas-texture sign plate: navy band, white zh/en text, optional line chips.
export function makeSign({ zh = '', en = '', chips = [], w = 6, h = 1.6 }) {
  const scale = 128; // px per metre
  const cw = Math.round(w * scale), ch = Math.round(h * scale);
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#101c26';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = '#1d2f3d';
  ctx.fillRect(0, 0, cw, ch * 0.18);

  ctx.textBaseline = 'middle';
  const pad = ch * 0.16;
  let x = pad;
  for (const chip of chips) {
    const cwpx = ch * 0.62;
    ctx.fillStyle = chip.color;
    ctx.fillRect(x, ch / 2 - cwpx / 2, cwpx, cwpx);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${cwpx * 0.62}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(chip.text, x + cwpx / 2, ch / 2 + 2);
    x += cwpx + pad * 0.7;
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${ch * 0.4}px "PingFang HK","PingFang SC",sans-serif`;
  ctx.fillText(zh, x, ch * 0.36);
  ctx.font = `400 ${ch * 0.24}px sans-serif`;
  ctx.fillStyle = '#c8d4de';
  ctx.fillText(en, x, ch * 0.72);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), mat);
  // mirrored plate on the back so the sign reads from both directions
  const plate2 = plate.clone();
  plate2.rotation.y = Math.PI;
  const frame = box(w + 0.08, h + 0.08, 0.05, M.signPost);
  const g = new THREE.Group();
  plate.position.z = 0.04;
  plate2.position.z = -0.04;
  g.add(plate, plate2, frame);
  return g;
}

// hanging sign: plate at height `y` (centre) + two rods up to the ceiling
export function hangingSign(opts, x, y, z, ry = 0) {
  const g = makeSign(opts);
  const h = opts.h || 1.6;
  for (const c of g.children) c.position.y = y;   // makeSign leaves the plate at y=0
  const ceilY = FLOOR_H - SLAB_T - 0.45;
  const rodLen = ceilY - (y + h / 2);
  for (const s of [-1, 1]) {
    const rod = box(0.05, Math.max(rodLen, 0.05), 0.05, M.signPost);
    rod.position.set(s * opts.w * 0.32, y + h / 2 + rodLen / 2, 0);
    g.add(rod);
  }
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  return g;
}

// platform hanging sign: number + line chip + destination, plate at 3.4 m + rods
export function platformSign(face) {
  const line = LINES[face.line];
  const g = makeSign({
    zh: `${face.num}  ${line.zh} ${face.to.zh}`,
    en: `Platform ${face.num} · ${line.en} ${face.to.en}`,
    chips: [{ text: String(face.num), color: line.color }],
    w: 7.5, h: 1.5,
  });
  const ceilY = FLOOR_H - SLAB_T - 0.45, plateY = 3.4, h = 1.5;
  for (const c of g.children) c.position.y = plateY;
  const rodLen = ceilY - (plateY + h / 2);
  for (const s of [-1, 1]) {
    const rod = box(0.05, Math.max(rodLen, 0.05), 0.05, M.signPost);
    rod.position.set(s * 7.5 * 0.32, plateY + h / 2 + rodLen / 2, 0);
    g.add(rod);
  }
  return g;
}

// Exit pavilion fascia: dark green band across the glazed front —
// red exit-letter chip + bilingual destination names, MTR entrance style.
export function exitFascia(exit, w = 7.7, h = 1.05) {
  const scale = 128;
  const cw = Math.round(w * scale), ch = Math.round(h * scale);
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0e2f24';
  ctx.fillRect(0, 0, cw, ch);

  // red letter chip
  const chip = ch * 0.78, pad = ch * 0.14;
  ctx.fillStyle = '#e2231a';
  ctx.fillRect(pad, ch / 2 - chip / 2, chip, chip);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${chip * 0.62}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(exit.id, pad + chip / 2, ch / 2 + 2);

  ctx.textAlign = 'left';
  const tx = pad * 2 + chip;
  ctx.fillStyle = '#fff';
  ctx.font = `600 ${ch * 0.42}px "PingFang HK","PingFang SC",sans-serif`;
  ctx.fillText(`出 ${exit.zh}`, tx, ch * 0.33);
  ctx.font = `400 ${ch * 0.26}px sans-serif`;
  ctx.fillStyle = '#cfe0d8';
  ctx.fillText(`Exit ${exit.id} · ${exit.en}`, tx, ch * 0.74);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1),
    new THREE.MeshBasicMaterial({ map: tex }));
  const back = box(w, h, 0.08, M.signPost);
  back.position.z = -0.05;
  const g = new THREE.Group();
  g.add(plate, back);
  return g;
}

// MTR totem on exit pavilions
export function exitTotem(exit) {
  const g = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e2231a';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 150px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(exit.id, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.15),
    new THREE.MeshBasicMaterial({ map: tex }));
  sign.position.y = 4.6;
  const pole = box(0.18, 4.0, 0.18, M.signPost);
  pole.position.y = 2;
  g.add(pole, sign);
  return g;
}
