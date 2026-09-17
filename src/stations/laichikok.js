// Lai Chi Kok Station 荔枝角 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/lck.pdf) +
// Wikipedia. Under Cheung Sha Wan Rd by Cheung Sha Wan Plaza — the
// garment-district showrooms turned D2 Place creative quarter, with
// the sports ground east and Hoi Lai Estate / the wholesale market
// west. Standard island platform; the temporary TWL north end for
// now — P1 berths arrivals from the east portal, wraps off-map and
// re-enters P2 to head back south. When Mei Foo lands, P1 goes
// through (dir +1) and terminus clears. Livery: orange-red (the
// lychee's skin).
// Exits (8): A Cheung Sha Wan Plaza / sports ground, B1/B2 Tai Nam
// West St, C Tung Chau West St, D1/D2 D2 Place / police station,
// D3 Liberte, D4 Lai Chi Kok Rd / Hoi Lai Estate.

export const LCK = {
  id: 'LCK', zh: '荔枝角', en: 'Lai Chi Kok',
  livery: '#c2410c',   // LCK's orange-red mosaic

  boxes: {
    lckSite: { cx: 320, cz: -1720, len: 240, wid: 84, rot: 0 }, // G apron
    lckConc: { cx: 320, cz: -1720, len: 190, wid: 44, rot: 0 }, // L1 concourse
    lckPlat: { cx: 320, cz: -1720, len: 200, wid: 24, rot: 0 }, // L2 island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'lckSite', zh: '地面',       en: 'Ground',   type: 'ground'   },
    { id: 'L1', y: -7,  box: 'lckConc', zh: '大堂',       en: 'Concourse', type: 'concourse'},
    { id: 'L2', y: -14, box: 'lckPlat', zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform' },
  ],

  // Island platform. Temporary TWL north end — P1 berths the arrival
  // (dir +1, east portal) and the consist wraps off-map to P2 for the
  // run back south (dir -1, west portal).
  platforms: {
    L2: {
      kind: 'island', terminus: true,
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
        { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
      ],
    },
  },

  escalators: [
    { from: 'L1', to: 'L2', frame: 'lckPlat', cx: -58, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'lckPlat', cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // exits — north (-z) side reaches CSW Rd / Tai Nam West St / the
  // sports ground; south (+z) side reaches D2 Place / Liberte / Lai
  // Chi Kok Rd
  exits: [
    { id: 'A',  x: -72, side: -1, zh: '長沙灣廣場・體育館',     en: 'CSW Plaza · Sports Ground' },
    { id: 'B1', x: -44, side: -1, zh: '大南西街',              en: 'Tai Nam West Street' },
    { id: 'B2', x: -16, side: -1, zh: '長沙灣道',              en: 'Cheung Sha Wan Road' },
    { id: 'C',  x:  20, side: -1, zh: '通州西街',              en: 'Tung Chau West Street' },
    { id: 'D1', x: -50, side: 1,  zh: 'D2 Place',            en: 'D2 Place' },
    { id: 'D2', x: -18, side: 1,  zh: 'D2 Place・警署',       en: 'D2 Place · Police Stn' },
    { id: 'D3', x:  26, side: 1,  zh: '昇悅居',               en: 'Liberte' },
    { id: 'D4', x:  62, side: 1,  zh: '荔枝角道・海麗邨',      en: 'Lai Chi Kok Rd · Hoi Lai' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D'],

  lifts: [
    { frame: 'lckPlat', x: 0,   z: 0,   levels: ['L1', 'L2'] },         // paid lift
    { frame: 'lckConc', x: -86, z: -18, levels: ['G', 'L1'] },          // street lift — Tai Nam side
    { frame: 'lckConc', x: 86,  z: 18,  levels: ['G', 'L1'] },          // street lift — D2 side
  ],

  gateRows: [
    { z: -9, x0: -62, x1: -24 },
    { z: -9, x0: 24,  x1: 62 },
    { z: 9,  x0: -62, x1: -24 },
    { z: 9,  x0: 24,  x1: 62 },
  ],
  gateEnds: { x0: -72, x1: 72 },

  kioskXs:  [-44, 8, 58],
  kioskXsS: [-24, 40, 78],

  walkRects: {
    G:  [{ x0: -112, z0: -38, x1: 112, z1: 38 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 20, L1: 54, L2: 40 },
};
