import * as THREE from 'three';
import { M } from './materials.js';
import { solid, walkable, GATES } from '../registry.js';
import { box } from './structure.js';
import { GATE_PITCH, SHOP_NAMES, FLOOR_H, SLAB_T, EXITS, EXIT_Z, RESTAURANTS, MALL, SEVEN } from '../station-data.js';
import { personFigure } from './people.js';

const padMat  = new THREE.MeshStandardMaterial({ color: 0x18d8e0, emissive: 0x0aa8b0, emissiveIntensity: 1.4, roughness: 0.4 });
const flapMat = new THREE.MeshStandardMaterial({ color: 0xd8b400, roughness: 0.55 });
const ductMat = new THREE.MeshStandardMaterial({ color: 0xaeb4ba, roughness: 0.55, metalness: 0.45 });
const casMat  = new THREE.MeshStandardMaterial({ color: 0xe4e7ea, roughness: 0.6 });
const ventMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.8 });

// ---- Octopus gate lanes ----------------------------------------------------
// One bank along X at world z. Each lane: two cabinets + two swing paddles +
// reader pad. Paddles fold back into the cabinets when a card is tapped.
export function gateBank(x0, x1, zRow, y) {
  const g = new THREE.Group();
  const cabW = 0.45, cabD = 1.9, cabH = 1.02;
  const nCab = Math.floor((x1 - x0) / GATE_PITCH) + 1;
  const cabGeo = new THREE.BoxGeometry(cabW, cabH, cabD);

  const cabinets = new THREE.InstancedMesh(cabGeo, M.gate, nCab);
  const m4 = new THREE.Matrix4();
  const cabXs = [];
  for (let i = 0; i < nCab; i++) {
    const x = x0 + i * GATE_PITCH;
    cabXs.push(x);
    m4.setPosition(x, y + cabH / 2, zRow);
    cabinets.setMatrixAt(i, m4);
  }
  cabinets.castShadow = true;
  cabinets.count = nCab;
  g.add(cabinets);

  // per-cabinet collider + reader pad on top
  const padGeo = new THREE.BoxGeometry(0.34, 0.07, 0.42);
  for (const x of cabXs) {
    const col = box(cabW, cabH, cabD, M.gate);
    col.position.set(x, y + cabH / 2, zRow);
    col.visible = false;              // visual from instanced mesh; this is the collider
    g.add(solid(col));
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(x + 0.02, y + cabH + 0.045, zRow - cabD / 2 + 0.3);
    g.add(pad);
  }

  // lanes between consecutive cabinets
  const flapGeo = new THREE.BoxGeometry(GATE_PITCH - cabW - 0.06, 0.8, 0.06);
  for (let i = 0; i < cabXs.length - 1; i++) {
    const xLane = (cabXs[i] + cabXs[i + 1]) / 2;
    const clear = GATE_PITCH - cabW;             // clear opening width
    const flaps = [];
    for (const s of [-1, 1]) {
      const geo = flapGeo.clone();
      geo.translate(s * -((GATE_PITCH - cabW - 0.06) / 2), 0, 0); // origin at hinge
      const flap = new THREE.Mesh(geo, flapMat);
      const pivot = new THREE.Group();
      pivot.position.set(xLane + s * clear / 2, y + 0.52, zRow);
      pivot.add(flap);
      g.add(pivot);
      flaps.push({ pivot, dir: -s });
    }
    GATES.push({
      x: xLane, z: zRow, half: clear / 2, open: 0, timer: 0,
      rect: { x0: xLane - clear / 2, z0: zRow - 0.22, x1: xLane + clear / 2, z1: zRow + 0.22 },
      flaps,
    });
  }
  return g;
}

