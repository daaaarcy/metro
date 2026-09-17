// Above-ground context — the schematic city around each station: windowed
// towers on the real skyline's footprints (compressed heights), flanking
// roads, parks, and the harbour along the north (−z) edge.
// Towers stand OUTSIDE the excavation holes (they'd float over the void
// otherwise); each registers a collider so the streets stay real if walked.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { solid } from '../registry.js';
import { LEVELS } from '../station-data.js';

// ---- facade materials: canvas window grids, lit cells glow via emissiveMap.
// One tile = 16 bays of ~3.4 m => ~54 m of facade per repeat; windows light
// up per-FLOOR (with jitter) like a real office block, not per-pixel noise.
const CELL = 3.4, NCELL = 16, TILE_M = CELL * NCELL;
function facadeMats(fg, unlit, lit, litRatio = 0.34, cellPx = 8) {
  const S = NCELL * cellPx;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const e = document.createElement('canvas'); e.width = e.height = S;
  const ctx = c.getContext('2d'), ectx = e.getContext('2d');
  ctx.fillStyle = fg; ctx.fillRect(0, 0, S, S);
  ectx.fillStyle = '#000'; ectx.fillRect(0, 0, S, S);
  const rnd = i => Math.abs(Math.sin(i * 12.9898 + cellPx * 7.7) * 43758.55) % 1;
  for (let y = 0; y < NCELL; y++) {
    const floorLit = rnd(y * 17.3) < litRatio;        // whole floors on/off
    for (let x = 0; x < NCELL; x++) {
      const on = floorLit ? rnd(x * 31.7 + y * 91.1) < 0.85
                          : rnd(x * 47.9 + y * 13.7) < 0.08;
      ctx.fillStyle = on ? lit : unlit;
      ctx.fillRect(x * cellPx + 1, y * cellPx + 1, cellPx - 2, cellPx - 2);
      if (on) {
        ectx.fillStyle = lit;
        ectx.fillRect(x * cellPx + 1, y * cellPx + 1, cellPx - 2, cellPx - 2);
      }
    }
  }
  const mk = cv => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  };
  return new THREE.MeshStandardMaterial({
    map: mk(c), emissiveMap: mk(e), emissive: 0xffffff, emissiveIntensity: 0.5,
    roughness: 0.6, metalness: 0.25,
  });
}
const FACADE = {
  office:   facadeMats('#232830', '#2e3742', '#e8d9b0'),
  glass:    facadeMats('#1a2530', '#33414e', '#cfe4f0', 0.42),
  gold:     facadeMats('#3d331c', '#5c4e2a', '#f0d888'),
  hotel:    facadeMats('#332e28', '#453e35', '#f0d0a0'),
  res:      facadeMats('#2e2b27', '#3e382f', '#e0c898', 0.3),
  mall:     facadeMats('#262b31', '#323840', '#ffd9a0', 0.18),
  heritage: facadeMats('#4e473e', '#5c544a', '#e8dcc0', 0.3),
};
const ROOF = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.95 });
const PARK_M = new THREE.MeshStandardMaterial({ color: 0x2e5b34, roughness: 1 });
const TREE_M = new THREE.MeshStandardMaterial({ color: 0x3f7040, roughness: 0.9 });
const TRUNK_M = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 });
const QUAY_M = new THREE.MeshStandardMaterial({ color: 0x5a5f66, roughness: 0.9 });
const LAMP_M = new THREE.MeshStandardMaterial({ color: 0x30343a, emissive: 0xffd9a0, emissiveIntensity: 1.6 });
const ROAD_M = (() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#23262b'; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#c8c03a'; ctx.fillRect(4, 30, 24, 3);       // centre dash along x
  ctx.fillStyle = '#3d424a'; ctx.fillRect(0, 0, 64, 4); ctx.fillRect(0, 60, 64, 4); // kerb lines
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
})();
const WATER_M = new THREE.MeshStandardMaterial({
  color: 0x12202e, roughness: 0.25, metalness: 0.5,
});

