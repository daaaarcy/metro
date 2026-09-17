// Mong Kok Station 旺角 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/mok.pdf) + Wikipedia.
// Under Nathan Rd × Argyle St. The system's busiest station: 15 exits
// (tied with East TST for the most in the MTR) and TWO stacked islands —
// the cross-platform-by-direction pair: L2 holds TWL P1 + KTL P3
// (northbound faces), L3 holds TWL P2 + KTL P4 (southbound faces).
// For now both lines terminate here — each consist arrives on the
// upper island (L2 northbound) then wraps off-map to the lower island
// (L3 southbound) to head back. When Prince Edward lands, terminus
// clears and both lines through-run north.
// Livery: red / medium grey.

export const MOK = {
  id: 'MOK', zh: '旺角', en: 'Mong Kok',
  livery: '#7a2620',   // MOK's deep red mosaic (grey accents)

  boxes: {
    mokSite:  { cx: 320, cz: -1240, len: 240, wid: 84, rot: 0 }, // G apron
    mokConc:  { cx: 320, cz: -1240, len: 190, wid: 44, rot: 0 }, // L1 concourse
    mokPlatU: { cx: 320, cz: -1240, len: 200, wid: 24, rot: 0 }, // L2 island (northbound)
    mokPlatD: { cx: 320, cz: -1240, len: 200, wid: 24, rot: 0 }, // L3 island (southbound)
  },

  levels: [
    { id: 'G',  y: 0,   box: 'mokSite',  zh: '地面',       en: 'Ground',   type: 'ground'   },
    { id: 'L1', y: -7,  box: 'mokConc',  zh: '大堂',       en: 'Concourse', type: 'concourse'},
    { id: 'L2', y: -14, box: 'mokPlatU', zh: '月台・荃灣綫/觀塘綫', en: 'TWL/KTL Platforms (northbound)', type: 'platform' },
    { id: 'L3', y: -21, box: 'mokPlatD', zh: '月台・荃灣綫/觀塘綫', en: 'TWL/KTL Platforms (southbound)', type: 'platform' },
  ],

  // Two stacked islands — northbound upstairs, southbound downstairs,
  // TWL on each island's north face and KTL on its south face (the real
  // cross-platform pairing). Temporary termini: northbound faces sign
  // 'to Tsuen Wan'/'to Tiu Keng Leng' (dir +1, east portal), southbound
  // 'to Central'/'to Whampoa' (dir -1, west portal).
  platforms: {
    L2: {
      kind: 'island', terminus: true,
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1, to: { zh: '往荃灣',   en: 'to Tsuen Wan' } },
        { num: 3, line: 'KTL', side: 1,  dir: 1, to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
      ],
    },
    L3: {
      kind: 'island', terminus: true,
      faces: [
        { num: 2, line: 'TWL', side: -1, dir: -1, to: { zh: '往中環', en: 'to Central' } },
        { num: 4, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔', en: 'to Whampoa' } },
      ],
    },
  },

  escalators: [
    { from: 'L1', to: 'L2', frame: 'mokPlatU', cx: -58, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'mokPlatU', cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'mokPlatD', cx: -82, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'mokPlatD', cx:  82, cz: 0, dir: [ 1, 0], n: 2 },
  ],

  // the 15-exit fan — north (-z) side serves Mong Kok Rd / Nathan Rd /
  // Fa Yuen St / MOKO; south (+z) side serves Shanghai St / Langham
  // Place / Argyle St / Grand Plaza
  exits: [
    { id: 'A1', x: -78, side: -1, zh: '旺角道',             en: 'Mong Kok Road' },
    { id: 'A2', x: -58, side: -1, zh: '砵蘭街',             en: 'Portland Street' },
    { id: 'B1', x: -38, side: -1, zh: '彌敦道',             en: 'Nathan Road' },
    { id: 'B2', x: -18, side: -1, zh: '花園街市政大廈',      en: 'Fa Yuen St MSB' },
    { id: 'B3', x:   6, side: -1, zh: 'MOKO・旺角東站',      en: 'MOKO · Mong Kok East' },
    { id: 'B4', x:  30, side: -1, zh: 'T.O.P 商場',         en: 'T.O.P. Mall' },
    { id: 'C1', x: -78, side: 1,  zh: '恒生旺角大廈',        en: 'Hang Seng Mongkok Bldg' },
    { id: 'C2', x: -56, side: 1,  zh: '上海街',             en: 'Shanghai Street' },
    { id: 'C3', x: -34, side: 1,  zh: '朗豪坊',             en: 'Langham Place' },
    { id: 'C4', x: -12, side: 1,  zh: '滙豐大廈',           en: 'HSBC Building' },
    { id: 'D1', x:  10, side: 1,  zh: '亞皆老街・上海商業銀行', en: 'Argyle St · Shanghai Commercial Bank' },
    { id: 'D2', x:  30, side: 1,  zh: '旺角中心',           en: 'Argyle Centre' },
    { id: 'D3', x:  50, side: 1,  zh: '通菜街',             en: 'Tung Choi Street' },
    { id: 'E1', x:  66, side: 1,  zh: '朗豪坊・大廣場',      en: 'Grand Plaza' },
    { id: 'E2', x:  82, side: 1,  zh: '招商永隆銀行中心',    en: 'CMB Wing Lung Bank Centre' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'mokPlatU', x: 0,   z: 0,   levels: ['L1', 'L2', 'L3'] },  // paid lift, all levels
    { frame: 'mokConc',  x: -86, z: -18, levels: ['G', 'L1'] },         // street lift — Mong Kok Rd side
    { frame: 'mokConc',  x: 86,  z: 18,  levels: ['G', 'L1'] },         // street lift — Argyle side
  ],

  gateRows: [
    { z: -9, x0: -62, x1: -24 },
    { z: -9, x0: 24,  x1: 62 },
    { z: 9,  x0: -62, x1: -24 },
    { z: 9,  x0: 24,  x1: 62 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  // kiosks dodge the dense exit-shaft spacing
  kioskXs:  [-88, -6, 52, 72],
  kioskXsS: [-24, -2, 58],

  walkRects: {
    G:  [{ x0: -112, z0: -38, x1: 112, z1: 38 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
    L3: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 26, L1: 70, L2: 46, L3: 46 },
};