// ---- shops & restaurants ----------------------------------------------------
function fasciaSign(name, w, h) {
  const scale = 96;
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const ctx = c.getContext('2d');
  ctx.fillStyle = name.color; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${c.height * 0.42}px "PingFang HK","PingFang SC",sans-serif`;
  ctx.fillText(name.zh, c.width / 2, c.height * 0.32);
  ctx.font = `500 ${c.height * 0.3}px sans-serif`;
  ctx.fillText(name.en, c.width / 2, c.height * 0.75);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), new THREE.MeshBasicMaterial({ map: tex }));
}

const glowMat = new THREE.MeshStandardMaterial({ color: 0xfff2d8, emissive: 0xffe9c0, emissiveIntensity: 0.9, roughness: 1 });
const coolMat = new THREE.MeshStandardMaterial({ color: 0xd8f0ff, emissive: 0xbfe2ff, emissiveIntensity: 1.1, roughness: 0.4 });
const screenMat = new THREE.MeshStandardMaterial({ color: 0x0d2036, emissive: 0x2a9ad8, emissiveIntensity: 1.3, roughness: 0.3 });
const glassCase = new THREE.MeshStandardMaterial({ color: 0xbfe0ee, roughness: 0.06, metalness: 0.05, transparent: true, opacity: 0.35 });

const SNACKS = [0xe2543e, 0xf2b53a, 0x5a9e4b, 0x4a7ec2, 0xe8e4dc, 0xd47a9e, 0x8a6db0];
const BREADS = [0xd9a45b, 0xc78b46, 0xe8c987, 0xa86e38, 0xf0deb0];
const DRINKS = [0x3aa5d8, 0xe2543e, 0x5a9e4b, 0xf2f2f2, 0xf2b53a, 0x2a2e35];
const BOOKS  = [0xa03030, 0x3a6ea5, 0x4e8a5a, 0xbf9b30, 0x8a6db0, 0xd8dde2, 0x2e8a8a];
const pickC = a => a[Math.floor(Math.random() * a.length)];

// one instanced box mesh for all small goods in a unit
function goodsMesh(list) {
  if (!list.length) return null;
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: 0.85 }), list.length);
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), sv = new THREE.Vector3(), c = new THREE.Color();
  list.forEach((it, i) => {
    m4.compose(v.set(it.x, it.y, it.z), new THREE.Quaternion(), sv.set(it.sx, it.sy, it.sz));
    im.setMatrixAt(i, m4);
    im.setColorAt(i, c.set(it.color));
  });
  im.instanceColor.needsUpdate = true;
  return im;
}

// gondola shelf: solid frame + tier boards stocked with goods rows
function shelf(g, goods, x, z, y, w, palette, faceDir = 0) {
  const frame = box(w, 1.9, 0.5, M.steel);
  frame.position.set(x, y + 0.95, z);
  g.add(solid(frame));
  for (let t = 0; t < 3; t++) {
    const ty = y + 0.5 + t * 0.55;
    const board = box(w - 0.08, 0.05, 0.5, M.ceiling);
    board.position.set(x, ty - 0.03, z);
    g.add(board);
    const n = Math.max(2, Math.floor(w / 0.24));
    for (let i = 0; i < n; i++) {
      const gx = x - w / 2 + 0.16 + i * (w - 0.32) / (n - 1);
      goods.push({ x: gx, y: ty + 0.1, z: z - 0.14, sx: 0.15, sy: 0.16 + Math.random() * 0.1, sz: 0.14, color: pickC(palette) });
      goods.push({ x: gx, y: ty + 0.1, z: z + 0.14, sx: 0.15, sy: 0.16 + Math.random() * 0.1, sz: 0.14, color: pickC(palette) });
    }
  }
}

// back-wall shelving strip (pharmacy/bookstore style) — z is the wall's
// interior face; the unit extends faceDir (toward the shop front) from it
function wallShelves(g, goods, x, z, y, w, faceDir, palette, books = false) {
  const frame = box(w, 2.1, 0.35, M.wallDark);
  frame.position.set(x, y + 1.05, z + faceDir * 0.18);
  g.add(solid(frame));
  for (let t = 0; t < 3; t++) {
    const ty = y + 0.6 + t * 0.62;
    const board = box(w - 0.1, 0.05, 0.3, M.ceiling);
    board.position.set(x, ty - 0.03, z + faceDir * 0.18);
    g.add(board);
    const n = Math.max(2, Math.floor(w / (books ? 0.12 : 0.26)));
    for (let i = 0; i < n; i++) {
      goods.push({
        x: x - w / 2 + 0.14 + i * (w - 0.28) / (n - 1),
        y: ty + (books ? 0.13 : 0.11),
        z: z + faceDir * 0.18 + (Math.random() - 0.5) * 0.1,
        sx: books ? 0.07 : 0.16, sy: books ? 0.26 : 0.18 + Math.random() * 0.1, sz: 0.18,
        color: pickC(palette),
      });
    }
  }
}

function counterUnit(g, x, z, y, w, faceDir) {
  const c = box(w, 1.0, 0.55, M.booth);
  c.position.set(x, y + 0.5, z);
  g.add(solid(c));
  const reg = box(0.35, 0.3, 0.06, screenMat);
  reg.position.set(x + w / 4, y + 1.16, z);
  g.add(reg);
  return c;
}

// ATM machines against a wall (bank)
function atmRow(g, x, z, y, faceDir, n = 2) {
  for (let i = 0; i < n; i++) {
    const ax = x + i * 1.1;
    const atm = box(0.75, 1.6, 0.5, M.steel);
    atm.position.set(ax, y + 0.8, z);
    g.add(solid(atm));
    const scr = box(0.45, 0.35, 0.04, screenMat);
    scr.position.set(ax, y + 1.15, z + faceDir * 0.26);
    const slot = box(0.4, 0.06, 0.04, M.signPost);
    slot.position.set(ax, y + 0.82, z + faceDir * 0.26);
    g.add(scr, slot);
  }
}

// glass-door chiller bank (convenience store drinks wall) — z is the wall's
// interior face; the unit extends faceDir (toward the shop front) from it
function chillerWall(g, goods, x, z, y, w, faceDir) {
  const frame = box(w, 2.3, 0.55, M.signPost);
  frame.position.set(x, y + 1.15, z + faceDir * 0.28);
  g.add(solid(frame));
  const glow = box(w - 0.2, 1.9, 0.06, coolMat);
  glow.position.set(x, y + 1.15, z + faceDir * 0.57);
  g.add(glow);
  const nDoor = Math.max(2, Math.round(w / 0.9));
  for (let i = 0; i <= nDoor; i++) {
    const mull = box(0.06, 1.9, 0.1, M.signPost);
    mull.position.set(x - w / 2 + 0.1 + i * (w - 0.2) / nDoor, y + 1.15, z + faceDir * 0.6);
    g.add(mull);
  }
  // bottle rows visible on the lit face
  for (let t = 0; t < 4; t++) {
    for (let i = 0; i < nDoor * 4; i++) {
      goods.push({
        x: x - w / 2 + 0.25 + i * (w - 0.5) / (nDoor * 4 - 1),
        y: y + 0.45 + t * 0.45,
        z: z + faceDir * 0.52,
        sx: 0.09, sy: 0.22, sz: 0.08, color: pickC(DRINKS),
      });
    }
  }
}

// bakery display case with bread rows
function bakeryCase(g, goods, x, z, y) {
  const base = box(2.2, 0.55, 0.7, M.booth);
  base.position.set(x, y + 0.27, z);
  g.add(solid(base));
  const dome = box(2.2, 0.5, 0.7, glassCase);
  dome.position.set(x, y + 0.8, z);
  g.add(dome);
  for (let i = 0; i < 8; i++) {
    goods.push({
      x: x - 0.9 + i * 0.26, y: y + 0.62, z: z + (i % 2 ? 0.14 : -0.14),
      sx: 0.2, sy: 0.1, sz: 0.18, color: pickC(BREADS),
    });
  }
}

// open-front shop shell: back wall + jambs + header beam, interior exposed
function shopShell(g, cx, z, y, faceDir, w = 7.5, d = 2.2, h = 3.4) {
  const front = z + faceDir * d / 2, back = z - faceDir * d / 2, inw = -faceDir;
  const mid = (front + back) / 2;
  const backW = box(w, h, 0.2, M.wallDark);
  backW.position.set(cx, y + h / 2, back + inw * -0.1);
  g.add(solid(backW));
  for (const sx of [cx - w / 2 + 0.15, cx + w / 2 - 0.15]) {
    const jamb = box(0.3, h, d, M.wallDark);
    jamb.position.set(sx, y + h / 2, mid);
    g.add(solid(jamb));
  }
  const roofB = box(w, 0.5, d, M.signPost);
  roofB.position.set(cx, y + h - 0.25, mid);
  g.add(roofB);
  const strip = box(w - 0.8, 0.08, 0.4, glowMat);
  strip.position.set(cx, y + h - 0.58, mid);
  g.add(strip);
  return { front, back, inw, mid };
}

// interior fittings per shop type (en name drives the kind)
const SHOP_KIND = {
  '7-Eleven': 'convenience', 'Cha Chaan Teng': 'diner', 'A1 Bakery': 'bakery',
  'Cafe': 'cafe', 'Pharmacy': 'shelves', 'Fast Food': 'diner',
  'Bookstore': 'books', 'Bank': 'bank',
};

function shopInterior(g, kind, cx, z, y, faceDir, sh) {
  const goods = [];
  // interior face of the back wall; at(d) = d metres in front of it
  const wallZ = sh.back + faceDir * 0.2;
  const at = d => wallZ + faceDir * d;
  const faceFront = faceDir > 0 ? 0 : Math.PI;   // yaw facing the shop front
  switch (kind) {
    case 'bank': {
      atmRow(g, cx - 2.4, at(0.55), y, faceDir, 2);
      const c = box(2.6, 1.0, 0.5, M.booth);
      c.position.set(cx + 1.8, y + 0.5, at(0.8));
      const glassTop = box(2.6, 0.8, 0.06, glassCase);
      glassTop.position.set(cx + 1.8, y + 1.45, at(0.8));
      g.add(solid(c), glassTop);
      g.add(fig('stand', { x: cx + 1.8, z: at(0.4) }, faceFront));
      g.add(fig('stand', { x: cx - 2.4, z: at(1.2) }, faceFront));
      break;
    }
    case 'diner': {
      counterUnit(g, cx - 2.2, at(0.55), y, 2.6, faceDir);
      const menu = box(2.4, 0.7, 0.05, glowMat);
      menu.position.set(cx - 2.2, y + 2.2, at(0.05));
      g.add(menu);
      cafeTable(g, cx + 1.2, z + faceDir * 0.1, y);
      cafeTable(g, cx + 2.9, z + faceDir * 0.05, y);
      g.add(fig('sit', { x: cx + 1.2 - 0.95, z: z + faceDir * 0.45 }, Math.PI / 2));
      g.add(fig('sit', { x: cx + 2.9 + 0.95, z: z + faceDir * 0.4 }, -Math.PI / 2));
      g.add(fig('stand', { x: cx - 2.2, z: at(1.0) }, faceFront));
      break;
    }
    case 'bakery': {
      wallShelves(g, goods, cx, wallZ, y, 6.4, faceDir, BREADS);
      bakeryCase(g, goods, cx - 1.2, z + faceDir * 0.1, y);
      g.add(fig('stand', { x: cx + 1.8, z: at(1.0) }, faceFront));
      break;
    }
    case 'cafe': {
      counterUnit(g, cx - 1.8, at(0.55), y, 3.0, faceDir);
      const machine = box(0.6, 0.5, 0.4, M.signPost);
      machine.position.set(cx - 0.9, y + 1.25, at(0.55));
      g.add(machine);
      cafeTable(g, cx + 2.2, z + faceDir * 0.15, y);
      g.add(fig('sit', { x: cx + 2.2 + 0.95, z: z + faceDir * 0.5 }, -Math.PI / 2));
      g.add(fig('stand', { x: cx - 1.8, z: at(0.95) }, faceFront));
      break;
    }
    case 'books': {
      wallShelves(g, goods, cx, wallZ, y, 6.4, faceDir, BOOKS, true);
      shelf(g, goods, cx - 0.5, z + faceDir * 0.2, y, 3.0, BOOKS);
      g.add(fig('stand', { x: cx - 0.5, z: z + faceDir * 0.9 }, faceFront));
      break;
    }
    case 'convenience': {
      chillerWall(g, goods, cx, wallZ, y, 6.4, faceDir);
      shelf(g, goods, cx - 0.8, z + faceDir * 0.25, y, 3.4, SNACKS);
      counterUnit(g, cx + 2.6, z + faceDir * 0.4, y, 1.6, faceDir);
      g.add(fig('stand', { x: cx + 2.6, z: at(0.9) }, faceFront));
      g.add(fig('stand', { x: cx - 0.8, z: z + faceDir * 1.0 }, faceFront));
      break;
    }
    default: {   // 'shelves' (pharmacy)
      wallShelves(g, goods, cx, wallZ, y, 6.4, faceDir, SNACKS);
      shelf(g, goods, cx - 0.6, z + faceDir * 0.2, y, 3.2, SNACKS);
      counterUnit(g, cx + 2.5, at(0.55), y, 1.6, faceDir);
      g.add(fig('stand', { x: cx + 2.5, z: at(0.95) }, faceFront));
    }
  }
  const gm = goodsMesh(goods);
  if (gm) g.add(gm);
}

// static occupant figure — thin wrapper over personFigure (y = local floor)
function fig(pose, at, yaw) {
  const m = personFigure({ pose, yaw });
  m.position.set(at.x, 0, at.z);
  return m;
}

// named shopfronts along a wall; faceDir = +1 faces +Z
export function shops(x0, x1, z, y, faceDir) {
  const g = new THREE.Group();
  // leave gaps where exit stairs land on this side, and where dedicated
  // restaurant / mall / 7-Eleven units occupy slots
  const side = Math.sign(z);
  const skipXs = EXITS.filter(e => e.side === side).map(e => e.x);
  const reserved = RESTAURANTS.filter(r => r.side === side).map(r => r.x)
    .concat(MALL.side === side ? [MALL.x] : [])
    .concat(SEVEN.side === side ? [SEVEN.x] : []);
  const blocked = x => skipXs.some(ex => x < ex + 2.6 && x + 7.5 > ex - 2.6)
    || reserved.some(rx => x < rx + 11.5 && x + 7.5 > rx);
  let i = 0;
  for (let x = x0; x < x1 - 7 && i < 40; x += 11.5, i++) {
    if (blocked(x)) continue;
    const name = SHOP_NAMES[i % SHOP_NAMES.length];
    const cx = x + 3.75;
    const sh = shopShell(g, cx, z, y, faceDir);
    shopInterior(g, SHOP_KIND[name.en] || 'shelves', cx, z, y, faceDir, sh);
    const fas = fasciaSign(name, 7.0, 0.75);
    fas.position.set(cx, y + 3.05, z + faceDir * 1.22);
    if (faceDir < 0) fas.rotation.y = Math.PI;
    g.add(fas);
  }
  return g;
}

// freestanding kiosk stall mid-concourse
export function kiosk(x, z, y, i = 0) {
  const g = new THREE.Group();
  const name = SHOP_NAMES[i % SHOP_NAMES.length];
  const body = box(3.2, 2.6, 3.2, M.booth);
  body.position.set(x, y + 1.3, z);
  g.add(solid(body));
  const counter = box(3.4, 0.12, 3.4, M.steel);
  counter.position.set(x, y + 1.05, z);
  g.add(counter);
  const roof = box(3.9, 0.18, 3.9, M.signPost);
  roof.position.set(x, y + 2.7, z);
  g.add(roof);
  const fas = fasciaSign(name, 2.8, 0.6);
  fas.position.set(x, y + 2.2, z + 1.72);
  g.add(fas);
  const fas2 = fasciaSign(name, 2.8, 0.6);
  fas2.position.set(x, y + 2.2, z - 1.72);
  fas2.rotation.y = Math.PI;
  g.add(fas2);
  // vendor at the serving side, facing the concourse
  g.add(fig('stand', { x: x + 0.9, z: z - Math.sign(z) * 2.35 }, Math.sign(z) > 0 ? Math.PI : 0));
  return g;
}

// customer service booth (glazed kiosk)
export function serviceBooth(x, z, y) {
  const g = new THREE.Group();
  const base = box(5, 1.1, 3, M.booth);
  base.position.set(x, y + 0.55, z);
  const glass = box(5, 1.5, 3, M.glass);
  glass.position.set(x, y + 1.85, z);
  const roof = box(5.6, 0.25, 3.6, M.signPost);
  roof.position.set(x, y + 2.75, z);
  g.add(solid(base), solid(glass), roof);
  // staff inside the glazed booth, facing the concourse
  const face = Math.sign(z) > 0 ? Math.PI : 0;
  g.add(fig('stand', { x: x - 1.2, z }, face));
  g.add(fig('stand', { x: x + 1.2, z }, face));
  return g;
}

// toilet block
export function toilets(x, z, y) {
  const b = box(10, 3.2, 5, M.wallDark);
  b.position.set(x, y + 1.6, z);
  return solid(b);
}

// ---- HVAC: ceiling ducts, cassette air-con units, linear vents --------------
export function hvac(rect, y, zs) {
  const g = new THREE.Group();
  const ceilY = FLOOR_H - SLAB_T - 0.45 + y;
  const len = rect.x1 - rect.x0 - 8;
  for (const z of zs) {
    const duct = box(len, 0.55, 1.5, ductMat);
    duct.position.set((rect.x0 + rect.x1) / 2, ceilY - 0.55, z);
    g.add(duct);
    for (const s of [-1, 1]) {
      const vent = box(len, 0.12, 0.22, ventMat);
      vent.position.set((rect.x0 + rect.x1) / 2, ceilY - 0.9, z + s * 0.95);
      g.add(vent);
    }
  }
  // cassette AC units in a grid between the duct runs
  const zmin = Math.min(...zs), zmax = Math.max(...zs);
  for (let x = rect.x0 + 14; x < rect.x1 - 10; x += 18) {
    for (const z of [zmin - 4, (zmin + zmax) / 2, zmax + 4]) {
      const u = box(1.7, 0.4, 1.7, casMat);
      u.position.set(x, ceilY - 0.5, z);
      const grille = box(1.3, 0.05, 1.3, ventMat);
      grille.position.set(x, ceilY - 0.72, z);
      g.add(u, grille);
    }
  }
  return g;
}

// ---- branded tenants --------------------------------------------------------
const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0e14, roughness: 0.9 });
const tableMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.5 });
const stoolMat = new THREE.MeshStandardMaterial({ color: 0x8a2f2f, roughness: 0.6 });

// logo glyph on a fascia: arches (McDonald's), nigiri (Genki), steamer, MTR roundel
function drawMark(ctx, mark, s) {
  if (mark === 'arches') {
    ctx.strokeStyle = '#ffc72c'; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.quadraticCurveTo(0.02 * s, -0.42 * s, 0.24 * s, -0.44 * s);
    ctx.quadraticCurveTo(0.44 * s, -0.44 * s, 0.5 * s, 0.4 * s);
    ctx.quadraticCurveTo(0.56 * s, -0.44 * s, 0.76 * s, -0.44 * s);
    ctx.quadraticCurveTo(0.98 * s, -0.42 * s, s, 0.4 * s);
    ctx.stroke();
  } else if (mark === 'sushi') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(s / 2, s * 0.12, s * 0.46, s * 0.28, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f6864a';
    ctx.beginPath(); ctx.ellipse(s / 2, s * 0.02, s * 0.48, s * 0.22, 0, Math.PI, 0); ctx.fill();
  } else if (mark === 'steamer') {
    ctx.fillStyle = '#e8c98a';
    ctx.fillRect(s * 0.14, s * 0.08, s * 0.72, s * 0.12);
    ctx.beginPath(); ctx.arc(s / 2, s * 0.18, s * 0.34, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
    for (const fx of [0.28, 0.5, 0.72]) {
      ctx.beginPath();
      ctx.moveTo(s * fx, s * 0.02);
      ctx.quadraticCurveTo(s * (fx - 0.09), -s * 0.2, s * fx, -s * 0.4);
      ctx.stroke();
    }
  } else if (mark === 'mtr') {
    ctx.fillStyle = '#a0191f'; ctx.fillRect(0, -s / 2, s, s);
    ctx.fillStyle = '#0f2d52';
    ctx.beginPath(); ctx.arc(s / 2, 0, s * 0.34, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(s * 0.14, -s * 0.05, s * 0.72, s * 0.1);
  }
}

// fascia with brand background + logo mark + bilingual name
function brandFascia(name, w, h) {
  const scale = 96;
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const ctx = c.getContext('2d');
  ctx.fillStyle = name.color; ctx.fillRect(0, 0, c.width, c.height);
  let pad = c.height * 0.16;
  if (name.mark) {
    const s = c.height * 0.66;
    ctx.save(); ctx.translate(pad, c.height / 2); drawMark(ctx, name.mark, s); ctx.restore();
    pad += s + c.height * 0.18;
  }
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${c.height * 0.4}px "PingFang HK","PingFang SC",sans-serif`;
  ctx.fillText(name.zh, pad, c.height * 0.33);
  ctx.font = `500 ${c.height * 0.26}px sans-serif`;
  ctx.fillText(name.en, pad, c.height * 0.75);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), new THREE.MeshBasicMaterial({ map: tex }));
}