// scale a box's per-face UVs so the facade texture tiles at `tile` metres
function scaleBoxUV(geo, w, h, d, tile = TILE_M) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
  }
  return geo;
}

const bag = new Map();          // material -> geometries awaiting merge
const put = (geo, mat, x, y, z, ry = 0) => {
  if (ry) geo.rotateY(ry);
  geo.translate(x, y, z);
  if (!bag.has(mat)) bag.set(mat, []);
  bag.get(mat).push(geo);
};

// world-space collider proxy + merged geometry entry for one block
function tower(x, z, w, d, h, kind = 'office') {
  put(scaleBoxUV(new THREE.BoxGeometry(w, h, d), w, h, d), FACADE[kind], x, h / 2, z);
  put(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), ROOF, x, h + 0.25, z);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), FACADE[kind]);
  m.position.set(x, h / 2, z);
  solid(m);
}
function block(x, z, w, d, h, mat, collide = true) {
  put(new THREE.BoxGeometry(w, h, d), mat, x, h / 2, z);
  if (!collide) return;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, h / 2, z);
  solid(m);
}
function cyl(x, z, r, h, kind = 'hotel') {
  const geo = new THREE.CylinderGeometry(r, r, h, 12);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r / TILE_M, uv.getY(i) * h / TILE_M);
  put(geo, FACADE[kind], x, h / 2, z);
  put(new THREE.CylinderGeometry(r + 0.3, r + 0.3, 0.5, 12), ROOF, x, h + 0.25, z);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), FACADE[kind]);
  m.position.set(x, h / 2, z);
  solid(m);
}
function road(x0, z0, x1, z1) {
  const w = x1 - x0, d = z1 - z0;
  const geo = new THREE.PlaneGeometry(w, d);
  geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 12, uv.getY(i) * d / 12);
  put(geo, ROAD_M, (x0 + x1) / 2, 0.02, (z0 + z1) / 2);
}
function park(x0, z0, x1, z1, nTrees = 14) {
  const w = x1 - x0, d = z1 - z0;
  block((x0 + x1) / 2, (z0 + z1) / 2, w, d, 0.12, PARK_M, false);
  for (let i = 0; i < nTrees; i++) {
    const tx = x0 + 4 + ((i * 37.7) % (w - 8)), tz = z0 + 4 + ((i * 23.9) % (d - 8));
    put(new THREE.CylinderGeometry(0.14, 0.18, 1.6, 5), TRUNK_M, tx, 0.8, tz);
    put(new THREE.ConeGeometry(1.5, 3.2, 7), TREE_M, tx, 3, tz);
  }
}
function lampRow(x0, z, x1, step = 22) {
  for (let x = x0; x <= x1; x += step) {
    put(new THREE.CylinderGeometry(0.08, 0.11, 5.5, 5), TRUNK_M, x, 2.75, z);
    put(new THREE.SphereGeometry(0.28, 6, 5), LAMP_M, x, 5.6, z);
  }
}

// ---- landmark icons -----------------------------------------------------
// hand-modelled silhouettes for the towers everyone recognises.
const MAST_M = new THREE.MeshStandardMaterial({ color: 0x8a9099, roughness: 0.5, metalness: 0.6 });

