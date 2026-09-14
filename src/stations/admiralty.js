// Admiralty Station 金鐘 — schematic data based on the official MTR layout.
// Units = metres. Local X = platform axis (east +X), Z = lateral (south +Z).

export const ADM = {
  id: 'ADM', zh: '金鐘', en: 'Admiralty',

  boxes: {
    main:  { cx: 0,  cz: 0,  len: 200, wid: 26, rot: 0 },     // L2 / L3 platform box
    conc:  { cx: 0,  cz: 0,  len: 170, wid: 42, rot: 0 },     // L1 concourse (sprawls wider)
    site:  { cx: 0,  cz: 4,  len: 196, wid: 76, rot: 0 },     // G ground slab
    lobby: { cx: 40, cz: 20, len: 110, wid: 34, rot: 0 },     // L4 transfer lobby
    ext:   { cx: 15, cz: 33, len: 230, wid: 26, rot: -0.30 }, // L5 / L6 expansion box
  },

  levels: [
    { id: 'U1', y: 8,   box: null,    zh: '行人天橋', en: 'Footbridge',        type: 'bridge'   },
    { id: 'G',  y: 0,   box: 'site',  zh: '地面',     en: 'Ground',            type: 'ground'   },
    { id: 'L1', y: -7,  box: 'conc',  zh: '大堂',     en: 'Concourse',         type: 'concourse'},
    { id: 'L2', y: -14, box: 'main',  zh: '月台・港島綫/荃灣綫', en: 'Platforms – Island / Tsuen Wan Line', type: 'platform' },
    { id: 'L3', y: -21, box: 'main',  zh: '月台・荃灣綫/港島綫', en: 'Platforms – Tsuen Wan / Island Line', type: 'platform' },
    { id: 'L4', y: -28, box: 'lobby', zh: '轉車大堂', en: 'Transfer Lobby',    type: 'lobby'    },
    { id: 'L5', y: -35, box: 'ext',   zh: '月台・東鐵綫', en: 'Platforms – East Rail Line',   type: 'platform' },
    { id: 'L6', y: -42, box: 'ext',   zh: '月台・南港島綫', en: 'Platforms – South Island Line', type: 'platform' },
  ],

  // Platform faces per level (keyed by the level's SHORT id within this station).
  // side -1 = north (−Z), +1 = south (+Z); dir = departure direction along X.
  platforms: {
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
  },

  // Escalator banks. `frame` = box whose local frame (cx,cz,dir) are expressed in.
  // dir = direction of descent in plan. n = escalators per bank.
  escalators: [
    { from: 'L1', to: 'L2', frame: 'main', cx: -45, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L1', to: 'L2', frame: 'main', cx:   0, cz: 0, dir: [ 1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'main', cx:  45, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'main', cx: -58, cz: 0, dir: [ 1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'main', cx: -20, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'main', cx:  20, cz: 0, dir: [ 1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'main', cx:  58, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L3', to: 'L4', frame: 'main', cx: 70, cz: 6,  dir: [ 1, 0], n: 3 },
    { from: 'L3', to: 'L4', frame: 'main', cx: 58, cz: 11, dir: [ 1, 0], n: 2 },
    { from: 'L4', to: 'L5', frame: 'ext',  cx: 34, cz: -4, dir: [ 0, 1], n: 3 },
    { from: 'L4', to: 'L5', frame: 'ext',  cx: -28, cz: -4, dir: [0, 1], n: 2 },
    { from: 'L5', to: 'L6', frame: 'ext',  cx: -18, cz: -6.5, dir: [ 1, -0.32], n: 2 },
    { from: 'L5', to: 'L6', frame: 'ext',  cx:  30, cz:  6.5, dir: [-1,  0.32], n: 2 },
  ],

  // Exits: stair shafts from G down to L1. side = -1 north / +1 south.
  exits: [
    { id: 'A',  x: -62, side: -1, zh: '海富中心',          en: 'Admiralty Centre' },
    { id: 'B',  x: -40, side: 1,  zh: '德立街・力寶中心',  en: 'Drake St · Lippo Centre' },
    { id: 'C1', x: -8,  side: -1, zh: '金鐘廊',            en: 'Queensway Plaza' },
    { id: 'C2', x: 16,  side: -1, zh: '的士站',            en: 'Taxi Stand' },
    { id: 'D',  x: -80, side: -1, zh: '統一中心',          en: 'United Centre' },
    { id: 'E1', x: 45,  side: 1,  zh: '樂禮街',           en: 'Rodney Street' },
    { id: 'E2', x: 58,  side: 1,  zh: '中信大廈',          en: 'CITIC Tower' },
    { id: 'F',  x: 66,  side: -1, zh: '太古廣場',          en: 'Pacific Place' },
  ],
  exitZ: 12.7,
  exitLetters: ['A', 'B', 'C', 'D', 'E', 'F'],

  lifts: [
    { frame: 'main', x: 12, z: -8.8, levels: ['L1', 'L2', 'L3'] },
    { frame: 'ext',  x: 55, z: -8.5, levels: ['L4', 'L5', 'L6'] },
  ],

  // Octopus gate lanes on the concourse paid/unpaid boundary (z = ±9.4)
  gateRows: [
    { z: -9.4, x0: -52, x1: -10 },
    { z: -9.4, x0: 10, x1: 52 },
    { z: 9.4, x0: -52, x1: -10 },
    { z: 9.4, x0: 10, x1: 52 },
  ],

  // U1 footbridge deck: a main spine + branch stubs + towers down to G.
  bridge: {
    y: 8,
    spine: { x0: -72, x1: 74, z0: -40, z1: -33 },
    connector: { x0: -30, x1: 60, z0: -33, z1: -20 },
    towers: [-58, -6, 62],
    buildings: [
      { x0: -78, x1: -62, z0: -62, z1: -44, h: 26, name: 'Admiralty Centre' },
      { x0: -16, x1:   4, z0: -64, z1: -44, h: 32, name: 'Queensway Plaza' },
      { x0:  58, x1:  76, z0: -62, z1: -44, h: 38, name: 'Government Offices' },
    ],
  },

  // Dedicated F&B tenants on the south shop row + the MTR mall entrance north.
  restaurants: [
    { x: -31,  side: 1, zh: '麥當勞',   en: "McDonald's",        color: '#da291c', mark: 'arches'  },
    { x: 3.5,  side: 1, zh: '元気寿司', en: 'Genki Sushi',       color: '#c8102e', mark: 'sushi'   },
    { x: 26.5, side: 1, zh: '點心酒樓', en: 'Dim Sum Restaurant', color: '#7a5b16', mark: 'steamer' },
  ],
  mall: { x: 2.5, side: -1, zh: '港鐵商場', en: 'MTR Malls', mark: 'mtr' },
  seven: { x: -19.5, side: -1, zh: '7-Eleven', en: '7-Eleven' },

  walkRects: {
    U1: [
      { x0: -70, z0: -39, x1: -60, z1: -34 },
      { x0: -56, z0: -39, x1: -8, z1: -34 },
      { x0: -4, z0: -39, x1: 60, z1: -34 },
      { x0: 64, z0: -39, x1: 72, z1: -34 },
      { x0: -28, z0: -32, x1: 58, z1: -21 },
    ],
    G: [{ x0: -88, z0: -28, x1: 88, z1: 28 }],
    L1: [{ x0: -80, z0: -19, x1: 80, z1: 19 }],
    L2: [{ x0: -90, z0: -4.9, x1: 90, z1: 4.9 }],
    L3: [{ x0: -90, z0: -4.9, x1: 90, z1: 4.9 }],
    L4: [{ x0: -10, z0: 5, x1: 88, z1: 35 }],
    L5: [{ x0: -105, z0: -4.9, x1: 105, z1: 4.9 }],
    L6: [{ x0: -108, z0: -12.6, x1: 108, z1: -7.4 }, { x0: -108, z0: 7.4, x1: 108, z1: 12.6 }],
  },

  people: { U1: 14, G: 16, L1: 58, L2: 44, L3: 44, L4: 24, L5: 24, L6: 18 },
};
