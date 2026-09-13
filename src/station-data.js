// Admiralty Station schematic data, based on the official MTR layout diagram.
// Units = metres. X = platform axis (east +X), Y = up, Z = lateral (south +Z).

export const FLOOR_H = 7;      // floor-to-floor height
export const SLAB_T = 1.0;     // structural slab thickness
export const WALL_T = 0.5;     // perimeter wall thickness
export const TRACK_DROP = 0.95; // track trough depth below platform floor
export const GAUGE = 1.9;      // rail separation (visual)
export const BED_HALF = 2.5;   // half-width of track trough

export const LINES = {
  TWL: { zh: '荃灣綫',   en: 'Tsuen Wan Line',    color: '#E2231A' },
  ISL: { zh: '港島綫',   en: 'Island Line',       color: '#0071CE' },
  EAL: { zh: '東鐵綫',   en: 'East Rail Line',    color: '#53B7E8' },
  SIL: { zh: '南港島綫', en: 'South Island Line', color: '#B5BD00' },
};

// Footprints. `len` runs along local X, `wid` along local Z, `rot` about Y.
export const BOXES = {
  main:  { cx: 0,  cz: 0,  len: 160, wid: 26, rot: 0 },     // L2 / L3 platform box
  conc:  { cx: 0,  cz: 0,  len: 170, wid: 42, rot: 0 },     // L1 concourse (sprawls wider)
  site:  { cx: 0,  cz: 4,  len: 196, wid: 76, rot: 0 },     // G ground slab
  lobby: { cx: 40, cz: 20, len: 110, wid: 34, rot: 0 },     // L4 transfer lobby
  ext:   { cx: 15, cz: 33, len: 150, wid: 26, rot: -0.30 }, // L5 / L6 expansion box
};

export const LEVELS = [
  { id: 'U1', y: 8,   box: null,    zh: '行人天橋', en: 'Footbridge',        type: 'bridge'   },
  { id: 'G',  y: 0,   box: 'site',  zh: '地面',     en: 'Ground',            type: 'ground'   },
  { id: 'L1', y: -7,  box: 'conc',  zh: '大堂',     en: 'Concourse',         type: 'concourse'},
  { id: 'L2', y: -14, box: 'main',  zh: '月台・港島綫/荃灣綫', en: 'Platforms – Island / Tsuen Wan Line', type: 'platform' },
  { id: 'L3', y: -21, box: 'main',  zh: '月台・荃灣綫/港島綫', en: 'Platforms – Tsuen Wan / Island Line', type: 'platform' },
  { id: 'L4', y: -28, box: 'lobby', zh: '轉車大堂', en: 'Transfer Lobby',    type: 'lobby'    },
  { id: 'L5', y: -35, box: 'ext',   zh: '月台・東鐵綫', en: 'Platforms – East Rail Line',   type: 'platform' },
  { id: 'L6', y: -42, box: 'ext',   zh: '月台・南港島綫', en: 'Platforms – South Island Line', type: 'platform' },
];

// Island platform half-width / track centre offsets (local Z).
export const ISLAND_HALF = 5.6;
export const TRACK_Z = 8.6;       // island level: track centres at ±TRACK_Z
export const SIDE_Z = 8.4;        // side-platform level: inner edge
export const SIDE_TRACK_Z = 4.4;  // side-platform level: track centres

