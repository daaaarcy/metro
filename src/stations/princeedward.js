// Prince Edward Station 太子 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/pre.pdf) + Wikipedia.
// Under Nathan Rd x Prince Edward Rd West. The second TWL/KTL
// cross-platform interchange — but the pairing is mirrored from Mong
// Kok: the KTL tracks swap levels in the flying junction between the
// two stations, so PRE's islands split by LINE direction crosswise:
// L2 holds TWL P1 (northbound) + KTL P2 (southbound), L3 holds TWL P4
// (southbound) + KTL P3 (northbound). Both lines terminate here for
// now — each consist arrives on one island then wraps off-map to the
// other to head back. When Sham Shui Po (TWL) and Shek Kip Mei (KTL)
// land, terminus clears and both lines through-run.
// Livery: light purple mosaic ("the regal colour").
// Exits per Wikipedia (7): A Mong Kok Stadium/Playing Field Rd;
// B1 Flower Market Rd, B2 Sai Yeung Choi St S; C1 Nathan Rd/Golden
// Plaza, C2 Metropark Hotel Mongkok; D Yu Chau St; E Cheung Sha Wan Rd.

export const PRE = {
  id: 'PRE', zh: '太子', en: 'Prince Edward',
  livery: '#a98cc0',   // PRE's light purple mosaic

  boxes: {
    preSite:  { cx: 320, cz: -1360, len: 240, wid: 84, rot: 0 }, // G apron
    preConc:  { cx: 320, cz: -1360, len: 190, wid: 44, rot: 0 }, // L1 concourse
    prePlatU: { cx: 320, cz: -1360, len: 200, wid: 24, rot: 0 }, // L2 island
    prePlatD: { cx: 320, cz: -1360, len: 200, wid: 24, rot: 0 }, // L3 island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'preSite',  zh: '地面',       en: 'Ground',   type: 'ground'   },
    { id: 'L1', y: -7,  box: 'preConc',  zh: '大堂',       en: 'Concourse', type: 'concourse'},
    { id: 'L2', y: -14, box: 'prePlatU', zh: '月台・荃灣綫/觀塘綫', en: 'TWL/KTL Platforms', type: 'platform' },
    { id: 'L3', y: -21, box: 'prePlatD', zh: '月台・荃灣綫/觀塘綫', en: 'TWL/KTL Platforms', type: 'platform' },
  ],

  // Mirrored cross-platform pair: L2 pairs TWL-north with KTL-south,
  // L3 pairs TWL-south with KTL-north (the KTL crosses levels in the
  // tunnel between here and Mong Kok). TWL through-runs to Sham Shui
  // Po; the KTL still terminates here — P3 (northbound arrival) wraps
  // off-map to P2 (southbound departure).
  platforms: {
    L2: {
      kind: 'island',
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
        { num: 2, line: 'KTL', side: 1,  dir: -1, terminus: true, to: { zh: '往黃埔', en: 'to Whampoa' } },
      ],
    },
    L3: {
      kind: 'island',
      faces: [
        { num: 4, line: 'TWL', side: -1, dir: -1, to: { zh: '往中環',   en: 'to Central' } },
        { num: 3, line: 'KTL', side: 1,  dir: 1,  terminus: true, to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
      ],
    },
  },

  escalators: [
    { from: 'L1', to: 'L2', frame: 'prePlatU', cx: -58, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'prePlatU', cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'prePlatD', cx: -82, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'prePlatD', cx:  82, cz: 0, dir: [ 1, 0], n: 2 },
  ],

  // the 7-exit fan — north (-z) side reaches Playing Field Rd / Flower
  // Market / Sai Yeung Choi St; south (+z) side reaches Nathan Rd /
  // Metropark / Yu Chau St / Cheung Sha Wan Rd
  exits: [
    { id: 'A',  x: -78, side: -1, zh: '旺角大球場・運動場道',   en: 'Mong Kok Stadium · Playing Field Rd' },
    { id: 'B1', x: -50, side: -1, zh: '花墟道・旺角警署',       en: 'Flower Market Rd · Mong Kok Police' },
    { id: 'B2', x: -20, side: -1, zh: '西洋菜南街・Elize PARK', en: 'Sai Yeung Choi St S · Elize PARK' },
    { id: 'C1', x: -8,  side: 1,  zh: '彌敦道・金都商場',       en: 'Nathan Road · Golden Plaza' },
    { id: 'C2', x:  22, side: 1,  zh: '維景酒店・大南街',       en: 'Metropark Hotel · Tai Nan Street' },
    { id: 'D',  x:  50, side: 1,  zh: '汝州街',                en: 'Yu Chau Street' },
    { id: 'E',  x:  78, side: 1,  zh: '長沙灣道・楓樹街遊樂場',  en: 'Cheung Sha Wan Rd · Maple St PGR' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'prePlatU', x: 0,   z: 0,   levels: ['L1', 'L2', 'L3'] },  // paid lift, all levels
    { frame: 'preConc',  x: -86, z: -18, levels: ['G', 'L1'] },         // street lift — Playing Field side
    { frame: 'preConc',  x: 86,  z: 18,  levels: ['G', 'L1'] },         // street lift — Prince Edward side
  ],

  gateRows: [
    { z: -9, x0: -62, x1: -24 },
    { z: -9, x0: 24,  x1: 62 },
    { z: 9,  x0: -62, x1: -24 },
    { z: 9,  x0: 24,  x1: 62 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  kioskXs:  [-44, 8, 58],
  kioskXsS: [-24, 40, 78],

  walkRects: {
    G:  [{ x0: -112, z0: -38, x1: 112, z1: 38 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
    L3: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 20, L1: 56, L2: 40, L3: 40 },
};
