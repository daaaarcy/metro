// Shau Kei Wan Station 筲箕灣 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/skw.pdf).
// ~600 m east of Sai Wan Ho under Shau Kei Wan Road / Mong Lung St.
// Single island platform on L2 (P1 -> Chai Wan, P2 -> Kennedy Town)
// with the plan's signature unpaid corridor fan — ten exits reaching
// the tram terminus, Main Street East, Aldrich Bay and the hillside.
// Exits per Wikipedia: A1 Perfect Mount Gdns, A2 Po Man St, A3 Bus
// Terminus; B1 Main St East, B2 Museum of Coastal Defence, B3 Aldrich
// Bay Rd; C Mong Lung St; D1 Tam Kung Temple/HK Art School,
// D2 Aldrich Garden.

export const SKW = {
  id: 'SKW', zh: '筲箕灣', en: 'Shau Kei Wan',
  livery: '#3d4f9e',   // Shau Kei Wan's indigo-blue mosaic tile livery

  boxes: {
    skwSite: { cx: 6000, cz: 0, len: 230, wid: 64, rot: 0 },  // G ground slab
    skwConc: { cx: 6000, cz: 0, len: 220, wid: 44, rot: 0 },  // L1 concourse
    skwP:    { cx: 6000, cz: 0, len: 200, wid: 24, rot: 0 },  // L2 ISL island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'skwSite', zh: '地面',   en: 'Ground',                 type: 'ground'   },
    { id: 'L1', y: -7,  box: 'skwConc', zh: '大堂',   en: 'Concourse',              type: 'concourse'},
    { id: 'L2', y: -14, box: 'skwP',    zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
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
    { from: 'L1', to: 'L2', frame: 'skwP', cx: -62, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'skwP', cx:  62, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // Exit fan: A-cluster south (Perfect Mount/Po Man St/Bus Terminus),
  // B-cluster north (Main St East/Coastal Defence Museum/Aldrich Bay),
  // C east (Mong Lung St), D west (Tam Kung Temple/Aldrich Garden).
  exits: [
    { id: 'A1', x: -90, side: 1,  zh: '峻峰花園',              en: 'Perfect Mount Gardens' },
    { id: 'A2', x: -74, side: 1,  zh: '寶文街',                en: 'Po Man Street' },
    { id: 'A3', x: -56, side: 1,  zh: '筲箕灣巴士總站',         en: 'Bus Terminus' },
    { id: 'B1', x: -50, side: -1, zh: '筲箕灣東大街',           en: 'Main Street East' },
    { id: 'B2', x: -66, side: -1, zh: '海防博物館',             en: 'Museum of Coastal Defence' },
    { id: 'B3', x: -84, side: -1, zh: '愛秩序灣道',             en: 'Aldrich Bay Road' },
    { id: 'C',  x: 92,  side: 1,  zh: '望隆街',                en: 'Mong Lung Street' },
    { id: 'D1', x: 62,  side: -1, zh: '譚公廟・香港藝術學院',    en: 'Tam Kung Temple · HK Art School' },
    { id: 'D2', x: 80,  side: -1, zh: '愛蝶灣',                en: 'Aldrich Garden' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D'],

  lifts: [
    { frame: 'skwConc', x: 0,   z: 0,   levels: ['L1', 'L2'] },        // paid lift
    { frame: 'skwConc', x: -96, z: 15,  levels: ['G', 'L1'] },          // street lift — A side
    { frame: 'skwConc', x: 96,  z: -15, levels: ['G', 'L1'] },          // street lift — D side
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
    G:  [{ x0: -108, z0: -28, x1: 108, z1: 28 }],
    L1: [{ x0: -102, z0: -19, x1: 102, z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
  },

  people: { G: 14, L1: 46, L2: 36 },
};
