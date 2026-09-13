import * as THREE from 'three';
import { M } from './materials.js';
import { solid, walkable, GATES } from '../registry.js';
import { box } from './structure.js';
import { GATE_PITCH, SHOP_NAMES, FLOOR_H, SLAB_T, EXITS, EXIT_Z, RESTAURANTS, MALL } from '../station-data.js';

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

// named shopfronts along a wall; faceDir = +1 faces +Z
export function shops(x0, x1, z, y, faceDir) {
  const g = new THREE.Group();
  // leave gaps where exit stairs land on this side, and where dedicated
  // restaurant / mall units occupy slots (stair bottom ≈ side*(EXIT_Z+runLen/2))
  const side = Math.sign(z);
  const skipXs = EXITS.filter(e => e.side === side).map(e => e.x);
  const reserved = RESTAURANTS.filter(r => r.side === side).map(r => r.x)
    .concat(MALL.side === side ? [MALL.x] : []);
  const blocked = x => skipXs.some(ex => x < ex + 2.6 && x + 7.5 > ex - 2.6)
    || reserved.some(rx => x < rx + 11.5 && x + 7.5 > rx);
  let i = 0;
  for (let x = x0; x < x1 - 7 && i < 40; x += 11.5, i++) {
    if (blocked(x)) continue;
    const name = SHOP_NAMES[i % SHOP_NAMES.length];
    const shop = box(7.5, 3.4, 2.2, M.wallDark);
    shop.position.set(x + 3.75, y + 1.7, z);
    g.add(solid(shop));
    // glazed front + interior glow
    const glow = box(6.8, 2.4, 0.08, glowMat);
    glow.position.set(x + 3.75, y + 1.35, z + faceDir * 1.06);
    g.add(glow);
    const fas = fasciaSign(name, 7.0, 0.75);
    fas.position.set(x + 3.75, y + 3.05, z + faceDir * 1.16);
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
  fas.position.set(x, y + 2.2, z + 1.66);
  g.add(fas);
  const fas2 = fasciaSign(name, 2.8, 0.6);
  fas2.position.set(x, y + 2.2, z - 1.66);
  fas2.rotation.y = Math.PI;
  g.add(fas2);
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

  const fas = brandFascia(r, w - 0.3, 0.85);
  fas.position.set(cx, y + 3.0, front + faceDir * 0.08);
  if (faceDir < 0) fas.rotation.y = Math.PI;
  g.add(fas);
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
  sign.position.set(cx, y + 3.15, front + faceDir * 0.09);
  if (faceDir < 0) sign.rotation.y = Math.PI;
  g.add(sign);
  return g;
}