function cafeTable(g, tx, tz, y) {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 14), tableMat);
  top.position.set(tx, y + 0.72, tz);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.72, 8), M.signPost);
  leg.position.set(tx, y + 0.37, tz);
  g.add(solid(top), leg);
  for (const a of [-1, 1]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 10), stoolMat);
    st.position.set(tx + a * 0.95, y + 0.22, tz + 0.35 * a);
    g.add(solid(st));
  }
}

// Branded F&B unit on the shop row: open front, counter + tables inside —
// the player can walk in. r = {x: slot left edge, zh, en, color, mark}.
export function restaurant(r, z, y, faceDir) {
  const g = new THREE.Group();
  const w = 10.8, h = 3.5, d = 2.2;
  const cx = r.x + 5.4;
  const front = z + faceDir * 1.1, back = z - faceDir * 1.1, inw = -faceDir;
  const mid = (front + back) / 2;

  const backW = box(w, h, 0.22, M.wallDark);
  backW.position.set(cx, y + h / 2, back + inw * -0.11);
  g.add(solid(backW));
  for (const sx of [cx - w / 2 + 0.15, cx + w / 2 - 0.15]) {
    const jamb = box(0.3, h, d, M.wallDark);
    jamb.position.set(sx, y + h / 2, mid);
    g.add(solid(jamb));
  }
  const roofB = box(w, 0.5, d, M.signPost);
  roofB.position.set(cx, y + h - 0.25, mid);
  g.add(roofB);

  // interior: counter + menu board on the back wall, ceiling strip, tables
  const counter = box(4.4, 1.0, 0.55, M.booth);
  counter.position.set(cx - 2.5, y + 0.5, back - inw * 0.6);
  const menu = box(4.6, 0.95, 0.06, glowMat);
  menu.position.set(cx - 2.5, y + 2.15, back - inw * 0.25);
  const strip = box(w - 1.4, 0.08, 0.45, glowMat);
  strip.position.set(cx, y + h - 0.58, mid);
  g.add(solid(counter), menu, strip);
  cafeTable(g, cx + 1.6, mid - inw * 0.3, y);
  cafeTable(g, cx + 3.6, mid - inw * 0.05, y);

  // diners at the tables + a staff member behind the counter
  g.add(fig('sit', { x: cx + 1.6 - 0.95, z: mid - inw * 0.65 }, Math.PI / 2));
  g.add(fig('sit', { x: cx + 3.6 + 0.95, z: mid + inw * 0.28 }, -Math.PI / 2));
  g.add(fig('sit', { x: cx + 3.6 - 0.95, z: mid - inw * 0.38 }, Math.PI / 2));
  g.add(fig('stand', { x: cx - 2.5, z: back - inw * 1.1 }, faceDir > 0 ? 0 : Math.PI));

  // brand touches: McDonald's self-order kiosks, Genki conveyor belt,
  // dim-sum steamer stack
  if (r.mark === 'arches') {
    for (const kx of [cx - 4.4, cx - 3.8]) {
      const kio = box(0.4, 1.5, 0.18, M.signPost);
      kio.position.set(kx, y + 0.75, mid + inw * 0.35);
      const scr = box(0.32, 0.55, 0.04, screenMat);
      scr.position.set(kx, y + 1.15, mid + inw * 0.45);
      g.add(solid(kio), scr);
    }
  } else if (r.mark === 'sushi') {
    // conveyor belt running along the counter front
    const belt = box(4.2, 0.14, 0.4, new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.4 }));
    belt.position.set(cx - 2.5, y + 1.12, back - inw * 0.15);
    g.add(belt);
  } else if (r.mark === 'steamer') {
    for (const tx of [cx + 1.6, cx + 3.6]) {
      for (let i = 0; i < 3; i++) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 10), tableMat);
        st.position.set(tx, y + 0.78 + i * 0.1, mid - inw * 0.15);
        g.add(st);
      }
    }
  }

  const fas = brandFascia(r, w - 0.3, 0.85);
  fas.position.set(cx, y + 3.0, front + faceDir * 0.12);
  if (faceDir < 0) fas.rotation.y = Math.PI;
  g.add(fas);
  return g;
}

