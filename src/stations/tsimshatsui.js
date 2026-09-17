// Tsim Sha Tsui Station 尖沙咀 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tst.pdf).
// On the Kowloon shore across the harbour from Admiralty — the first
// station on the far side, reached by the harbour-crossing tunnel leg.
// Single island platform (L2) under a concourse (L1) with the Nathan
// Road exit fan — twelve exits per Wikipedia (East TST's J/K/L/N/P set
// belongs to the separate station, not built here).
// Exits: A1 Kowloon Park, A2 Humphreys Ave; B1 Nathan Rd/The ONE,
// B2 Cameron Rd; C1 Nathan Rd, C2 Peking Rd; D1 Nathan Rd, D2 Carnarvon
// Rd, D3 K11; E Kowloon Hotel; H/R iSQUARE.
// Livery: dark green / yellow mosaic.

export const TST = {
  id: 'TST', zh: '尖沙咀', en: 'Tsim Sha Tsui',
  livery: '#1e3d2a',   // TST's near-black dark green tile (yellow accents)

  boxes: {
    tstSite: { cx: 320, cz: -880, len: 240, wid: 84, rot: 0 },  // G apron
    tstConc: { cx: 320, cz: -880, len: 190, wid: 44, rot: 0 },  // L1 concourse
    tstPlat: { cx: 320, cz: -880, len: 200, wid: 24, rot: 0 },  // L2 island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'tstSite', zh: '地面',       en: 'Ground',   type: 'ground'   },
    { id: 'L1', y: -7,  box: 'tstConc', zh: '大堂',       en: 'Concourse', type: 'concourse'},
    { id: 'L2', y: -14, box: 'tstPlat', zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform' },
  ],

  // Island platform — through station on the Nathan Rd corridor.
  // P1 dispatches north (dir +1) toward Jordan/Tsuen Wan; P2 south
  // (dir -1) toward Central. TWL northbound faces depart the east
  // portal everywhere along the line.
  platforms: {
    L2: {
      kind: 'island',
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
        { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
      ],
    },
  },

  escalators: [
    { from: 'L1', to: 'L2', frame: 'tstPlat', cx: -58, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'tstPlat', cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // exit fan along both sides of the Nathan Road spine — north (-z)
  // side serves Kowloon Park / The ONE / Cameron Rd; south (+z) side
  // serves Peking Rd / K11 / iSQUARE / the harbour hotels.
  exits: [
    { id: 'A1', x: -78, side: -1, zh: '九龍公園',        en: 'Kowloon Park' },
    { id: 'B1', x: -50, side: -1, zh: '彌敦道・The ONE', en: 'Nathan Road · The ONE' },
    { id: 'C1', x: -22, side: -1, zh: '彌敦道',          en: 'Nathan Road' },
    { id: 'D1', x:  8,  side: -1, zh: '彌敦道',          en: 'Nathan Road' },
    { id: 'B2', x: 36,  side: -1, zh: '金馬倫道',        en: 'Cameron Road' },
    { id: 'D2', x: 64,  side: -1, zh: '加拿分道',        en: 'Carnarvon Road' },
    { id: 'A2', x: -70, side: 1,  zh: '堪富利士道',      en: 'Humphreys Avenue' },
    { id: 'C2', x: -42, side: 1,  zh: '北京道',          en: 'Peking Road' },
    { id: 'E',  x: -14, side: 1,  zh: '九龍酒店',        en: 'Kowloon Hotel' },
    { id: 'D3', x: 14,  side: 1,  zh: 'K11 購物藝術館',  en: 'K11 Art Mall' },
    { id: 'H',  x: 42,  side: 1,  zh: 'iSQUARE',        en: 'iSQUARE' },
    { id: 'R',  x: 70,  side: 1,  zh: 'iSQUARE',        en: 'iSQUARE' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E', 'H', 'R'],

  lifts: [
    { frame: 'tstPlat', x: 0,   z: 0,   levels: ['L1', 'L2'] },         // paid lift
    { frame: 'tstConc', x: -86, z: -18, levels: ['G', 'L1'] },          // street lift — Kowloon Park side
    { frame: 'tstConc', x: 86,  z: 18,  levels: ['G', 'L1'] },          // street lift — harbour side
  ],

  gateRows: [
    { z: -9, x0: -62, x1: -24 },
    { z: -9, x0: 24,  x1: 62 },
    { z: 9,  x0: -62, x1: -24 },
    { z: 9,  x0: 24,  x1: 62 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  // kiosks dodge the exit stair shafts (x ±1.7 each side of every exit x)
  kioskXs:  [-64, -8, 22, 50],
  kioskXsS: [-56, -28, 0, 28, 56],

  walkRects: {
    G:  [{ x0: -112, z0: -38, x1: 112, z1: 38 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 22, L1: 56, L2: 44 },
};
