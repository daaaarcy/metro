// Tai Koo Station 太古 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tak.pdf).
// ~600 m east of Quarry Bay under King's Road. Single island platform
// on L2 (P1 -> Chai Wan, P2 -> Kennedy Town); the plan's signature
// feature is the big unpaid subway fan — nine exits reaching Cityplaza
// / Taikoo Shing on the harbour side and Kornhill up the hill.
// Exits per Wikipedia: A1 Kornhill Gdn 1–4, A2 Kornhill Plaza North,
// B Kornhill N–R, C Kornhill A–M/Plaza South, D1 Cityplaza/One Island
// East, D2 Cityplaza GF, E1 Cityplaza 2F, E2 Kornhill Gdn 5–6,
// E3 Kornhill Gdn 7–10.

export const TAK = {
  id: 'TAK', zh: '太古', en: 'Tai Koo',
  livery: '#b2203c',   // Tai Koo's crimson mosaic tile livery

  boxes: {
    takSite: { cx: 4800, cz: 0, len: 230, wid: 64, rot: 0 },  // G ground slab
    takConc: { cx: 4800, cz: 0, len: 220, wid: 44, rot: 0 },  // L1 concourse
    takP:    { cx: 4800, cz: 0, len: 200, wid: 24, rot: 0 },  // L2 ISL island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'takSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'takConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'takP',    zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
  ],

  platforms: {
    L2: {
      kind: 'island',
      faces: [
        { num: 1, line: 'ISL', side: -1, dir: 1,  to: { zh: '往柴灣',     en: 'to Chai Wan' } },
        { num: 2, line: 'ISL', side: 1,  dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
      ],
    },
  },

  escalators: [
    { from: 'L1', to: 'L2', frame: 'takP', cx: -62, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'takP', cx:  62, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // Exit fan: D/E1 cluster north (Cityplaza side); A/B/C/E2/E3 south
  // (Kornhill side). Shafts keep clear of the wells (x∈±[54.8,69.2]).
  exits: [
    { id: 'D1', x: -70, side: -1, zh: '太古城中心・港島東中心', en: 'Cityplaza · One Island East' },
    { id: 'D2', x: -52, side: -1, zh: '太古城中心',            en: 'Cityplaza' },
    { id: 'E1', x: 40,  side: -1, zh: '太古城中心二期',         en: 'Cityplaza 2F' },
    { id: 'A1', x: -96, side: 1,  zh: '康山花園1-4座',          en: 'Kornhill Gdn 1–4' },
    { id: 'A2', x: -82, side: 1,  zh: '康怡廣場北座',           en: 'Kornhill Plaza North' },
    { id: 'B',  x: -60, side: 1,  zh: '康山N-R座',             en: 'Kornhill Blocks N–R' },
    { id: 'C',  x: 70,  side: 1,  zh: '康山A-M座・康怡廣場南座', en: 'Kornhill A–M · Plaza South' },
    { id: 'E2', x: 84,  side: 1,  zh: '康山花園5-6座',          en: 'Kornhill Gdn 5–6' },
    { id: 'E3', x: 96,  side: 1,  zh: '康山花園7-10座',         en: 'Kornhill Gdn 7–10' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'takConc', x: 0,   z: 0,   levels: ['L1', 'L2'] },        // paid lift
    { frame: 'takConc', x: -76, z: -15, levels: ['G', 'L1'] },          // street lift — Cityplaza side
    { frame: 'takConc', x: 88,  z: 15,  levels: ['G', 'L1'] },          // street lift — Kornhill side
  ],

  gateRows: [
    { z: -9, x0: -68, x1: -26 },
    { z: -9, x0: 26,  x1: 68 },
    { z: 9,  x0: -68, x1: -26 },
    { z: 9,  x0: 26,  x1: 68 },
  ],
  gateEnds: { x0: -74, x1: 74 },

  kioskXs:  [-44, -8, 34],
  kioskXsS: [-38, 8, 42],

  walkRects: {
    G:  [{ x0: -108, z0: -28, x1: 108, z1: 28 }],
    L1: [{ x0: -102, z0: -19, x1: 102, z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
  },

  people: { G: 14, L1: 48, L2: 40 },
};