// Bank of China: dark glass wrapped in the famous white X-lattice
const BOC_M = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const e = document.createElement('canvas'); e.width = e.height = 128;
  const ctx = c.getContext('2d'), ectx = e.getContext('2d');
  ctx.fillStyle = '#1b2431'; ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#2a3646';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++)
    ctx.fillRect(x * 16 + 3, y * 16 + 3, 10, 10);
  ctx.strokeStyle = '#dde6ee'; ctx.lineWidth = 7;
  for (const [x0, y0, x1, y1] of [[0, 0, 128, 128], [128, 0, 0, 128]]) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ectx.strokeStyle = '#9fb4c8'; ectx.lineWidth = 5;
    ectx.beginPath(); ectx.moveTo(x0, y0); ectx.lineTo(x1, y1); ectx.stroke();
  }
  const mk = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  return new THREE.MeshStandardMaterial({ map: mk(c), emissiveMap: mk(e), emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.5, metalness: 0.3 });
})();
// Jardine House: light concrete skin of dark portholes
const JARDINE_M = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8b8f94'; ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    ctx.beginPath(); ctx.fillStyle = '#22262c';
    ctx.arc(x * 16 + 8, y * 16 + 8, 5.5, 0, Math.PI * 2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 });
})();
const HILL_M = new THREE.MeshStandardMaterial({
  color: 0x2c4234, roughness: 1, emissive: 0x1a2c22, emissiveIntensity: 1,
});

function iconSolid(x, z, w, d, h) {   // collider proxy for a hand-built icon
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), QUAY_M);
  m.position.set(x, h / 2, z);
  solid(m);
}

// Bank of China Tower — stepped shafts, lattice skin, twin antennas
function bocTower(x, z) {
  const w = 32, d = 28;
  put(scaleBoxUV(new THREE.BoxGeometry(w, 58, d), w, 58, d, 14), BOC_M, x, 29, z);
  put(scaleBoxUV(new THREE.BoxGeometry(24, 20, 20), 24, 20, 20, 14), BOC_M, x + 2, 68, z + 2);
  put(scaleBoxUV(new THREE.BoxGeometry(16, 12, 14), 16, 12, 14, 14), BOC_M, x + 4, 84, z + 4);
  put(new THREE.BoxGeometry(0.7, 24, 0.7), MAST_M, x - 6, 90 + 12, z - 4);
  put(new THREE.BoxGeometry(0.7, 19, 0.7), MAST_M, x + 8, 90 + 9.5, z + 6);
  iconSolid(x, z, w, d, 90);
}

// HSBC HQ — the exoskeleton icon: main slab lifted on stilts over an open
// plaza, twin roof masts
function hsbc(x, z) {
  const w = 30, d = 24;
  for (const cx of [-10, 0, 10]) for (const cz of [-8, 8])
    put(new THREE.BoxGeometry(2.4, 9, 2.4), MAST_M, x + cx, 4.5, z + cz);
  put(new THREE.BoxGeometry(w - 4, 0.5, d - 4), QUAY_M, x, 8.8, z);   // atrium deck
  put(scaleBoxUV(new THREE.BoxGeometry(w, 43, d), w, 43, d, 9), FACADE.office, x, 9 + 21.5, z);
  put(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), ROOF, x, 52.5, z);
  for (const mx of [-8, 8])
    put(new THREE.BoxGeometry(1, 14, 1), MAST_M, x + mx, 59.5, z);     // roof cranes
  iconSolid(x, z, w, d, 53);
}

// Jardine House — porthole skin
function jardine(x, z) {
  const w = 28, d = 24, h = 52;
  put(scaleBoxUV(new THREE.BoxGeometry(w, h, d), w, h, d, 26), JARDINE_M, x, h / 2, z);
  put(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), ROOF, x, h + 0.25, z);
  iconSolid(x, z, w, d, h);
}

// Central Government Offices — the 門常開 "door always open": two slabs
// joined by a top bridge, portal void between them
function tamarDoor(x, z) {
  const d = 14;
  for (const sx of [-9.5, 29.5])
    put(scaleBoxUV(new THREE.BoxGeometry(16, 30, d), 16, 30, d), FACADE.office, x + sx, 15, z);
  put(new THREE.BoxGeometry(55, 4.5, d), FACADE.office, x + 10, 28, z); // the lintel
  put(new THREE.BoxGeometry(55.4, 0.5, d + 0.4), ROOF, x + 10, 30.4, z);
  iconSolid(x + 10, z, 55, d, 30);
}

