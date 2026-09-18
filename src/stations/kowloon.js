// Kowloon Station 九龍 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/kow.pdf) + Wikipedia.
// The Airport Railway's Kowloon-side hub under Union Square / Elements,
// ~1 km south of Hong Kong station across the strait. Stacked islands:
// AEX on L2, TCL on L3 (same convention as Hong Kong station's
// AEX-over-TCL split). Elements' mall exits and the Union Square towers
// fan off the concourse; ICC / Sky100 sits on the dig's north edge.
// Livery: cool grey like Hong Kong — the Airport Railway look.
// Exits (per Wikipedia, condensed): A Elements/ICC, B Sorrento·
// Waterfront, C1 Austin Rd W, C2 WKCD, D The Waterfront, E1 Harbourside,
// E2 The Arch.

export const KOW = {
  id: 'KOW', zh: '九龍', en: 'Kowloon',
  livery: '#9aa7ae',   // Airport Railway grey, a shade under HOK's

  boxes: {
    kowSite: { cx: -1480, cz: -1020, len: 240, wid: 76, rot: 0 }, // G apron — Elements podium
    kowConc: { cx: -1480, cz: -1020, len: 190, wid: 44, rot: 0 }, // L1 concourse
    kowAex:  { cx: -1480, cz: -1020, len: 200, wid: 18, rot: 0 }, // L2 AEX island
    kowTcl:  { cx: -1480, cz: -1020, len: 200, wid: 24, rot: 0 }, // L3 TCL island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'kowSite', zh: '地面',           en: 'Ground',                   type: 'ground'    },
    { id: 'L1', y: -7,  box: 'kowConc', zh: '大堂',           en: 'Concourse',                type: 'concourse' },
    { id: 'L2', y: -14, box: 'kowAex',  zh: '月台・機場快綫',  en: 'Airport Express Platform',   type: 'platform'  },
    { id: 'L3', y: -21, box: 'kowTcl',  zh: '月台・東涌綫',    en: 'Tung Chung Line Platforms',  type: 'platform'  },
  ],

  // L2: AEX island — P1 to Airport/AsiaWorld-Expo, P2 back to Hong Kong.
  // L3: TCL island — P3 out to Tung Chung, P4 back to Hong Kong.
  platforms: {
    L2: {
      kind: 'island',
      faces: [
        { num: 1, line: 'AEX', side: -1, dir: 1,  to: { zh: '往機場・博覽館', en: 'to Airport / AsiaWorld-Expo' } },
        { num: 2, line: 'AEX', side: 1,  dir: -1, to: { zh: '往香港',        en: 'to Hong Kong' } },
      ],
    },
    L3: {
      kind: 'island',
      faces: [
        { num: 3, line: 'TCL', side: -1, dir: 1,  to: { zh: '往東涌・迪士尼綫', en: 'to Tung Chung / Disneyland' } },
        { num: 4, line: 'TCL', side: 1,  dir: -1, to: { zh: '往香港',          en: 'to Hong Kong' } },
      ],
    },
  },

  // cascade down through the AEX island to the TCL box, like HOK's stack
  escalators: [
    { from: 'L1', to: 'L2', frame: 'kowAex', cx: -50, cz: 3, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'kowAex', cx:  50, cz: 3, dir: [ 1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'kowTcl', cx: -40, cz: 3, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'kowTcl', cx:  40, cz: 3, dir: [-1, 0], n: 2 },
  ],

  // exit fan: Elements/Union Square cluster west + east, the ICC
  // forecourt north, Austin Rd / WKCD toward the south apron
  exits: [
    { id: 'A',  x: -80, side: -1, zh: '圓方・環球貿易廣場',   en: 'Elements · ICC' },
    { id: 'B',  x: -52, side: -1, zh: '擎天半島・君臨天下',    en: 'Sorrento · The Harbourside' },
    { id: 'C1', x: -24, side: -1, zh: '柯士甸道西',          en: 'Austin Road West' },
    { id: 'C2', x:  24, side: -1, zh: '西九文化區',          en: 'West Kowloon Cultural District' },
    { id: 'D',  x:  52, side: -1, zh: '漾日居',             en: 'The Waterfront' },
    { id: 'E1', x: -40, side: 1,  zh: '凱旋門',             en: 'The Arch' },
    { id: 'E2', x:  40, side: 1,  zh: '天璽',               en: 'The Cullinan' },
  ],
  exitZ: 16,
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'kowConc', x: 0,   z: 0,   levels: ['L1', 'L2', 'L3'] },  // paid lift, centre
    { frame: 'kowConc', x: -86, z: -15, levels: ['G', 'L1'] },          // street lift — Elements side
    { frame: 'kowConc', x: 86,  z: 15,  levels: ['G', 'L1'] },          // street lift — WKCD side
  ],

  gateRows: [
    { z: -9, x0: -66, x1: -28 },
    { z: -9, x0:  28, x1:  66 },
    { z:  9, x0: -66, x1: -28 },
    { z:  9, x0:  28, x1:  66 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  kioskXs:  [-44, 8, 58],
  kioskXsS: [-24, 40, 78],

  walkRects: {
    G:  [{ x0: -112, z0: -34, x1: 112, z1: 34 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
    L3: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 16, L1: 44, L2: 24, L3: 30 },
};
