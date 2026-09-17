// Fortress Hill Station 炮台山 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/foh.pdf).
// ~500 m east of Tin Hau under King's Road. Like TIH the Island Line
// platforms are stacked side tubes (some of the longest escalators in
// the system link them to the concourse): L2 = platform 1 to Chai Wan
// (eastbound), L3 = platform 2 to Kennedy Town (westbound).
// Exits per Wikipedia: A (AIA Tower / Citicorp Centre, west) and B
// (Olympia Plaza / Electric Centre, east — reached via the King's Rd
// footbridge to Fuk Yuen St / Electric Rd).

export const FOH = {
  id: 'FOH', zh: '炮台山', en: 'Fortress Hill',
  livery: '#166b3a',   // Fortress Hill's dark-green mosaic tile livery

  boxes: {
    fohSite: { cx: 2900, cz: 0, len: 220, wid: 64, rot: 0 },  // G ground slab
    fohConc: { cx: 2900, cz: 0, len: 200, wid: 40, rot: 0 },  // L1 concourse
    fohP2:   { cx: 2900, cz: 0, len: 190, wid: 18, rot: 0 },  // L2 ISL side platform (1)
    fohP3:   { cx: 2900, cz: 0, len: 190, wid: 18, rot: 0 },  // L3 ISL side platform (2)
  },

  levels: [
    { id: 'G',  y: 0,   box: 'fohSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'fohConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'fohP2',   zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
    { id: 'L3', y: -21, box: 'fohP3',   zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
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

  // Some of the longest escalators in the system link concourse to the
  // platform tubes — twin cascades L1 -> L2 -> L3 at both ends.
  escalators: [
    { from: 'L1', to: 'L2', frame: 'fohP2', cx: -60, cz: 3, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'fohP2', cx:  60, cz: 3, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'fohP3', cx: -80, cz: 3, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'fohP3', cx:  80, cz: 3, dir: [ 1, 0], n: 2 },
  ],

  // A west toward AIA Tower (north side), B east toward Olympia Plaza /
  // the Electric Rd footbridge (north side on the plan). Shafts clear
  // the escalator wells (x∈±[52.8,67.2] upper, ±[72.8,87.2] lower).
  exits: [
    { id: 'A', x: -88, side: -1, zh: '友邦廣場・萬國寶通中心', en: 'AIA Tower · Citicorp Centre' },
    { id: 'B', x: 92,  side: -1, zh: '康澤花園・電氣道',       en: 'Olympia Plaza · Electric Rd' },
  ],
  exitZ: 9,
  exitLetters: ['A', 'B'],

  lifts: [
    { frame: 'fohConc', x: 45,  z: 2,    levels: ['L1', 'L2', 'L3'] },  // paid lift, east half
    { frame: 'fohConc', x: -96, z: -14.5, levels: ['G', 'L1'] },         // street lift — A side
    { frame: 'fohConc', x: 84,  z: -14.5, levels: ['G', 'L1'] },         // street lift — B side
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

  kioskXs: [-46, -6, 30],      // north band — between the two shafts
  kioskXsS: [-40, 10, 56],     // south band

  walkRects: {
    G:  [{ x0: -102, z0: -28, x1: 102, z1: 28 }],
    L1: [{ x0: -94,  z0: -17, x1: 94,  z1: 17 }],
    L2: [{ x0: -88,  z0: -0.6, x1: 88, z1: 6.6 }],
    L3: [{ x0: -88,  z0: -0.6, x1: 88, z1: 6.6 }],
  },

  people: { G: 8, L1: 26, L2: 18, L3: 18 },
};