// Court of Final Appeal (old Supreme Court / LegCo) — heritage block + dome
function legcoDome(x, z) {
  const w = 20, d = 16;
  put(scaleBoxUV(new THREE.BoxGeometry(w, 9, d), w, 9, d), FACADE.heritage, x, 4.5, z);
  put(new THREE.CylinderGeometry(3.6, 3.9, 1.4, 10), FACADE.heritage, x, 9.7, z);
  const dome = new THREE.SphereGeometry(3.6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  put(dome, ROOF, x, 10.4, z);
  put(new THREE.CylinderGeometry(0.3, 0.3, 2.4, 6), ROOF, x, 14.4, z);   // lantern
  iconSolid(x, z, w, d, 11);
}

// Two IFC — shaft plus the sculpted crown: tapering caps + parapet fins
function twoIfc(x, z) {
  const w = 34, d = 30;
  put(scaleBoxUV(new THREE.BoxGeometry(w, 96, d), w, 96, d), FACADE.glass, x, 48, z);
  put(scaleBoxUV(new THREE.BoxGeometry(28, 12, 24), 28, 12, 24), FACADE.glass, x, 102, z);
  put(scaleBoxUV(new THREE.BoxGeometry(20, 9, 16), 20, 9, 16), FACADE.glass, x, 112.5, z);
  for (const fx of [-10, 0, 10])
    put(new THREE.BoxGeometry(0.8, 8, 14), MAST_M, x + fx, 121, z);      // crown fins
  put(new THREE.BoxGeometry(0.6, 14, 0.6), MAST_M, x, 124, z);           // mast
  iconSolid(x, z, w, d, 118);
}

// Victoria Peak — extruded ridged silhouette south of Central/Admiralty,
// plus the Tai Hang / Jardine's Lookout hills behind Wan Chai
function peakRidges() {
  const PEAK = [[-1560, 40], [-1380, 100], [-1260, 145], [-1140, 168], [-1020, 118],
                [-930, 138], [-800, 105], [-620, 126], [-460, 86], [-300, 62], [-140, 44]];
  const EAST = [[420, 34], [620, 58], [880, 76], [1180, 62], [1480, 88], [1700, 66], [1845, 48]];
  const ridge = (pts, z, depth) => {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], 0);
    for (const [px, py] of pts) s.lineTo(px, py);
    s.lineTo(pts[pts.length - 1][0], 0); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    put(geo, HILL_M, 0, 0, z);
  };
  ridge(PEAK, 165, 140);
  ridge(EAST, 235, 130);
  // scattered Peak-side house lights on the slope face, capped by the
  // local ridge height so none float above the skyline
  const ridgeAt = (pts, x) => {
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
    }
    return pts[pts.length - 1][1];
  };
  const scatter = (pts, z, n) => {
    const dot = new THREE.BoxGeometry(1.6, 1.4, 0.4);
    const xa = pts[0][0] + 30, xb = pts[pts.length - 1][0] - 30;
    for (let i = 0; i < n; i++) {
      const x = xa + ((i * 97.31) % (xb - xa));
      const y = 10 + ((i * 53.7) % Math.max(ridgeAt(pts, x) - 22, 12));
      put(dot.clone(), LAMP_M, x, y, z);
    }
  };
  scatter(PEAK, 164.6, 26);
  scatter(EAST, 234.6, 20);
}

