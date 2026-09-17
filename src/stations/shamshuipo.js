// Sham Shui Po Station 深水埗 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/ssp.pdf) +
// Wikipedia. Under Cheung Sha Wan Rd at the Kweilin/Pei Ho junction —
// the market district: Apliu St electronics, Fuk Wa St stalls, the Pei
// Ho St municipal services building. Standard island platform; the
// temporary TWL north end for now — P1 berths arrivals from the east
// portal, wraps off-map and re-enters P2 to head back south. When
// Cheung Sha Wan lands, P1 goes through (dir +1) and terminus clears.
// Livery: dark green.
// Exits per the street map (8, all within the Kweilin/Pei Ho/Fuk
// Wa/Apliu quadrant): A1/A2 Kweilin St side, B1/B2 Pei Ho St market
// side, C1/C2 Apliu St side, D1/D2 Fuk Wa St side.

export const SSP = {
  id: 'SSP', zh: '深水埗', en: 'Sham Shui Po',
  livery: '#14532d',   // SSP's dark bottle-green mosaic

  boxes: {
    sspSite: { cx: 320, cz: -1480, len: 240, wid: 84, rot: 0 }, // G apron
    sspConc: { cx: 320, cz: -1480, len: 190, wid: 44, rot: 0 }, // L1 concourse
    sspPlat: { cx: 320, cz: -1480, len: 200, wid: 24, rot: 0 }, // L2 island
  },

  levels: [
    { id: 'G',  y: 0,   box: 'sspSite', zh: '地面',       en: 'Ground',   type: 'ground'   },
    { id: 'L1', y: -7,  box: 'sspConc', zh: '大堂',       en: 'Concourse', type: 'concourse'},
    { id: 'L2', y: -14, box: 'sspPlat', zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform' },
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
    { from: 'L1', to: 'L2', frame: 'sspPlat', cx: -58, cz: 0, dir: [-1, 0], n: 3 },
    { from: 'L1', to: 'L2', frame: 'sspPlat', cx:  58, cz: 0, dir: [ 1, 0], n: 3 },
  ],

  // the 8-exit fan — north (-z) side reaches Kweilin St / Pei Ho St
  // market; south (+z) side reaches Apliu St / Fuk Wa St / the bazaar
  exits: [
    { id: 'A1', x: -78, side: -1, zh: '桂林街・北河街',        en: 'Kweilin St · Pei Ho St' },
    { id: 'A2', x: -50, side: -1, zh: '桂林街',              en: 'Kweilin Street' },
    { id: 'B1', x: -16, side: -1, zh: '北河街市政大廈',        en: 'Pei Ho St MSB' },
    { id: 'B2', x:  14, side: -1, zh: '北河街街市',           en: 'Pei Ho Street Market' },
    { id: 'C1', x: -60, side: 1,  zh: '鴨寮街',              en: 'Apliu Street' },
    { id: 'C2', x: -30, side: 1,  zh: '鴨寮街電子市集',        en: 'Apliu St Electronics' },
    { id: 'D1', x:  30, side: 1,  zh: '福華街',              en: 'Fuk Wa Street' },
    { id: 'D2', x:  66, side: 1,  zh: '福華街・欽州街',        en: 'Fuk Wa St · Yen Chow St' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D'],

  lifts: [
    { frame: 'sspPlat', x: 0,   z: 0,   levels: ['L1', 'L2'] },         // paid lift
    { frame: 'sspConc', x: -86, z: -18, levels: ['G', 'L1'] },          // street lift — Kweilin side
    { frame: 'sspConc', x: 86,  z: 18,  levels: ['G', 'L1'] },          // street lift — Yen Chow side
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
