// Station registry — merges per-station modules into the global view the
// builders consume. Add a new MTR station by creating a module under
// src/stations/ (same shape as admiralty.js) and registering it in STATIONS.
import { ADM } from './stations/admiralty.js';
import { CEN } from './stations/central.js';
import { HOK } from './stations/hongkong.js';
import { WAC } from './stations/wanchai.js';
import { CAB } from './stations/causewaybay.js';
import { SHW } from './stations/sheungwan.js';
import { SYP } from './stations/saiyingpun.js';
import { HKU } from './stations/hku.js';
import { KET } from './stations/kennedytown.js';
import { TIH } from './stations/tinhau.js';
import { FOH } from './stations/fortresshill.js';
import { NOP } from './stations/northpoint.js';
import { QUB } from './stations/quarrybay.js';
import { TAK } from './stations/taikoo.js';
import { SWH } from './stations/saiwanho.js';
import { SKW } from './stations/shaukeiwan.js';
import { HFC } from './stations/hengfachuen.js';
import { CHW } from './stations/chaiwan.js';
import { TST } from './stations/tsimshatsui.js';
import { JOR } from './stations/jordan.js';
import { YMT } from './stations/yaumatei.js';
import { MOK } from './stations/mongkok.js';
import { PRE } from './stations/princeedward.js';
import { SSP } from './stations/shamshuipo.js';
import { CSW } from './stations/cheungshawan.js';
import { LCK } from './stations/laichikok.js';
import { MEF } from './stations/meifoo.js';
import { LAK } from './stations/laiking.js';
import { KWF } from './stations/kwaifong.js';
import { KWH } from './stations/kwaihing.js';
import { TWH } from './stations/taiwohau.js';
import { TSW } from './stations/tsuenwan.js';
import { KOW } from './stations/kowloon.js';
import { OLY } from './stations/olympic.js';
import { OCP } from './stations/oceanpark.js';
import { WCH } from './stations/wongchukhang.js';
import { LET } from './stations/leitung.js';
import { SOH } from './stations/southhorizons.js';
import { EXC } from './stations/exhibitioncentre.js';
import { HUH } from './stations/hunghom.js';
import { MKE } from './stations/mongkokeast.js';
import { KOT } from './stations/kowloontong.js';
import { TAW } from './stations/taiwai.js';

export const STATIONS = { ADM, CEN, HOK, WAC, CAB, SHW, SYP, HKU, KET, TIH, FOH, NOP, QUB, TAK, SWH, SKW, HFC, CHW, TST, JOR, YMT, MOK, PRE, SSP, CSW, LCK, MEF, LAK, KWF, KWH, TWH, TSW, KOW, OLY, OCP, WCH, LET, SOH, EXC, HUH, MKE, KOT, TAW };

// ---------------------------------------------------------------- constants
export const FLOOR_H = 7;      // floor-to-floor height
export const SLAB_T = 1.0;     // structural slab thickness
export const WALL_T = 0.5;     // perimeter wall thickness
export const TRACK_DROP = 0.95; // track trough depth below platform floor
export const GAUGE = 1.9;      // rail separation (visual)
export const BED_HALF = 2.5;   // half-width of track trough

// MTR network line colours (subset — extend as stations are added).
export const LINES = {
  TWL: { zh: '荃灣綫',   en: 'Tsuen Wan Line',      color: '#E2231A' },
  ISL: { zh: '港島綫',   en: 'Island Line',         color: '#0071CE' },
  SIL: { zh: '南港島綫', en: 'South Island Line',   color: '#B5BD00' },
  EAL: { zh: '東鐵綫',   en: 'East Rail Line',      color: '#53B7E8' },
  TCL: { zh: '東涌綫',   en: 'Tung Chung Line',     color: '#F7943E' },
  AEX: { zh: '機場快綫', en: 'Airport Express',     color: '#00888A' },
  TKO: { zh: '將軍澳綫', en: 'Tseung Kwan O Line',  color: '#7D499D' },
  KTL: { zh: '觀塘綫',   en: 'Kwun Tong Line',      color: '#00AB4E' },
  TML: { zh: '屯馬綫',   en: 'Tuen Ma Line',        color: '#9A3B26' },
};

