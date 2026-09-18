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
  ['TSW', 140, 34, -2490, '綠楊新邨 Luk Yeung Sun Chuen'],
  ['TSW', 520, 50, -2420, '南豐中心 Nan Fung Centre'],
  ['TSW', 560, 46, -2450, '悅來酒店 Panda Hotel'],
  ['TSW', 60, 96, -2510, '如心廣場 Nina Tower'],
  ['TSW', 300, 16, -2530, '愉景新城 Discovery Park'],
  ['TSW', 330, 8, -2385, '大河道 Tai Ho Road'],
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
