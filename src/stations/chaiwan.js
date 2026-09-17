// Chai Wan Station 柴灣 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/chw.pdf).
// Eastern terminus of the Island Line — the line's only elevated
// station: an island platform on a viaduct (U2) over a concourse deck
// (U1) carried on a podium block, with the public transport interchange
// and street exits at grade. Both faces dispatch toward Kennedy Town;
// the overrun tail continues east on the viaduct to buffer stops.
// Exits per Wikipedia: A New Jade Gardens/Industrial Area/Cape Collinson,
// B Cheung Lee St, C Public Transport Interchange, D Ning Foo St,
// E Hing Wah Estate.

export const CHW = {
  id: 'CHW', zh: '柴灣', en: 'Chai Wan',
  livery: '#3f6b4f',   // Chai Wan's deep green mosaic tile

  boxes: {
    chwSite: { cx: 7400, cz: 0, len: 230, wid: 84, rot: 0 },  // G apron + PTI
    chwConc: { cx: 7400, cz: 0, len: 150, wid: 40, rot: 0 },  // U1 elevated concourse
    chwPlat: { cx: 7400, cz: 0, len: 200, wid: 24, rot: 0 },  // U2 island platform
  },

  levels: [
    { id: 'U2', y: 15, box: 'chwPlat', zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
    { id: 'U1', y: 8,  box: 'chwConc', zh: '大堂',   en: 'Concourse', type: 'concourse', podium: 8 },
    { id: 'G',  y: 0,  box: 'chwSite', zh: '地面',   en: 'Ground',    type: 'ground'   },
  ],

  // Island platform on the viaduct: both faces are terminus departures
  // toward Kennedy Town (dir -1 = west portal out). Trains reverse via
  // the scissors move — out the west portal and back onto the other
  // face — while the physical tail track overruns EAST (tail: +1) to
  // buffer stops on the open viaduct.
  platforms: {
    U2: {
      kind: 'island', terminus: true, buffers: false, tail: 1,
      faces: [
        { num: 1, line: 'ISL', side: -1, dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
        { num: 2, line: 'ISL', side: 1,  dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
      ],
    },
  },

  // twin 3-lane banks CLIMB from the concourse (U1) up through the
  // platform slab onto the island — the well cuts U2's floor and U1's
  // ceiling rather than the usual descending pattern
  escalators: [
    { from: 'U1', to: 'U2', frame: 'chwPlat', cx: -30, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'U1', to: 'U2', frame: 'chwPlat', cx:  30, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // exits rise from the street aprons onto the deck edges (concourse is
  // above street, same 'up' shaft geometry as HFC). A + D on the north
  // apron; B + C + E south toward the interchange / estates.
  exits: [
    { id: 'A', x:  55, side: -1, zh: '新翠花園・柴灣工業邨', en: 'New Jade Gardens · Industrial Area' },
    { id: 'D', x: -55, side: -1, zh: '寧富街',              en: 'Ning Foo Street' },
    { id: 'B', x: -62, side: 1,  zh: '祥利街',              en: 'Cheung Lee Street' },
    { id: 'C', x:   0, side: 1,  zh: '公共運輸交匯處',       en: 'Public Transport Interchange' },
    { id: 'E', x:  62, side: 1,  zh: '興華邨',              en: 'Hing Wah Estate' },
  ],
  exitZ: 22,
  roadSide: 1,           // PTI / interchange forecourt on the south apron
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'chwPlat', x: 0,   z: 0,   levels: ['U1', 'U2'] },  // paid lift onto the island
    { frame: 'chwSite', x: -20, z: -18, levels: ['G', 'U1'] },   // street lift — north apron
    { frame: 'chwSite', x: 30,  z: 18,  levels: ['G', 'U1'] },   // street lift — PTI side
  ],

  // paid core between the gate lines feeds the escalator wells + lift;
  // unpaid edge bands carry the five exit stairs + street lifts
  gateRows: [
    { z: -9, x0: -66, x1: -28 },
    { z: -9, x0: 28,  x1: 66 },
    { z: 9,  x0: -66, x1: -28 },
    { z: 9,  x0: 28,  x1: 66 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  kioskXs:  [-46, -4, 38],        // north band — dodges A (55) and D (-55)
  kioskXsS: [-30, -48, 30],       // south band — dodges B (-62), C (0), E (62)

  walkRects: {
    G:  [{ x0: -108, z0: 16,  x1: 108,  z1: 40 },
         { x0: -108, z0: -40, x1: 108,  z1: -16 },
         { x0: -108, z0: -40, x1: -71,  z1: 40 },
         { x0: 71,   z0: -40, x1: 108,  z1: 40 }],
    U1: [{ x0: -70, z0: -18, x1: 70, z1: 18 }],
    U2: [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 14, U1: 38, U2: 34 },
};
