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
  com:      facadeMats('#2b2a26', '#413c34', '#e8c890', 0.35),
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
  const PEAK = [[-4600, 26], [-4350, 52], [-4050, 44], [-3750, 34], [-3350, 36],
                [-3050, 24], [-2760, 38], [-2460, 50], [-2160, 44], [-1860, 58],
                [-1560, 40], [-1380, 100], [-1260, 145], [-1140, 168], [-1020, 118],
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

// Kowloon — the peninsula across the strait: a waterfront tower band on
// the new quay, the Nathan Road mid-rise wall behind the corridor, the
// ICC wedge on the west point, and the Lion Rock silhouette closing the
// horizon. Towers dodge x 190..450 where the TST dig (and the future
// Nathan Road chain sites) punch through the ground plane.
function kowloonSkyline() {
  const kl = [[-1560, -860, 40, 34, 54], [-1480, -870, 46, 40, 78],   // ICC cluster
              [-1280, -850, 40, 30, 48], [-1100, -860, 42, 34, 58],
              [-820, -850, 36, 30, 44],  [-560, -855, 40, 32, 52],
              [-320, -845, 34, 28, 40],  [-80, -850, 36, 30, 46],
              [140, -845, 30, 26, 36],   [500, -850, 34, 30, 44],
              [700, -860, 40, 34, 56],   [950, -850, 38, 30, 48],
              [1250, -855, 36, 30, 42],  [1500, -860, 42, 34, 54],
              // Nathan Road corridor wall — kept off the x≈320 dig line
              [-160, -1010, 34, 28, 44], [40, -990, 36, 30, 52],
              [-420, -995, 38, 30, 56],  [560, -985, 34, 28, 46],
              [780, -1000, 36, 30, 50],  [1020, -990, 34, 28, 42]];
  for (const [x, z, w, d, h] of kl)
    put(scaleBoxUV(new THREE.BoxGeometry(w, h, d), w, h, d), FACADE.office, x, h / 2, z);
  // ICC — tallest slab with a tapered crown, on the west point
  put(scaleBoxUV(new THREE.BoxGeometry(46, 140, 40), 46, 140, 40), FACADE.glass, -1470, 70, -890);
  put(scaleBoxUV(new THREE.BoxGeometry(34, 18, 28), 34, 18, 28), FACADE.glass, -1470, 149, -890);
  // Lion Rock — the ridge silhouette far behind Kowloon
  const LION = [[-2400, 30], [-2000, 44], [-1600, 38], [-1200, 52], [-800, 44],
                [-400, 62], [0, 48], [400, 58], [800, 42], [1200, 50], [1600, 36], [2000, 40]];
  const s = new THREE.Shape();
  s.moveTo(LION[0][0], 0);
  for (const [px, py] of LION) s.lineTo(px, py);
  s.lineTo(LION[LION.length - 1][0], 0); s.closePath();
  put(new THREE.ExtrudeGeometry(s, { depth: 120, bevelEnabled: false }), HILL_M, 0, 0, -1620);
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
  { // ---- Sheung Wan — Shun Tak twin + Macau Ferry on the water,
    //     Western Market, Infinitus Plaza, Wing On Centre, old low-rises
    id: 'SHW', hole: [-2171, -1929, -38, 38],
    roads: [[-2160, 40, -1940, 52], [-2160, -64, -1940, -52], [-2124, -36, -2112, 36], [-1972, -36, -1960, 36]],
    towers: [
      [-2130, -74, 34, 22, 42, 'office'], [-2088, -74, 34, 22, 42, 'office'], // Shun Tak Centre twin
      [-2168, -68, 26, 20, 44, 'office'],   // China Merchants Tower
      [-2052, -66, 24, 18, 36, 'office'],   // Chu Kong Shipping Tower
      [-2010, -68, 24, 18, 38, 'office'],   // Guangdong Investment Tower
      [-1955, -60, 30, 22, 38, 'office'],   // Infinitus Plaza
      [-1978, 58, 26, 20, 34, 'office'],    // Wing On Centre
      [-2128, 62, 26, 20, 40, 'office'],    // FWD Financial Centre
      [-2104, 56, 24, 14, 10, 'heritage'],  // Western Market
      [-2045, 78, 30, 20, 46, 'office'],    // Grand Millennium Plaza
      [-2068, 56, 20, 16, 24, 'res'], [-2148, 80, 18, 14, 18, 'res'],
      [-1998, 74, 20, 16, 22, 'res'], [-1920, 60, 18, 14, 20, 'res'],
      [-2180, 58, 18, 16, 22, 'res'], [-2020, 60, 16, 14, 18, 'res'],
    ],
    quays: [[-2160, -78, -1990, -112]],                        // Macau Ferry apron
    piers: [[-2110, -116, -2070, -122], [-2030, -116, -1996, -122]],
    parks: [[-2160, 76, -2112, 96, 8]],                        // Blake Garden side
    lamps: [[-2150, 46, -1950], [-2150, -58, -1950]],
  },
  { // ---- Sai Ying Pun — Mid-Levels old town: low-rise res blocks, the
    //     lift-tower exits, Sun Yat Sen Memorial Park on the waterfront
    id: 'SYP', hole: [-2966, -2734, -38, 38],
    roads: [[-2955, 40, -2745, 52], [-2955, -64, -2745, -52], [-2862, -36, -2850, 36]],
    towers: [
      [-2910, -66, 26, 20, 34, 'res'],     // Island Crest-ish
      [-2945, -70, 22, 18, 40, 'res'],     // The Nova-ish
      [-2880, -70, 22, 16, 30, 'res'],
      [-2800, -68, 24, 18, 36, 'res'], [-2760, -64, 20, 16, 28, 'res'],
      [-2950, 60, 22, 16, 26, 'res'], [-2900, 62, 24, 18, 32, 'res'],
      [-2830, 58, 20, 16, 24, 'res'], [-2790, 62, 22, 16, 28, 'res'],
      [-2870, 80, 20, 14, 20, 'res'], [-2920, 82, 18, 14, 18, 'res'],
      [-2810, 92, 24, 18, 32, 'res'],      // hillside towers south
      [-2860, 90, 22, 16, 30, 'res'],
    ],
    parks: [[-2958, -72, -2896, -92, 10]],  // Sun Yat Sen Memorial Park
    lamps: [[-2940, 46, -2760], [-2940, -58, -2760]],
  },
  { // ---- HKU / Shek Tong Tsui — The Belcher's twin cluster, Westwood,
    //     Hill Rd / Whitty St res towers, HKU campus uphill to the south,
    //     Western Wholesale Food Market sheds on the waterfront
    id: 'HKU', hole: [-3666, -3434, -38, 38],
    roads: [[-3655, 40, -3445, 52], [-3655, -64, -3445, -52], [-3562, -36, -3550, 36], [-3612, -36, -3600, 36]],
    towers: [
      [-3640, 70, 26, 22, 55, 'res'],      // The Belcher's tower
      [-3605, 74, 26, 22, 55, 'res'],      // The Belcher's tower 2
      [-3630, 96, 24, 20, 48, 'res'],      // Belcher's rear row
      [-3598, 96, 24, 20, 48, 'res'],
      [-3550, 60, 22, 18, 36, 'res'],      // Westwood-ish
      [-3510, 66, 22, 16, 30, 'res'],      // Chong Yip Centre
      [-3470, 62, 24, 18, 34, 'res'],      // Hong Kong Plaza
      [-3445, 70, 20, 16, 26, 'res'],
      [-3480, -68, 22, 16, 30, 'res'],     // Hill Rd towers
      [-3610, -70, 24, 18, 22, 'res'],     // Harbour One waterfront
      [-3560, 108, 30, 24, 26, 'office'],  // HKU campus on the hillside
      [-3495, 112, 26, 20, 24, 'office'],
      [-3630, 114, 24, 18, 22, 'office'],
    ],
    parks: [[-3660, -80, -3590, -100, 8]], // Belcher Bay Park (waterfront)
    lamps: [[-3640, 46, -3460], [-3640, -58, -3460]],
  },
  { // ---- Kennedy Town — The Merton trio, Manhattan Heights, old-town
    //     grid, Kennedy Town Playground + bus terminus by the shore
    id: 'KET', hole: [-4366, -4134, -38, 38],
    roads: [[-4355, 40, -4145, 52], [-4355, -64, -4145, -52], [-4256, -36, -4244, 36], [-4310, -36, -4298, 36]],
    towers: [
      [-4340, -70, 24, 20, 58, 'res'],     // The Merton 1 (New Praya)
      [-4306, -74, 24, 20, 58, 'res'],     // The Merton 2
      [-4270, -68, 22, 18, 44, 'res'],     // Manhattan Heights
      [-4220, -72, 24, 18, 32, 'res'],     // Lexington Hill
      [-4170, -66, 20, 16, 26, 'res'],
      [-4340, 66, 22, 18, 34, 'res'],      // old-town grid south
      [-4300, 62, 20, 16, 28, 'res'],
      [-4220, 66, 22, 16, 30, 'res'],      // Kennedy Town Centre
      [-4180, 62, 20, 16, 24, 'res'],
      [-4145, 70, 18, 14, 22, 'res'],
    ],
    parks: [[-4250, -84, -4170, -100, 8]], // Kennedy Town shore promenade
    lamps: [[-4340, 46, -4160], [-4340, -58, -4160]],
  },
  { // ---- Tin Hau — King's Rd / Electric Rd corridor, Central Library,
    //     Victoria Park's east lawn, mid-rise hotels
    id: 'TIH', hole: [2290, 2510, -38, 38],
    roads: [[2295, 40, 2505, 52], [2295, -64, 2505, -52], [2394, -36, 2406, 36]],
    towers: [
      [1980, -60, 26, 20, 30, 'res'],      // Causeway Bay East corridor fill
      [2060, -68, 24, 18, 36, 'res'],      // AIA Tower-ish
      [2140, -62, 22, 18, 28, 'res'],
      [2220, -70, 26, 20, 38, 'office'],   // Citicorp Centre-ish
      [2000, 62, 24, 18, 26, 'res'],
      [2100, 66, 24, 20, 32, 'res'],
      [2200, 60, 22, 18, 30, 'res'],
      [2330, -64, 24, 18, 34, 'res'],      // Victoria Centre
      [2370, -70, 22, 18, 40, 'office'],   // Metropark hotel
      [2430, -66, 24, 18, 36, 'res'],
      [2470, -72, 22, 16, 30, 'office'],   // Empire hotel-ish
      [2320, 62, 24, 20, 30, 'res'],
      [2360, 68, 26, 20, 36, 'res'],
      [2440, 64, 24, 18, 28, 'res'],
      [2480, 70, 20, 16, 24, 'res'],
      [2400, 92, 30, 18, 22, 'office'],    // Central Library block
    ],
    parks: [[2295, -78, 2345, -100, 8]],   // Victoria Park east lawn
    lamps: [[2310, 46, 2490], [2310, -58, 2490]],
  },
  { // ---- Fortress Hill — King's Rd corridor, AIA Tower, City Garden
    //     blocks and the Electric Rd strip
    id: 'FOH', hole: [2790, 3010, -38, 38],
    roads: [[2795, 40, 3005, 52], [2795, -64, 3005, -52], [2894, -36, 2906, 36]],
    towers: [
      [2810, -66, 26, 20, 46, 'office'],   // AIA Tower
      [2850, -62, 22, 16, 26, 'res'],
      [2960, -64, 24, 18, 34, 'res'],      // City Garden blocks
      [2995, -70, 22, 16, 30, 'res'],
      [2800, 62, 24, 18, 28, 'res'],
      [2845, 68, 24, 18, 34, 'res'],
      [2940, 64, 22, 16, 26, 'res'],       // Olympia Plaza-ish
      [2980, 70, 22, 16, 30, 'res'],
    ],
    parks: [],
    lamps: [[2810, 46, 2990], [2810, -58, 2990]],
  },
  { // ---- North Point — King's Rd canyon, Harbourfront Landmark,
    //     Harbour North towers and the North Point ferry piers
    id: 'NOP', hole: [3490, 3710, -38, 38],
    roads: [[3495, 40, 3705, 52], [3495, -64, 3705, -52], [3594, -36, 3606, 36]],
    towers: [
      [3510, -66, 24, 18, 42, 'res'],      // Harbour North
      [3550, -68, 24, 18, 46, 'res'],
      [3650, -64, 24, 18, 40, 'res'],
      [3690, -70, 22, 16, 36, 'res'],
      [3620, -88, 26, 20, 62, 'office'],   // Harbourfront Landmark
      [3500, 62, 24, 18, 32, 'res'],       // dense NP blocks
      [3540, 68, 22, 16, 30, 'res'],
      [3640, 64, 24, 18, 38, 'res'],
      [3680, 70, 22, 16, 34, 'res'],
    ],
    parks: [],
    lamps: [[3510, 46, 3690], [3510, -58, 3690]],
  },
  { // ---- Quarry Bay — Taikoo Place office cluster south of King's Rd,
    //     Harbour Plaza + waterside blocks north, Mount Parker behind
    id: 'QUB', hole: [4090, 4310, -38, 38],
    roads: [[4095, 40, 4305, 52], [4095, -64, 4305, -52], [4194, -36, 4206, 36]],
    towers: [
      [4150, 62, 26, 20, 58, 'office'],   // One Taikoo Place
      [4188, 70, 24, 18, 44, 'office'],   // Devon House-ish
      [4230, 66, 26, 20, 52, 'office'],   // Two Taikoo Place
      [4270, 72, 22, 16, 34, 'res'],
      [4110, -64, 24, 18, 40, 'res'],     // Taikoo Shing west edge
      [4150, -70, 22, 16, 34, 'res'],
      [4250, -62, 24, 18, 30, 'res'],
      [4290, -68, 22, 16, 36, 'res'],     // Harbour Plaza NP-ish
    ],
    parks: [],
    lamps: [[4110, 46, 4290], [4110, -58, 4290]],
  },
  { // ---- Tai Koo — Cityplaza podium + One Island East on the harbour
    //     side; Taikoo Shing slab blocks north-east; Kornhill uphill
    id: 'TAK', hole: [4685, 4915, -38, 38],
    roads: [[4690, 40, 4910, 52], [4690, -64, 4910, -52], [4794, -36, 4806, 36]],
    towers: [
      [4730, -76, 30, 22, 70, 'office'],   // One Island East
      [4770, -62, 40, 24, 12, 'mall'],     // Cityplaza podium
      [4710, 60, 22, 16, 34, 'res'],       // Kornhill
      [4750, 72, 22, 16, 38, 'res'],
      [4860, 64, 24, 18, 30, 'res'],
      [4900, 70, 22, 16, 34, 'res'],
      [4860, -60, 24, 18, 36, 'res'],      // Taikoo Shing slabs
      [4900, -66, 24, 18, 32, 'res'],
    ],
    parks: [[4700, 70, 4760, 96, 6]],      // Quarry Bay Park strip
    lamps: [[4700, 46, 4900], [4700, -58, 4900]],
  },
  { // ---- Sai Wan Ho — Shau Kei Wan Rd corridor, Aldrich Bay blocks,
    //     Le King / Grand Promenade towers toward the water
    id: 'SWH', hole: [5290, 5510, -38, 38],
    roads: [[5295, 40, 5505, 52], [5295, -64, 5505, -52], [5394, -36, 5406, 36]],
    towers: [
      [5330, -66, 24, 18, 40, 'res'],      // Le King-ish
      [5370, -72, 26, 20, 48, 'res'],      // Grand Promenade-ish
      [5430, -64, 24, 18, 36, 'res'],
      [5470, -70, 22, 16, 30, 'res'],
      [5320, 62, 24, 18, 32, 'res'],       // Tai On St blocks
      [5360, 68, 22, 16, 28, 'res'],
      [5440, 64, 24, 18, 34, 'res'],
      [5480, 70, 20, 16, 26, 'res'],
    ],
    parks: [],
    lamps: [[5310, 46, 5490], [5310, -58, 5490]],
  },
  { // ---- Shau Kei Wan — Main St East corridor, Aldrich Bay / L'Hiver
    //     towers on the shore, Perfect Mount + the museum hill south
    id: 'SKW', hole: [5885, 6115, -38, 38],
    roads: [[5890, 40, 6110, 52], [5890, -64, 6110, -52], [5994, -36, 6006, 36]],
    towers: [
      [5930, -66, 26, 20, 44, 'res'],      // L'Hiver / Aldrich Bay
      [5970, -72, 24, 18, 46, 'res'],
      [6040, -64, 24, 18, 38, 'res'],
      [6080, -70, 22, 16, 34, 'res'],
      [5920, 62, 24, 18, 30, 'res'],       // Main St East old blocks
      [5960, 68, 22, 16, 26, 'res'],
      [6050, 64, 24, 18, 32, 'res'],
      [6090, 72, 20, 16, 28, 'res'],
      [5930, 96, 26, 20, 40, 'res'],       // Perfect Mount uphill
    ],
    parks: [[6040, -78, 6120, -108, 6]],   // museum grounds / promenade
    lamps: [[5910, 46, 6090], [5910, -58, 6090]],
  },
  { // ---- Heng Fa Chuen — the at-grade station sits in the estate apron:
    //     Paradise Mall podium + the estate's tower arcs south/west, Chai
    //     Wan Depot sheds east of the platforms, harbourfront promenade north
    id: 'HFC', hole: [6479, 6721, -48, 48],
    roads: [[6480, 44, 6720, 56], [6714, -44, 6726, 40]],
    towers: [
      [6520, 62, 60, 22, 8, 'mall'],        // Paradise Mall podium
      [6450, 58, 22, 18, 30, 'res'],        // estate arc — south
      [6490, 76, 22, 18, 34, 'res'],
      [6540, 82, 22, 18, 32, 'res'],
      [6590, 86, 22, 18, 36, 'res'],
      [6640, 84, 22, 18, 34, 'res'],
      [6690, 78, 22, 18, 30, 'res'],
      [6740, 66, 22, 18, 28, 'res'],
      [6440, 92, 22, 18, 36, 'res'],        // west arc
      [6420, 60, 20, 16, 28, 'res'],
      [6760, -20, 60, 22, 12, 'mall'],      // Chai Wan Depot shed
      [6810, 26, 40, 26, 9, 'mall'],        // depot workshops
      [6700, -66, 24, 18, 26, 'res'],       // shore-side blocks
      [6640, -70, 22, 16, 24, 'res'],
    ],
    parks: [[6490, -52, 6700, -88, 8]],     // harbourfront promenade green
    lamps: [[6500, 48, 6700], [6500, -52, 6700]],
  },
  { // ---- Chai Wan — the elevated terminus stands over the public
    //     transport interchange: New Jade Gardens towers north, Hing Wah
    //     Estate + Youth Square south, industrial blocks toward the depot
    //     and Chai Wan Park on the shore side
    id: 'CHW', hole: [7279, 7521, -48, 48],
    roads: [[7285, 44, 7515, 56], [7452, -44, 7464, 40]],
    towers: [
      [7310, -66, 24, 18, 44, 'res'],       // New Jade Gardens towers
      [7345, -72, 22, 16, 40, 'res'],
      [7380, -64, 22, 16, 38, 'res'],
      [7460, -62, 24, 18, 42, 'res'],       // Neptune Terrace-ish
      [7500, -70, 20, 16, 36, 'res'],
      [7440, 66, 22, 16, 38, 'res'],        // Hing Wah Estate
      [7480, 72, 22, 16, 40, 'res'],
      [7520, 64, 20, 16, 34, 'res'],
      [7322, 62, 26, 18, 62, 'office'],     // Youth Square tower
      [7322, 84, 24, 14, 30, 'office'],     // Y Loft hostel block
      [7292, 70, 24, 18, 26, 'office'],     // industrial blocks west
      [7292, 94, 22, 16, 22, 'office'],
      [7370, 96, 22, 16, 20, 'office'],
      [7490, 96, 24, 18, 30, 'res'],        // toward Siu Sai Wan
      [7410, 57, 90, 12, 5, 'mall'],        // PTI canopy — bus bays south
    ],
    parks: [[7460, -80, 7540, -100, 8]],    // Chai Wan Park strip
    lamps: [[7300, 48, 7500], [7300, -52, 7500]],
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
  { // ---- Tsim Sha Tsui — first district on the Kowloon shore: Star
    //     Ferry pier + Clock Tower + Cultural Centre on the point,
    //     Harbour City west and The Peninsula east along Salisbury Rd,
    //     the Nathan Road canyon behind the dig, Kowloon Park NW.
    id: 'TST', hole: [194, 446, -928, -832],
    roads: [[140, -830, 560, -812],            // Salisbury Rd waterfront strip
            [456, -940, 470, -820]],           // Chatham Rd lane east of dig
    towers: [
      [90,  -840, 34, 26, 30, 'office'],   // Star House / Harbour City west
      [30,  -846, 40, 30, 42, 'office'],
      [-60, -850, 44, 34, 54, 'glass'],
      [470, -840, 40, 24, 14, 'mall'],     // Cultural Centre low slab
      [560, -838, 30, 22, 40, 'hotel'],    // The Peninsula
      [640, -846, 26, 20, 34, 'res'],
      [311, -808, 30, 14, 8,  'mall'],     // Star Ferry terminal
      // Nathan Rd canyon towers flank the corridor — the x 194..446 strip
      // stays clear for the chain of station digs marching north
      [150, -960, 34, 30, 52, 'res'],      // iSQUARE-ish tower over the mall
      [480, -966, 30, 26, 46, 'res'],      // Chungking Mansions slab
      [500, -950, 32, 28, 48, 'office'],   // K11 / Hart Ave side
      [130, -970, 30, 26, 44, 'res'],      // The ONE-ish
      [120, -940, 34, 28, 40, 'office'],
    ],
    cyls: [[452, -842, 2.4, 17, 'office']],    // Clock Tower on the point
    parks: [[60, -950, 180, -1080, 30]],       // Kowloon Park
    piers: [[292, -796, 330, -758]],           // Star Ferry finger pier
    lamps: [[150, -806, 560]],                 // Avenue of Stars lamp row
  },
  { // ---- Jordan — the Nathan Rd canyon continues north: Yue Hwa's big
    //     emporium box and Novotel on the west flank; Eaton Hotel,
    //     Prudential Centre, Diocesan Girls' School and Queen Elizabeth
    //     Hospital on the east; Jordan Rd crosses east-west at the dig.
    id: 'JOR', hole: [194, 446, -1048, -952],
    roads: [[194, -950, 446, -930],            // Nathan Rd between the digs
            [194, -1074, 446, -1050],          // Nathan Rd north toward YMT
            [60, -1012, 190, -996],            // Jordan Rd west
            [450, -1012, 590, -996]],          // Jordan Rd east to Gascoigne
    towers: [
      [150, -985, 34, 28, 26, 'mall'],     // Yue Hwa Emporium big box
      [140, -1020, 30, 24, 38, 'hotel'],   // Novotel Nathan Rd
      [120, -962, 28, 22, 42, 'res'],
      [165, -1060, 26, 20, 36, 'res'],
      [480, -990, 34, 26, 40, 'hotel'],    // Eaton Hotel
      [505, -1020, 30, 24, 36, 'hotel'],   // Prudential Centre tower
      [470, -962, 28, 22, 30, 'office'],
      [560, -1000, 44, 26, 14, 'mall'],    // Diocesan Girls' School low block
      [640, -1030, 52, 36, 26, 'office'],  // Queen Elizabeth Hospital slab
      [610, -965, 30, 20, 38, 'res'],
    ],
    parks: [[520, -1090, 600, -1040, 14]],     // Diocesan sports field
    lamps: [[60, -1004, 190], [450, -1004, 590]],
  },
  { // ---- Yau Ma Tei — the Nathan Rd × Waterloo Rd junction: Temple
    //     Street night-market low-rise + Yau Ma Tei Theatre west of the
    //     dig; Metropark Hotel, Kwong Wah Hospital and King's Park east;
    //     Wholesale Fruit Market (果欄) to the northwest.
    id: 'YMT', hole: [194, 446, -1168, -1072],
    roads: [[60, -1128, 190, -1112],           // Waterloo Rd west
            [450, -1128, 600, -1112],          // Waterloo Rd east
            [194, -1194, 446, -1172]],         // Nathan Rd north toward MOK
    towers: [
      [140, -1100, 40, 26, 20, 'office'],  // Yau Ma Tei Theatre / service bldg
      [120, -1140, 30, 24, 34, 'res'],     // Temple St shophouse blocks
      [160, -1160, 28, 22, 38, 'res'],
      [100, -1180, 32, 26, 12, 'mall'],    // Wholesale Fruit Market sheds
      [470, -1100, 30, 24, 36, 'hotel'],   // Metropark Hotel
      [520, -1130, 50, 30, 24, 'office'],  // Kwong Wah Hospital slab
      [480, -1170, 28, 22, 40, 'res'],
      [500, -1070, 30, 20, 30, 'res'],
    ],
    parks: [[560, -1200, 660, -1100, 20]],     // King's Park west edge
    lamps: [[60, -1120, 190], [450, -1120, 600]],
  },
  { // ---- Mong Kok — Nathan Rd × Argyle St, the system's busiest:
    //     Langham Place's tower west of the dig, MOKO + the Argyle St
    //     bank canyon east, Ladies' Market stalls along Tung Choi St,
    //     Mong Kok East's slab further out.
    id: 'MOK', hole: [194, 446, -1288, -1192],
    roads: [[60, -1248, 190, -1232],           // Argyle St west
            [450, -1248, 600, -1232],          // Argyle St east
            [194, -1312, 446, -1290]],         // Nathan Rd north toward PRE
    towers: [
      [140, -1220, 40, 30, 58, 'office'],  // Langham Place tower
      [120, -1255, 44, 30, 16, 'mall'],    // Langham Place mall podium
      [160, -1280, 28, 22, 44, 'res'],
      [100, -1210, 26, 20, 30, 'res'],
      [150, -1310, 30, 24, 40, 'res'],
      [120, -1330, 26, 20, 36, 'res'],
      [490, -1220, 34, 26, 42, 'office'],  // Argyle Centre / bank towers
      [530, -1260, 40, 28, 30, 'mall'],    // MOKO podium
      [520, -1210, 30, 22, 38, 'hotel'],
      [480, -1290, 28, 22, 34, 'res'],
      [560, -1320, 32, 24, 40, 'office'],
      [640, -1260, 26, 20, 30, 'res'],
      [760, -1260, 60, 40, 26, 'office'],  // Mong Kok East slab over the ERL
      // corridor flanks continue north — x 194..446 stays clear for PRE
      [490, -1400, 32, 26, 42, 'office'],
    ],
    parks: [[580, -1180, 640, -1100, 14]],     // King's Park south edge
    lamps: [[60, -1240, 190], [450, -1240, 600]],
  },
  { // ---- Prince Edward — Nathan Rd x Prince Edward Rd West, the
    //     second TWL/KTL cross-platform interchange: Mong Kok Stadium
    //     + playing fields west, Flower Market / Bird Garden north,
    //     dense commercial east.
    id: 'PRE', hole: [194, 446, -1408, -1312],
    roads: [[60, -1374, 190, -1356],           // Prince Edward Rd W
            [450, -1374, 600, -1356],          // Prince Edward Rd E
            [194, -1435, 446, -1410]],         // Nathan Rd toward SSP
    towers: [
      [500, -1340, 32, 24, 36, 'office'],
      [540, -1390, 34, 26, 30, 'res'],
      [490, -1430, 30, 22, 34, 'res'],
      [620, -1360, 30, 24, 28, 'res'],
      [160, -1445, 30, 20, 14, 'mall'],    // Flower Market sheds
      [160, -1475, 26, 20, 30, 'res'],
    ],
    parks: [[70, -1410, 180, -1345, 34],       // Mong Kok Stadium + playing fields
            [60, -1470, 140, -1420, 14]],      // Yuen Po St Bird Garden
    lamps: [[60, -1365, 190], [450, -1365, 600]],
  },
  { // ---- Sham Shui Po — Cheung Sha Wan Rd x Kweilin/Pei Ho, the
    //     market district: Apliu St electronics bazaar, Fuk Wa St toy
    //     stalls, Pei Ho St municipal block. Dense low-rise fabric —
    //     Golden Computer Arcade + Dragon Centre the anchors.
    id: 'SSP', hole: [194, 446, -1528, -1432],
    roads: [[60, -1488, 190, -1472],           // Cheung Sha Wan Rd west
            [450, -1488, 600, -1472],          // Cheung Sha Wan Rd east
            [194, -1560, 446, -1530]],         // toward Lai Chi Kok Rd
    towers: [
      [110, -1500, 30, 24, 26, 'res'],     // fabric quarter low-rise
      [150, -1530, 28, 22, 22, 'res'],
      [100, -1560, 30, 24, 24, 'res'],
      [140, -1590, 28, 22, 28, 'res'],
      [510, -1455, 32, 26, 30, 'mall'],    // Golden Computer Arcade side
      [520, -1510, 36, 30, 40, 'mall'],    // Dragon Centre
      [560, -1545, 30, 24, 34, 'office'],
      [490, -1570, 28, 22, 30, 'res'],
      // corridor flanks continue north — x 194..446 stays clear for CSW
      [150, -1600, 28, 22, 30, 'res'],
      [490, -1610, 30, 24, 32, 'res'],
    ],
    parks: [],
    lamps: [[60, -1480, 190], [450, -1480, 600]],
  },
  { // ---- Cheung Sha Wan — Cheung Sha Wan Rd x Tonkin/Fat Tseung, the
    //     garment wholesale district turned loft/industrial: Un Chau
    //     Estate slab blocks south, the wholesale food market + So Uk
    //     west, IVE (Haking Wong) and the playground east.
    id: 'CSW', hole: [194, 446, -1648, -1552],
    roads: [[60, -1608, 190, -1592],           // Cheung Sha Wan Rd west
            [450, -1608, 600, -1592],          // Cheung Sha Wan Rd east
            [194, -1680, 446, -1650]],         // toward Lai Chi Kok Rd
    towers: [
      [110, -1620, 30, 24, 24, 'res'],     // Un Chau Estate slabs
      [150, -1650, 28, 22, 22, 'res'],
      [100, -1680, 32, 26, 26, 'res'],
      [140, -1700, 28, 22, 24, 'res'],
      [530, -1620, 32, 26, 30, 'office'],  // loft conversions
      [520, -1660, 36, 30, 38, 'office'],  // Billion Plaza-ish
      [560, -1700, 30, 24, 32, 'office'],
      [490, -1690, 28, 22, 26, 'res'],
      // corridor flanks continue north — x 194..446 stays clear for LCK
      [150, -1740, 28, 22, 28, 'res'],
      [490, -1750, 30, 24, 30, 'res'],
    ],
    parks: [[470, -1590, 600, -1560, 16]],     // Cheung Sha Wan Playground
    lamps: [[60, -1600, 190], [450, -1600, 600]],
  },
  { // ---- Lai Chi Kok — Cheung Sha Wan Rd x Tai Nam West/Tung Chau
    //     West, the showroom quarter: Cheung Sha Wan Plaza east, D2
    //     Place loft malls south, Liberte/Hoi Lai slabs west, the
    //     sports ground across the road.
    id: 'LCK', hole: [194, 446, -1768, -1672],
    roads: [[60, -1728, 190, -1712],           // Cheung Sha Wan Rd west
            [450, -1728, 600, -1712],          // Cheung Sha Wan Rd east
            [194, -1800, 446, -1770]],         // toward Lai Chi Kok Rd
    towers: [
      [150, -1790, 28, 22, 22, 'res'],     // Liberte slab (north edge)
      [120, -1782, 28, 22, 24, 'res'],     // Liberte slab (park frontage)
      [530, -1740, 36, 26, 30, 'mall'],    // D2 Place ONE/TWO
      [520, -1780, 32, 26, 26, 'office'],
      [560, -1810, 30, 24, 34, 'res'],
      [490, -1800, 28, 22, 26, 'res'],
      // corridor flank continues north — x 194..446 stays clear for MEF
      [490, -1870, 30, 24, 30, 'res'],
    ],
    parks: [[60, -1760, 180, -1720, 20]],      // Sham Shui Po Sports Ground
    lamps: [[60, -1720, 190], [450, -1720, 600]],
  },
  { // ---- Mei Foo — the two-part interchange: TWL dig under the estate
    //     plaza east, covered Tuen Ma shed by the park west, linked by
    //     the L1 subway. Mei Foo Sun Chuen slabs grid the south-west;
    //     Lai Chi Kok Park rolls across the whole north side.
    id: 'MEF', hole: [-70, 460, -1890, -1792],
    roads: [[-120, -1896, 460, -1880],        // Lai King Hill Rd along the park
            [-60, -1790, 440, -1776],         // estate road, south edge
            [460, -1848, 600, -1832]],        // Cheung Sha Wan Rd east
    towers: [
      // Mei Foo Sun Chuen — the estate slab grid west of the dig
      [-60, -1760, 34, 20, 30, 'res'], [-10, -1760, 34, 20, 30, 'res'],
      [40, -1760, 34, 20, 30, 'res'],
      [-60, -1715, 34, 20, 30, 'res'], [-10, -1715, 34, 20, 30, 'res'],
      [40, -1715, 34, 20, 30, 'res'],
      [-60, -1670, 34, 20, 30, 'res'], [-10, -1670, 34, 20, 30, 'res'],
      [40, -1670, 34, 20, 30, 'res'],
      [230, -1764, 36, 20, 16, 'mall'],   // Mount Sterling Mall podium
      [300, -1764, 36, 20, 16, 'mall'],   // Broadway shops podium
      [480, -1760, 30, 24, 28, 'res'],    // estate blocks east
      [520, -1810, 32, 26, 30, 'res'],
      [-120, -1810, 26, 20, 24, 'res'],   // Ching Lai Court by the shed
      [-160, -1845, 26, 20, 24, 'res'],
    ],
    parks: [[-120, -2060, 60, -1895, 24]],    // Lai Chi Kok Park
    lamps: [[-60, -1783, 440], [-120, -1888, 460]],
  },
  { // ---- Lai King — stacked cross-platform interchange terraced into
    //     the hill below Lai King Hill Road. Lai King Estate slabs step
    //     down the south slope; Yin Lai Court west; container terminals
    //     toward the water southwest. Lai King Hill greens the north.
    id: 'LAK', hole: [192, 448, -2010, -1910],
    roads: [[140, -2034, 500, -2016],         // Lai King Hill Rd along the crest
            [200, -1908, 470, -1894]],        // estate road, south edge
    towers: [
      // Lai King Estate — slab blocks stepping down the south slope
      [480, -1950, 30, 22, 26, 'res'], [520, -1950, 30, 22, 24, 'res'],
      [560, -1950, 30, 22, 28, 'res'],
      [480, -1995, 30, 22, 30, 'res'], [520, -1995, 30, 22, 24, 'res'],
      [560, -1995, 30, 22, 26, 'res'],
      [480, -2040, 30, 22, 22, 'res'], [530, -2040, 30, 22, 28, 'res'],
      // Yin Lai Court — west of the dig, south of the park strip
      [150, -2050, 28, 20, 26, 'res'],
      [110, -2010, 26, 20, 24, 'res'],
      [100, -1960, 26, 20, 22, 'res'],
    ],
    parks: [[40, -2280, 92, -2140, 18]],     // Lai King Hill slope — west strip behind the estates
    lamps: [[140, -2025, 500, 30], [200, -1900, 470, 30]],
  },
  { // ---- Kwai Fong — elevated station over the grade concourse; Metroplaza
    //     tower east, Kwai Fong Estate + Gardens west, theatre/plaza south.
    id: 'KWF', hole: [192, 448, -2136, -2024],
    roads: [[200, -2022, 470, -2012],         // Kwai Fong Rd between the digs
            [470, -2440, 492, -2020]],        // Kwai Chung Rd → Castle Peak Rd east flank, on to Tsuen Wan
    towers: [
      [490, -2090, 34, 30, 64, 'com'],        // Metroplaza office tower
      [462, -2090, 20, 28, 14, 'com'],        // Metroplaza mall podium
      // Kwai Fong Estate / New Kwai Fong Gardens — west of the dig
      [150, -2120, 28, 20, 26, 'res'], [110, -2120, 28, 20, 22, 'res'],
      [150, -2160, 30, 20, 24, 'res'], [110, -2160, 30, 20, 28, 'res'],
      [140, -2080, 30, 20, 24, 'res'],
      [140, -1980, 28, 20, 22, 'res'],        // south-west infill between the digs
      // Kwai Chung Plaza / theatre block — east, south of Metroplaza
      [480, -2030, 26, 20, 20, 'com'], [520, -2030, 26, 20, 24, 'res'],
      [560, -2060, 30, 22, 26, 'res'], [560, -2110, 30, 22, 24, 'res'],
    ],
    parks: [[460, -2000, 540, -1960, 10]],    // Hibiscus Park
    lamps: [[200, -2017, 470, 30]],
  },
  { // ---- Kwai Hing — Kwai Fong's twin: elevated side platforms over the
    //     grade concourse; KCC tower + industrial blocks east across Kwai
    //     Chung Rd, Kwai Hing Estate west at the hill foot.
    id: 'KWH', hole: [200, 440, -2248, -2152],
    roads: [[200, -2150, 470, -2140]],        // Kwai Hing Rd between the digs
    towers: [
      [510, -2230, 36, 30, 52, 'com'],        // Kowloon Commerce Centre (exit E footbridge)
      [480, -2180, 26, 20, 18, 'com'],        // Kwai Hing Government Offices
      [560, -2200, 30, 22, 30, 'com'],        // Kwai Chung industrial blocks
      [560, -2260, 30, 22, 26, 'com'],
      // Kwai Hing Estate / Sun Kwai Hing Gardens — west of the dig
      [120, -2220, 30, 20, 26, 'res'], [160, -2220, 30, 20, 24, 'res'],
      [120, -2260, 30, 20, 28, 'res'], [160, -2260, 30, 20, 22, 'res'],
      [130, -2190, 28, 20, 22, 'res'], [170, -2190, 28, 20, 24, 'res'],
      // Kwai Hong Court — south-west of the dig (exit C side)
      [180, -2170, 26, 20, 24, 'res'],
      // estate infill continuing north toward Tai Wo Hau
      [150, -2310, 28, 20, 26, 'res'], [110, -2310, 26, 20, 22, 'res'],
    ],
    lamps: [[200, -2145, 470, 30]],
  },
  { // ---- Tai Wo Hau — back underground: the line dives off the viaduct
    //     into the hillside box under Kwok Shui Rd. Tai Wo Hau Estate and
    //     Kwai Yin Court west/south, the resited village houses east across
    //     Castle Peak Rd, Kwok Shui Rd Park greening the north edge.
    id: 'TWH', hole: [200, 440, -2368, -2272],
    roads: [[200, -2268, 470, -2258]],        // Castle Peak Rd continues between the digs
    towers: [
      // Tai Wo Hau Estate — slab blocks west of the dig, south of KWH's infill
      [130, -2350, 30, 20, 26, 'res'], [170, -2350, 30, 20, 24, 'res'],
      [130, -2400, 30, 20, 28, 'res'], [170, -2400, 30, 20, 22, 'res'],
      // Kwai Yin Court — south-west of the dig
      [150, -2440, 28, 20, 24, 'res'], [110, -2440, 26, 20, 20, 'res'],
      // resited village houses (Kwan Mun Hau / Hoi Pa San Tsuen) — low-rise
      // east across Castle Peak Rd
      [520, -2320, 22, 18, 10, 'res'], [550, -2320, 20, 18, 12, 'res'],
      [520, -2360, 22, 18, 11, 'res'], [550, -2360, 20, 18, 9, 'res'],
      [515, -2400, 24, 18, 12, 'res'],
    ],
    parks: [[220, -2390, 370, -2372, 10]],    // Kwok Shui Rd Park — strip between the digs
    lamps: [[200, -2263, 470, 30]],
  },
  { // ---- Tsuen Wan — the TWL's north end, at grade under the gallery
    //     concourse. Luk Yeung Sun Chuen slabs west, the town-centre
    //     towers east across Castle Peak Rd, depot sidings past the east
    //     throat, Discovery Park green south.
    id: 'TSW', hole: [200, 440, -2488, -2392],
    roads: [[200, -2390, 470, -2380],          // Tai Ho Rd between the digs
            [180, -2520, 192, -2390]],         // depot access road, west edge
    towers: [
      // Luk Yeung Sun Chuen — estate slabs west of the dig, south of
      // Kwai Yin Court's footprint
      [130, -2480, 30, 20, 26, 'res'], [170, -2480, 30, 20, 24, 'res'],
      [130, -2530, 30, 20, 28, 'res'], [170, -2530, 30, 20, 22, 'res'],
      [120, -2570, 28, 20, 24, 'res'],
      // Tsuen Wan town centre — east across Castle Peak Rd
      [520, -2420, 34, 26, 44, 'com'],        // Nan Fung Centre
      [560, -2450, 30, 24, 40, 'hotel'],      // Panda Hotel
      [520, -2490, 30, 24, 36, 'com'],
      [560, -2520, 34, 26, 30, 'com'],        // Vision City
      // Nina Tower — the landmark spike west over the depot
      [60, -2510, 26, 22, 88, 'glass'],
    ],
    parks: [[230, -2560, 390, -2500, 12]],    // Discovery Park
    lamps: [[200, -2385, 470, 30]],
  },
  { // ---- Kowloon — the Airport Railway dig under Union Square. ICC
    //     stands on the hole's north edge (already in the skyline band);
    //     Elements podium roofs the box, WKCD opens west toward the
    //     point, the Union Square towers ring the site.
    id: 'KOW', hole: [-1600, -1360, -1058, -982],
    roads: [[-1700, -937, -1260, -925],       // Nga Cheung Rd between the mall wings and skyline
            [-1260, -1120, -1248, -960],      // Austin Rd W east side
            [-1700, -1092, -1260, -1080]],    // Museum Dr / south apron edge
    towers: [
      // Union Square — the towers over the Elements podium
      [-1660, -1010, 34, 26, 66, 'res'],      // The Harbourside
      [-1690, -1040, 30, 24, 58, 'res'],      // The Arch
      [-1300, -1010, 34, 26, 72, 'res'],      // Sorrento
      [-1270, -1040, 30, 24, 62, 'res'],      // Sorrento 2
      [-1640, -960, 44, 22, 18, 'mall'],      // Elements west wing
      [-1320, -960, 44, 22, 18, 'mall'],      // Elements east wing
      // WKCD edge + The Cullinan over the mall's north side
      [-1660, -1080, 26, 20, 30, 'com'],      // M+ block silhouette
      [-1560, -920, 30, 20, 54, 'res'],       // The Cullinan north
      [-1400, -920, 30, 20, 50, 'res'],       // The Cullinan south
      // south apron — Austin Rd W low-rise
      [-1420, -1120, 26, 18, 22, 'res'], [-1520, -1120, 26, 18, 26, 'res'],
      [-1620, -1120, 24, 18, 20, 'res'], [-1340, -1120, 24, 18, 24, 'res'],
    ],
    parks: [[-1760, -1120, -1680, -1060, 8]], // WKCD nursery park strip
    lamps: [[-1690, -931, -1270, 30]],
  },
  { // ---- Olympic — the reclamation station: Olympian City mall on the
    //     north edge, Island Harbourview/HSBC Centre towers along Sham
    //     Mong Rd, Tai Kok Tsui low-rise to the south.
    id: 'OLY', hole: [-920, -680, -1492, -1408],
    roads: [[-1040, -1390, -560, -1378],      // Cherry St east of the dig
            [-1040, -1520, -560, -1508],      // Sham Mong Rd south
            [-1040, -1520, -1028, -1390],     // Hoi Fai Rd west edge
            [-560, -1520, -548, -1390]],      // Lin Cheung Rd east edge
    towers: [
      [-1000, -1360, 40, 30, 34, 'mall'],     // Olympian City
      [-1060, -1430, 28, 20, 52, 'res'],      // Island Harbourview
      [-1060, -1490, 28, 20, 48, 'res'],
      [-620, -1360, 30, 22, 46, 'office'],    // HSBC Centre
      [-580, -1430, 28, 20, 40, 'office'],
      [-560, -1490, 26, 20, 36, 'hotel'],
      [-1000, -1560, 30, 22, 38, 'res'],      // Hampton Place
      [-620, -1560, 28, 20, 34, 'res'],
      [-940, -1580, 24, 18, 18, 'res'],       // Tai Kok Tsui blocks
      [-860, -1580, 24, 18, 20, 'res'], [-740, -1580, 24, 18, 16, 'res'],
    ],
    parks: [[-1040, -1560, -1000, -1530, 8],  // Cherry St Park corner
            [-700, -1560, -580, -1530, 10]],
    lamps: [[-1030, -1384, -570, 30], [-1030, -1514, -570, 30]],
  },
  { // ---- Exhibition Centre — the Wan Chai North reclamation: Convention
    //     Plaza towers + hotels wedged between Immigration Tower and the
    //     HKCEC slab on the water.
    id: 'EXC', hole: [478, 722, -94, -6],
    roads: [[470, 2, 730, 14],          // Gloucester Rd service along the south
            [466, -94, 478, 14], [722, -94, 734, 14]],
    towers: [
      [560, 34, 30, 22, 44, 'office'],  // Convention Plaza office tower
      [614, 36, 26, 20, 52, 'hotel'],   // Grand Hyatt
      [668, 32, 26, 20, 46, 'hotel'],   // Renaissance Harbour View
      [450, 30, 24, 18, 36, 'office'],  // China Overseas-ish west
      [510, 66, 26, 20, 28, 'res'], [580, 68, 24, 18, 32, 'res'],
      [650, 70, 26, 20, 30, 'res'],     // Wan Chai res row south
    ],
    parks: [[735, -88, 770, -30, 8]],   // harbourfront promenade green
    lamps: [[480, 8, 720, 40]],
  },
  { // ---- Hung Hom — the old KCR terminus trench where the EAL surfaces
    //     from the harbour: HK Coliseum's arena block, PolyU campus west,
    //     Metropolis east, Hung Hom town south.
    id: 'HUH', hole: [678, 922, -1024, -936],
    roads: [[670, -1036, 930, -1024], [670, -936, 930, -924],
            [666, -1024, 678, -936], [922, -1024, 934, -936]],
    towers: [
      [880, -1070, 42, 30, 14, 'heritage'], // HK Coliseum arena block
      [960, -1000, 34, 26, 32, 'hotel'],    // Metropolis / Harbour Plaza
      [700, -1070, 30, 22, 20, 'com'], [745, -1095, 28, 22, 18, 'com'], // PolyU
      [640, -900, 26, 20, 30, 'res'], [590, -905, 24, 18, 26, 'res'],
      [860, -890, 26, 20, 34, 'res'], [910, -895, 24, 18, 28, 'res'],
    ],
    parks: [[960, -1080, 1010, -1030, 10]],
    lamps: [[680, -1030, 920, 40], [680, -930, 920, 40]],
  },
  { // ---- Mong Kok East — the embankment stop: Grand Century Place +
    //     Royal Plaza over the east edge, Mong Kok Stadium's pitch south,
    //     res towers filling the blocks toward the Lion Rock foot.
    id: 'MKE', hole: [626, 874, -1286, -1194],
    roads: [[620, -1300, 880, -1286], [620, -1194, 880, -1180],
            [614, -1286, 626, -1194], [874, -1286, 886, -1194]],
    towers: [
      [892, -1240, 30, 26, 40, 'com'],      // Grand Century Place office
      [892, -1296, 26, 22, 42, 'hotel'],    // Royal Plaza Hotel
      [700, -1340, 26, 22, 30, 'res'], [760, -1350, 24, 20, 28, 'res'],
      [820, -1345, 24, 20, 32, 'res'],
      [660, -1160, 24, 18, 22, 'res'], [730, -1155, 26, 20, 26, 'res'],
      [800, -1160, 24, 18, 20, 'res'],
    ],
    parks: [[540, -1160, 630, -1130, 0]],   // Mong Kok Stadium pitch
    lamps: [[630, -1293, 870, 40], [630, -1187, 870, 40]],
  },
  { // ---- Kowloon Tong — Festival Walk's mall + tower over the west,
    //     Kowloon Tsai Park NW, Baptist U / City U blocks climbing the
    //     Lion Rock foothills, school low-rises south.
    id: 'KOT', hole: [478, 722, -1464, -1376],
    roads: [[470, -1476, 730, -1464], [470, -1376, 730, -1364],
            [466, -1464, 478, -1376], [722, -1464, 734, -1376]],
    towers: [
      [445, -1470, 44, 34, 14, 'mall'],     // Festival Walk mall
      [500, -1480, 26, 22, 36, 'com'],      // Festival Walk tower
      [720, -1482, 30, 22, 22, 'com'], [775, -1478, 26, 20, 28, 'com'], // BU/CityU
      [560, -1340, 28, 20, 14, 'heritage'], [620, -1350, 26, 20, 16, 'res'],
      [680, -1345, 24, 18, 18, 'res'],
    ],
    parks: [[380, -1495, 450, -1420, 12]],  // Kowloon Tsai Park
    lamps: [[480, -1470, 720, 40], [480, -1370, 720, 40]],
  },
  { // ---- Tai Wai — Shing Mun valley stop north of the Lion Rock tunnel:
    //     Festival City's slab towers over the depot land, the river
    //     channel east, Che Kung Temple on its bank, village rows south.
    id: 'TAW', hole: [598, 842, -2192, -2088],
    roads: [[590, -2204, 850, -2192], [590, -2088, 850, -2076],
            [586, -2192, 598, -2088], [842, -2192, 854, -2088]],
    towers: [
      [600, -2230, 22, 20, 46, 'res'], [640, -2240, 22, 20, 50, 'res'],
      [680, -2230, 22, 20, 48, 'res'], [720, -2245, 22, 20, 52, 'res'],
      [760, -2230, 22, 20, 44, 'res'], [800, -2240, 22, 20, 46, 'res'], // Festival City
      [870, -2070, 20, 16, 10, 'heritage'], // Che Kung Temple on the bank
      [620, -2060, 22, 16, 12, 'res'], [670, -2055, 20, 16, 10, 'res'],
      [720, -2065, 22, 18, 14, 'res'], [780, -2058, 24, 18, 16, 'res'],
    ],
    water: [[860, -2350, 905, -2125]],    // Shing Mun river channel east
    parks: [[790, -2075, 830, -2045, 8]],
    lamps: [[600, -2198, 840, 40], [600, -2082, 840, 40]],
  },
  { // ---- Ocean Park — the SIL surfaces south of the hills onto the
    //     coastal viaduct. Park entrance gardens + bus terminus north,
    //     Police College and the Wong Chuk Hang Rd blocks south.
    id: 'OCP', hole: [680, 920, 432, 528],
    roads: [[640, 536, 960, 548],        // Wong Chuk Hang Rd along the south edge
            [640, 408, 960, 420]],       // Ocean Park Rd north
    towers: [
      [650, 460, 40, 30, 14, 'mall'],    // park entrance plaza block
      [942, 460, 30, 22, 30, 'hotel'],   // Ocean Park Marriott silhouette
      [900, 580, 30, 22, 22, 'hotel'],   // Waterfront-side hotels
      [955, 575, 30, 22, 18, 'office'],  // Police College blocks south-east
      [995, 605, 26, 20, 16, 'office'],
    ],
    parks: [[660, 372, 950, 402, 20]],   // Ocean Park entrance gardens
    lamps: [[660, 542, 940, 30]],
  },
  { // ---- Wong Chuk Hang — viaduct over Wong Chuk Hang Rd; the SIL
    //     depot sheds east, industrial blocks north, Nam Long Shan
    //     schools south.
    id: 'WCH', hole: [440, 680, 552, 648],
    roads: [[400, 536, 720, 548],        // Wong Chuk Hang Rd north
            [400, 660, 720, 672]],       // Nam Long Shan Rd south
    towers: [
      [722, 590, 52, 30, 12, 'mall'],    // SIL depot shed east of the dig
      [768, 600, 40, 26, 10, 'mall'],
      [470, 505, 30, 22, 34, 'office'],  // industrial blocks north
      [530, 500, 30, 22, 28, 'office'], [590, 508, 26, 20, 40, 'office'],
      [650, 505, 30, 22, 26, 'com'],
      [470, 690, 30, 22, 24, 'res'],     // Nam Long Shan blocks south
      [560, 690, 30, 22, 30, 'res'], [640, 695, 28, 20, 22, 'res'],
    ],
    parks: [[700, 690, 760, 730, 10]],
    lamps: [[410, 542, 710, 30], [410, 666, 710, 30]],
  },
  { // ---- Lei Tung — Ap Lei Chau's hill cavern. Estate slab towers up
    //     the slope, Ap Lei Chau Bridge Rd along the channel west.
    id: 'LET', hole: [120, 360, 618, 702],
    roads: [[40, 740, 104, 560],         // Ap Lei Chau Bridge Rd west edge
            [104, 606, 380, 594],        // estate drive north edge
            [104, 716, 380, 728]],       // estate drive south edge
    water: [[375, 545, 435, 735]],       // Aberdeen Channel east of the dig
    towers: [
      [170, 560, 28, 20, 40, 'res'],     // Lei Tung Estate up the hill
      [230, 555, 28, 20, 44, 'res'], [290, 560, 28, 20, 38, 'res'],
      [170, 750, 28, 20, 42, 'res'],     // estate south slope
      [240, 755, 28, 20, 36, 'res'], [310, 750, 28, 20, 40, 'res'],
      [60, 500, 26, 20, 30, 'res'],      // Ap Lei Chau Main St blocks
      [60, 440, 26, 20, 24, 'res'],
    ],
    parks: [[330, 560, 370, 600, 8], [330, 720, 370, 760, 8]],
    lamps: [[120, 600, 360, 30], [120, 722, 360, 30]],
  },
  { // ---- South Horizons — the terminus under the estate; slab towers
    //     ring the dig, the promenade runs the south shore.
    id: 'SOH', hole: [-200, 40, 632, 728],
    roads: [[-240, 616, 80, 604],        // South Horizon Dr north edge
            [-240, 740, 80, 752]],       // promenade road south edge
    water: [[-340, 800, 380, 1100]],     // the south shore sea band
    towers: [
      [-260, 660, 30, 22, 44, 'res'],    // South Horizons slabs west
      [-260, 710, 30, 22, 40, 'res'],
      [80, 640, 30, 22, 46, 'res'],      // estate slabs east
      [80, 700, 30, 22, 42, 'res'], [130, 670, 28, 20, 38, 'res'],
      [-160, 570, 30, 22, 40, 'res'],    // north ring
      [-60, 575, 30, 22, 36, 'res'], [20, 570, 28, 20, 34, 'res'],
      [-80, 780, 90, 18, 8, 'mall'],     // Marina Square podium south
    ],
    parks: [[-230, 755, -40, 785, 14]],  // waterfront promenade greens
    lamps: [[-230, 610, 70, 30], [-230, 746, 70, 30]],
  },
  { // ---- Shek Kip Mei — estate slab blocks east of the Nathan Rd
    //     corridor, Tai Hang Sai low-rise south, City U at the hill foot.
    id: 'SKM', hole: [830, 1070, -1488, -1392],
    roads: [[820, -1380, 1080, -1392], [820, -1500, 1080, -1488],
            [818, -1500, 830, -1380], [1070, -1500, 1082, -1380]],
    towers: [
      [850, -1340, 34, 24, 40, 'res'],   // Shek Kip Mei Estate slabs
      [900, -1330, 34, 24, 44, 'res'], [950, -1345, 34, 24, 38, 'res'],
      [1005, -1330, 34, 24, 42, 'res'], [1050, -1345, 30, 22, 36, 'res'],
      [860, -1530, 24, 18, 14, 'res'],   // Tai Hang Sai low-rise
      [920, -1535, 24, 18, 12, 'res'], [980, -1528, 24, 18, 16, 'res'],
      [1040, -1532, 24, 18, 13, 'res'],
    ],
    parks: [[840, -1560, 920, -1580, 8]],
    lamps: [[830, -1386, 1070, 40], [830, -1494, 1070, 40]],
  },
  { // ---- Lok Fu — Lok Fu Plaza podium under the Wang Tau Hom estate
    //     blocks at the Lion Rock foot.
    id: 'LOF', hole: [1130, 1370, -1508, -1412],
    roads: [[1120, -1400, 1380, -1412], [1120, -1520, 1380, -1508],
            [1118, -1520, 1130, -1400], [1370, -1520, 1382, -1400]],
    towers: [
      [1160, -1355, 44, 30, 12, 'mall'],  // Lok Fu Plaza podium
      [1200, -1310, 30, 22, 38, 'res'],   // estate towers behind the mall
      [1250, -1315, 30, 22, 42, 'res'], [1300, -1305, 30, 22, 36, 'res'],
      [1350, -1320, 30, 22, 40, 'res'],
      [1160, -1545, 30, 22, 34, 'res'],   // Wang Tau Hom south blocks
      [1220, -1555, 30, 22, 38, 'res'], [1300, -1550, 30, 22, 32, 'res'],
      [1360, -1558, 28, 20, 30, 'res'],
    ],
    parks: [[1140, -1570, 1220, -1590, 8]],
    lamps: [[1130, -1406, 1370, 40], [1130, -1514, 1370, 40]],
  },
  { // ---- Wong Tai Sin — the temple + Temple Mall at the hill foot,
    //     Lower Wong Tai Sin estate slabs south of the dig.
    id: 'WTS', hole: [1420, 1660, -1488, -1392],
    roads: [[1410, -1380, 1670, -1392], [1410, -1500, 1670, -1488],
            [1408, -1500, 1420, -1380], [1660, -1500, 1672, -1380]],
    towers: [
      [1440, -1350, 30, 22, 36, 'res'],   // Temple-side towers
      [1500, -1340, 30, 22, 40, 'res'], [1560, -1355, 30, 22, 34, 'res'],
      [1620, -1342, 30, 22, 38, 'res'],
      [1470, -1535, 40, 24, 10, 'heritage'], // Sik Sik Yuen temple halls
      [1560, -1530, 60, 26, 12, 'mall'],     // Temple Mall podium
      [1460, -1580, 30, 22, 32, 'res'],   // Lower WTS estate slabs
      [1520, -1590, 30, 22, 36, 'res'], [1600, -1585, 30, 22, 30, 'res'],
    ],
    parks: [[1430, -1560, 1470, -1570, 8]],
    lamps: [[1420, -1386, 1660, 40], [1420, -1494, 1660, 40]],
  },
  { // ---- Diamond Hill — Plaza Hollywood + Galaxia at the Kowloon Peak
    //     foot; Chi Lin Nunnery gardens across the road.
    id: 'DIH', hole: [1710, 1950, -1488, -1392],
    roads: [[1700, -1380, 1960, -1392], [1700, -1500, 1960, -1488],
            [1698, -1500, 1710, -1380], [1950, -1500, 1962, -1380]],
    towers: [
      [1740, -1350, 70, 34, 14, 'mall'],  // Plaza Hollywood podium
      [1750, -1305, 30, 22, 44, 'res'],   // Galaxia towers
      [1800, -1300, 30, 22, 48, 'res'], [1850, -1310, 30, 22, 42, 'res'],
      [1900, -1300, 30, 22, 46, 'res'],
      [1890, -1540, 60, 30, 12, 'heritage'], // Chi Lin Nunnery halls
      [1930, -1540, 30, 22, 34, 'res'],   // Tai Hom side blocks
    ],
    parks: [[1820, -1560, 1880, -1580, 14]], // nunnery gardens
    lamps: [[1710, -1386, 1950, 40], [1710, -1494, 1950, 40]],
  },
  { // ---- Choi Hung — the rainbow estate's famous slab blocks marching
    //     east past the ridge's end; Ngau Chi Wan village south.
    id: 'CHH', hole: [2040, 2280, -1668, -1572],
    roads: [[2030, -1560, 2290, -1572], [2030, -1680, 2290, -1668],
            [2028, -1680, 2040, -1560], [2280, -1680, 2292, -1560]],
    towers: [
      [2060, -1520, 40, 20, 30, 'res'],   // Choi Hung rainbow slabs
      [2110, -1530, 40, 20, 32, 'res'], [2160, -1518, 40, 20, 28, 'res'],
      [2210, -1530, 40, 20, 34, 'res'], [2260, -1520, 40, 20, 30, 'res'],
      [2070, -1720, 26, 18, 14, 'res'],   // Ngau Chi Wan low-rise
      [2130, -1730, 26, 18, 12, 'res'], [2190, -1725, 26, 18, 16, 'res'],
      [2250, -1735, 26, 18, 13, 'res'],
    ],
    parks: [[2050, -1700, 2110, -1560, 10]],
    lamps: [[2040, -1566, 2280, 40], [2040, -1674, 2280, 40]],
  },
  { // ---- Kowloon Bay — the KTL climbs onto the Kwun Tong Rd viaduct;
    //     Telford Gardens slab towers and the depot sheds alongside,
    //     industrial blocks across the road.
    id: 'KOB', hole: [2312, 2568, -1736, -1624],
    roads: [[2300, -1612, 2580, -1624], [2300, -1748, 2580, -1736],
            [2300, -1748, 2312, -1612], [2568, -1748, 2580, -1612]],
    towers: [
      [2340, -1560, 30, 22, 36, 'res'],   // Telford Gardens slabs
      [2390, -1550, 30, 22, 40, 'res'], [2440, -1565, 30, 22, 34, 'res'],
      [2490, -1550, 30, 22, 38, 'res'], [2540, -1562, 30, 22, 32, 'res'],
      [2340, -1790, 60, 30, 10, 'com'],   // depot sheds south
      [2420, -1795, 60, 30, 8, 'com'],
      [2500, -1785, 40, 24, 30, 'office'], // industrial loft blocks
      [2550, -1795, 34, 24, 36, 'office'],
    ],
    parks: [],
    lamps: [[2320, -1618, 2560, 40], [2320, -1742, 2560, 40]],
  },
  { // ---- Ngau Tau Kok — garden estate blocks north, Millennium City
    //     office towers south on the industrial strip.
    id: 'NTK', hole: [2592, 2848, -1796, -1684],
    roads: [[2580, -1672, 2860, -1684], [2580, -1808, 2860, -1796],
            [2580, -1808, 2592, -1672], [2848, -1808, 2860, -1672]],
    towers: [
      [2620, -1630, 32, 24, 30, 'res'],   // Garden Estate blocks
      [2680, -1620, 32, 24, 34, 'res'], [2740, -1632, 32, 24, 28, 'res'],
      [2800, -1620, 32, 24, 32, 'res'],
      [2640, -1850, 36, 28, 52, 'office'], // Millennium City towers
      [2720, -1860, 36, 28, 58, 'office'], [2800, -1848, 36, 28, 48, 'office'],
    ],
    parks: [[2600, -1830, 2660, -1850, 8]],
    lamps: [[2600, -1678, 2840, 40], [2600, -1802, 2840, 40]],
  },
  { // ---- Kwun Tong — the town centre: apm mall + Yue Man Square at the
    //     deck, office/industrial canyon along Kwun Tong Rd.
    id: 'KWT', hole: [2872, 3128, -1856, -1744],
    roads: [[2860, -1732, 3140, -1744], [2860, -1868, 3140, -1856],
            [2860, -1868, 2872, -1732], [3128, -1868, 3140, -1732]],
    towers: [
      [2900, -1690, 50, 30, 16, 'mall'],   // apm / Yue Man Sq podium
      [2940, -1650, 30, 22, 44, 'office'], // Millennium City 5
      [3000, -1660, 30, 22, 50, 'office'], [3060, -1648, 30, 22, 40, 'office'],
      [3100, -1660, 28, 20, 36, 'office'],
      [2900, -1910, 30, 22, 38, 'com'],    // industrial loft strip
      [2960, -1920, 30, 22, 34, 'com'], [3020, -1910, 30, 22, 42, 'com'],
      [3080, -1920, 30, 22, 32, 'com'],
    ],
    parks: [[2880, -1890, 2940, -1910, 8]],
    lamps: [[2880, -1738, 3120, 40], [2880, -1862, 3120, 40]],
  },
  { // ---- Lam Tin — hillside estate towers climbing the slope above the
    //     cutting; Kai Tin Rd blocks south.
    id: 'LAT', hole: [3140, 3380, -1928, -1832],
    roads: [[3130, -1820, 3390, -1832], [3130, -1940, 3390, -1928],
            [3128, -1940, 3140, -1820], [3380, -1940, 3392, -1820]],
    towers: [
      [3170, -1770, 32, 24, 36, 'res'],   // Lam Tin Estate slabs
      [3230, -1760, 32, 24, 40, 'res'], [3290, -1775, 32, 24, 34, 'res'],
      [3350, -1762, 32, 24, 38, 'res'],
      [3180, -1990, 30, 22, 30, 'res'],   // Kai Tin blocks south
      [3240, -2000, 30, 22, 34, 'res'], [3320, -1995, 30, 22, 28, 'res'],
    ],
    parks: [[3150, -1960, 3230, -1980, 10]],
    lamps: [[3150, -1826, 3370, 40], [3150, -1934, 3370, 40]],
  },
  { // ---- Yau Tong — estate rebuild towers over the cutting, Cha Kwo
    //     Ling industrial shore east.
    id: 'YAT', hole: [3400, 3640, -2008, -1912],
    roads: [[3390, -1900, 3650, -1912], [3390, -2020, 3650, -2008],
            [3388, -2020, 3400, -1900], [3640, -2020, 3652, -1900]],
    towers: [
      [3430, -1860, 32, 24, 40, 'res'],   // Yau Tong Estate towers
      [3490, -1850, 32, 24, 44, 'res'], [3550, -1865, 32, 24, 38, 'res'],
      [3610, -1852, 32, 24, 42, 'res'],
      [3440, -2060, 34, 24, 30, 'com'],   // Cha Kwo Ling industrial
      [3510, -2070, 34, 24, 26, 'com'], [3580, -2060, 34, 24, 32, 'com'],
    ],
    parks: [[3420, -2030, 3500, -2050, 8]],
    lamps: [[3410, -1906, 3630, 40], [3410, -2014, 3630, 40]],
  },
  { // ---- Tiu Keng Leng — the TKO new town's Metro Town towers over the
    //     at-grade terminus; green hillside east toward the tunnel.
    id: 'TKL', hole: [3660, 3900, -2088, -1992],
    roads: [[3650, -1980, 3910, -1992], [3650, -2100, 3910, -2088],
            [3648, -2100, 3660, -1980], [3900, -2100, 3912, -1980]],
    towers: [
      [3690, -1930, 32, 24, 46, 'res'],   // Metro Town towers
      [3750, -1920, 32, 24, 50, 'res'], [3810, -1935, 32, 24, 44, 'res'],
      [3870, -1920, 32, 24, 48, 'res'],
      [3700, -2140, 30, 22, 36, 'res'],   // Kin Ming Estate blocks
      [3760, -2150, 30, 22, 40, 'res'], [3840, -2145, 30, 22, 34, 'res'],
    ],
    parks: [[3660, -2120, 3740, -2140, 10]],
    lamps: [[3670, -1986, 3890, 40], [3670, -2094, 3890, 40]],
  },
  { // ---- Ho Man Tin — upland estate slabs between Yau Ma Tei and the
    //     Hung Hom corridor; Oi Man Estate + HKMU campus blocks.
    id: 'HOM', hole: [450, 690, -1178, -1082],
    roads: [[440, -1070, 700, -1082], [440, -1190, 700, -1178],
            [438, -1190, 450, -1070], [690, -1190, 702, -1070]],
    towers: [
      [470, -1230, 34, 24, 38, 'res'],   // Oi Man Estate slabs
      [530, -1240, 34, 24, 42, 'res'], [590, -1225, 34, 24, 36, 'res'],
      [610, -1215, 30, 22, 40, 'res'],
      [470, -1030, 30, 22, 30, 'office'], // HKMU campus blocks
      [530, -1020, 34, 24, 26, 'office'], [600, -1035, 30, 22, 32, 'office'],
      [660, -1022, 28, 20, 28, 'res'],
    ],
    parks: [[455, -1040, 525, -1060, 10]],  // Ho Man Tin hillside green
    lamps: [[450, -1076, 690, 40], [450, -1184, 690, 40]],
  },
  { // ---- Whampoa — the waterfront terminus: Whampoa Garden slab rows
    //     and the ship-shaped Whampoa mall beached on the promenade.
    id: 'WHA', hole: [540, 780, -928, -832],
    roads: [[530, -940, 790, -928],        // Tak On St north edge
            [540, -820, 780, -808],        // promenade along the harbour
            [528, -940, 540, -820], [780, -940, 792, -820]],
    towers: [
      [560, -970, 34, 24, 34, 'res'],    // Whampoa Garden slabs north
      [615, -980, 34, 24, 38, 'res'], [670, -968, 34, 24, 32, 'res'],
      [725, -978, 34, 24, 36, 'res'],
      [840, -870, 90, 26, 12, 'mall'],   // The Whampoa — the ship mall
      [800, -950, 30, 22, 40, 'res'],    // estate towers east
      [500, -870, 34, 24, 30, 'res'],    // Hung Hom side slabs
      [500, -960, 30, 22, 34, 'res'],
    ],
    parks: [[545, -800, 770, -790, 6]],  // harbourfront promenade greens
    lamps: [[540, -934, 780, 40], [545, -814, 775, 40]],
  },
  { // ---- Tseung Kwan O — new-town centre: PopCorn mall podium and the
    //     Park Central / TKO Plaza slab rows flanking the dig.
    id: 'TKW', hole: [4180, 4420, -2228, -2132],
    roads: [[4170, -2120, 4430, -2132], [4170, -2240, 4430, -2228],
            [4168, -2240, 4180, -2120], [4420, -2240, 4432, -2120]],
    towers: [
      [4200, -2080, 34, 24, 44, 'res'],   // Park Central row north
      [4260, -2090, 34, 24, 48, 'res'], [4320, -2078, 34, 24, 40, 'res'],
      [4380, -2088, 34, 24, 46, 'res'],
      [4140, -2180, 60, 40, 14, 'mall'],  // PopCorn podium
      [4210, -2280, 34, 24, 42, 'res'],   // TKO Plaza row south
      [4280, -2295, 34, 24, 38, 'res'], [4350, -2285, 34, 24, 44, 'res'],
      [4410, -2298, 30, 22, 36, 'res'],
    ],
    parks: [[4200, -2110, 4300, -2120, 10]],
    lamps: [[4180, -2126, 4420, 40], [4180, -2234, 4420, 40]],
  },
  { // ---- Hang Hau — East Point City podium and the Hau Tak estate
    //     slabs around the town-centre dig.
    id: 'HAH', hole: [4580, 4820, -2328, -2232],
    roads: [[4570, -2220, 4830, -2232], [4570, -2340, 4830, -2328],
            [4568, -2340, 4580, -2220], [4820, -2340, 4832, -2220]],
    towers: [
      [4600, -2180, 34, 24, 40, 'res'],   // East Point City towers north
      [4660, -2190, 34, 24, 44, 'res'], [4720, -2178, 34, 24, 38, 'res'],
      [4780, -2188, 34, 24, 42, 'res'],
      [4530, -2280, 50, 36, 12, 'mall'],  // East Point City podium
      [4620, -2380, 34, 24, 36, 'res'],   // Hau Tak Estate slabs south
      [4700, -2395, 34, 24, 40, 'res'], [4780, -2385, 34, 24, 34, 'res'],
    ],
    parks: [[4630, -2210, 4730, -2220, 10]],
    lamps: [[4580, -2226, 4820, 40], [4580, -2334, 4820, 40]],
  },
  { // ---- Po Lam — the north terminus under Metro City; Po Lam Estate
    //     slabs and the Mau Wu Tsai green edge to the south.
    id: 'POL', hole: [4960, 5200, -2428, -2332],
    roads: [[4950, -2320, 5210, -2332], [4950, -2440, 5210, -2428],
            [4948, -2440, 4960, -2320], [5200, -2440, 5212, -2320]],
    towers: [
      [4990, -2280, 34, 24, 42, 'res'],   // Metro City towers north
      [5050, -2290, 34, 24, 46, 'res'], [5110, -2278, 34, 24, 40, 'res'],
      [5170, -2288, 34, 24, 44, 'res'],
      [5240, -2380, 56, 40, 14, 'mall'],  // Metro City podium
      [5000, -2470, 34, 24, 36, 'res'],   // Po Lam Estate slabs south
      [5070, -2485, 34, 24, 40, 'res'], [5140, -2475, 34, 24, 34, 'res'],
    ],
    parks: [[5030, -2310, 5130, -2320, 10], [4980, -2450, 5050, -2460, 10]],
    lamps: [[4960, -2326, 5200, 40], [4960, -2434, 5200, 40]],
  },
  { // ---- LOHAS Park — the branch terminus at grade beside the depot
    //     shed; The LOHAS mall podium and the Capitol estate slabs tower
    //     over the platforms.
    id: 'LHP', hole: [4400, 4640, -2608, -2512],
    roads: [[4390, -2500, 4650, -2512], [4390, -2620, 4650, -2608],
            [4388, -2620, 4400, -2500], [4640, -2620, 4652, -2500]],
    towers: [
      [4430, -2460, 34, 24, 50, 'res'],   // Capitol slabs north
      [4490, -2470, 34, 24, 54, 'res'], [4550, -2458, 34, 24, 46, 'res'],
      [4610, -2468, 34, 24, 52, 'res'],
      [4350, -2560, 60, 40, 14, 'mall'],  // The LOHAS podium
      [4700, -2560, 80, 60, 10, 'com'],   // TKO depot shed east
      [4440, -2660, 34, 24, 44, 'res'],   // Le Prestige slabs south
      [4520, -2675, 34, 24, 48, 'res'], [4600, -2665, 34, 24, 40, 'res'],
    ],
    parks: [[4440, -2490, 4560, -2500, 10]],
    lamps: [[4400, -2506, 4640, 40], [4400, -2614, 4640, 40]],
  },
  { // ---- Sha Tin — New Town Plaza podium and mall towers around the
    //     town-centre dig; the Shing Mun river channel runs east.
    id: 'SHS', hole: [980, 1220, -2808, -2712],
    roads: [[970, -2700, 1230, -2712], [970, -2820, 1230, -2808],
            [958, -2820, 970, -2700], [1220, -2820, 1232, -2700]],
    towers: [
      [930, -2760, 60, 44, 16, 'mall'],   // New Town Plaza podium
      [1000, -2660, 34, 24, 44, 'res'],   // New Town Towers north
      [1060, -2670, 34, 24, 48, 'res'], [1120, -2658, 34, 24, 40, 'res'],
      [1180, -2668, 34, 24, 46, 'res'],
      [1270, -2760, 30, 24, 14, 'office'], // Sha Tin Town Hall
      [1010, -2860, 34, 24, 42, 'res'],   // Lek Yuen / Wo Che slabs south
      [1080, -2875, 34, 24, 38, 'res'], [1150, -2865, 34, 24, 44, 'res'],
      [1210, -2880, 30, 22, 36, 'res'],
    ],
    water: [[1320, -2870, 1380, -2620]],  // Shing Mun River east
    parks: [[1050, -2690, 1150, -2700, 10]],
    lamps: [[980, -2706, 1220, 40], [980, -2814, 1220, 40]],
  },
  { // ---- Fo Tan — Ho Tung Lau depot shed and the industrial loft rows;
    //     Jubilee Garden towers south.
    id: 'FOT', hole: [1380, 1620, -2888, -2792],
    roads: [[1370, -2780, 1630, -2792], [1370, -2900, 1630, -2888],
            [1368, -2900, 1380, -2780], [1620, -2900, 1632, -2780]],
    towers: [
      [1400, -2740, 30, 22, 26, 'office'], // industrial lofts north
      [1460, -2750, 30, 22, 30, 'office'], [1520, -2738, 30, 22, 24, 'office'],
      [1500, -2940, 120, 40, 8, 'com'],   // Ho Tung Lau depot shed
      [1660, -2870, 34, 24, 40, 'res'],   // Jubilee Garden towers east
      [1700, -2880, 34, 24, 44, 'res'],
      [1400, -2920, 30, 22, 32, 'res'],
    ],
    parks: [[1560, -2770, 1620, -2780, 8]],
    lamps: [[1380, -2786, 1620, 40], [1380, -2894, 1620, 40]],
  },
  { // ---- University — CUHK campus blocks stepping up the hillside
    //     north; Ma Liu Shui waterfront and Science Park glimpse south,
    //     Tolo Harbour east.
    id: 'UNI', hole: [1830, 2070, -2968, -2872],
    roads: [[1820, -2860, 2080, -2872], [1820, -2980, 2080, -2968],
            [1818, -2980, 1830, -2860], [2070, -2980, 2082, -2860]],
    towers: [
      [1860, -2820, 30, 22, 24, 'office'], // CUHK campus terraces
      [1920, -2830, 30, 22, 28, 'office'], [1980, -2818, 30, 22, 22, 'office'],
      [2040, -2828, 30, 22, 26, 'office'],
      [1900, -3020, 34, 24, 18, 'office'], // Science Park labs south
      [1970, -3030, 34, 24, 20, 'office'],
    ],
    water: [[2150, -3050, 2250, -2900]],  // Tolo Harbour east
    parks: [[2100, -2940, 2140, -2960, 8]],
    lamps: [[1830, -2866, 2070, 40], [1830, -2974, 2070, 40]],
  },
  { // ---- Tai Po Market — the market-town centre: Mega Mall podium,
    //     Uptown Plaza, estate slabs in the Tai Po valley.
    id: 'TPM', hole: [2330, 2570, -3048, -2952],
    roads: [[2320, -2940, 2580, -2952], [2320, -3060, 2580, -3048],
            [2318, -3060, 2330, -2940], [2570, -3060, 2582, -2940]],
    towers: [
      [2290, -3000, 56, 40, 14, 'mall'],  // Tai Po Mega Mall
      [2360, -2900, 34, 24, 40, 'res'],   // Uptown Plaza towers north
      [2420, -2910, 34, 24, 44, 'res'], [2480, -2898, 34, 24, 36, 'res'],
      [2540, -2908, 34, 24, 42, 'res'],
      [2380, -3100, 34, 24, 38, 'res'],   // Tai Po Centre slabs south
      [2450, -3115, 34, 24, 42, 'res'], [2520, -3105, 34, 24, 34, 'res'],
    ],
    parks: [[2600, -2990, 2660, -3030, 10]],
    lamps: [[2330, -2946, 2570, 40], [2330, -3054, 2570, 40]],
  },
  { // ---- Tai Wo — viaduct stop over the estate; Tai Wo Plaza podium
    //     west, estate slabs both sides.
    id: 'TAO', hole: [2678, 2922, -3132, -3028],
    roads: [[2668, -3016, 2932, -3028], [2668, -3144, 2932, -3132],
            [2666, -3144, 2678, -3016], [2922, -3144, 2934, -3016]],
    towers: [
      [2710, -2980, 34, 24, 34, 'res'],   // Tai Wo Estate slabs north
      [2770, -2990, 34, 24, 38, 'res'], [2830, -2978, 34, 24, 30, 'res'],
      [2890, -2988, 34, 24, 36, 'res'],
      [2640, -3080, 50, 36, 12, 'mall'],  // Tai Wo Plaza
      [2730, -3180, 34, 24, 32, 'res'],   // estate slabs south
      [2800, -3195, 34, 24, 36, 'res'], [2870, -3185, 30, 22, 30, 'res'],
    ],
    parks: [[2700, -3000, 2780, -3014, 8]],
    lamps: [[2680, -3022, 2920, 40], [2680, -3138, 2920, 40]],
  },
  { // ---- Fanling — Fanling Centre and Flora Plaza towers in the
    //     Fanling/Sheung Shui new town.
    id: 'FAN', hole: [3030, 3270, -3188, -3092],
    roads: [[3020, -3080, 3280, -3092], [3020, -3200, 3280, -3188],
            [3018, -3200, 3030, -3080], [3270, -3200, 3282, -3080]],
    towers: [
      [3060, -3040, 34, 24, 38, 'res'],   // Fanling Centre north
      [3120, -3050, 34, 24, 42, 'res'], [3180, -3038, 34, 24, 34, 'res'],
      [3240, -3048, 34, 24, 40, 'res'],
      [2990, -3140, 50, 36, 12, 'mall'],  // Flora Plaza
      [3090, -3240, 34, 24, 36, 'res'],   // Wah Sum slabs south
      [3160, -3255, 34, 24, 40, 'res'], [3230, -3245, 30, 22, 34, 'res'],
    ],
    parks: [[3100, -3070, 3180, -3088, 8]],
    lamps: [[3030, -3086, 3270, 40], [3030, -3194, 3270, 40]],
  },
  { // ---- Sheung Shui — the junction town: Sheung Shui Centre, Shek Wu
    //     Hui market blocks, Choi Yuen estate. The LMC spur branches
    //     south here.
    id: 'SHU', hole: [3400, 3640, -3248, -3152],
    roads: [[3390, -3140, 3650, -3152], [3390, -3260, 3650, -3248],
            [3388, -3260, 3400, -3140], [3640, -3260, 3652, -3140]],
    towers: [
      [3440, -3100, 34, 24, 40, 'res'],   // Sheung Shui Centre north
      [3500, -3110, 34, 24, 44, 'res'], [3560, -3098, 34, 24, 36, 'res'],
      [3620, -3108, 34, 24, 42, 'res'],
      [3360, -3200, 50, 36, 12, 'mall'],  // Landmark North
      [3450, -3300, 34, 24, 38, 'res'],   // Choi Yuen Estate south
      [3520, -3315, 34, 24, 42, 'res'], [3590, -3305, 30, 22, 36, 'res'],
    ],
    parks: [[3460, -3130, 3540, -3148, 8]],
    lamps: [[3400, -3146, 3640, 40], [3400, -3254, 3640, 40]],
  },
  { // ---- Lo Wu — the boundary terminus: long control-point hall, no
    //     towers inside the frontier restricted zone; Shenzhen River
    //     meander south.
    id: 'LOW', hole: [3800, 4040, -3328, -3232],
    roads: [[3790, -3220, 4050, -3232], [3790, -3340, 4050, -3328],
            [3788, -3340, 3800, -3220], [4040, -3340, 4052, -3220]],
    towers: [
      [3920, -3180, 100, 30, 10, 'com'],  // Lo Wu control-point hall
      [3830, -3130, 30, 22, 12, 'office'], // barrack blocks
      [3890, -3140, 30, 22, 14, 'office'],
    ],
    parks: [[3830, -3380, 4010, -3440, 8]], // frontier green
    lamps: [[3800, -3226, 4040, 40], [3800, -3334, 4040, 40]],
  },
  { // ---- Lok Ma Chau — the spur terminus on the wetlands edge: Futian
    //     control hall, marshes and the Shenzhen River loop south.
    id: 'LMC', hole: [3400, 3640, -3568, -3472],
    roads: [[3390, -3460, 3650, -3472], [3390, -3580, 3650, -3568],
            [3388, -3580, 3400, -3460], [3640, -3580, 3652, -3460]],
    towers: [
      [3520, -3420, 90, 28, 10, 'com'],   // Lok Ma Chau control hall
    ],
    water: [[3440, -3660, 3600, -3600]],  // Shenzhen River loop
    parks: [[3660, -3600, 3760, -3700, 10]], // wetlands
    lamps: [[3400, -3466, 3640, 40], [3400, -3574, 3640, 40]],
  },
  { // ---- Tsing Yi — Maritime Square podium over the dig, estate slabs
    //     and Tsing Yi Park around the island town.
    id: 'TSY', hole: [-2020, -1780, -1448, -1352],
    roads: [[-2030, -1340, -1770, -1352], [-2030, -1460, -1770, -1448],
            [-2032, -1460, -2020, -1340], [-1780, -1460, -1768, -1340]],
    towers: [
      [-1900, -1300, 60, 40, 14, 'mall'],   // Maritime Square
      [-1970, -1260, 34, 24, 40, 'res'],    // estate slabs north
      [-1840, -1255, 34, 24, 44, 'res'],
      [-1980, -1500, 34, 24, 38, 'res'],    // Tsing Yi Estate south
      [-1910, -1515, 34, 24, 42, 'res'], [-1830, -1505, 30, 22, 36, 'res'],
    ],
    parks: [[-1770, -1420, -1700, -1360, 10]],
    lamps: [[-2020, -1346, -1780, 40], [-2020, -1454, -1780, 40]],
  },
  { // ---- Sunny Bay — the open shore interchange: promenade greens and
    //     low blocks, the bay water east.
    id: 'SUN', hole: [-2570, -2330, -1948, -1852],
    roads: [[-2580, -1840, -2320, -1852], [-2580, -1960, -2320, -1948],
            [-2582, -1960, -2570, -1840], [-2330, -1960, -2318, -1840]],
    towers: [
      [-2540, -1800, 34, 24, 26, 'res'],    // shore blocks north
      [-2470, -1795, 34, 24, 30, 'res'], [-2400, -1805, 30, 22, 24, 'res'],
    ],
    water: [[-2300, -1960, -2100, -1700]],  // Sunny Bay shore east
    parks: [[-2560, -1975, -2360, -2010, 8]],
    lamps: [[-2570, -1846, -2330, 40], [-2570, -1954, -2330, 40]],
  },
  { // ---- Tung Chung — the new-town centre under Citygate: mall podium,
    //     crescent towers, Fu Tung estate slabs, cable-car terminus.
    id: 'TUC', hole: [-3120, -2880, -2348, -2252],
    roads: [[-3130, -2240, -2870, -2252], [-3130, -2360, -2870, -2348],
            [-3132, -2360, -3120, -2240], [-2880, -2360, -2868, -2240]],
    towers: [
      [-3000, -2200, 70, 44, 16, 'mall'],   // Citygate podium north
      [-3070, -2160, 34, 24, 44, 'res'],    // Coastal Skyline slabs
      [-2940, -2155, 34, 24, 48, 'res'], [-2870, -2165, 34, 24, 40, 'res'],
      [-3080, -2400, 34, 24, 38, 'res'],    // Fu Tung Estate south
      [-3010, -2415, 34, 24, 42, 'res'], [-2930, -2405, 30, 22, 36, 'res'],
      [-3150, -2300, 24, 18, 10, 'heritage'], // Ngong Ping 360 terminus
    ],
    parks: [[-2860, -2230, -2800, -2250, 8]],
    lamps: [[-3120, -2246, -2880, 40], [-3120, -2354, -2880, 40]],
  },
  { // ---- Airport — the long terminal hall fronting the platforms,
    //     runway apron east, SkyPier greens.
    id: 'AIR', hole: [-2920, -2680, -1548, -1452],
    roads: [[-2930, -1440, -2670, -1452], [-2930, -1560, -2670, -1548],
            [-2932, -1560, -2920, -1440], [-2680, -1560, -2668, -1440]],
    towers: [
      [-2800, -1400, 200, 40, 18, 'com'],   // Terminal 1 hall
      [-2920, -1360, 40, 30, 40, 'office'], // Regal Airport Hotel
      [-2500, -1470, 30, 22, 30, 'office'], // SkyCity blocks east
      [-2430, -1480, 30, 22, 26, 'office'],
    ],
    parks: [[-2660, -1570, -2580, -1620, 8]],
    lamps: [[-2920, -1446, -2680, 40], [-2920, -1554, -2680, 40]],
  },
  { // ---- AsiaWorld-Expo — the expo shed row west of the airport island,
    //     hotel block and Skycity greens.
    id: 'AWE', hole: [-3420, -3180, -1698, -1602],
    roads: [[-3430, -1590, -3170, -1602], [-3430, -1710, -3170, -1698],
            [-3432, -1710, -3420, -1590], [-3180, -1710, -3168, -1590]],
    towers: [
      [-3300, -1560, 160, 30, 10, 'com'],   // expo halls
      [-3400, -1750, 34, 24, 34, 'office'], // expo hotel
      [-3220, -1755, 30, 22, 28, 'office'],
    ],
    parks: [[-3380, -1730, -3300, -1780, 8]],
    lamps: [[-3420, -1596, -3180, 40], [-3420, -1704, -3180, 40]],
  },
  { // ---- Disneyland Resort — parkland terminus: the castle keep, resort
    //     hotel, Inspiration Lake greens — no slab blocks.
    id: 'DIS', hole: [-2420, -2180, -2448, -2352],
    roads: [[-2430, -2340, -2170, -2352], [-2430, -2460, -2170, -2448],
            [-2432, -2460, -2420, -2340], [-2180, -2460, -2168, -2340]],
    towers: [
      [-2300, -2530, 24, 18, 20, 'heritage'], // the castle keep
      [-2140, -2490, 44, 26, 20, 'res'],      // resort hotel
    ],
    parks: [[-2400, -2480, -2220, -2530, 10], [-2380, -2310, -2240, -2340, 8]],
    lamps: [[-2420, -2346, -2180, 40], [-2420, -2454, -2180, 40]],
  },

  // ===================== Tuen Ma Line — west arm =====================

  { // ---- Tuen Mun — the terminus town centre: V City podium, Tuen Mun
    //     Park greens and the town-centre slab rows on Tuen Mun Heung
    //     Sze Wui Rd.
    id: 'TUM', hole: [-3420, -3180, -3148, -3052],
    roads: [[-3430, -3040, -3170, -3052], [-3430, -3160, -3170, -3148],
            [-3432, -3160, -3420, -3040], [-3180, -3160, -3168, -3040]],
    towers: [
      [-3300, -2980, 90, 34, 14, 'mall'],     // V City podium north
      [-3400, -2960, 34, 24, 52, 'res'],      // town centre towers
      [-3330, -2940, 34, 24, 56, 'res'], [-3260, -2960, 30, 22, 48, 'res'],
      [-3400, -3220, 34, 24, 44, 'res'],      // south of the viaduct
      [-3240, -3230, 34, 24, 40, 'res'],
      [-3130, -3100, 60, 26, 12, 'com'],      // town hall block east
    ],
    parks: [[-3360, -3010, -3220, -2990, 10]],   // Tuen Mun Park
    lamps: [[-3420, -3046, -3180, 40], [-3420, -3154, -3180, 40]],
  },
  { // ---- Siu Hong — depot town: the depot shed yard north, Siu Hong
    //     Court slabs and Lingnan edge south.
    id: 'SIH', hole: [-3020, -2780, -3398, -3302],
    roads: [[-3030, -3290, -2770, -3302], [-3030, -3410, -2770, -3398],
            [-3032, -3410, -3020, -3290], [-2780, -3410, -2768, -3290]],
    towers: [
      [-2900, -3250, 120, 30, 8, 'com'],      // depot shed north
      [-3000, -3220, 34, 24, 40, 'res'],      // Siu Hong Court
      [-2940, -3210, 34, 24, 44, 'res'], [-2870, -3225, 30, 22, 38, 'res'],
      [-2960, -3470, 34, 24, 36, 'res'],      // Lingnan / Fu Tei edge
      [-2760, -3340, 26, 20, 30, 'office'],
    ],
    parks: [[-2840, -3240, -2800, -3280, 6]],
    lamps: [[-3020, -3296, -2780, 40], [-3020, -3404, -2780, 40]],
  },
  { // ---- Tin Shui Wai — northwest new town: Kingswood slab rows and
    //     the wetland-park edge greens.
    id: 'TIS', hole: [-2520, -2280, -3548, -3452],
    roads: [[-2530, -3440, -2270, -3452], [-2530, -3560, -2270, -3548],
            [-2532, -3560, -2520, -3440], [-2280, -3560, -2268, -3440]],
    towers: [
      [-2480, -3400, 34, 24, 40, 'res'],      // Kingswood rows north
      [-2410, -3380, 34, 24, 44, 'res'], [-2340, -3400, 34, 24, 38, 'res'],
      [-2500, -3610, 34, 24, 42, 'res'],      // Tin Yiu south
      [-2430, -3630, 34, 24, 40, 'res'], [-2360, -3610, 30, 22, 36, 'res'],
      [-2240, -3500, 44, 26, 10, 'com'],      // town-centre mall east
    ],
    parks: [[-2560, -3480, -2530, -3520, 6], [-2300, -3380, -2260, -3420, 6]],
    lamps: [[-2520, -3446, -2280, 40], [-2520, -3554, -2280, 40]],
  },
  { // ---- Long Ping — estate slabs on the Yuen Long town edge, Ping
    //     Shan heritage trail greens.
    id: 'LOP', hole: [-2120, -1880, -3348, -3252],
    roads: [[-2130, -3240, -1870, -3252], [-2130, -3360, -1870, -3348],
            [-2132, -3360, -2120, -3240], [-1880, -3360, -1868, -3240]],
    towers: [
      [-2080, -3200, 34, 24, 44, 'res'],      // Long Ping Estate
      [-2010, -3180, 34, 24, 48, 'res'], [-1940, -3200, 30, 22, 42, 'res'],
      [-2100, -3420, 34, 24, 38, 'res'],      // Wang Chau edge south
      [-1960, -3410, 34, 24, 40, 'res'],
      [-1860, -3300, 30, 22, 12, 'heritage'], // Ping Shan hall east
    ],
    parks: [[-2140, -3180, -2100, -3220, 6]],
    lamps: [[-2120, -3246, -1880, 40], [-2120, -3354, -1880, 40]],
  },
  { // ---- Yuen Long — the town centre: YOHO Mall podium and the YOHO
    //     Town slab towers over Long Yat Rd.
    id: 'YUL', hole: [-1820, -1580, -3048, -2952],
    roads: [[-1830, -2940, -1570, -2952], [-1830, -3060, -1570, -3048],
            [-1832, -3060, -1820, -2940], [-1580, -3060, -1568, -2940]],
    towers: [
      [-1700, -2900, 80, 30, 14, 'mall'],     // YOHO Mall podium
      [-1780, -2880, 34, 24, 60, 'res'],      // YOHO Town towers
      [-1700, -2860, 34, 24, 64, 'res'], [-1620, -2880, 34, 24, 58, 'res'],
      [-1800, -3110, 34, 24, 44, 'res'],      // town south
      [-1720, -3130, 34, 24, 40, 'res'], [-1560, -3100, 30, 22, 36, 'res'],
    ],
    parks: [[-1650, -3120, -1610, -3160, 6]],
    lamps: [[-1820, -2946, -1580, 40], [-1820, -3054, -1580, 40]],
  },
  { // ---- Kam Sheung Road — Kam Tin valley stop: weekend market sheds,
    //     village houses and the Pat Sin foothill greens.
    id: 'KSR', hole: [-1420, -1180, -2748, -2652],
    roads: [[-1430, -2640, -1170, -2652], [-1430, -2760, -1170, -2748],
            [-1432, -2760, -1420, -2640], [-1180, -2760, -1168, -2640]],
    towers: [
      [-1360, -2600, 50, 26, 8, 'com'],       // market sheds north
      [-1280, -2580, 24, 18, 12, 'res'],      // village houses
      [-1400, -2820, 24, 18, 12, 'res'], [-1330, -2800, 24, 18, 12, 'res'],
      [-1250, -2810, 24, 18, 14, 'res'],
    ],
    parks: [[-1440, -2590, -1400, -2630, 6], [-1160, -2790, -1120, -2830, 6]],
    lamps: [[-1420, -2646, -1180, 40], [-1420, -2754, -1180, 40]],
  },
  { // ---- Tsuen Wan West — the reclamation waterfront: Ocean Pride /
    //     Nina Tower cluster over the waterfront promenade.
    id: 'TWW', hole: [-820, -580, -2542, -2458],
    roads: [[-830, -2446, -570, -2458], [-830, -2554, -570, -2542],
            [-832, -2554, -820, -2446], [-580, -2554, -568, -2446]],
    towers: [
      [-760, -2400, 40, 26, 72, 'res'],       // Ocean Pride towers
      [-700, -2380, 40, 26, 78, 'res'], [-640, -2400, 36, 24, 66, 'res'],
      [-540, -2500, 44, 26, 88, 'office'],    // Nina Tower
      [-880, -2510, 34, 24, 50, 'res'],       // Bayview Garden west
      [-760, -2610, 34, 24, 44, 'res'],
    ],
    parks: [[-860, -2420, -840, -2460, 6], [-560, -2430, -540, -2470, 6]],
    lamps: [[-820, -2452, -580, 40], [-820, -2548, -580, 40]],
  },

  // ===================== West Kowloon trench =====================

  { // ---- Nam Cheong — West Kowloon reclamation: Cullinan slabs over
    //     V·Walk, Fu Cheong Estate rows and Nam Cheong Park.
    id: 'NAC', hole: [580, 820, -1742, -1658],
    roads: [[570, -1646, 830, -1658], [570, -1754, 830, -1742],
            [568, -1754, 580, -1646], [820, -1754, 832, -1646]],
    towers: [
      [640, -1600, 40, 26, 66, 'res'],        // Cullinan towers
      [700, -1580, 40, 26, 72, 'res'], [760, -1600, 36, 24, 62, 'res'],
      [620, -1810, 34, 24, 46, 'res'],        // Fu Cheong Estate
      [690, -1830, 34, 24, 42, 'res'], [780, -1810, 30, 22, 40, 'res'],
      [600, -1620, 70, 40, 10, 'mall'],       // V·Walk podium under the Cullinan slabs
    ],
    parks: [[560, -1780, 540, -1820, 6], [850, -1620, 880, -1660, 6]],
    lamps: [[580, -1652, 820, 40], [580, -1748, 820, 40]],
  },
  { // ---- Austin — West Kowloon edge: the Xiqu Centre curve, the
    //    express-rail terminus block and the Austin Rd slab rows.
    id: 'AUS', hole: [230, 470, -1392, -1308],
    roads: [[220, -1296, 480, -1308], [220, -1404, 480, -1392],
            [218, -1404, 230, -1296], [470, -1404, 482, -1296]],
    towers: [
      [280, -1250, 60, 30, 16, 'heritage'],   // Xiqu Centre
      [380, -1240, 80, 34, 24, 'com'],        // XRL terminus block
      [260, -1470, 34, 24, 48, 'res'],        // The Austin south
      [340, -1490, 34, 24, 52, 'res'], [430, -1470, 30, 22, 46, 'res'],
      [200, -1350, 30, 22, 40, 'office'],     // Jordan edge west
    ],
    parks: [[480, -1260, 510, -1300, 6]],
    lamps: [[230, -1302, 470, 40], [230, -1398, 470, 40]],
  },
  { // ---- East Tsim Sha Tsui — under the TST East podium: Middle Rd
    //     hotel slabs, the promenade edge, Science Museum block.
    id: 'ETS', hole: [420, 660, -1057, -973],
    roads: [[410, -961, 670, -973], [410, -1069, 670, -1057],
            [408, -1069, 420, -961], [660, -1069, 672, -961]],
    towers: [
      [470, -920, 60, 26, 34, 'com'],         // K11 Musea podium edge
      [560, -900, 44, 26, 52, 'com'],         // hotel slabs
      [630, -920, 40, 24, 44, 'com'],
      [450, -1120, 34, 24, 30, 'office'],     // Science Museum south
      [540, -1140, 40, 26, 26, 'heritage'],   // museum block
      [640, -1120, 30, 22, 38, 'com'],
    ],
    parks: [[410, -930, 430, -960, 6]],
    lamps: [[420, -967, 660, 40], [420, -1063, 660, 40]],
  },

  // ===================== Kowloon City / Kai Tak =====================

  { // ---- To Kwa Wan — old-town streets: Ma Tau Wai Rd slab rows and
    //     the market block.
    id: 'TOS', hole: [980, 1220, -1222, -1138],
    roads: [[970, -1126, 1230, -1138], [970, -1234, 1230, -1222],
            [968, -1234, 980, -1126], [1220, -1234, 1232, -1126]],
    towers: [
      [1030, -1090, 30, 22, 36, 'res'],       // Ma Tau Wai Rd rows
      [1100, -1070, 34, 24, 40, 'res'], [1180, -1090, 30, 22, 34, 'res'],
      [1010, -1280, 34, 24, 38, 'res'],       // town south
      [1090, -1300, 30, 22, 34, 'res'], [1170, -1280, 34, 24, 36, 'res'],
      [1250, -1180, 50, 30, 12, 'com'],       // market block east
    ],
    parks: [[960, -1260, 990, -1300, 6]],
    lamps: [[980, -1132, 1220, 40], [980, -1228, 1220, 40]],
  },
  { // ---- Sung Wong Toi — the garden over the Sung Wong Toi rock
    //     inscription, Kowloon City slab rows, Kai Tak edge.
    id: 'SUW', hole: [1280, 1520, -1342, -1258],
    roads: [[1270, -1246, 1530, -1258], [1270, -1354, 1530, -1342],
            [1268, -1354, 1280, -1246], [1520, -1354, 1532, -1246]],
    towers: [
      [1330, -1200, 34, 24, 38, 'res'],       // Kowloon City rows
      [1410, -1180, 30, 22, 36, 'res'], [1490, -1200, 34, 24, 40, 'res'],
      [1310, -1400, 34, 24, 34, 'res'],       // Ma Tau Chung south
      [1390, -1420, 30, 22, 32, 'res'],
      [1560, -1300, 50, 30, 20, 'com'],       // Kai Tak edge east
    ],
    parks: [[1260, -1180, 1290, -1220, 8], [1450, -1400, 1510, -1440, 8]],
    lamps: [[1280, -1252, 1520, 40], [1280, -1348, 1520, 40]],
  },
  { // ---- Kai Tak — the runway redevelopment: AIRSIDE mall slab,
    //     Sports Park dome block, new-district towers on gridded roads.
    id: 'KAT', hole: [1580, 1820, -1292, -1208],
    roads: [[1570, -1196, 1830, -1208], [1570, -1304, 1830, -1292],
            [1568, -1304, 1580, -1196], [1820, -1304, 1832, -1196]],
    towers: [
      [1650, -1150, 80, 30, 20, 'mall'],      // AIRSIDE north
      [1750, -1130, 50, 30, 26, 'com'],       // twin airside towers
      [1880, -1250, 70, 50, 10, 'com'],       // Sports Park dome east
      [1620, -1360, 34, 24, 44, 'res'],       // new district rows
      [1700, -1380, 34, 24, 48, 'res'], [1780, -1360, 30, 22, 42, 'res'],
    ],
    parks: [[1560, -1330, 1590, -1370, 8], [1850, -1330, 1880, -1370, 8]],
    lamps: [[1580, -1202, 1820, 40], [1580, -1298, 1820, 40]],
  },

  // ===================== Tai Wai saddle =====================

  { // ---- Hin Keng — estate slabs in the hill saddle between Diamond
    //     Hill and Tai Wai.
    id: 'HIK', hole: [1180, 1420, -1892, -1808],
    roads: [[1170, -1796, 1430, -1808], [1170, -1904, 1430, -1892],
            [1168, -1904, 1180, -1796], [1420, -1904, 1432, -1796]],
    towers: [
      [1240, -1750, 34, 24, 42, 'res'],       // Hin Keng Estate
      [1320, -1730, 34, 24, 46, 'res'], [1390, -1750, 30, 22, 40, 'res'],
      [1230, -1960, 34, 24, 38, 'res'],       // Hin Tin south
      [1310, -1980, 30, 22, 36, 'res'],
    ],
    parks: [[1440, -1830, 1470, -1870, 8], [1150, -1860, 1170, -1900, 6]],
    lamps: [[1180, -1802, 1420, 40], [1180, -1898, 1420, 40]],
  },

  // ===================== Ma On Shan arm =====================

  { // ---- Che Kung Temple — the temple on the Shing Mun bank, festival
    //     square and Sha Tin edge slabs.
    id: 'CKT', hole: [830, 1070, -2528, -2432],
    roads: [[820, -2420, 1080, -2432], [820, -2540, 1080, -2528],
            [818, -2540, 830, -2420], [1070, -2540, 1082, -2420]],
    towers: [
      [900, -2380, 50, 30, 14, 'heritage'],   // Che Kung Temple
      [970, -2360, 34, 24, 44, 'res'],        // Chun Shek Estate
      [1040, -2380, 30, 22, 40, 'res'],
      [880, -2590, 34, 24, 38, 'res'],        // Holford Gardens south
      [960, -2610, 30, 22, 36, 'res'],
    ],
    parks: [[800, -2380, 830, -2420, 6], [1090, -2460, 1110, -2500, 6]],
    lamps: [[830, -2426, 1070, 40], [830, -2534, 1070, 40]],
  },
  { // ---- Sha Tin Wai — estate slabs on the river bank east of Sha Tin.
    id: 'STW', hole: [1380, 1620, -2748, -2652],
    roads: [[1370, -2640, 1630, -2652], [1370, -2760, 1630, -2748],
            [1368, -2760, 1380, -2640], [1620, -2760, 1632, -2640]],
    towers: [
      [1440, -2600, 34, 24, 44, 'res'],       // Sha Tin Wai Estate
      [1520, -2580, 34, 24, 48, 'res'], [1590, -2600, 30, 22, 42, 'res'],
      [1430, -2810, 34, 24, 40, 'res'],       // Sha Kok Estate south
      [1510, -2830, 34, 24, 38, 'res'], [1580, -2810, 30, 22, 34, 'res'],
    ],
    parks: [[1350, -2590, 1380, -2630, 6]],
    lamps: [[1380, -2646, 1620, 40], [1380, -2754, 1620, 40]],
  },
  { // ---- City One — the mega-estate slab rows marching north along the
    //     river, City One Plaza podium.
    id: 'CIO', hole: [1780, 2020, -2848, -2752],
    roads: [[1770, -2740, 2030, -2752], [1770, -2860, 2030, -2848],
            [1768, -2860, 1780, -2740], [2020, -2860, 2032, -2740]],
    towers: [
      [1840, -2700, 34, 22, 46, 'res'],       // City One courts north
      [1910, -2680, 34, 22, 50, 'res'], [1980, -2700, 34, 22, 44, 'res'],
      [1830, -2910, 34, 22, 48, 'res'],       // courts south
      [1900, -2930, 34, 22, 52, 'res'], [1970, -2910, 34, 22, 46, 'res'],
      [1900, -2720, 60, 24, 12, 'mall'],      // City One Plaza north
    ],
    parks: [[2040, -2790, 2070, -2830, 6]],
    lamps: [[1780, -2746, 2020, 40], [1780, -2854, 2020, 40]],
  },
  { // ---- Shek Mun — the business fringe on the river: office slabs and
    //     industrial blocks.
    id: 'SHM', hole: [2130, 2370, -2918, -2822],
    roads: [[2120, -2810, 2380, -2822], [2120, -2930, 2380, -2918],
            [2118, -2930, 2130, -2810], [2370, -2930, 2382, -2810]],
    towers: [
      [2200, -2770, 40, 26, 40, 'office'],    // business area north
      [2280, -2750, 36, 24, 44, 'office'], [2340, -2770, 30, 22, 36, 'office'],
      [2190, -2980, 40, 26, 30, 'com'],       // industrial south
      [2270, -3000, 36, 24, 34, 'com'], [2340, -2980, 30, 22, 28, 'com'],
    ],
    parks: [[2390, -2850, 2420, -2890, 6]],
    lamps: [[2130, -2816, 2370, 40], [2130, -2924, 2370, 40]],
  },
  { // ---- Tai Shui Hang — Kam Hay Court slabs under the Ma On Shan
    //     foothill, village edge.
    id: 'TSH', hole: [2580, 2820, -2998, -2902],
    roads: [[2570, -2890, 2830, -2902], [2570, -3010, 2830, -2998],
            [2568, -3010, 2580, -2890], [2820, -3010, 2832, -2890]],
    towers: [
      [2640, -2850, 34, 24, 42, 'res'],       // Kam Hay Court
      [2720, -2830, 34, 24, 46, 'res'], [2790, -2850, 30, 22, 40, 'res'],
      [2650, -3060, 24, 18, 14, 'res'],       // village south
      [2730, -3080, 24, 18, 12, 'res'],
    ],
    parks: [[2550, -2850, 2580, -2890, 6], [2840, -2940, 2870, -2980, 6]],
    lamps: [[2580, -2896, 2820, 40], [2580, -3004, 2820, 40]],
  },
  { // ---- Heng On — the estate edge of Ma On Shan new town, town park
    //     greens east.
    id: 'HEO', hole: [2730, 2970, -3298, -3202],
    roads: [[2720, -3190, 2980, -3202], [2720, -3310, 2980, -3298],
            [2718, -3310, 2730, -3190], [2970, -3310, 2982, -3190]],
    towers: [
      [2790, -3150, 34, 24, 46, 'res'],       // Heng On Estate
      [2870, -3130, 34, 24, 50, 'res'], [2940, -3150, 30, 22, 44, 'res'],
      [2780, -3360, 34, 24, 42, 'res'],       // Yiu On south
      [2860, -3380, 34, 24, 44, 'res'], [2940, -3360, 30, 22, 40, 'res'],
    ],
    parks: [[2990, -3220, 3020, -3260, 8], [2700, -3170, 2720, -3210, 6]],
    lamps: [[2730, -3196, 2970, 40], [2730, -3304, 2970, 40]],
  },
  { // ---- Ma On Shan — town centre: MOSTown podium, the plaza slab and
    //     the estate rows along Sai Sha Rd.
    id: 'MOS', hole: [3030, 3270, -3448, -3352],
    roads: [[3020, -3340, 3280, -3352], [3020, -3460, 3280, -3448],
            [3018, -3460, 3030, -3340], [3270, -3460, 3282, -3340]],
    towers: [
      [3150, -3300, 70, 40, 14, 'mall'],      // MOSTown podium north
      [3090, -3290, 34, 24, 54, 'res'],       // Sunshine City towers
      [3160, -3270, 34, 24, 58, 'res'], [3230, -3290, 34, 24, 52, 'res'],
      [3080, -3510, 34, 24, 48, 'res'],       // Lee On south
      [3160, -3530, 34, 24, 50, 'res'], [3240, -3510, 30, 22, 44, 'res'],
    ],
    parks: [[2990, -3380, 3020, -3420, 8], [3290, -3390, 3320, -3430, 6]],
    lamps: [[3030, -3346, 3270, 40], [3030, -3454, 3270, 40]],
  },
  { // ---- Wu Kai Sha — the shore terminus: Double Cove / Lake Silver
    //     slabs, village greens, Three Fathoms Cove water east.
    id: 'WKS', hole: [3330, 3570, -3692, -3608],
    roads: [[3320, -3596, 3580, -3608], [3320, -3704, 3580, -3692],
            [3318, -3704, 3330, -3596], [3570, -3704, 3582, -3596]],
    towers: [
      [3400, -3550, 40, 26, 52, 'res'],       // Double Cove towers
      [3480, -3530, 40, 26, 56, 'res'], [3550, -3550, 36, 24, 48, 'res'],
      [3380, -3760, 24, 18, 12, 'res'],       // village south
      [3460, -3780, 24, 18, 14, 'res'],
    ],
    parks: [[3300, -3570, 3320, -3610, 6], [3590, -3640, 3620, -3680, 8]],
    lamps: [[3330, -3602, 3570, 40], [3330, -3698, 3570, 40]],
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
  ['CEN', -962, 18, -76, '大會堂 City Hall'],
  ['CEN', -932, 17, 86, '終審法院 Court of Final Appeal'],
  ['HOK', -1445, 134, -100, '國際金融中心 IFC'],
  ['HOK', -1400, 28, -104, '摩天輪 Observation Wheel'],
  ['HOK', -1470, 162, -890, '環球貿易廣場 ICC'],
  ['SHW', -2108, 50, -74, '信德中心 Shun Tak Centre'],
  ['SHW', -2104, 16, 56, '西港城 Western Market'],
  ['SHW', -2090, 14, -118, '港澳碼頭 Macau Ferry'],
  ['SYP', -2927, 16, -82, '中山紀念公園 Sun Yat Sen Park'],
  ['HKU', -3622, 60, 82, '寶翠園 The Belcher\'s'],
  ['HKU', -3560, 34, 118, '香港大學 HKU'],
  ['KET', -4323, 64, -82, '泓都 The Merton'],
  ['WAC', 905, 104, -64, '中環廣場 Central Plaza'],
  ['WAC', 795, 68, 66, '合和中心 Hopewell Centre'],
  ['CAB', 1612, 58, 60, '時代廣場 Times Square'],
  ['CAB', 1755, 28, -60, '崇光百貨 SOGO'],
  ['TIH', 2400, 26, 92, '中央圖書館 Central Library'],
  ['FOH', 2810, 52, -66, '友邦廣場 AIA Tower'],
  ['NOP', 3620, 68, -88, '港匯東 Harbourfront Landmark'],
  ['NOP', 3540, 8, -128, '北角碼頭 North Point Ferry'],
  ['QUB', 4150, 64, 62, '太古坊 Taikoo Place'],
  ['TAK', 4730, 76, -76, '港島東中心 One Island East'],
  ['TAK', 4770, 14, -62, '太古城中心 Cityplaza'],
  ['SKW', 6080, 10, -93, '海防博物館 Coastal Defence Museum'],
  ['HFC', 6520, 12, 62, '杏花新城 Paradise Mall'],
  ['HFC', 6760, 16, -20, '港鐵柴灣車廠 Chai Wan Depot'],
  ['HFC', 6590, 40, 86, '杏花邨 Heng Fa Chuen'],
  ['CHW', 7322, 68, 62, '青年廣場 Youth Square'],
  ['CHW', 7310, 50, -66, '新翠花園 New Jade Gardens'],
  ['CHW', 7410, 10, 57, '柴灣公共運輸交匯處 Chai Wan PTI'],
  ['CAB', 1665, 66, 60, '希慎廣場 Hysan Place'],
  ['CAB', 1880, 12, -65, '維多利亞公園 Victoria Park'],
  ['TST', 311, 14, -780, '尖沙咀天星碼頭 Star Ferry Pier'],
  ['TST', 452, 20, -842, '尖沙咀鐘樓 Clock Tower'],
  ['TST', 560, 44, -838, '半島酒店 The Peninsula'],
  ['TST', 30, 46, -846, '海港城 Harbour City'],
  ['TST', 150, 56, -960, 'iSQUARE'],
  ['TST', 120, 10, -1000, '九龍公園 Kowloon Park'],
  ['TST', 0, 80, -1480, '獅子山 Lion Rock'],
  ['JOR', 150, 30, -985, '裕華國貨 Yue Hwa Emporium'],
  ['JOR', 480, 44, -990, '伊敦酒店 Eaton Hotel'],
  ['JOR', 505, 40, -1020, '恒豐中心 Prudential Centre'],
  ['JOR', 560, 18, -1000, '拔萃女書院 Diocesan Girls\''],
  ['JOR', 640, 30, -1030, '伊利沙伯醫院 Queen Elizabeth Hosp.'],
  ['YMT', 120, 10, -1140, '廟街夜市 Temple Street'],
  ['YMT', 140, 24, -1100, '油麻地戲院 Yau Ma Tei Theatre'],
  ['YMT', 100, 16, -1180, '果欄 Fruit Market'],
  ['YMT', 470, 40, -1100, '維景酒店 Metropark Hotel'],
  ['YMT', 520, 30, -1130, '廣華醫院 Kwong Wah Hospital'],
  ['YMT', 610, 22, -1150, '京士柏 King\'s Park'],
  ['MOK', 140, 62, -1220, '朗豪坊 Langham Place'],
  ['MOK', 530, 34, -1260, '新世紀廣場 MOKO'],
  ['MOK', 470, 14, -1268, '女人街 Ladies\' Market'],
  ['MOK', 760, 30, -1260, '旺角東站 Mong Kok East'],
  ['PRE', 125, 18, -1378, '旺角大球場 Mong Kok Stadium'],
  ['PRE', 100, 10, -1445, '花墟・雀鳥花園 Flower Market'],
  ['PRE', 500, 40, -1340, '金都商場 Golden Plaza'],
  ['SSP', 510, 34, -1455, '黃金電腦商場 Golden Computer Arcade'],
  ['SSP', 520, 44, -1510, '西九龍中心 Dragon Centre'],
  ['SSP', 300, 8, -1480, '鴨寮街 Apliu Street'],
  ['CSW', 110, 28, -1620, '元州邨 Un Chau Estate'],
  ['CSW', 520, 42, -1660, '億京廣場 Billion Plaza'],
  ['CSW', 300, 8, -1600, '長沙灣道 Cheung Sha Wan Road'],
  ['LCK', 140, 26, -1784, '昇悅居 Liberte'],
  ['LCK', 530, 34, -1740, 'D2 Place'],
  ['LCK', 120, 10, -1740, '深水埗運動場 SSP Sports Ground'],
  ['MEF', 170, 10, -1975, '荔枝角公園 Lai Chi Kok Park'],
  ['MEF', -10, 36, -1740, '美孚新邨 Mei Foo Sun Chuen'],
  ['MEF', 265, 20, -1762, '美孚廣場 Mount Sterling Mall'],
  ['MEF', -140, 30, -1828, '清麗苑 Ching Lai Court'],
  ['MEF', 270, 8, -1890, '荔景山路 Lai King Hill Road'],
  ['LAK', 520, 40, -1995, '荔景邨 Lai King Estate'],
  ['LAK', 140, 34, -2030, '賢麗苑 Yin Lai Court'],
  ['LAK', 60, 12, -1920, '葵青貨櫃碼頭 Kwai Chung Container Terminals'],
  ['LAK', 66, 26, -2200, '荔景山 Lai King Hill'],
  ['KWF', 492, 70, -2090, '新都會廣場 Metroplaza'],
  ['KWF', 130, 36, -2140, '葵芳邨 Kwai Fong Estate'],
  ['KWF', 500, 30, -2030, '葵涌廣場 Kwai Chung Plaza'],
  ['KWF', 290, 8, -2017, '葵芳道 Kwai Fong Road'],
  ['KWH', 512, 58, -2230, '九龍貿易中心 Kowloon Commerce Centre'],
  ['KWH', 140, 34, -2250, '葵興邨 Kwai Hing Estate'],
  ['KWH', 140, 28, -2190, '新葵興花園 Sun Kwai Hing Gardens'],
  ['KWH', 330, 8, -2145, '葵興路 Kwai Hing Road'],
  ['TWH', 140, 34, -2350, '大窩口邨 Tai Wo Hau Estate'],
  ['TWH', 130, 30, -2440, '葵賢苑 Kwai Yin Court'],
  ['TWH', 300, 14, -2380, '國瑞路公園 Kwok Shui Rd Park'],
  ['TWH', 540, 16, -2340, '關門口村 Kwan Mun Hau Tsuen'],
  ['TWH', 481, 8, -2280, '青山公路 Castle Peak Road'],
  ['KOW', -1640, 26, -952, '圓方 Elements'],
  ['KOW', -1730, 36, -1090, '西九文化區 WKCD'],
  ['OLY', -1000, 40, -1352, '奧海城 Olympian City'],
  ['OLY', -608, 50, -1354, '滙豐中心 HSBC Centre'],
  ['OCP', 805, 26, 388, '海洋公園 Ocean Park'],
  ['OCP', 942, 36, 460, '海洋公園萬豪酒店 Marriott'],
  ['WCH', 745, 18, 588, '南港島綫車廠 SIL Depot'],
  ['WCH', 560, 46, 500, '黃竹坑工業區 Wong Chuk Hang'],
  ['LET', 230, 52, 552, '利東邨 Lei Tung Estate'],
  ['LET', 62, 36, 470, '鴨脷洲大街 Ap Lei Chau Main St'],
  ['SOH', -80, 52, 570, '海怡半島 South Horizons'],
  ['EXC', 1010, 20, -80, '香港會展中心 HKCEC'],
  ['EXC', 614, 58, 36, '君悅酒店 Grand Hyatt'],
  ['HUH', 880, 22, -1070, '香港體育館 HK Coliseum'],
  ['HUH', 960, 38, -1000, '都會海逸 Metropolis'],
  ['MKE', 892, 50, -1296, '帝京酒店 Royal Plaza'],
  ['KOT', 445, 22, -1470, '又一城 Festival Walk'],
  ['KOT', 775, 36, -1478, '城市大學 City U'],
  ['TAW', 700, 58, -2235, '名城 Festival City'],
  ['TAW', 870, 16, -2070, '車公廟 Che Kung Temple'],
  ['TAW', 883, 6, -2260, '城門河 Shing Mun River'],
  ['SKM', 950, 46, -1320, '石硤尾邨 Shek Kip Mei Est'],
  ['LOF', 1160, 14, -1355, '樂富廣場 Lok Fu Plaza'],
  ['WTS', 1470, 12, -1535, '黃大仙祠 Wong Tai Sin Temple'],
  ['DIH', 1740, 16, -1350, '荷里活廣場 Plaza Hollywood'],
  ['DIH', 1890, 14, -1540, '志蓮淨苑 Chi Lin Nunnery'],
  ['CHH', 2160, 34, -1518, '彩虹邨 Choi Hung Estate'],
  ['KOB', 2390, 42, -1550, '德福花園 Telford Gardens'],
  ['KOB', 2380, 12, -1790, '九龍灣車廠 Kowloon Bay Depot'],
  ['NTK', 2720, 60, -1860, '創紀之城 Millennium City'],
  ['KWT', 2900, 18, -1690, 'apm・裕民坊 Yue Man Sq'],
  ['LAT', 3230, 42, -1760, '藍田邨 Lam Tin Estate'],
  ['YAT', 3490, 46, -1850, '油塘邨 Yau Tong Estate'],
  ['TKL', 3750, 52, -1920, '都會駅 Metro Town'],
  ['HOM', 530, 44, -1240, '愛民邨 Oi Man Estate'],
  ['WHA', 840, 14, -870, '黃埔號 The Whampoa'],
  ['WHA', 615, 40, -980, '黃埔花園 Whampoa Garden'],
  ['TSW', 140, 34, -2490, '綠楊新邨 Luk Yeung Sun Chuen'],
  ['TSW', 520, 50, -2420, '南豐中心 Nan Fung Centre'],
  ['TSW', 560, 46, -2450, '悅來酒店 Panda Hotel'],
  ['TSW', 60, 96, -2510, '如心廣場 Nina Tower'],
  ['TSW', 300, 16, -2530, '愉景新城 Discovery Park'],
  ['TSW', 330, 8, -2385, '大河道 Tai Ho Road'],
  ['TKW', 4300, 52, -2085, '將軍澳中心 Park Central'],
  ['TKW', 4140, 16, -2180, 'PopCorn'],
  ['HAH', 4700, 46, -2185, '東港城 East Point City'],
  ['HAH', 4700, 44, -2390, '厚德邨 Hau Tak Estate'],
  ['POL', 5080, 48, -2285, '新都城 Metro City'],
  ['POL', 5070, 42, -2480, '寶林邨 Po Lam Estate'],
  ['LHP', 4520, 56, -2465, '日出康城 LOHAS Park'],
  ['LHP', 4700, 14, -2560, '將軍澳車廠 TKO Depot'],
  ['SHS', 930, 18, -2760, '新城市廣場 New Town Plaza'],
  ['SHS', 1350, 8, -2740, '城門河 Shing Mun River'],
  ['FOT', 1500, 12, -2940, '何東樓車廠 Ho Tung Lau Depot'],
  ['UNI', 1950, 30, -2825, '中文大學 CUHK'],
  ['UNI', 2200, 8, -2980, '吐露港 Tolo Harbour'],
  ['TPM', 2290, 16, -3000, '大埔超級城 Tai Po Mega Mall'],
  ['TAO', 2640, 14, -3080, '太和廣場 Tai Wo Plaza'],
  ['FAN', 2990, 14, -3140, '花都廣場 Flora Plaza'],
  ['SHU', 3360, 14, -3200, '上水廣場 Landmark North'],
  ['LOW', 3920, 12, -3180, '羅湖管制站 Lo Wu Control Point'],
  ['LMC', 3520, 12, -3420, '落馬洲管制站 Lok Ma Chau'],
  ['LMC', 3710, 6, -3650, '落馬洲濕地 Wetlands'],
  ['TSY', -1900, 16, -1300, '青衣城 Maritime Square'],
  ['SUN', -2200, 8, -1830, '欣澳海灣 Sunny Bay'],
  ['TUC', -3000, 18, -2200, '東薈城 Citygate Outlets'],
  ['TUC', -3150, 12, -2300, '昂坪360 Ngong Ping 360'],
  ['AIR', -2800, 20, -1400, '香港國際機場 HKIA Terminal 1'],
  ['AWE', -3300, 12, -1560, '亞洲國際博覽館 AsiaWorld-Expo'],
  ['DIS', -2300, 22, -2530, '迪士尼樂園 Disneyland'],
  ['DIS', -2260, 8, -2490, '迪欣湖 Inspiration Lake'],
  ['TUM', -3300, 16, -2980, 'V City・屯門市中心'],
  ['SIH', -2900, 10, -3250, '屯門車廠 MTR Depot'],
  ['TIS', -2260, 12, -3500, '天水圍市中心 Tin Shui Wai'],
  ['TIS', -2560, 8, -3500, '濕地公園 Wetland Park'],
  ['LOP', -1860, 14, -3300, '屏山文物徑 Ping Shan'],
  ['YUL', -1700, 16, -2900, 'YOHO Mall・元朗市中心'],
  ['KSR', -1360, 10, -2600, '錦田市集 Kam Tin Market'],
  ['TWW', -540, 90, -2500, '如心廣場 Nina Tower'],
  ['TWW', -700, 80, -2380, '海之戀 Ocean Pride'],
  ['NAC', 700, 14, -1700, '匯璽・V Walk Cullinan'],
  ['AUS', 280, 18, -1250, '戲曲中心 Xiqu Centre'],
  ['AUS', 380, 26, -1240, '高鐵西九龍 West Kowloon Stn'],
  ['ETS', 470, 36, -920, 'K11 MUSEA・星光大道'],
  ['ETS', 540, 28, -1140, '科學館 Science Museum'],
  ['TOS', 1250, 14, -1180, '土瓜灣街市 To Kwa Wan Market'],
  ['SUW', 1280, 10, -1200, '宋皇臺公園 Sung Wong Toi'],
  ['KAT', 1650, 22, -1150, 'AIRSIDE・啟德'],
  ['KAT', 1880, 12, -1250, '啟德體育園 Sports Park'],
  ['HIK', 1320, 46, -1730, '顯徑邨 Hin Keng Estate'],
  ['CKT', 900, 16, -2380, '車公廟 Che Kung Temple'],
  ['CIO', 1900, 14, -2800, '第一城 City One Shatin'],
  ['SHM', 2280, 44, -2750, '石門商貿區 Shek Mun'],
  ['MOS', 3150, 16, -3400, '新港城 MOSTown'],
  ['WKS', 3480, 58, -3530, '迎海 Double Cove'],
  ['WKS', 3420, 10, -3760, '烏溪沙村 Wu Kai Sha Village'],
];

export function buildCity() {
  const group = new THREE.Group();
  const labels = [];
  const groundUid = id => LEVELS.find(l => l.station === id && (l.type === 'ground' || l.type === 'checkin'))?.uid;

  // towers must clear EVERY site's dig, not just their own district's —
  // a neighbour's footprint can reach into this hole (STW slabs over FOT)
  const holes = SITES.map(s => s.hole);
  const clearAll = r => holes.every(([hx0, hx1, hz0, hz1]) =>
    r.x1 < hx0 - 2 || r.x0 > hx1 + 2 || r.z1 < hz0 - 2 || r.z0 > hz1 + 2);
  for (const s of SITES) {
    for (const [x, z, w, d, h, kind] of s.towers || []) {
      const r = { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 };
      if (!clearAll(r)) { console.warn(`city: ${s.id} tower at ${x},${z} overlaps the dig — skipped`); continue; }
      tower(x, z, w, d, h, kind);
    }
    for (const [x, z, r, h, kind] of s.cyls || []) {
      const rr = { x0: x - r, x1: x + r, z0: z - r, z1: z + r };
      if (!clearAll(rr)) { console.warn(`city: ${s.id} cyl at ${x},${z} overlaps the dig — skipped`); continue; }
      cyl(x, z, r, h, kind);
    }
    for (const [x0, z0, x1, z1] of s.roads || []) road(x0, z0, x1, z1);
    for (const [x0, z0, x1, z1, n] of s.parks || []) park(x0, z0, x1, z1, n);
    for (const [x0, z, x1, step] of s.lamps || []) lampRow(x0, z, x1, step);
    for (const [x0, z0, x1, z1] of s.quays || []) block((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.35, QUAY_M, false);
    for (const [x0, z0, x1, z1] of s.piers || []) block((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 1.0, QUAY_M, false);
    for (const [x0, z0, x1, z1] of s.water || []) {
      const w = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
      w.rotateX(-Math.PI / 2);
      put(w, WATER_M, (x0 + x1) / 2, 0.03, (z0 + z1) / 2);
    }
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

  // ---- the harbour: a strait between the island shore (-95) and the
  // Kowloon shore (-800). Quay walls + promenades line both sides; the
  // strip spans every site hole so the waterline keeps running as
  // stations extend west/east.
  const SHORE = -95, KSHORE = -800;
  const seaX0 = Math.min(...SITES.map(s => s.hole[0])) - 450;
  const seaX1 = Math.max(...SITES.map(s => s.hole[1])) + 350;
  const seaW = seaX1 - seaX0, seaCx = (seaX0 + seaX1) / 2;
  const sea = new THREE.PlaneGeometry(seaW, SHORE - KSHORE);
  sea.rotateX(-Math.PI / 2);
  put(sea, WATER_M, seaCx, 0.03, (SHORE + KSHORE) / 2);
  block(seaCx, SHORE + 0.6, seaW, 1.2, 1.4, QUAY_M, false);          // island seawall
  block(seaCx, SHORE + 4, seaW, 7, 0.1, QUAY_M, false);              // island promenade
  block(seaCx, KSHORE - 0.6, seaW, 1.2, 1.4, QUAY_M, false);         // Kowloon seawall
  block(seaCx, KSHORE - 4.5, seaW, 8, 0.1, QUAY_M, false);           // Avenue of Stars
  // typhoon-shelter breakwater arm off Causeway Bay
  block(1855, -102, 90, 4, 1.6, QUAY_M, false);
  block(1732, -115, 4, 30, 1.6, QUAY_M, false);
  // boats — tiny hulls + cabins scattered on the shelter + off the piers
  for (const [bx, bz] of [[1800, -115], [1840, -122], [1885, -112], [1870, -135], [-1420, -128], [-1520, -130], [1010, -105],
                          [280, -420], [640, -350], [-200, -560]]) {
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
