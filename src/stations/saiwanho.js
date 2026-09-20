// Sai Wan Ho Station 西灣河 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/swh.pdf).
// ~600 m east of Tai Koo under Shau Kei Wan Road. Single island
// platform on L2 (P1 -> Chai Wan, P2 -> Kennedy Town); two exits —
// A Tai On Street (south side) and B Shau Kei Wan Road (north side).

export const SWH = {
  id: 'SWH', zh: '西灣河', en: 'Sai Wan Ho',
  livery: '#e8c832',   // Sai Wan Ho's yellow mosaic tile livery

  boxes: {
    swhSite: { cx: 5400, cz: 0, len: 220, wid: 64, rot: 0 },  // G ground slab
    swhConc: { cx: 5400, cz: 0, len: 210, wid: 44, rot: 0 },  // L1 concourse
    swhP:    { cx: 5400, cz: 0, len: 200, wid: 24, rot: 0 },  // L2 ISL island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'swhSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'swhConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'swhP',    zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
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

  escalators: [
    { from: 'L1', to: 'L2', frame: 'swhP', cx: -62, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'swhP', cx:  62, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  exits: [
    { id: 'A', x: 60,  side: 1,  zh: '太安街・愛秩序灣',   en: 'Tai On St · Aldrich Bay' },
    { id: 'B', x: -60, side: -1, zh: '筲箕灣道・海灣華庭', en: 'Shau Kei Wan Rd' },
    { id: 'C', x: 60,  side: -1, zh: '海晏街・阿公岩道',   en: 'Hoi An St · A Kung Ngam Rd' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C'],

  lifts: [
    { frame: 'swhConc', x: 0,   z: 0,   levels: ['L1', 'L2'] },        // paid lift
    { frame: 'swhConc', x: 76,  z: 15,  levels: ['G', 'L1'] },          // street lift — A side
    { frame: 'swhConc', x: -76, z: -15, levels: ['G', 'L1'] },          // street lift — B side
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
  },

  people: { G: 10, L1: 30, L2: 26 },
};
