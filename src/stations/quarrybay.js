// Quarry Bay Station 鰂魚涌 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/qub.pdf).
// ~600 m east of North Point under King's Road. Second ISL/TKO
// interchange — here the stacked islands split by LINE, not direction:
//   L2 upper island: P1 ISL -> Chai Wan + P2 ISL -> Kennedy Town
//   L3 lower island: P3 TKO -> Po Lam/LOHAS Park + P4 TKO -> North Point
// TKO through-trains run North Point terminus <-> Quarry Bay and
// reverse off-map east of QUB (toward the unbuilt Yau Tong portal).
// Exits per Wikipedia: A King's Rd/Taikoo Place (west), B Finnie St
// and C Model Lane/Harbour Plaza North Point (east).

export const QUB = {
  id: 'QUB', zh: '鰂魚涌', en: 'Quarry Bay',
  livery: '#00918e',   // Quarry Bay's teal mosaic tile livery

  boxes: {
    qubSite: { cx: 4200, cz: 0, len: 220, wid: 64, rot: 0 },  // G ground slab
    qubConc: { cx: 4200, cz: 0, len: 210, wid: 44, rot: 0 },  // L1 concourse
    qubP2:   { cx: 4200, cz: 0, len: 200, wid: 24, rot: 0 },  // L2 ISL island
    qubP3:   { cx: 4200, cz: 0, len: 200, wid: 24, rot: 0 },  // L3 TKO island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'qubSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'qubConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'qubP2',   zh: '月台・港島綫',   en: 'Island Line Platforms', type: 'platform' },
    { id: 'L3', y: -21, box: 'qubP3',   zh: '月台・將軍澳綫', en: 'Tseung Kwan O Line Platforms', type: 'platform' },
  ],

  platforms: {
    L2: {
      kind: 'island',
      faces: [
        { num: 1, line: 'ISL', side: -1, dir: 1,  to: { zh: '往柴灣',     en: 'to Chai Wan' } },
        { num: 2, line: 'ISL', side: 1,  dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
      ],
    },
    L3: {
      kind: 'island',
      faces: [
        { num: 4, line: 'TKO', side: -1, dir: -1, to: { zh: '往北角・終點站', en: 'to North Point terminus' } },
        { num: 3, line: 'TKO', side: 1,  dir: 1,  to: { zh: '往寶琳/康城',   en: 'to Po Lam/LOHAS Park' } },
      ],
    },
  },

  escalators: [
    { from: 'L1', to: 'L2', frame: 'qubP2', cx: -62, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'qubP2', cx:  62, cz: 0, dir: [ 1, 0], n: 3 },
    { from: 'L2', to: 'L3', frame: 'qubP3', cx: -82, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L2', to: 'L3', frame: 'qubP3', cx:  82, cz: 0, dir: [ 1, 0], n: 2 },
  ],

  // A west end south side (King's Rd/Taikoo Place); B/C east end —
  // Finnie St and Model Lane both surface on the north side.
  exits: [
    { id: 'A', x: -92, side: 1,  zh: '太古坊・英皇道',   en: "Taikoo Place · King's Rd" },
    { id: 'B', x: 80,  side: -1, zh: '芬尼街',         en: 'Finnie Street' },
    { id: 'C', x: 94,  side: -1, zh: '模範里・北角海逸酒店', en: 'Model Ln · Harbour Plaza' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C'],

  lifts: [
    { frame: 'qubConc', x: 0,   z: 0,   levels: ['L1', 'L2', 'L3'] },  // paid lift
    { frame: 'qubConc', x: -88, z: 15,  levels: ['G', 'L1'] },          // street lift — A side
    { frame: 'qubConc', x: 88,  z: -15, levels: ['G', 'L1'] },          // street lift — B/C side
  ],

  gateRows: [
    { z: -9, x0: -68, x1: -26 },
    { z: -9, x0: 26,  x1: 68 },
    { z: 9,  x0: -68, x1: -26 },
    { z: 9,  x0: 26,  x1: 68 },
  ],
  gateEnds: { x0: -74, x1: 74 },

  kioskXs:  [-44, -8, 34],
  kioskXsS: [-38, 8, 42],

  walkRects: {
    G:  [{ x0: -102, z0: -28, x1: 102, z1: 28 }],
    L1: [{ x0: -98,  z0: -19, x1: 98,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
    L3: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
  },

  people: { G: 10, L1: 44, L2: 36, L3: 36 },
};