// Kowloon skyline across the harbour — silhouetted towers + the ICC wedge
function kowloonSkyline() {
  block(150, -445, 3500, 260, 0.4, HILL_M, false);                     // far shore
  const kl = [[-1560, -390, 34, 30, 48], [-1500, -430, 46, 40, 72],
              [-1380, -410, 44, 36, 66], [-1260, -400, 38, 32, 54], [-1080, -420, 42, 34, 62],
              [-920, -395, 34, 30, 44], [-700, -410, 40, 32, 56], [-480, -390, 36, 28, 42],
              [-200, -415, 40, 30, 50], [60, -400, 34, 26, 38], [320, -410, 38, 28, 46]];
  for (const [x, z, w, d, h] of kl)
    put(scaleBoxUV(new THREE.BoxGeometry(w, h, d), w, h, d), FACADE.office, x, h / 2, z);
  // ICC — tallest slab with a tapered crown
  put(scaleBoxUV(new THREE.BoxGeometry(46, 140, 40), 46, 140, 40), FACADE.glass, -1470, 70, -430);
  put(scaleBoxUV(new THREE.BoxGeometry(34, 18, 28), 34, 18, 28), FACADE.glass, -1470, 149, -430);
}

// per-station surroundings — all coords are world space; `hole` is the
// excavation rect, towers intersecting it are skipped with a warning.
const SITES = [
  { // ---- Admiralty — Pacific Place + Lippo + Tamar/government + HK Park
    id: 'ADM', hole: [-105, 105, -49, 41],
    roads: [[-95, 44, 95, 56], [-160, -64, 160, -52], [108, -50, 122, 42], [-122, -50, -108, 42]],
    towers: [
      [-70, -76, 24, 20, 50, 'glass'], [-38, -76, 24, 20, 52, 'glass'],   // Lippo Centre twin
      [-95, -74, 20, 18, 46, 'gold'],                                    // Far East Finance
      [92, -76, 26, 20, 36, 'office'], [124, -74, 22, 18, 34, 'office'],
      [-55, -88, 20, 12, 18, 'office'],
      [68, -88, 22, 14, 12, 'heritage'],                                 // LegCo block
      [100, 68, 24, 20, 46, 'hotel'],                                    // JW Marriott
      [126, 68, 22, 20, 56, 'hotel'],                                    // Conrad
      [152, 70, 24, 22, 58, 'hotel'],                                    // Shangri-La
      [72, 68, 30, 22, 40, 'mall'],                                      // Pacific Place podium
      [98, 68, 22, 18, 44, 'office'],                                    // One Pacific Place
      [-125, 68, 24, 20, 42, 'office'],                                  // China Evergrande
      [-148, 66, 20, 16, 36, 'office'],                                  // Bank of America
      [-155, -76, 22, 18, 40, 'office'], [-180, -58, 24, 18, 32, 'office'],
    ],
    parks: [[-15, 72, 60, 104, 14], [-85, -74, -30, -92, 10]],              // HK Park, Tamar
    lamps: [[-95, 50, 95], [-150, -58, 160]],
  },
  { // ---- Central — HSBC row, Landmark cluster, Chater Garden, BOC Tower
    id: 'CEN', hole: [-1150, -950, -57, 57],
    roads: [[-1145, 60, -955, 72], [-1145, -69, -962, -57], [-1180, -55, -1168, 55], [-932, -55, -920, 55]],
    towers: [
      [-1102, -80, 26, 20, 46, 'office'],   // Standard Chartered
      [-1132, -84, 28, 24, 66, 'glass'],    // Cheung Kong Center
      [-985, -82, 28, 20, 46, 'office'],    // AIA Central
      [-928, -72, 24, 18, 40, 'office'],    // CCB side
      [-962, -76, 30, 12, 12, 'heritage'],  // City Hall
      [-1050, 82, 30, 20, 42, 'office'],    // Landmark-ish
      [-1015, 84, 26, 20, 38, 'hotel'],     // Prince's/Mandarin
      [-985, 82, 24, 18, 34, 'hotel'],
      [-1035, 82, 20, 14, 30, 'office'],    // St George's Bldg
    ],
    parks: [[-1145, 74, -1062, 88, 14]],                                   // Chater Garden
    lamps: [[-1140, 66, -960], [-1140, -63, -970]],
  },
  { // ---- Hong Kong — IFC towers on a reclamation quay, Exchange Sq, wheel
    id: 'HOK', hole: [-1615, -1345, -67, 67],
    roads: [[-1610, 70, -1350, 82], [-1610, -79, -1345, -67], [-1330, -65, -1318, 65]],
    towers: [
      [-1530, -94, 30, 26, 44, 'glass'],    // One IFC
      [-1485, -84, 80, 8, 9, 'mall'],       // IFC Mall podium
      [-1570, -98, 24, 20, 58, 'hotel'],    // Four Seasons
      [-1600, -92, 22, 18, 50, 'hotel'],    // Four Seasons Place
      [-1325, -92, 28, 24, 52, 'office'],   // Exchange Square I
      [-1295, -94, 28, 24, 52, 'office'],   // Exchange Square II
      [-1305, -108, 26, 22, 48, 'office'],  // Exchange Square III
      [-1420, 94, 28, 24, 50, 'office'],    // Jardine House (south)
      [-1390, 92, 26, 20, 32, 'office'],    // Chater House
      [-1520, 92, 30, 20, 40, 'office'],    // Landmark-ish west
      [-1560, 94, 24, 18, 34, 'office'],
      [-1638, -92, 26, 20, 36, 'office'],   // west waterfront
    ],
    quays: [[-1660, -80, -1280, -115]],                                    // reclamation deck
    piers: [[-1560, -118, -1530, -124], [-1400, -118, -1370, -124]],        // ferry piers
    lamps: [[-1600, 76, -1360], [-1600, -73, -1350]],
  },
  { // ---- Wan Chai — Central Plaza + harbourfront towers, low-rise old town
    id: 'WAC', hole: [785, 975, -33, 33],
    roads: [[790, 36, 970, 47], [790, -47, 970, -36], [760, -34, 772, 34], [988, -34, 1000, 34]],
    towers: [
      [905, -64, 34, 30, 86, 'glass'],      // Central Plaza (spire below)
      [955, -60, 26, 22, 50, 'office'],     // China Resources Bldg
      [990, -56, 26, 20, 34, 'office'],     // Shui On Centre
      [825, -58, 30, 20, 38, 'office'],     // Harbour Centre
      [852, -60, 24, 18, 42, 'office'],     // Great Eagle Centre
      [1010, -80, 55, 22, 14, 'mall'],      // HKCEC slab on the water
      [768, -58, 26, 18, 40, 'office'],     // Immigration Tower
      [762, -48, 22, 16, 34, 'office'],     // Revenue Tower-ish
      [830, 58, 30, 18, 38, 'office'],      // Police HQ
      [960, 58, 30, 18, 12, 'mall'],        // Wan Chai Market
      [758, 62, 20, 16, 30, 'res'], [742, 48, 14, 12, 16, 'heritage'], // Lee Tung / Pawn
      [1000, 50, 24, 18, 26, 'res'], [1030, -48, 24, 18, 30, 'res'],
      [1060, 55, 22, 16, 28, 'res'], [1045, -58, 22, 16, 32, 'office'],
    ],
    cyls: [[795, 66, 11, 62, 'hotel']],     // Hopewell Centre — round tower
    parks: [[800, 52, 852, 66, 8]],         // Southorn Playground
    lamps: [[795, 41.5, 965], [795, -41.5, 965]],
    spire: [905, -64, 86],                  // Central Plaza's pyramid crown
  },
  { // ---- Causeway Bay — Times Square, SOGO, Hysan, Victoria Park, shelter
    id: 'CAB', hole: [1578, 1822, -33, 33],
    roads: [[1582, 36, 1818, 47], [1582, -47, 1818, -36], [1562, -34, 1574, 34], [1826, -34, 1838, 34]],
    towers: [
      [1595, 60, 24, 20, 52, 'office'], [1630, 60, 24, 20, 52, 'office'], // Times Square twin
      [1612, 57, 60, 16, 9, 'mall'],                                      // its podium
      [1755, -60, 45, 25, 22, 'mall'],                                    // SOGO block
      [1720, -60, 26, 22, 36, 'office'],                                  // Windsor House
      [1790, -72, 30, 24, 42, 'office'],                                  // World Trade Centre
      [1820, -74, 28, 24, 56, 'glass'],                                   // ex-Excelsior site
      [1842, -52, 28, 22, 34, 'hotel'],                                   // Park Lane Hotel
      [1605, -58, 26, 20, 40, 'office'],                                  // Sino Plaza
      [1585, -58, 22, 15, 26, 'office'],                                  // Hang Lung Centre
      [1650, -56, 22, 16, 34, 'office'],                                  // Soundwill Plaza
      [1665, 60, 30, 24, 60, 'glass'],                                    // Hysan Place
      [1556, 52, 26, 20, 34, 'office'],                                   // Causeway Bay Plaza
      [1760, 60, 28, 22, 38, 'hotel'],                                    // Regal Hong Kong
      [1700, 62, 26, 20, 32, 'office'],                                   // Leighton Centre
      [1730, 56, 20, 14, 24, 'res'], [1800, 56, 22, 16, 28, 'res'],
      [1855, 55, 24, 18, 34, 'res'], [1640, 76, 22, 16, 30, 'res'],
      [1700, 80, 24, 16, 36, 'res'], [1870, -55, 24, 18, 30, 'office'],
    ],
    parks: [[1860, -45, 1898, -85, 16]],                                  // Victoria Park
    lamps: [[1590, 41.5, 1810], [1590, -41.5, 1810]],
  },
];

