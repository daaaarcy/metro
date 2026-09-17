// Mei Foo Station 美孚 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/mef.pdf) + Wikipedia. The
// two-part interchange: the Tsuen Wan Line island sits at L3 under the
// Mei Foo Sun Chuen estate plaza, while the Tuen Ma Line runs in a
// covered box at grade by Lai Chi Kok Park — the two concourses are far
// apart, joined by the L1 subway (the real walk is 5–10 min). Temporary
// TWL north end: P3 berths arrivals from the east portal, wraps off-map
// and re-enters P4 to head back south. When Lai King lands, P3 goes
// through and terminus clears. Livery: blue mosaic (TWL side); the TML
// shed runs white.
// Exits (8): A Mei Foo Sun Chuen / Broadway, B Mount Sterling Mall,
// C1 Lai Wan Rd, C2 Humbert St, E Lai Wan Rd / park (all TWL side,
// stair shafts G→L1); D park / F estate / G Lai King Hill Rd — street
// doors straight into the TML box.

export const MEF = {
  id: 'MEF', zh: '美孚', en: 'Mei Foo',
  livery: '#1c69d4',   // MEF's blue mosaic (TWL side)

  boxes: {
    mefSite: { cx: 190, cz: -1840, len: 500, wid: 84, rot: 0 }, // G apron — estate plaza, wraps the TML box
    mefConc: { cx: 320, cz: -1840, len: 190, wid: 44, rot: 0 }, // L1 concourse
    mefPlat: { cx: 320, cz: -1840, len: 200, wid: 24, rot: 0 }, // L3 island
    mefTml:  { cx: 60,  cz: -1840, len: 200, wid: 30, rot: 0 }, // P — covered at-grade TML box
  },

  levels: [
    { id: 'G',  y: 0,   box: 'mefSite', zh: '地面',          en: 'Ground',                type: 'ground'   },
    { id: 'P',  y: 0,   box: 'mefTml',  zh: '月台・屯馬綫',  en: 'Tuen Ma Line Platform',   type: 'platform', livery: '#dcdcdc' },
    { id: 'L1', y: -7,  box: 'mefConc', zh: '大堂',          en: 'Concourse',              type: 'concourse'},
    { id: 'L3', y: -21, box: 'mefPlat', zh: '月台・荃灣綫',  en: 'Tsuen Wan Line Platform', type: 'platform' },
  ],

  // TML: side platforms at grade in the covered box — P1 to Tuen Mun
  // (west portal), P2 to Wu Kai Sha (east portal); no service until the
  // line extends (Nam Cheong / Tsuen Wan West aren't built).
  // TWL: island at L3, temporary terminus — P3 berths the arrival
  // (dir +1, east portal), wraps off-map to P4 for the run back south.
  platforms: {
    P: {
      kind: 'side',
      faces: [
        { num: 1, line: 'TML', side: -1, dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
        { num: 2, line: 'TML', side:  1, dir:  1, to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
      ],
    },
    L3: {
      kind: 'island', terminus: true,
      faces: [
        { num: 3, line: 'TWL', side: -1, dir: 1,  to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
        { num: 4, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
      ],
    },
  },

  // The L1 subway (built in builders/link.js) mouths through the
  // concourse west wall and surfaces via a stair through the TML slab
  // onto P1's east end.
  slabCuts: {
    G: [{ x0: -232, z0: -15.8, x1: -28, z1: 15.8 }],   // TML shed footprint cut from the apron
    P: [{ x0: 75, z0: -11.2, x1: 98, z1: -7.2 }],      // subway stair shaft onto the north platform
  },

  // L1->L3 is a 14 m drop — deep-station express escalators (runLen
  // override keeps the standard ~29° slope over the doubled drop).
  escalators: [
    { from: 'L1', to: 'L3', frame: 'mefPlat', cx: -58, cz: 0, dir: [-1, 0], n: 3, runLen: 26 },
    { from: 'L1', to: 'L3', frame: 'mefPlat', cx:  58, cz: 0, dir: [ 1, 0], n: 3, runLen: 26 },
  ],

  // TWL-side exits stair down into the L1 unpaid bands (x in the site
  // frame — the shafts land inside the concourse box, ~130 m east of
  // the apron centre). D/F/G are street doors in the TML shed's walls.
  exits: [
    { id: 'A',  x:  60, side: 1,  zh: '美孚新邨・百老滙',   en: 'Mei Foo Sun Chuen · Broadway' },
    { id: 'B',  x: 110, side: 1,  zh: '美孚廣場',           en: 'Mount Sterling Mall' },
    { id: 'C1', x: 170, side: -1, zh: '荔灣道',             en: 'Lai Wan Road' },
    { id: 'C2', x: 205, side: -1, zh: '亨柏街',             en: 'Humbert Street' },
    { id: 'E',  x:  40, side: -1, zh: '荔灣道・荔枝角公園', en: 'Lai Wan Rd · Lai Chi Kok Park' },
    { id: 'D',  box: 'mefTml', door: true, x:  40, side: -1, zh: '荔枝角公園', en: 'Lai Chi Kok Park' },
    { id: 'F',  box: 'mefTml', door: true, x: -20, side:  1, zh: '美孚新邨',   en: 'Mei Foo Sun Chuen' },
    { id: 'G',  box: 'mefTml', door: true, x: -70, side: -1, zh: '荔景山路',   en: 'Lai King Hill Road' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],

  lifts: [
    { frame: 'mefPlat', x: 0,   z: 0,   levels: ['L1', 'L3'] },          // paid lift (14 m shaft)
    { frame: 'mefConc', x: -86, z: -18, levels: ['G', 'L1'] },           // street lift — park side
    { frame: 'mefConc', x:  86, z: 18,  levels: ['G', 'L1'] },           // street lift — estate side
  ],

  // Paid strip widened to z ±12 so the subway mouth (west wall,
  // z -11.5..-4.5) lands inside it — the link is paid-to-paid.
  gateRows: [
    { z: -12, x0: -62, x1: -24 },
    { z: -12, x0: 24,  x1: 62 },
    { z: 12,  x0: -62, x1: -24 },
    { z: 12,  x0: 24,  x1: 62 },
  ],
  gateEnds: { x0: 'wall', x1: 72 },

  kioskXs:  [-44, 8, 58],
  kioskXsS: [-24, 40, 78],

  walkRects: {
    // apron wraps the TML shed — walkers route around its footprint
    G:  [{ x0: -26, z0: -38, x1: 245, z1: 38 },
         { x0: -245, z0: -38, x1: -26, z1: -17 },
         { x0: -245, z0: 17,  x1: -26, z1: 38 },
         { x0: -245, z0: -17, x1: -234, z1: 17 }],
    // side platforms: bands inside the walls, north band ends short of
    // the subway stair opening
    P:  [{ x0: -95, z0: -14.4, x1: 70,  z1: -7.2 },
         { x0: -95, z0: 7.2,   x1: 95,  z1: 14.4 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L3: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 30, P: 36, L1: 54, L3: 44 },
};
