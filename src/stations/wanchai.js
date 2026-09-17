// Wan Chai Station 灣仔 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/wac.pdf).
// Sits ~880 m east of Admiralty along the harbour-front axis (+X).
// Like Central, the Island Line platforms are stacked side platforms:
// L2 = platform 1 to Chai Wan (eastbound), L3 = platform 2 to Kennedy
// Town (westbound), each with the track on the north side of the box.
// The unpaid concourse (yellow on the official plan) wraps the paid core;
// exits fan to both sides of Hennessy Road.

export const WAC = {
  id: 'WAC', zh: '灣仔', en: 'Wan Chai',
  livery: '#a2c614',   // Wan Chai's lime-green mosaic tile livery

  boxes: {
    wacSite: { cx: 880, cz: 0, len: 190, wid: 64, rot: 0 },  // G ground slab
    wacConc: { cx: 880, cz: 0, len: 185, wid: 40, rot: 0 },  // L1 concourse
    wacP2:   { cx: 880, cz: 0, len: 190, wid: 18, rot: 0 },  // L2 ISL side platform (1)
    wacP3:   { cx: 880, cz: 0, len: 190, wid: 18, rot: 0 },  // L3 ISL side platform (2)
  },

  levels: [
    { id: 'G',  y: 0,   box: 'wacSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'wacConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'wacP2',   zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
    { id: 'L3', y: -21, box: 'wacP3',   zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
  ],

  // Per the official layout: L2 is a side platform (1 to Chai Wan), L3 the
  // second side platform (2 to Kennedy Town) stacked directly beneath it.
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

  // Escalators cascade concourse -> L2 -> L3 like the real station — the
  // plan's stair shafts drop through both platform levels in series.
  escalators: [
    { from: 'L1', to: 'L2', frame: 'wacP2', cx: -45, cz: 3, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'wacP2', cx:  30, cz: 3, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'wacP3', cx: -10, cz: 3, dir: [ 1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'wacP3', cx:  60, cz: 3, dir: [-1, 0], n: 2 },
  ],

  // Street stairs G -> L1 per the official exit list: A1–A5 + A along
  // Hennessy Road, B1 Southorn Centre / B2 Luard Road west, C Lockhart Road
  // Municipal Services Building at the west end, D Lee Tung Street east.
  exits: [
    { id: 'C',  x: -80, side: -1, zh: '駱克道市政大廈',   en: 'Lockhart Rd Municipal Services Bldg' },
    { id: 'B2', x: -56, side: -1, zh: '盧押道',           en: 'Luard Road' },
    { id: 'B1', x: -62, side: 1,  zh: '修頓中心・修頓球場', en: 'Southorn Centre · Southorn Playground' },
    { id: 'A2', x: -30, side: 1,  zh: '駱克道',           en: 'Lockhart Road' },
    { id: 'A1', x: -16, side: -1, zh: '莊士敦道',         en: 'Johnston Road' },
    { id: 'A',  x: 6,   side: 1,  zh: '軒尼詩道',         en: 'Hennessy Road' },
    { id: 'A3', x: 24,  side: -1, zh: '軒尼詩道',         en: 'Hennessy Road' },
    { id: 'A4', x: 46,  side: -1, zh: '太原街',           en: 'Tai Yuen Street' },
    { id: 'A5', x: 56,  side: 1,  zh: '皇后大道東',       en: "Queen's Road East" },
    { id: 'D',  x: 76,  side: 1,  zh: '利東街',           en: 'Lee Tung Street' },
  ],
  // shaft spans |z| exitZ±6.3 — landings must clear the shop row (±16.6)
  exitZ: 9,
  exitLetters: ['A', 'B', 'C', 'D'],

  lifts: [
    { frame: 'wacConc', x: 15, z: 2,    levels: ['L1', 'L2', 'L3'] },
    // street lift in the unpaid band beside exits A4/A5, per the plan's
    // lift icons on the Hennessy Road side
    { frame: 'wacConc', x: 50, z: 14.5, levels: ['G', 'L1'] },
  ],

  // Octopus gate lanes on the paid/unpaid boundary — the official plan's
  // unpaid band wraps the paid core, so gate banks sit at z = ±8.
  gateRows: [
    { z: -8, x0: -55, x1: -10 },
    { z: -8, x0: 10,  x1: 55 },
    { z: 8,  x0: -55, x1: -10 },
    { z: 8,  x0: 10,  x1: 55 },
  ],
  // end caps just clear of the B2/A5 stair shafts (x∈±[54.8,57.2]) so the
  // unpaid band wraps both ends like the plan's yellow ring
  gateEnds: { x0: -58.5, x1: 58.5 },

  walkRects: {
    G:  [{ x0: -88, z0: -28, x1: 88, z1: 28 }],
    L1: [{ x0: -86, z0: -17, x1: 86, z1: 17 }],
    L2: [{ x0: -88, z0: -0.6, x1: 88, z1: 6.6 }],
    L3: [{ x0: -88, z0: -0.6, x1: 88, z1: 6.6 }],
  },

  people: { G: 14, L1: 40, L2: 24, L3: 24 },
};