// landmark tags — bilingual, tagged to each station's ground level so they
// only show in exterior orbit / on the street, never underground.
const NAMES = [
  ['ADM', -54, 56, -75, '力寶中心 Lippo Centre'],
  ['ADM', 100, 50, 72, '太古廣場 Pacific Place'],
  ['ADM', 10, 34, -88, '政府總部 Central Govt Offices'],
  ['ADM', -1140, 178, 235, '太平山 Victoria Peak'],
  ['CEN', -1070, 68, -82, '滙豐總行 HSBC'],
  ['CEN', -1040, 112, 92, '中銀大廈 Bank of China'],
  ['CEN', -1275, 56, -84, '怡和大廈 Jardine House'],
  ['CEN', -932, 17, 86, '終審法院 Court of Final Appeal'],
  ['HOK', -1445, 134, -100, '國際金融中心 IFC'],
  ['HOK', -1400, 28, -104, '摩天輪 Observation Wheel'],
  ['HOK', -1470, 162, -430, '環球貿易廣場 ICC'],
  ['WAC', 905, 104, -64, '中環廣場 Central Plaza'],
  ['WAC', 795, 68, 66, '合和中心 Hopewell Centre'],
  ['CAB', 1612, 58, 60, '時代廣場 Times Square'],
  ['CAB', 1755, 28, -60, '崇光百貨 SOGO'],
  ['CAB', 1665, 66, 60, '希慎廣場 Hysan Place'],
  ['CAB', 1880, 12, -65, '維多利亞公園 Victoria Park'],
];

