// Tai Koo Station 太古 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tak.pdf).
// ~600 m east of Quarry Bay under King's Road. Single island platform
// on L2 (P1 -> Chai Wan, P2 -> Kennedy Town); the plan's signature
// feature is the big unpaid subway fan — nine exits reaching Cityplaza
// / Taikoo Shing on the harbour side and Kornhill up the hill.
// Exits per Wikipedia: A1 Kornhill Gdn 1–4, A2 Kornhill Plaza North,
// B Kornhill N–R, C Kornhill A–M/Plaza South, D1 Cityplaza/One Island
// East, D2 Cityplaza GF, E1 Cityplaza 2F, E2 Kornhill Gdn 5–6,
// E3 Kornhill Gdn 7–10.
// Built on the islIsland() recipe.

import { islIsland } from './template.js';

export const TAK = islIsland({
  id: 'TAK', zh: '太古', en: 'Tai Koo',
  livery: '#b2203c',   // Tai Koo's crimson mosaic tile livery
  cx: 4800,

  // Exit fan: D/E1 cluster north (Cityplaza side); A/B/C/E2/E3 south
  // (Kornhill side). Shafts keep clear of the wells (x∈±[54.8,69.2]).
  exits: [
    { id: 'D1', x: -70, side: -1, zh: '太古城中心・港島東中心', en: 'Cityplaza · One Island East' },
    { id: 'D2', x: -52, side: -1, zh: '太古城中心',            en: 'Cityplaza' },
    { id: 'E1', x: 40,  side: -1, zh: '太古城中心二期',         en: 'Cityplaza 2F' },
    { id: 'A1', x: -96, side: 1,  zh: '康山花園1-4座',          en: 'Kornhill Gdn 1–4' },
    { id: 'A2', x: -82, side: 1,  zh: '康怡廣場北座',           en: 'Kornhill Plaza North' },
    { id: 'B',  x: -60, side: 1,  zh: '康山N-R座',             en: 'Kornhill Blocks N–R' },
    { id: 'C',  x: 70,  side: 1,  zh: '康山A-M座・康怡廣場南座', en: 'Kornhill A–M · Plaza South' },
    { id: 'E2', x: 84,  side: 1,  zh: '康山花園5-6座',          en: 'Kornhill Gdn 5–6' },
    { id: 'E3', x: 96,  side: 1,  zh: '康山花園7-10座',         en: 'Kornhill Gdn 7–10' },
  ],

  lifts: [
    { frame: 'takConc', x: 0,   z: 0,   levels: ['L1', 'L2'] },        // paid lift
    { frame: 'takConc', x: -76, z: -15, levels: ['G', 'L1'] },          // street lift — Cityplaza side
    { frame: 'takConc', x: 88,  z: 15,  levels: ['G', 'L1'] },          // street lift — Kornhill side
  ],

  gateRows: [
    { z: -9, x0: -68, x1: -26 },
    { z: -9, x0:  26, x1:  68 },
    { z:  9, x0: -68, x1: -26 },
    { z:  9, x0:  26, x1:  68 },
  ],
  gateEnds: { x0: -74, x1: 74 },

  kioskXs:  [-44, -8, 34],
  kioskXsS: [-38, 8, 42],

  people: { G: 14, L1: 48, L2: 40 },
});
