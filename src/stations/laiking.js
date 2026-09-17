// Lai King Station 荔景 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/lak.pdf) + Wikipedia. A stacked
// cross-platform TWL/TCL interchange carved into the hill below Lai King
// Hill Road: the upper island (L3) carries outbound trains (TWL P1 to
// Tsuen Wan / TCL P3 to Tung Chung) and the lower island (L5) the inbound
// pair (TWL P2 to Central / TCL P4 to Hong Kong), sandwiching the L4
// concourse. Entrances fan out of the L1 passageway; the Airport Express
// threads through non-stop (not modelled). Through station on the TWL
// corridor now; TCL faces dressed but unserved until the corridor
// extends. Livery: crimson red mosaic (LAK is the red station
// between blue Mei Foo and orange Lai Chi Kok).
// Exits (5): A1 Lai King Hill Rd, A2 Yin Lai Court, A3 Lai King Estate,
// B Kwai Chung Container Terminal, C HKEAA Lai King Assessment Centre.

export const LAK = {
  id: 'LAK', zh: '荔景', en: 'Lai King',
  livery: '#b02a30',   // LAK's crimson mosaic

  boxes: {
    lakSite:  { cx: 320, cz: -1960, len: 240, wid: 84, rot: 0 }, // G apron — hillside terrace
    lakPass:  { cx: 320, cz: -1960, len: 190, wid: 44, rot: 0 }, // L1 passageway concourse
    lakUp:    { cx: 320, cz: -1960, len: 200, wid: 24, rot: 0 }, // L3 upper island (outbound)
    lakConc:  { cx: 320, cz: -1960, len: 190, wid: 44, rot: 0 }, // L4 concourse between platforms
    lakDn:    { cx: 320, cz: -1960, len: 200, wid: 24, rot: 0 }, // L5 lower island (inbound)
  },

  levels: [
    { id: 'G',  y: 0,   box: 'lakSite',  zh: '地面',            en: 'Ground',                  type: 'ground'    },
    { id: 'L1', y: -7,  box: 'lakPass',  zh: '通道・大堂',       en: 'Passageway / Concourse',   type: 'concourse' },
    { id: 'L3', y: -21, box: 'lakUp',    zh: '上月台',          en: 'Upper Platform',           type: 'platform'  },
    { id: 'L4', y: -28, box: 'lakConc',  zh: '大堂',            en: 'Concourse',                type: 'concourse' },
    { id: 'L5', y: -35, box: 'lakDn',    zh: '下月台',          en: 'Lower Platform',           type: 'platform'  },
  ],

  // Stacked cross-platform interchange — same-direction faces pair up:
  // outbound upstairs (TWL P1 / TCL P3), inbound downstairs (TWL P2 /
  // TCL P4). Through station now KWF is live; TCL faces are dressed but
  // unserved until the corridor extends.
  platforms: {
    L3: {
      kind: 'island',
      faces: [
        { num: 1, line: 'TWL', side: -1, dir: 1, to: { zh: '往荃灣',   en: 'to Tsuen Wan' } },
        { num: 3, line: 'TCL', side: 1,  dir: 1, to: { zh: '往東涌',   en: 'to Tung Chung' } },
      ],
    },
    L5: {
      kind: 'island',
      faces: [
        { num: 4, line: 'TCL', side: -1, dir: -1, to: { zh: '往香港', en: 'to Hong Kong' } },
        { num: 2, line: 'TWL', side: 1,  dir: -1, to: { zh: '往中環', en: 'to Central' } },
      ],
    },
  },

  // dir = direction of descent in plan. L1->L3 is a 14 m drop — long-run
  // escalators (runLen override keeps the standard ~29 deg slope). The
  // lower hopscotch: L3->L4 mid-island, then L4->L5 near the ends.
  escalators: [
    { from: 'L1', to: 'L3', frame: 'lakUp',   cx: -58, cz: 0, dir: [-1, 0], n: 3, runLen: 26 },
    { from: 'L1', to: 'L3', frame: 'lakUp',   cx:  58, cz: 0, dir: [ 1, 0], n: 3, runLen: 26 },
    { from: 'L3', to: 'L4', frame: 'lakConc', cx: -20, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L3', to: 'L4', frame: 'lakConc', cx:  20, cz: 0, dir: [ 1, 0], n: 2 },
    { from: 'L4', to: 'L5', frame: 'lakDn',   cx: -70, cz: 0, dir: [-1, 0], n: 2 },
    { from: 'L4', to: 'L5', frame: 'lakDn',   cx:  70, cz: 0, dir: [ 1, 0], n: 2 },
  ],

  // Exit stair shafts G->L1 (all five land in the unpaid bands).
  exits: [
    { id: 'A1', x: -70, side: -1, zh: '荔景山路',             en: 'Lai King Hill Road' },
    { id: 'A2', x: -30, side: -1, zh: '賢麗苑',              en: 'Yin Lai Court' },
    { id: 'A3', x:  60, side: -1, zh: '荔景邨',              en: 'Lai King Estate' },
    { id: 'B',  x: -10, side: 1,  zh: '葵青貨櫃碼頭',        en: 'Kwai Chung Container Terminal' },
    { id: 'C',  x:  90, side: 1,  zh: '考評局荔景評核中心',   en: 'HKEAA Assessment Centre' },
  ],
  exitZ: 9.5,
  exitLetters: ['A', 'B', 'C'],

  lifts: [
    { frame: 'lakUp',   x: 0,   z: 0,   levels: ['L1', 'L3', 'L4', 'L5'] }, // paid lift, 4 stops
    { frame: 'lakPass', x: -86, z: -18, levels: ['G', 'L1'] },              // street lift — hill side
    { frame: 'lakPass', x:  86, z: 18,  levels: ['G', 'L1'] },              // street lift — estate side
  ],

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
    G:  [{ x0: -115, z0: -38, x1: 115, z1: 38 }],
    L1: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L3: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
    L4: [{ x0: -88,  z0: -19, x1: 88,  z1: 19 }],
    L5: [{ x0: -92,  z0: -4.9, x1: 92, z1: 4.9 }],
  },

  people: { G: 24, L1: 46, L3: 40, L4: 26, L5: 36 },
};
