// Cheung Sha Wan Station 長沙灣 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/csw.pdf) +
// Wikipedia. Under Cheung Sha Wan Rd between Tonkin St and Fat Tseung
// St — garment wholesale district gone startup/industrial-loft, with
// Un Chau Estate and the Cheung Sha Wan wholesale markets west, IVE
// (Haking Wong) and the playground east. Standard island platform;
// the temporary TWL north end for now — P1 berths arrivals from the
// east portal, wraps off-map and re-enters P2 to head back south.
// When Lai Chi Kok lands, P1 goes through (dir +1) and terminus
// clears. Livery: mustard yellow / brown.
// Exits (6): A1 Cheung Sha Wan Rd, A2 Tonkin St, A3 Tonkin St (Lei
// Cheng Uk Han Tomb / Cheung Sha Wan Estate — lift podium), B Fat
// Tseung St (playground / IVE), C1 Wing Lung St, C2 Un Chau Estate.

export const CSW = {
  id: 'CSW', zh: '長沙灣', en: 'Cheung Sha Wan',
  livery: '#a16207',   // CSW's mustard-yellow/brown mosaic

  boxes: {
    cswSite: { cx: 320, cz: -1600, len: 240, wid: 84, rot: 0 }, // G apron
    cswConc: { cx: 320, cz: -1600, len: 190, wid: 44, rot: 0 }, // L1 concourse
    cswPlat: { cx: 320, cz: -1600, len: 200, wid: 24, rot: 0 }, // L2 island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'cswSite', zh: '地面',       en: 'Ground',   type: 'ground'   },
    { id: 'L1', y: -7,  box: 'cswConc', zh: '大堂',       en: 'Concourse', type: 'concourse'},
    { id: 'L2', y: -14, box: 'cswPlat', zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform' },
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
    { from: 'L1', to: 'L2', frame: 'cswPlat', cx: -58, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'cswPlat', cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // exits — north (-z) side reaches Cheung Sha Wan Rd / Tonkin St /
  // Fat Tseung St; south (+z) side reaches Wing Lung St / Un Chau
  exits: [
    { id: 'A1', x: -70, side: -1, zh: '長沙灣道',             en: 'Cheung Sha Wan Road' },
    { id: 'A2', x: -38, side: -1, zh: '東京街',              en: 'Tonkin Street' },
    { id: 'A3', x:  -8, side: -1, zh: '東京街・李鄭屋漢墓',   en: 'Tonkin St · Han Tomb' },
    { id: 'B',  x:  40, side: -1, zh: '發祥街・保安道遊樂場', en: 'Fat Tseung St · Playground' },
    { id: 'C1', x: -30, side: 1,  zh: '永隆街',              en: 'Wing Lung Street' },
    { id: 'C2', x:  30, side: 1,  zh: '元州邨',              en: 'Un Chau Estate' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C'],

  lifts: [
    { frame: 'cswPlat', x: 0,   z: 0,   levels: ['L1', 'L2'] },         // paid lift
    { frame: 'cswConc', x: -86, z: -18, levels: ['G', 'L1'] },          // street lift — Tonkin side
    { frame: 'cswConc', x: 86,  z: 18,  levels: ['G', 'L1'] },          // street lift — Un Chau side
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
