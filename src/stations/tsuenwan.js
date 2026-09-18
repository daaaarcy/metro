// Tsuen Wan Station 荃灣 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tsw.pdf) + Wikipedia.
// The TWL's north-western terminus and its ONLY at-grade station: two
// side platforms flank the track pair at ground level under an elevated
// gallery concourse (U1) spanning the tracks — the same form as Heng Fa
// Chuen. P1 is the alighting platform; the overrun tail continues past
// the east throat toward Tsuen Wan Depot's sidings. Exits D/E are
// street doors straight off P1 (the "leave without going up" exits).
// Livery: dark red.
// Exits (per Wikipedia): A1 Luk Yeung/Bus Terminus, A2 Nan Fung Centre/
// Town Hall, B Panda Hotel/Chung On St, C Discovery Park/Govt Offices
// (all off the U1 gallery); D minibus stops + E Sam Tung Uk Museum at
// platform level on P1's north edge.

export const TSW = {
  id: 'TSW', zh: '荃灣', en: 'Tsuen Wan',
  livery: '#7f1d1d',   // Tsuen Wan's dark red mosaic

  boxes: {
    tswSite: { cx: 320, cz: -2440, len: 240, wid: 84, rot: 0 },  // G apron
    tswConc: { cx: 320, cz: -2440, len: 150, wid: 36, rot: 0 },  // U1 gallery concourse
    tswPlat: { cx: 320, cz: -2440, len: 200, wid: 24, rot: 0 },  // G side platforms
  },

  levels: [
    { id: 'U1', y: 8, box: 'tswConc', zh: '大堂', en: 'Concourse',            type: 'concourse'},
    { id: 'G',  y: 0, box: 'tswSite', zh: '地面', en: 'Ground',               type: 'ground'   },
    { id: 'P',  y: 0, box: 'tswPlat', zh: '月台・荃灣綫', en: 'Tsuen Wan Line Platform', type: 'platform' },
  ],

  // the platform box stands at grade inside the site — cut its footprint
  // out of the apron slab so the hall reads through the excavation
  slabCuts: { G: [{ x0: -100, z0: -12, x1: 100, z1: 12 }] },

  // Terminus side platforms at grade: P1 northbound face berths arrivals
  // (alighting only) then slides out the east portal into the overrun —
  // the tail track continues east to buffer stops toward the depot.
  // P2 re-enters and dispatches south to Central.
  platforms: {
    P: {
      kind: 'side', terminus: true, tail: 1,
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1,  to: { zh: '終點站', en: 'Terminus' } },
        { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
      ],
    },
  },

  // gallery deck -> each side platform strip
  escalators: [
    { from: 'U1', to: 'P', frame: 'tswPlat', cx: -30, cz: -8.6, dir: [-1, 0], n: 2 },  // P1 north
    { from: 'U1', to: 'P', frame: 'tswPlat', cx:  30, cz:  8.6, dir: [ 1, 0], n: 2 },  // P2 south
  ],

  // exits drop off the gallery deck edges to the street apron (up-shafts,
  // same geometry as HFC); D/E are street doors in P1's north wall so
  // alighting passengers leave without climbing to the concourse.
  exits: [
    { id: 'A1', x: -45, side: -1, zh: '綠楊新邨・巴士總站',   en: 'Luk Yeung Est · Bus Terminus' },
    { id: 'A2', x:  45, side: -1, zh: '南豐中心・荃灣大會堂', en: 'Nan Fung Centre · Town Hall' },
    { id: 'B',  x: -45, side: 1,  zh: '悅來酒店・眾安街',     en: 'Panda Hotel · Chung On St' },
    { id: 'C',  x:  45, side: 1,  zh: '愉景新城・政府合署',   en: 'Discovery Park · Govt Offices' },
    { id: 'D',  x: -60, side: -1, door: true, box: 'tswPlat', zh: '專綫小巴・古屋里', en: 'Minibus · Kwu Uk Lane' },
    { id: 'E',  x:  60, side: -1, door: true, box: 'tswPlat', zh: '三棟屋博物館',    en: 'Sam Tung Uk Museum' },
  ],
  exitZ: 20,
  roadSide: 1,           // town-centre forecourt on the south apron
  exitLetters: ['A', 'B', 'C', 'D', 'E'],

  lifts: [
    { frame: 'tswPlat', x: 0,   z: -9.5, levels: ['U1', 'P'] },  // paid lift — P1
    { frame: 'tswPlat', x: 0,   z:  9.5, levels: ['U1', 'P'] },  // paid lift — P2
    { frame: 'tswSite', x: -70, z:  15,  levels: ['U1', 'G'] },  // street lift — south
    { frame: 'tswSite', x: 70,  z: -15,  levels: ['U1', 'G'] },  // street lift — north
  ],

  // paid gallery core between the two platform wells; unpaid edge bands
  // feed the exit stairs + street lifts
  gateRows: [
    { z: -11.5, x0: -62, x1: -26 },
    { z: -11.5, x0: 26,  x1: 62 },
    { z: 11.5,  x0: -62, x1: -26 },
    { z: 11.5,  x0: 26,  x1: 62 },
  ],
  gateEnds: { x0: -68, x1: 68 },

  kioskXs:  [-15, 15, 62],     // north unpaid band (dodges A shafts at ±45)
  kioskXsS: [-62, -15, 15],    // south unpaid band (dodges B/C at ∓45)

  walkRects: {
    U1: [{ x0: -70, z0: -16, x1: 70, z1: 16 }],
    G:  [{ x0: -112, z0: 13,  x1: 112,  z1: 40 },
         { x0: -112, z0: -40, x1: 112,  z1: -13 },
         { x0: -112, z0: -40, x1: -101, z1: 40 },
         { x0: 101,  z0: -40, x1: 112,  z1: 40 }],
    P:  [{ x0: -92, z0: 7.2,   x1: 92, z1: 11.4 },
         { x0: -92, z0: -11.4, x1: 92, z1: -7.2 }],
  },

  people: { G: 16, U1: 46, P: 44 },
};