export function buildCity() {
  const group = new THREE.Group();
  const labels = [];
  const groundUid = id => LEVELS.find(l => l.station === id && (l.type === 'ground' || l.type === 'checkin'))?.uid;

  for (const s of SITES) {
    const [hx0, hx1, hz0, hz1] = s.hole;
    const clear = r => r.x1 < hx0 - 2 || r.x0 > hx1 + 2 || r.z1 < hz0 - 2 || r.z0 > hz1 + 2;
    for (const [x, z, w, d, h, kind] of s.towers || []) {
      const r = { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 };
      if (!clear(r)) { console.warn(`city: ${s.id} tower at ${x},${z} overlaps the dig — skipped`); continue; }
      tower(x, z, w, d, h, kind);
    }
    for (const [x, z, r, h, kind] of s.cyls || []) cyl(x, z, r, h, kind);
    for (const [x0, z0, x1, z1] of s.roads || []) road(x0, z0, x1, z1);
    for (const [x0, z0, x1, z1, n] of s.parks || []) park(x0, z0, x1, z1, n);
    for (const [x0, z, x1, step] of s.lamps || []) lampRow(x0, z, x1, step);
    for (const [x0, z0, x1, z1] of s.quays || []) block((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.35, QUAY_M, false);
    for (const [x0, z0, x1, z1] of s.piers || []) block((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 1.0, QUAY_M, false);
    if (s.spire) {
      const [x, z, h] = s.spire;
      put(new THREE.ConeGeometry(9, 14, 4), FACADE.glass, x, h + 7, z, Math.PI / 4);
    }
  }

  // ---- the recognisable skyline icons
  hsbc(-1070, -82);            // HSBC HQ — stilts + roof masts
  bocTower(-1040, 92);         // Bank of China — lattice + antennas
  jardine(-1275, -84);         // Jardine House — portholes
  tamarDoor(0, -88);           // Central Govt Offices — the open door
  legcoDome(-932, 86);         // Court of Final Appeal dome
  twoIfc(-1445, -100);         // Two IFC crown
  peakRidges();                // Victoria Peak + Tai Hang hills
  kowloonSkyline();            // far shore + ICC
  for (const [stn, x, y, z, txt] of NAMES) {
    const uid = groundUid(stn);
    if (uid) labels.push({ level: uid, cls: 'city', html: txt, pos: new THREE.Vector3(x, y, z) });
  }

  // ---- the harbour: water plane along -z, quay wall + promenade, boats
  const SHORE = -95;
  const sea = new THREE.PlaneGeometry(3500, 1500);
  sea.rotateX(-Math.PI / 2);
  put(sea, WATER_M, 150, 0.03, SHORE - 750);
  block(150, SHORE + 0.6, 3500, 1.2, 1.4, QUAY_M, false);          // seawall lip
  block(150, SHORE + 4, 3500, 7, 0.1, QUAY_M, false);              // promenade strip
  // typhoon-shelter breakwater arm off Causeway Bay
  block(1855, -102, 90, 4, 1.6, QUAY_M, false);
  block(1732, -115, 4, 30, 1.6, QUAY_M, false);
  // boats — tiny hulls + cabins scattered on the shelter + off the piers
  for (const [bx, bz] of [[1800, -115], [1840, -122], [1885, -112], [1870, -135], [-1420, -128], [-1520, -130], [1010, -105]]) {
    const ry = ((bx * 7) % 10) / 14;
    put(new THREE.BoxGeometry(4, 0.9, 1.6), QUAY_M, bx, 0.4, bz, ry);
    put(new THREE.BoxGeometry(1.6, 0.8, 1.1), ROOF, bx, 1.1, bz, ry);
  }
  // HK observation wheel on the Central harbourfront quay
  {
    const wx = -1400, wz = -104;
    put(new THREE.TorusGeometry(9, 0.35, 6, 24), QUAY_M, wx, 12, wz);
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.BoxGeometry(0.25, 18, 0.25);
      sp.rotateZ(i * Math.PI / 4);
      put(sp, QUAY_M, wx, 12, wz);
    }
    put(new THREE.BoxGeometry(0.5, 12, 0.5), QUAY_M, wx - 3, 5.5, wz);
    put(new THREE.BoxGeometry(0.5, 12, 0.5), QUAY_M, wx + 3, 5.5, wz);
  }

  // merge everything into one mesh per material (~10 draw calls total) —
  // de-indexed first since ExtrudeGeometry comes non-indexed and
  // mergeGeometries rejects mixed index-ness
  for (const [mat, geos] of bag) {
    const merged = mergeGeometries(geos.map(g => (g.index ? g.toNonIndexed() : g)), false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  }
  bag.clear();

  return { group, labels };
}