// Platform faces per level. side -1 = north (−Z), +1 = south (+Z).
export const PLATFORMS = {
  L2: {
    kind: 'island',
    faces: [
      { num: 3, line: 'ISL', side: -1, dir: 1,  to: { zh: '往柴灣',     en: 'to Chai Wan' } },
      { num: 4, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環',     en: 'to Central' } },
    ],
  },
  L3: {
    kind: 'island',
    faces: [
      { num: 1, line: 'TWL', side: -1, dir: -1, to: { zh: '往荃灣',     en: 'to Tsuen Wan' } },
      { num: 2, line: 'ISL', side: 1,  dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
    ],
  },
  L5: {
    kind: 'island', terminus: true,
    faces: [
      { num: 7, line: 'EAL', side: -1, dir: 1, to: { zh: '往羅湖',   en: 'to Lo Wu' } },
      { num: 8, line: 'EAL', side: 1,  dir: 1, to: { zh: '往落馬洲', en: 'to Lok Ma Chau' } },
    ],
  },
  L6: {
    kind: 'side',
    faces: [
      { num: 5, line: 'SIL', side: -1, dir: 1, to: { zh: '往海怡半島', en: 'to South Horizons' } },
      { num: 6, line: 'SIL', side: 1,  dir: 1, to: { zh: '往海怡半島', en: 'to South Horizons' } },
    ],
  },
};

// Escalator banks. `frame` = coordinate frame the (cx,cz,dir) are expressed in;
// 'main'-framed entries are plain world axes, 'ext' entries use the rotated box.
// dir = direction of descent in plan. n = escalators per bank.
export const ESCALATORS = [
  // L1 concourse -> L2 platforms
  { from: 'L1', to: 'L2', frame: 'main', cx: -45, cz: 0, dir: [-1, 0], n: 2 },
  { from: 'L1', to: 'L2', frame: 'main', cx:   0, cz: 0, dir: [ 1, 0], n: 3 },
  { from: 'L1', to: 'L2', frame: 'main', cx:  45, cz: 0, dir: [-1, 0], n: 2 },
  // L2 -> L3 (cross-platform interchange is by escalator, not stairs across)
  { from: 'L2', to: 'L3', frame: 'main', cx: -58, cz: 0, dir: [ 1, 0], n: 2 },
  { from: 'L2', to: 'L3', frame: 'main', cx: -20, cz: 0, dir: [-1, 0], n: 2 },
  { from: 'L2', to: 'L3', frame: 'main', cx:  20, cz: 0, dir: [ 1, 0], n: 2 },
  { from: 'L2', to: 'L3', frame: 'main', cx:  58, cz: 0, dir: [-1, 0], n: 2 },
  // L3 -> L4 transfer lobby (east end, descending into the expansion)
  { from: 'L3', to: 'L4', frame: 'main', cx: 70, cz: 6,  dir: [ 1, 0], n: 3 },
  { from: 'L3', to: 'L4', frame: 'main', cx: 58, cz: 11, dir: [ 1, 0], n: 2 },
  // L4 -> L5 East Rail platforms
  { from: 'L4', to: 'L5', frame: 'ext',  cx: 34, cz: -4, dir: [ 0, 1], n: 3 },
  { from: 'L4', to: 'L5', frame: 'ext',  cx: -28, cz: -4, dir: [0, 1], n: 2 },
  // L5 -> L6 South Island side platforms (drift outward off the island onto each side)
  { from: 'L5', to: 'L6', frame: 'ext',  cx: -18, cz: -6.5, dir: [ 1, -0.32], n: 2 },
  { from: 'L5', to: 'L6', frame: 'ext',  cx:  30, cz:  6.5, dir: [-1,  0.32], n: 2 },
];

// Station exits: stair shafts from G down to L1. side = -1 north / +1 south.
// Names per the official MTR Admiralty station layout / street map.
export const EXITS = [
  { id: 'A',  x: -62, side: -1, zh: '海富中心',          en: 'Admiralty Centre' },
  { id: 'B',  x: -40, side: 1,  zh: '德立街・力寶中心',  en: 'Drake St · Lippo Centre' },
  { id: 'C1', x: -8,  side: -1, zh: '金鐘廊',            en: 'Queensway Plaza' },
  { id: 'C2', x: 16,  side: -1, zh: '的士站',            en: 'Taxi Stand' },
  { id: 'D',  x: -80, side: -1, zh: '統一中心',          en: 'United Centre' },
  { id: 'E1', x: 45,  side: 1,  zh: '樂禮街',            en: 'Rodney Street' },
  { id: 'E2', x: 58,  side: 1,  zh: '中信大廈',          en: 'CITIC Tower' },
  { id: 'F',  x: 66,  side: -1, zh: '太古廣場',          en: 'Pacific Place' },
];
export const EXIT_Z = 12.7;   // run centre offset from centreline (lands inside 42-wide concourse)

// Glazed lift shafts. frame + local coords; serves levels `from`..`to`.
export const LIFTS = [
  { frame: 'main', x: 12, z: -8.8, levels: ['L1', 'L2', 'L3'] },
  { frame: 'ext',  x: 55, z: -8.5, levels: ['L4', 'L5', 'L6'] },
];

// U1 footbridge deck: a main spine + branch stubs + towers down to G.
export const BRIDGE = {
  y: 8,
  spine: { x0: -72, x1: 74, z0: -40, z1: -33 },   // main deck rect
  connector: { x0: -30, x1: 60, z0: -33, z1: -20 }, // deck reaching back toward the concourse roof
  towers: [-58, -6, 62],                            // stair/lift towers to ground (x positions at spine)
  buildings: [                                      // neighbours the bridge plugs into
    { x0: -78, x1: -62, z0: -62, z1: -44, h: 26, name: 'Admiralty Centre' },
    { x0: -16, x1:   4, z0: -64, z1: -44, h: 32, name: 'Queensway Plaza' },
    { x0:  58, x1:  76, z0: -62, z1: -44, h: 38, name: 'Government Offices' },
  ],
};

export const LIFT_SIZE = { w: 3.4, d: 3.4 };
export const ESC = { runLen: 12.6, width: 1.15, gap: 0.55 }; // per-escalator width + gap

// Octopus gate lanes on the concourse paid/unpaid boundary (z = ±9.4)
export const GATE_ROWS = [
  { z: -9.4, x0: -52, x1: -10 },
  { z: -9.4, x0: 10, x1: 52 },
  { z: 9.4, x0: -52, x1: -10 },
  { z: 9.4, x0: 10, x1: 52 },
];
export const GATE_PITCH = 2.4;

// Concourse shops & restaurants (along both walls + a kiosk row)
export const SHOP_NAMES = [
  { zh: '便利店', en: '7-Eleven', color: '#e8722a' },
  { zh: '茶餐廳', en: 'Cha Chaan Teng', color: '#3f7d54' },
  { zh: '西餅店', en: 'Bakery', color: '#b3543f' },
  { zh: '咖啡店', en: 'Coffee Shop', color: '#6b4a8a' },
  { zh: '藥房', en: 'Pharmacy', color: '#3f6db3' },
  { zh: '快餐店', en: 'Fast Food', color: '#c7a23a' },
  { zh: '書店', en: 'Bookstore', color: '#8a4a6e' },
  { zh: '銀行', en: 'Bank', color: '#a03030' },
];

// Dedicated F&B tenants on the south shop row + the MTR mall entrance on the
// north row (between exits C1/C2, like the real Queensway Plaza link).
// x = left edge of the unit on the shop-row grid (pitch 11.5 from x0).
export const RESTAURANTS = [
  { x: -31,  side: 1, zh: '麥當勞',   en: "McDonald's",        color: '#da291c', mark: 'arches'  },
  { x: 3.5,  side: 1, zh: '元気寿司', en: 'Genki Sushi',       color: '#c8102e', mark: 'sushi'   },
  { x: 26.5, side: 1, zh: '點心酒樓', en: 'Dim Sum Restaurant', color: '#7a5b16', mark: 'steamer' },
];
export const MALL = { x: 2.5, side: -1, zh: '港鐵商場', en: 'MTR Malls', mark: 'mtr' };

// Trains per line: compressed headways (sec), dwell, car count
export const TRAIN_SPEC = {
  TWL: { headway: 46, dwell: 13, cars: 8, carLen: 18.5 },
  ISL: { headway: 46, dwell: 13, cars: 8, carLen: 18.5 },
  EAL: { headway: 75, dwell: 18, cars: 6, carLen: 19.5 },
  SIL: { headway: 62, dwell: 15, cars: 3, carLen: 19.5 },
};

// Where passengers may wander, per level, in that level's LOCAL frame.
export const WALK_RECTS = {
  L1: [{ x0: -80, z0: -19, x1: 80, z1: 19 }],
  L2: [{ x0: -74, z0: -4.9, x1: 74, z1: 4.9 }],
  L3: [{ x0: -74, z0: -4.9, x1: 74, z1: 4.9 }],
  L4: [{ x0: -10, z0: 5, x1: 88, z1: 35 }],   // lobby is unrotated → local = world
  L5: [{ x0: -70, z0: -4.9, x1: 70, z1: 4.9 }],
  L6: [{ x0: -68, z0: -12.6, x1: 68, z1: -7.4 }, { x0: -68, z0: 7.4, x1: 68, z1: 12.6 }],
};

// ---- helpers ---------------------------------------------------------------

const D2R = Math.PI / 180;

// local (x,z) in a box frame -> world (x,z)
export function boxToWorld(box, x, z) {
  const c = Math.cos(box.rot), s = Math.sin(box.rot);
  return { x: box.cx + x * c + z * s, z: box.cz - x * s + z * c };
}
// world (x,z) -> local coords of a box frame
export function worldToBox(box, x, z) {
  const c = Math.cos(box.rot), s = Math.sin(box.rot);
  const dx = x - box.cx, dz = z - box.cz;
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}

export function levelById(id) { return LEVELS.find(l => l.id === id); }

// World-space endpoints of one escalator bank -> array of runs (one per unit).
export function escalatorRuns(e) {
  const box = e.frame === 'ext' ? BOXES.ext : { cx: 0, cz: 0, rot: 0 };
  const yTop = levelById(e.from).y, yBot = levelById(e.to).y;
  const dirLen = Math.hypot(e.dir[0], e.dir[1]);
  const d = [e.dir[0] / dirLen, e.dir[1] / dirLen];
  const half = ESC.runLen / 2;
  const runs = [];
  const total = e.n * ESC.width + (e.n - 1) * ESC.gap;
  for (let i = 0; i < e.n; i++) {
    const off = -total / 2 + ESC.width / 2 + i * (ESC.width + ESC.gap);
    // perpendicular offset in the frame's local axes
    const cx = e.cx + (-d[1]) * off, cz = e.cz + d[0] * off;
    const a = boxToWorld(box, cx - d[0] * half, cz - d[1] * half);
    const b = boxToWorld(box, cx + d[0] * half, cz + d[1] * half);
    runs.push({
      x1: a.x, z1: a.z, y1: yTop,
      x2: b.x, z2: b.z, y2: yBot,
      w: ESC.width, from: e.from, to: e.to,
      going: i % 2 === 0 ? 'down' : 'up',
    });
  }
  return runs;
}

export function liftWorldRect(l) {
  const box = l.frame === 'ext' ? BOXES.ext : { cx: 0, cz: 0, rot: 0 };
  const p = boxToWorld(box, l.x, l.z);
  return { x: p.x, z: p.z };
}
