// Tin Hau Station 天后 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tih.pdf).
// ~600 m east of Causeway Bay under King's Road. Space under the road
// is tight, so the Island Line platforms are stacked side platforms:
// L2 = platform 1 to Chai Wan (eastbound), L3 = platform 2 to Kennedy
// Town (westbound). A walkway level above the concourse feeds the exit
// fan — folded into L1 here. Exits per Wikipedia: A1 King's Rd,
// A2 Victoria Park, B Central Library (wheelchair stair-lift side).

export const TIH = {
  id: 'TIH', zh: '天后', en: 'Tin Hau',
  livery: '#ee6b1a',   // Tin Hau's neon-orange mosaic tile livery

  boxes: {
    tihSite: { cx: 2400, cz: 0, len: 220, wid: 64, rot: 0 },  // G ground slab
    tihConc: { cx: 2400, cz: 0, len: 200, wid: 40, rot: 0 },  // L1 concourse
    tihP2:   { cx: 2400, cz: 0, len: 190, wid: 18, rot: 0 },  // L2 ISL side platform (1)
    tihP3:   { cx: 2400, cz: 0, len: 190, wid: 18, rot: 0 },  // L3 ISL side platform (2)
  },

  levels: [
    { id: 'G',  y: 0,   box: 'tihSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'tihConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'tihP2',   zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
    { id: 'L3', y: -21, box: 'tihP3',   zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
  ],

  platforms: {
    L2: {
      kind: 'single', single: { track: -1, side: 1 },
      faces: [
        { num: 1, line: 'ISL', side: 1, dir: 1, to: { zh: '往柴灣', en: 'to Chai Wan' } },
      ],
    },
    L3: {
      kind: 'single', single: { track: -1, side: 1 },
      faces: [
        { num: 2, line: 'ISL', side: 1, dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
      ],
    },
  },

  // Escalator cascades at both ends: concourse -> L2 -> L3, like the
  // plan's twin diagonal drops on the east side of each tube.
  escalators: [
    { from: 'L1', to: 'L2', frame: 'tihP2', cx: -60, cz: 3, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'tihP2', cx:  60, cz: 3, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'tihP3', cx: -80, cz: 3, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'tihP3', cx:  80, cz: 3, dir: [ 1, 0], n: 2 },
  ],

  // A1/A2 fan west toward King's Rd + Victoria Park (north side), B east
  // on the library side (south). Shafts clear the escalator wells.
  exits: [
    { id: 'A1', x: -88,  side: -1, zh: '英皇道・留仙街',     en: 'King’s Rd · Lau Sin St' },
    { id: 'A2', x: -44,  side: -1, zh: '維多利亞公園・中央圖書館對面', en: 'Victoria Park · Causeway Bay Market' },
    { id: 'B',  x: 76,   side: 1,  zh: '香港中央圖書館',     en: 'Hong Kong Central Library' },
  ],
  exitZ: 9,
  exitLetters: ['A', 'B'],

  lifts: [
    { frame: 'tihConc', x: 45,  z: 2,    levels: ['L1', 'L2', 'L3'] },  // paid lift, east half
    { frame: 'tihConc', x: 88,  z: 14.5, levels: ['G', 'L1'] },          // street lift — B/library side
    { frame: 'tihConc', x: -88, z: -14.5, levels: ['G', 'L1'] },         // street lift — Victoria Park side
  ],

  // Gate banks on the paid/unpaid boundary; the band wraps the strip's
  // ends like the plan's yellow ring around each paid blob.
  gateRows: [
    { z: -8, x0: -68, x1: -24 },
    { z: -8, x0: 24,  x1: 68 },
    { z: 8,  x0: -68, x1: -24 },
    { z: 8,  x0: 24,  x1: 68 },
  ],
  gateEnds: { x0: -74, x1: 74 },

  kioskXs: [-52, -6, 40],      // north band, dodging the exit shafts
  kioskXsS: [-46, 8, 52],      // south band

  walkRects: {
    G:  [{ x0: -102, z0: -28, x1: 102, z1: 28 }],
    L1: [{ x0: -94,  z0: -17, x1: 94,  z1: 17 }],
    L2: [{ x0: -88,  z0: -0.6, x1: 88, z1: 6.6 }],
    L3: [{ x0: -88,  z0: -0.6, x1: 88, z1: 6.6 }],
  },

  people: { G: 10, L1: 30, L2: 20, L3: 20 },
};
