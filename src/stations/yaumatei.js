// Yau Ma Tei Station 油麻地 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/ymt.pdf) + Wikipedia.
// One stop up Nathan Road from Jordan — sits under the Nathan Rd ×
// Waterloo Rd junction. TWL island platform on L2 under the L1
// concourse. (The real station's L3 Kwun Tong line island lands with
// the KTL when Mong Kok is built — YMT↔MOK is KTL's corridor pair.)
// Exits per Wikipedia: A1/A2 Pitt St/Kwong Wah Hosp; B1 Nathan Rd,
// B2 Portland St; C Man Ming Lane (Temple St); D Waterloo Rd/Metropark.
// Livery: light grey-green platform tiles, grey + red in the concourse.

export const YMT = {
  id: 'YMT', zh: '油麻地', en: 'Yau Ma Tei',
  livery: '#8fa08c',   // YMT's pale grey-green mosaic

  boxes: {
    ymtSite: { cx: 320, cz: -1120, len: 240, wid: 84, rot: 0 }, // G apron
    ymtConc: { cx: 320, cz: -1120, len: 190, wid: 44, rot: 0 }, // L1 concourse
    ymtPlat: { cx: 320, cz: -1120, len: 200, wid: 24, rot: 0 }, // L2 TWL island
    ymtKtl:  { cx: 320, cz: -1120, len: 200, wid: 24, rot: 0 }, // L3 KTL island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'ymtSite', zh: '地面',       en: 'Ground',   type: 'ground'   },
    { id: 'L1', y: -7,  box: 'ymtConc', zh: '大堂',       en: 'Concourse', type: 'concourse'},
    { id: 'L2', y: -14, box: 'ymtPlat', zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform' },
    { id: 'L3', y: -21, box: 'ymtKtl',  zh: '月台・觀塘綫', en: 'Kwun Tong Line Platform', type: 'platform' },
  ],

  // L2 island: TWL through station — P1 north (dir +1) toward Mong Kok/
  // Tsuen Wan, P2 south (dir -1) toward Central. L3 island: the KTL's
  // south end for now — the shuttle to Mong Kok departs both faces and
  // reverses at the east portal. When Ho Man Tin lands the island goes
  // through-running (P3 'to Tiu Keng Leng' dir +1 / P4 'to Whampoa'
  // dir -1) and terminus clears.
  platforms: {
    L2: {
      kind: 'island',
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
        { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
      ],
    },
    L3: {
      kind: 'island', terminus: true,
      faces: [
        { num: 3, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
        { num: 4, line: 'KTL', side: 1,  dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
      ],
    },
  },

  escalators: [
    { from: 'L1', to: 'L2', frame: 'ymtPlat', cx: -58, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'ymtPlat', cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'ymtKtl',  cx: -82, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'ymtKtl',  cx:  82, cz: 0, dir: [ 1, 0], n: 2 },
  ],

  // exit fan — north (-z) side reaches Pitt St / Kwong Wah Hospital /
  // Nathan Rd; south (+z) side reaches Portland St / Temple St /
  // Waterloo Rd
  exits: [
    { id: 'A1', x: -60, side: -1, zh: '碧街',                 en: 'Pitt Street' },
    { id: 'A2', x: -20, side: -1, zh: 'YMCA・廣華醫院',        en: 'YMCA · Kwong Wah Hospital' },
    { id: 'B1', x:  30, side: -1, zh: '彌敦道',               en: 'Nathan Road' },
    { id: 'C',  x: -40, side: 1,  zh: '文明里・廟街',          en: 'Man Ming Lane · Temple Street' },
    { id: 'B2', x:  20, side: 1,  zh: '砵蘭街・窩打老道8號',   en: 'Portland Street · 8 Waterloo Rd' },
    { id: 'D',  x:  66, side: 1,  zh: '窩打老道・維景酒店',    en: 'Waterloo Road · Metropark Hotel' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D'],

  lifts: [
    { frame: 'ymtPlat', x: 0,   z: 0,   levels: ['L1', 'L2', 'L3'] },   // paid lift, all levels
    { frame: 'ymtConc', x: -86, z: -18, levels: ['G', 'L1'] },          // street lift — Pitt St side
    { frame: 'ymtConc', x: 86,  z: 18,  levels: ['G', 'L1'] },          // street lift — Waterloo side
  ],

  gateRows: [
    { z: -9, x0: -62, x1: -24 },
    { z: -9, x0: 24,  x1: 62 },
    { z: 9,  x0: -62, x1: -24 },
    { z: 9,  x0: 24,  x1: 62 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  // kiosks dodge the exit stair shafts
  kioskXs:  [-44, 8, 58],
  kioskXsS: [-24, 40, 78],

  walkRects: {
    G:  [{ x0: -112, z0: -38, x1: 112, z1: 38 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
    L3: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 16, L1: 46, L2: 38, L3: 30 },
};
