// Kwai Hing Station 葵興 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/kwh.pdf) + Wikipedia. Second of
// the TWL's three elevated stations, structurally a twin of Kwai Fong:
// opposed side platforms on the U1 viaduct deck over a concourse building
// at grade — each side has its own escalator bank and riders come back
// down through the concourse to change direction. Exits A–D are street
// doors in the ground concourse; E is the footbridge off P1's north edge
// to Kowloon Commerce Centre (deck + stair stub built in builders/link.js).
// Temporary TWL north end: P1 berths arrivals, wraps off-map and re-enters
// P2 to head back south. Livery: bright yellow.
// Exits (5): A Kwai Hing Estate, B Transport Interchange / Kwai Hing
// Government Offices, C Kwai Hong Court, D Sun Kwai Hing Gardens,
// E Kowloon Commerce Centre footbridge.

export const KWH = {
  id: 'KWH', zh: '葵興', en: 'Kwai Hing',
  livery: '#eab308',   // KWH's bright yellow

  boxes: {
    kwhSite: { cx: 320, cz: -2200, len: 240, wid: 96, rot: 0 }, // G apron
    kwhConc: { cx: 320, cz: -2200, len: 150, wid: 30, rot: 0 }, // G concourse at grade
    kwhPlat: { cx: 320, cz: -2200, len: 200, wid: 24, rot: 0 }, // U1 side platforms on the viaduct
  },

  levels: [
    { id: 'G',  y: 0, box: 'kwhSite', zh: '地面',        en: 'Ground',                type: 'ground'    },
    { id: 'GC', y: 0, box: 'kwhConc', zh: '大堂',        en: 'Concourse',             type: 'concourse' },
    { id: 'U1', y: 8, box: 'kwhPlat', zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform'  },
  ],

  // Opposed side platforms flanking the track pair — P1 northbound to
  // Tsuen Wan (via Tai Wo Hau), P2 southbound to Central (via Kwai Fong).
  // Temporary terminus: P1 berths arrivals, wraps off-map to P2.
  platforms: {
    U1: {
      kind: 'side', terminus: true,
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '往荃灣', en: 'to Tsuen Wan' } },
        { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
      ],
    },
  },

  // Concourse footprint cut from the apron slab (the building sits in
  // the dig like HFC's platform box).
  slabCuts: { G: [{ x0: -76, z0: -15.5, x1: 76, z1: 15.5 }] },

  // Opposed platforms need a bank per side — riders can't cross the
  // tracks: west bank serves P1 (north edge), east bank P2.
  escalators: [
    { from: 'GC', to: 'U1', frame: 'kwhPlat', cx: -30, cz: -9.2, dir: [-1, 0], n: 2 },
    { from: 'GC', to: 'U1', frame: 'kwhPlat', cx:  30, cz:  9.2, dir: [ 1, 0], n: 2 },
  ],

  // A–D are street doors in the ground concourse walls; E is the
  // doorway onto the Kowloon Commerce Centre footbridge off P1's
  // north edge.
  exits: [
    { id: 'A',  x: -50, side: -1, door: true, box: 'kwhConc', zh: '葵興邨',           en: 'Kwai Hing Estate' },
    { id: 'B',  x:  40, side: -1, door: true, box: 'kwhConc', zh: '葵興政府合署',      en: 'Kwai Hing Govt Offices' },
    { id: 'C',  x: -40, side:  1, door: true, box: 'kwhConc', zh: '葵康苑',           en: 'Kwai Hong Court' },
    { id: 'D',  x:  50, side:  1, door: true, box: 'kwhConc', zh: '新葵興花園',        en: 'Sun Kwai Hing Gardens' },
    { id: 'E',  x:  94, side: -1, door: true, box: 'kwhPlat', zh: '九龍貿易中心',      en: 'Kowloon Commerce Centre' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'kwhPlat', x: 50, z: -9.4, levels: ['GC', 'U1'] },  // paid lift onto P1
  ],

  // gate line splits the grade concourse — unpaid edge bands carry the
  // street doors
  gateRows: [
    { z: -8, x0: -58, x1: -20 },
    { z: -8, x0:  20, x1:  58 },
    { z:  8, x0: -58, x1: -20 },
    { z:  8, x0:  20, x1:  58 },
  ],
  gateEnds: { x0: 'wall', x1: 66 },

  kioskXs:  [-34, 6, 58],
  kioskXsS: [-50, -6, 34],

  walkRects: {
    G:  [{ x0: -112, z0: -46, x1: 112, z1: -16 },
         { x0: -112, z0: 16,  x1: 112, z1: 46 },
         { x0: -112, z0: -16, x1: -78, z1: 16 },
         { x0: 78,   z0: -16, x1: 112, z1: 16 }],
    GC: [{ x0: -71, z0: -12.5, x1: 71, z1: 12.5 }],
    U1: [{ x0: -92, z0: -11.3, x1: 92, z1: -7.4 },
         { x0: -92, z0: 7.4,   x1: 92, z1: 11.3 }],
  },

  people: { G: 24, GC: 40, U1: 36 },
};