// Island platform half-width / track centre offsets (local Z).
export const ISLAND_HALF = 5.6;
export const TRACK_Z = 8.6;       // island level: track centres at ±TRACK_Z
export const SIDE_Z = 8.4;        // side-platform level: platform inner edge
export const SIDE_TRACK_Z = 4.4;  // side/single level: track centres

// Rolling-stock + headway spec per line. Urban lines run 8-car M-Trains
// (~180 m over couplers, 22.4 m cars, 5 door pairs per side). EAL runs the
// 9-car R-Train; SIL a 3-car S-Train; TCL the 8-car K-Train; AEX the CAF stock.
export const TRAIN_SPEC = {
  TWL: { headway: 46, dwell: 13, cars: 8, carLen: 22.4 },
  ISL: { headway: 46, dwell: 13, cars: 8, carLen: 22.4 },
  EAL: { headway: 75, dwell: 18, cars: 9, carLen: 23.0 },
  SIL: { headway: 62, dwell: 15, cars: 3, carLen: 19.5 },
  TCL: { headway: 60, dwell: 16, cars: 8, carLen: 22.4 },
  AEX: { headway: 95, dwell: 30, cars: 7, carLen: 23.0 },
  TKO: { headway: 55, dwell: 14, cars: 8, carLen: 22.4 },
  KTL: { headway: 46, dwell: 13, cars: 8, carLen: 22.4 },
  TML: { headway: 55, dwell: 14, cars: 8, carLen: 23.0 },   // ex-KCR SP1900/IKK stock
};

export const ESC = { runLen: 12.6, width: 1.15, gap: 0.55 }; // per-escalator width + gap
export const LIFT_SIZE = { w: 3.4, d: 3.4 };
export const GATE_PITCH = 2.4;

// Concourse shop rotation (name -> SHOP_KIND interior in props.js)
export const SHOP_NAMES = [
  { zh: '便利店', en: '7-Eleven', color: '#e8722a' },
  { zh: '茶餐廳', en: 'Cha Chaan Teng', color: '#3f7d54' },
  { zh: '英王麵包店', en: 'A1 Bakery', color: '#b3543f' },
  { zh: '咖啡店', en: 'Cafe', color: '#6b4a8a' },
  { zh: '藥房', en: 'Pharmacy', color: '#3f6db3' },
  { zh: '快餐店', en: 'Fast Food', color: '#c7a23a' },
  { zh: '書店', en: 'Bookstore', color: '#8a4a6e' },
  { zh: '銀行', en: 'Bank', color: '#a03030' },
];

// ------------------------------------------------------- merged world views
// Every level gets a globally-unique uid "<STN>:<id>" — used as the key in
// PLATFORMS / WALK_RECTS / STAIR_RUNS / FITTINGS / door sets everywhere.
export const LEVELS = [];
export const BOXES = {};
export const PLATFORMS = {};
export const ESCALATORS = [];
export const EXITS = [];
export const LIFTS = [];
export const WALK_RECTS = {};
export const PEOPLE_N = {};
export const GATE_ROWS = {};

