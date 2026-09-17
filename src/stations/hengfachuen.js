// Heng Fa Chuen Station 杏花邨 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/hfc.pdf).
// ~600 m east of Shau Kei Wan, the Island Line climbs to grade into
// Heng Fa Chuen: two side platforms at ground level beside Chai Wan
// Depot with the concourse on an elevated gallery deck (U1) spanning
// the tracks — exits are stairs dropping from the deck edges to the
// estate apron. Exits per Wikipedia: A1 Paradise Mall (West),
// A2 Paradise Mall (East).

export const HFC = {
  id: 'HFC', zh: '杏花邨', en: 'Heng Fa Chuen',
  livery: '#b23227',   // Heng Fa Chuen's vermillion / post-office red livery

  boxes: {
    hfcSite: { cx: 6600, cz: 0, len: 230, wid: 84, rot: 0 },  // G estate apron
    hfcConc: { cx: 6600, cz: 0, len: 150, wid: 36, rot: 0 },  // U1 gallery deck
    hfcPlat: { cx: 6600, cz: 0, len: 200, wid: 24, rot: 0 },  // G side platforms
  },

  levels: [
    { id: 'U1', y: 8, box: 'hfcConc', zh: '大堂',   en: 'Concourse',            type: 'concourse'},
    { id: 'G',  y: 0, box: 'hfcSite', zh: '地面',   en: 'Ground',               type: 'ground'   },
    { id: 'P',  y: 0, box: 'hfcPlat', zh: '月台・港島綫', en: 'Island Line Platform', type: 'platform' },
  ],

  // the platform box stands at grade inside the site — cut its footprint
  // out of the apron slab so the deck/boxes read through the excavation
  slabCuts: { G: [{ x0: -100, z0: -12, x1: 100, z1: 12 }] },

  platforms: {
    P: {
      kind: 'side',
      faces: [
        { num: 1, line: 'ISL', side: -1, dir: 1,  to: { zh: '往柴灣',     en: 'to Chai Wan' } },
        { num: 2, line: 'ISL', side: 1,  dir: -1, to: { zh: '往堅尼地城', en: 'to Kennedy Town' } },
      ],
    },
  },

  // gallery deck -> each side platform strip
  escalators: [
    { from: 'U1', to: 'P', frame: 'hfcPlat', cx: -30, cz: -8.6, dir: [-1, 0], n: 2 },  // P1 north
    { from: 'U1', to: 'P', frame: 'hfcPlat', cx:  30, cz:  8.6, dir: [ 1, 0], n: 2 },  // P2 south
  ],

  // exits drop off the deck edges: A1 north-east, A2 south-west (the plan
  // shows them on opposite deck edges; both serve Paradise Mall)
  exits: [
    { id: 'A1', x:  40, side: -1, zh: '杏花新城（西翼）', en: 'Paradise Mall (West)' },
    { id: 'A2', x: -40, side: 1,  zh: '杏花新城（東翼）', en: 'Paradise Mall (East)' },
  ],
  exitZ: 20,
  roadSide: -1,          // depot access road on the north apron; mall forecourt south
  exitLetters: ['A'],

  lifts: [
    { frame: 'hfcPlat', x: 0,   z: -9.5, levels: ['U1', 'P'] },  // paid lift — P1
    { frame: 'hfcPlat', x: 0,   z:  9.5, levels: ['U1', 'P'] },  // paid lift — P2
    { frame: 'hfcSite', x: -70, z:  15,  levels: ['U1', 'G'] },  // street lift — south
    { frame: 'hfcSite', x: 70,  z: -15,  levels: ['U1', 'G'] },  // street lift — north
  ],

  // paid gallery core between the two platform wells; unpaid edge bands
  // feed the exit stairs
  gateRows: [
    { z: -11.5, x0: -62, x1: -26 },
    { z: -11.5, x0: 26,  x1: 62 },
    { z: 11.5,  x0: -62, x1: -26 },
    { z: 11.5,  x0: 26,  x1: 62 },
  ],
  gateEnds: { x0: -68, x1: 68 },

  kioskXs:  [-52, -6, 30],   // north unpaid band (dodges A1 shaft at x=40)
  kioskXsS: [8, 30, 58],     // south unpaid band (dodges A2 shaft at x=-40)

  walkRects: {
    U1: [{ x0: -70, z0: -16, x1: 70, z1: 16 }],
    G:  [{ x0: -108, z0: 13,  x1: 108,  z1: 40 },
         { x0: -108, z0: -40, x1: 108,  z1: -13 },
         { x0: -108, z0: -40, x1: -101, z1: 40 },
         { x0: 101,  z0: -40, x1: 108,  z1: 40 }],
    P:  [{ x0: -92, z0: 7.2,   x1: 92, z1: 11.4 },
         { x0: -92, z0: -11.4, x1: 92, z1: -7.2 }],
  },

  people: { G: 12, U1: 36, P: 40 },
};
