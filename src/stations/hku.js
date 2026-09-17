// HKU Station 香港大學 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/hku.pdf).
// West Island Line, opened Dec 2014 — the deepest station in the system
// (~70 m under the Mid-Levels). Island platform under a single concourse.
// A1, A2 and C1 are MTR's first lift-only exits — express lift towers up
// the hill; here each gets a rideable street lift beside its pavilion.
// Exits per Wikipedia: A1 Pok Fu Lam Rd / A2 HKU Main Campus, B1 Whitty
// St / B2 Hill Rd (north side), C1 The Belcher's / C2 Belcher's St.

export const HKU = {
  id: 'HKU', zh: '香港大學', en: 'HKU',
  livery: '#9bb03f',   // HKU's lime-green mosaic tile

  boxes: {
    hkuSite: { cx: -3550, cz: 0, len: 220, wid: 64, rot: 0 },  // G ground slab
    hkuConc: { cx: -3550, cz: 0, len: 210, wid: 44, rot: 0 },  // L1 concourse
    hkuP:    { cx: -3550, cz: 0, len: 200, wid: 24, rot: 0 },  // L2 ISL island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'hkuSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'hkuConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'hkuP',    zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
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

  // Two 3-lane banks drop from the concourse ends onto the island
  // platform centre, like the plan's twin escalator clusters.
  escalators: [
    { from: 'L1', to: 'L2', frame: 'hkuP', cx: -62, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'hkuP', cx:  62, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // Exit fan per Wikipedia — A exits east toward the university, B exits
  // north toward the harbour, C exits west toward The Belcher's. Shafts
  // keep clear of the escalator wells (x∈±[55,69]).
  exits: [
    { id: 'A1', x: 96,  side: -1, zh: '薄扶林道・聖保羅書院',   en: 'Pok Fu Lam Rd · St. Paul’s College' },
    { id: 'A2', x: 80,  side: 1,  zh: '香港大學本部校園',       en: 'HKU Main Campus' },
    { id: 'B1', x: -20, side: -1, zh: '屈地街・創業商場',       en: 'Whitty St · Chong Yip Centre' },
    { id: 'B2', x: 10,  side: -1, zh: '山道・香港商業中心',     en: 'Hill Rd · Hong Kong Plaza' },
    { id: 'C1', x: -16, side: 1,  zh: '寶翠園・百周年校園',     en: 'The Belcher’s · Centennial Campus' },
    { id: 'C2', x: -92, side: -1, zh: '卑路乍街・西寶城',       en: 'Belcher’s St · The Westwood' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C'],

  lifts: [
    { frame: 'hkuConc', x: -8,  z: 0,   levels: ['L1', 'L2'] },   // paid lift onto the island
    { frame: 'hkuConc', x: 91,  z: -15, levels: ['G', 'L1'] },    // A1 lift tower (lift-only exit)
    { frame: 'hkuConc', x: 75,  z: 15,  levels: ['G', 'L1'] },    // A2 lift tower (lift-only exit)
    { frame: 'hkuConc', x: -21, z: 15,  levels: ['G', 'L1'] },    // C1 lift tower (lift-only exit)
  ],

  // Octopus gate lanes on the paid core; the unpaid band wraps the ends
  // like the plan's yellow ring around each concourse blob.
  gateRows: [
    { z: -9, x0: -66, x1: -28 },
    { z: -9, x0: 28,  x1: 66 },
    { z: 9,  x0: -66, x1: -28 },
    { z: 9,  x0: 28,  x1: 66 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  kioskXs:  [-48, 0, 34],      // north band, dodging the exit shafts
  kioskXsS: [-40, 12, 50],     // south band

  walkRects: {
    G:  [{ x0: -102, z0: -28, x1: 102, z1: 28 }],
    L1: [{ x0: -98,  z0: -19, x1: 98,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
  },

  people: { G: 14, L1: 42, L2: 34 },
};