for (const stn of Object.values(STATIONS)) {
  for (const lvl of stn.levels) {
    LEVELS.push({ ...lvl, uid: `${stn.id}:${lvl.id}`, station: stn.id });
  }
  Object.assign(BOXES, stn.boxes);
  for (const [lvlId, spec] of Object.entries(stn.platforms || {})) {
    PLATFORMS[`${stn.id}:${lvlId}`] = spec;
  }
  for (const e of stn.escalators || []) {
    ESCALATORS.push({ ...e, from: `${stn.id}:${e.from}`, to: `${stn.id}:${e.to}`, station: stn.id });
  }
  for (const ex of stn.exits || []) {
    EXITS.push({ ...ex, stn: stn.id, exitZ: stn.exitZ });
  }
  for (const l of stn.lifts || []) {
    LIFTS.push({ ...l, stn: stn.id, levels: l.levels.map(id => `${stn.id}:${id}`) });
  }
  for (const [lvlId, rects] of Object.entries(stn.walkRects || {})) {
    WALK_RECTS[`${stn.id}:${lvlId}`] = rects;
  }
  for (const [lvlId, n] of Object.entries(stn.people || {})) {
    PEOPLE_N[`${stn.id}:${lvlId}`] = n;
  }
  if (stn.gateRows) GATE_ROWS[stn.id] = stn.gateRows;
}

// Paid zone per concourse level — bounded by the gate lines and their end
// caps. gateEnds 'wall' means the strip runs into that end wall (the CEN/HOK
// subway mouths stay inside paid); otherwise it ends at the outermost bank
// and the unpaid band wraps around it. Passengers use it to keep wander
// targets on their own side of the gate line.
export const PAID_CORE = {};
for (const stn of Object.values(STATIONS)) {
  if (!stn.gateRows?.length) continue;
  const z = Math.max(...stn.gateRows.map(r => Math.abs(r.z)));
  const ge = stn.gateEnds || {};
  const x0 = ge.x0 === 'wall' ? -1e9 : (ge.x0 ?? Math.min(...stn.gateRows.map(r => r.x0)));
  const x1 = ge.x1 === 'wall' ?  1e9 : (ge.x1 ?? Math.max(...stn.gateRows.map(r => r.x1)));
  for (const l of stn.levels)
    if (l.type === 'concourse') PAID_CORE[`${stn.id}:${l.id}`] = { x0, x1, z };
}

// U1 footbridge is Admiralty-specific street furniture.
export const BRIDGE = ADM.bridge;

// ---------------------------------------------------------------- helpers
// local (x,z) in a box frame -> world (x,z); pass `out` to avoid an alloc
// (the crowd loop calls this ~10k times a frame)
export function boxToWorld(box, x, z, out = {}) {
  const c = Math.cos(box.rot), s = Math.sin(box.rot);
  out.x = box.cx + x * c + z * s;
  out.z = box.cz - x * s + z * c;
  return out;
}
// world (x,z) -> local coords of a box frame
export function worldToBox(box, x, z, out = {}) {
  const c = Math.cos(box.rot), s = Math.sin(box.rot);
  const dx = x - box.cx, dz = z - box.cz;
  out.x = dx * c - dz * s;
  out.z = dx * s + dz * c;
  return out;
}

export function levelById(uid) { return LEVELS.find(l => l.uid === uid); }

// World-space endpoints of one escalator bank -> array of runs (one per unit).
export function escalatorRuns(e) {
  const box = BOXES[e.frame] || { cx: 0, cz: 0, rot: 0 };
  const yTop = levelById(e.from).y, yBot = levelById(e.to).y;
  const dirLen = Math.hypot(e.dir[0], e.dir[1]);
  const d = [e.dir[0] / dirLen, e.dir[1] / dirLen];
  // e.runLen overrides the standard 12.6 m run — deep drops (MEF's 14 m
  // L1->L3) need the longer flight to keep the standard slope
  const half = (e.runLen ?? ESC.runLen) / 2;
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

// World-space centre point of a lift shaft (expressed in a box frame).
export function liftWorldRect(l) {
  const box = BOXES[l.frame] || { cx: 0, cz: 0, rot: 0 };
  return boxToWorld(box, l.x, l.z);
}

// The concourse level of a station (first 'concourse' typed level).
export function concourseId(stnId) {
  return LEVELS.find(l => l.station === stnId && l.type === 'concourse')?.uid;
}

// Ground slab boxes — where the street plane needs an opening.
export function groundBoxes() {
  return LEVELS.filter(l => l.type === 'ground' || l.type === 'checkin').map(l => BOXES[l.box]);
}
