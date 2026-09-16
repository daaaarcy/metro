// Hong Kong Station 香港 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/hok.pdf).
// ~430 m west of Central; Tung Chung Line + Airport Express terminus under IFC.

export const HOK = {
  id: 'HOK', zh: '香港', en: 'Hong Kong',

  boxes: {
    hokSite: { cx: -1480, cz: 0,  len: 190, wid: 76, rot: 0 },  // G in-town check-in hall
    hokMezz: { cx: -1480, cz: 0,  len: 150, wid: 32, rot: 0 },  // L1 shops mezzanine
    hokAex:  { cx: -1480, cz: 0,  len: 190, wid: 18, rot: 0 },  // L2 Airport Express platform
    hokConc: { cx: -1480, cz: 0,  len: 170, wid: 40, rot: 0 },  // L3 Tung Chung Line concourse
    hokTcl:  { cx: -1480, cz: 0,  len: 190, wid: 24, rot: 0 },  // L4 TCL platforms
  },

  levels: [
    { id: 'G',  y: 0,   box: 'hokSite', zh: '市區預辦登機', en: 'In-town Check-in', type: 'checkin'  },
    { id: 'L1', y: -7,  box: 'hokMezz', zh: '商店/餐廳',   en: 'Shops / Restaurants', type: 'concourse' },
    { id: 'L2', y: -14, box: 'hokAex',  zh: '月台・機場快綫', en: 'Airport Express Platform', type: 'platform' },
    { id: 'L3', y: -21, box: 'hokConc', zh: '大堂・東涌綫',  en: 'Tung Chung Line Concourse',  type: 'concourse' },
    { id: 'L4', y: -28, box: 'hokTcl',  zh: '月台・東涌綫',  en: 'Tung Chung Line Platforms',   type: 'platform' },
  ],

  // Per the official layout: L2 is the AEX side platform (1 to Airport), L4 is
  // the TCL terminus island (3,4 — both board toward Tung Chung/Disneyland).
  platforms: {
    L2: {
      kind: 'single', single: { track: -1, side: 1 },
      faces: [
        { num: 1, line: 'AEX', side: 1, dir: -1, to: { zh: '往機場・博覽館', en: 'to Airport / AsiaWorld-Expo' } },
      ],
    },
    L4: {
      kind: 'island', terminus: true,
      faces: [
        { num: 3, line: 'TCL', side: -1, dir: -1, to: { zh: '往東涌・迪士尼綫', en: 'to Tung Chung / Disneyland' } },
        { num: 4, line: 'TCL', side: 1,  dir: -1, to: { zh: '往東涌・迪士尼綫', en: 'to Tung Chung / Disneyland' } },
      ],
    },
  },

  escalators: [
    { from: 'G',  to: 'L1', frame: 'hokSite', cx: -30, cz: 0,  dir: [-1, 0], n: 3 },
    { from: 'G',  to: 'L1', frame: 'hokSite', cx:  40, cz: 0,  dir: [ 1, 0], n: 2 },
    { from: 'L1', to: 'L2', frame: 'hokAex',  cx: -20, cz: 3,  dir: [-1, 0], n: 2 },
    { from: 'L1', to: 'L2', frame: 'hokAex',  cx:  50, cz: 3,  dir: [ 1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'hokConc', cx: -40, cz: 3,  dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'hokConc', cx:  30, cz: 3,  dir: [-1, 0], n: 2 },
    { from: 'L3', to: 'L4', frame: 'hokTcl',  cx: -30, cz: 0,  dir: [-1, 0], n: 2 },
    { from: 'L3', to: 'L4', frame: 'hokTcl',  cx:  45, cz: 0,  dir: [ 1, 0], n: 2 },
  ],

  // IFC / harbourfront exits down to the check-in hall, per Wikipedia:
  // A1/A2 Two IFC, B1/B2 Exchange Square I/II, C Douglas St, D Exchange Sq III,
  // E1/E3 One IFC, F IFC Mall.
  exits: [
    { id: 'A1', x: -60, side: 1,  zh: '國際金融中心二期', en: 'Two IFC' },
    { id: 'A2', x: -45, side: 1,  zh: '國際金融中心二期', en: 'Two IFC' },
    { id: 'E1', x: -30, side: -1, zh: '國際金融中心一期', en: 'One IFC' },
    { id: 'E3', x: -15, side: -1, zh: '國際金融中心一期', en: 'One IFC' },
    { id: 'B1', x: 30,  side: -1, zh: '交易廣場一/二座',   en: 'Exchange Square I/II' },
    { id: 'B2', x: 45,  side: -1, zh: '交易廣場一/二座',   en: 'Exchange Square I/II' },
    { id: 'D',  x: 58,  side: -1, zh: '交易廣場三座',      en: 'Exchange Square III' },
    { id: 'C',  x: 70,  side: 1,  zh: '德忌利士街',        en: 'Douglas Street' },
    { id: 'F',  x: 82,  side: 1,  zh: '國際金融中心商場',  en: 'IFC Mall' },
  ],
  exitZ: 16,
  exitLetters: ['A', 'B', 'C', 'D', 'E', 'F'],

  lifts: [
    { frame: 'hokConc', x: 0, z: 2, levels: ['G', 'L1', 'L2', 'L3', 'L4'] },
  ],

  gateRows: [
    { z: -8.4, x0: -50, x1: -10 },
    { z: -8.4, x0: 10, x1: 50 },
    { z: 8.4, x0: -50, x1: -10 },
    { z: 8.4, x0: 10, x1: 50 },
  ],

  walkRects: {
    G:  [{ x0: -88, z0: -34, x1: 88, z1: 34 }],
    L1: [{ x0: -70, z0: -13, x1: 70, z1: 13 }],
    L2: [{ x0: -88, z0: -0.6, x1: 88, z1: 6.4 }],
    L3: [{ x0: -80, z0: -17, x1: 80, z1: 17 }],
    L4: [{ x0: -88, z0: -4.9, x1: 88, z1: 4.9 }],
  },

  people: { G: 16, L1: 20, L2: 22, L3: 30, L4: 24 },
};