// ---- 7-Eleven ---------------------------------------------------------------
// White fascia with the logo tile (red-bar "7" with green ELEVEn across) and
// the orange/red/green tri-colour stripe; open front, stocked gondolas,
// chiller wall, cashier counter — modelled on the MTR Admiralty store.
function sevenFascia(w, h) {
  const scale = 96;
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4f4f2'; ctx.fillRect(0, 0, c.width, c.height);
  // logo tile, left of centre
  const s = c.height * 0.92, lx = c.height * 0.14, ly = c.height * 0.04;
  ctx.fillStyle = '#fff'; ctx.fillRect(lx, ly, s, s);
  ctx.strokeStyle = '#007a5e'; ctx.lineWidth = s * 0.045;
  ctx.strokeRect(lx + s * 0.03, ly + s * 0.03, s * 0.94, s * 0.94);
  // the "7": red top bar, orange diagonal
  ctx.fillStyle = '#ee3524';
  ctx.fillRect(lx + s * 0.24, ly + s * 0.16, s * 0.52, s * 0.17);
  ctx.fillStyle = '#f47a20';
  ctx.beginPath();
  ctx.moveTo(lx + s * 0.66, ly + s * 0.33);
  ctx.lineTo(lx + s * 0.76, ly + s * 0.33);
  ctx.lineTo(lx + s * 0.52, ly + s * 0.86);
  ctx.lineTo(lx + s * 0.4, ly + s * 0.86);
  ctx.closePath(); ctx.fill();
  // ELEVEn inside the bar
  ctx.fillStyle = '#007a5e';
  ctx.font = `700 ${s * 0.11}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('ELEVEn', lx + s * 0.5, ly + s * 0.245);
  // wordmark text to the right
  ctx.fillStyle = '#1d1d1b';
  ctx.textAlign = 'left';
  ctx.font = `800 ${c.height * 0.34}px sans-serif`;
  ctx.fillText('7-ELEVEn', lx + s + c.height * 0.22, c.height * 0.4);
  ctx.font = `500 ${c.height * 0.16}px sans-serif`;
  ctx.fillStyle = '#555';
  ctx.fillText('便利店 Convenience Store', lx + s + c.height * 0.24, c.height * 0.72);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), new THREE.MeshBasicMaterial({ map: tex }));
}

export function sevenEleven(x, z, y, faceDir) {
  const g = new THREE.Group();
  const w = 10.8, h = 3.6, d = 2.2;
  const cx = x + w / 2;
  const front = z + faceDir * d / 2, back = z - faceDir * d / 2, inw = -faceDir;
  const mid = (front + back) / 2;

  const backW = box(w, h, 0.2, M.wallDark);
  backW.position.set(cx, y + h / 2, back + inw * -0.1);
  g.add(solid(backW));
  for (const sx of [cx - w / 2 + 0.15, cx + w / 2 - 0.15]) {
    const jamb = box(0.3, h, d, M.wallDark);
    jamb.position.set(sx, y + h / 2, mid);
    g.add(solid(jamb));
  }
  const roofB = box(w, 0.5, d, M.signPost);
  roofB.position.set(cx, y + h - 0.25, mid);
  g.add(roofB);
  // white interior floor tile + ceiling light strips
  const tile = box(w - 0.7, 0.05, d - 0.4, new THREE.MeshStandardMaterial({ color: 0xeef0f0, roughness: 0.35 }));
  tile.position.set(cx, y + 0.03, mid);
  g.add(walkable(tile));
  const strip = box(w - 1.2, 0.08, 0.4, coolMat);
  strip.position.set(cx, y + h - 0.55, mid);
  g.add(strip);

  // interior: chiller wall across the back, two snack gondolas, cashier counter
  const wallZ = back + faceDir * 0.2;      // interior face of the back wall
  const faceFront = faceDir > 0 ? 0 : Math.PI;
  const goods = [];
  chillerWall(g, goods, cx, wallZ, y, w - 1.2, faceDir);
  shelf(g, goods, cx - 2.2, mid + inw * 0.15, y, 3.6, SNACKS);
  shelf(g, goods, cx + 1.2, mid + inw * 0.15, y, 3.0, SNACKS);
  counterUnit(g, cx + 4.0, mid + inw * 0.3, y, 1.8, faceDir);
  // hot snack case beside the till
  const hot = box(0.9, 0.5, 0.5, glassCase);
  hot.position.set(cx + 3.2, y + 1.3, mid + inw * 0.3);
  g.add(hot);
  const gm = goodsMesh(goods);
  if (gm) g.add(gm);
  // cashier + a browsing customer
  g.add(fig('stand', { x: cx + 4.0, z: mid + inw * 0.7 }, faceFront));
  g.add(fig('stand', { x: cx - 2.2, z: mid - inw * 0.6 }, faceFront + 0.3));

  // fascia: white sign + tri-colour stripe band across the whole width
  const fas = sevenFascia(w - 0.4, 0.9);
  fas.position.set(cx, y + 3.0, front + faceDir * 0.12);
  if (faceDir < 0) fas.rotation.y = Math.PI;
  g.add(fas);
  const stripes = ['#f47a20', '#ee3524', '#007a5e'];
  stripes.forEach((c, i) => {
    const b = box(w - 0.2, 0.13, 0.06, new THREE.MeshStandardMaterial({ color: new THREE.Color(c), roughness: 0.5 }));
    b.position.set(cx, y + 2.32 - i * 0.13, front + faceDir * 0.08);
    g.add(b);
  });
  return g;
}

// MTR mall link: wide lit portal in the shop row with a dark corridor recess
// at the back suggesting the mall continuing beyond the station box.
export function mallEntrance(x, z, y, faceDir) {
  const g = new THREE.Group();
  const w = 11.5, h = 3.9, d = 2.2;
  const cx = x + w / 2;
  const front = z + faceDir * 1.1, back = z - faceDir * 1.1, inw = -faceDir;
  const mid = (front + back) / 2;

  const backW = box(w, h, 0.22, M.wallDark);
  backW.position.set(cx, y + h / 2, back + inw * -0.11);
  g.add(solid(backW));
  for (const sx of [cx - w / 2 + 0.2, cx + w / 2 - 0.2]) {
    const jamb = box(0.4, h, d, M.wallDark);
    jamb.position.set(sx, y + h / 2, mid);
    g.add(solid(jamb));
  }
  const roofB = box(w + 0.6, 0.6, d + 0.3, M.signPost);
  roofB.position.set(cx, y + h - 0.3, mid);
  g.add(roofB);
  // polished mall floor + threshold strip
  const tile = box(w - 0.8, 0.07, d - 0.3, M.paid);
  tile.position.set(cx, y + 0.035, mid);
  walkable(tile);

  // dark corridor recess centred at the back (the mall continues off-model)
  const corr = box(4.8, 2.8, 0.8, darkMat);
  corr.position.set(cx, y + 1.4, back - inw * 0.45);
  g.add(solid(corr));
  const lit = box(4.5, 0.3, 0.06, glowMat);
  lit.position.set(cx, y + 2.62, back - inw * 0.87);
  g.add(tile, lit);
  // small lit shopfronts flanking the corridor inside the entrance
  for (const sx of [cx - 3.6, cx + 3.6]) {
    const sf = box(2.2, 1.8, 0.08, glowMat);
    sf.position.set(sx, y + 1.3, back - inw * 0.28);
    g.add(sf);
    const fas = fasciaSign({ zh: '商舖', en: 'Shop', color: '#22404f' }, 2.3, 0.5);
    fas.position.set(sx, y + 2.55, back - inw * 0.34);
    if (faceDir < 0) fas.rotation.y = Math.PI;
    g.add(fas);
  }

  const sign = brandFascia(MALL, w - 0.4, 1.05);
  sign.position.set(cx, y + 3.15, front + faceDir * 0.13);
  if (faceDir < 0) sign.rotation.y = Math.PI;
  g.add(sign);
  return g;
}
