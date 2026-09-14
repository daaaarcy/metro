// Central Station 中環 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/cen.pdf).
// Sits ~1.05 km west of Admiralty along the harbour-front axis (-X).

export const CEN = {
  id: 'CEN', zh: '中環', en: 'Central',

  boxes: {
    cenSite: { cx: -1050, cz: 0,  len: 200, wid: 70, rot: 0 },  // G ground slab
    cenConc: { cx: -1050, cz: 0,  len: 190, wid: 46, rot: 0 },  // L1 sprawling concourse
    cenIsl:  { cx: -1045, cz: 0,  len: 190, wid: 18, rot: 0 },  // L2 ISL side platform (3)
    cenTwl:  { cx: -1055, cz: 0,  len: 190, wid: 24, rot: 0 },  // L3 TWL terminus island (1,2)
    cenIsl4: { cx: -1045, cz: 0,  len: 190, wid: 18, rot: 0 },  // L4 ISL side platform (4)
  },

  levels: [
    { id: 'G',  y: 0,   box: 'cenSite', zh: '地面',   en: 'Ground',                  type: 'ground'   },
    { id: 'L1', y: -7,  box: 'cenConc', zh: '大堂',   en: 'Concourse',               type: 'concourse'},
    { id: 'L2', y: -14, box: 'cenIsl',  zh: '月台・港島綫', en: 'Island Line Platform',  type: 'platform' },
    { id: 'L3', y: -21, box: 'cenTwl',  zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platforms', type: 'platform' },
    { id: 'L4', y: -28, box: 'cenIsl4', zh: '月台・港島綫', en: 'Island Line Platform',  type: 'platform' },
  ],

  // Per the official layout: L2 is a side platform (3 to Chai Wan), L3 is the
  // TWL terminus island (both faces board toward Tsuen Wan), L4 is the second
  // ISL side platform (4 to Kennedy Town), stacked under L2.
  platforms: {
    L2: {
      kind: 'single', single: { track: -1, side: 1 },
      faces: [
        { num: 3, line: 'ISL', side: 1, dir: 1, to: { zh: '往柴灣', en: 'to Chai Wan' } },
      ],
    },
    L3: {
      kind: 'island', terminus: true,
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1, to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
        { num: 2, line: 'TWL', side: 1,  dir: 1, to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
      ],
    },
    L4: {
      kind: 'single', single: { track: -1, side: 1 },
      faces: [
        { num: 4, line: 'ISL', side: 1, dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
      ],
    },
  },

  // Escalators cascade down the middle of the stack like the real station:
  // concourse -> L2 (ISL), L2 -> L3 (TWL island), L3 -> L4 (ISL below).
  // Banks sit at local z +3/+2 so they land on the side-platform strips /
  // island platform respectively (boxes share the cz=0 column).
  escalators: [
    { from: 'L1', to: 'L2', frame: 'cenIsl',  cx: -45, cz: 3, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'cenIsl',  cx:  30, cz: 3, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'cenTwl',  cx: -30, cz: 2, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'cenTwl',  cx:  40, cz: 2, dir: [ 1, 0], n: 2 },
    { from: 'L3', to: 'L4', frame: 'cenIsl4', cx: -10, cz: 3, dir: [ 1, 0], n: 2 },
    { from: 'L3', to: 'L4', frame: 'cenIsl4', cx:  60, cz: 3, dir: [-1, 0], n: 2 },
  ],

  // Street stairs G -> L1, per the layout's exit fan (A..L).
  exits: [
    { id: 'A',  x: -70, side: -1, zh: '遮打大廈',        en: 'Chater House' },
    { id: 'B',  x: -50, side: -1, zh: '歷山大廈',        en: 'Alexandra House' },
    { id: 'C',  x: -25, side: -1, zh: '置地廣場',        en: 'The Landmark' },
    { id: 'D1', x: -8,  side: 1,  zh: '畢打街',          en: 'Pedder Street' },
    { id: 'D2', x: 4,   side: 1,  zh: '會德豐大廈',      en: 'Wheelock House' },
    { id: 'E',  x: 22,  side: -1, zh: '皇后大道中',      en: "Queen's Road Central" },
    { id: 'F',  x: 38,  side: 1,  zh: '租庇利街',        en: 'Jubilee Street' },
    { id: 'G',  x: 55,  side: -1, zh: '交易廣場',        en: 'Exchange Square' },
    { id: 'H',  x: 70,  side: 1,  zh: '怡和大廈',        en: 'Jardine House' },
    { id: 'K',  x: 85,  side: -1, zh: '香港站行人隧道',  en: 'HK Station Subway' },
  ],
  exitZ: 15.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L'],

  lifts: [
    { frame: 'cenConc', x: -20, z: -6, levels: ['L1', 'L2', 'L3', 'L4'] },
  ],

  gateRows: [
    { z: -9.4, x0: -60, x1: -14 },
    { z: -9.4, x0: 14, x1: 60 },
    { z: 9.4, x0: -60, x1: -14 },
    { z: 9.4, x0: 14, x1: 60 },
  ],

  walkRects: {
    G:  [{ x0: -92, z0: -30, x1: 92, z1: 30 }],
    L1: [{ x0: -88, z0: -20, x1: 88, z1: 20 }],
    L2: [{ x0: -88, z0: -0.6, x1: 88, z1: 6.6 }],
    L3: [{ x0: -88, z0: -4.9, x1: 88, z1: 4.9 }],
    L4: [{ x0: -88, z0: -0.6, x1: 88, z1: 6.6 }],
  },

  people: { G: 14, L1: 44, L2: 26, L3: 30, L4: 24 },
};
