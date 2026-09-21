// Sai Ying Pun Station 西營盤 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/syp.pdf).
// ~800 m west of Sheung Wan on the Island Line (West Island Line, 2014).
// Island platform under a single concourse. The real station sits deep
// under the Mid-Levels: B3 (Ki Ling Lane) and C (Bonham Rd) reach the
// hill by high-speed lift towers, A1/A2/B1/B2 by long corridors — here
// the lift towers become rideable street lifts at the south edge.
// Built on the islIsland() recipe.

import { islIsland } from './template.js';

export const SYP = islIsland({
  id: 'SYP', zh: '西營盤', en: 'Sai Ying Pun',
  livery: '#8663a8',   // Sai Ying Pun's purple mosaic tile
  cx: -2850, siteLen: 220,

  // Exits per Wikipedia: A1 Queen's Rd W / A2 Des Voeux Rd W (north side),
  // B1 First St, B2 Second St (south corridors), B3 Ki Ling Lane and
  // C Bonham Rd (the Mid-Levels lift towers — street lifts beside them).
  // D Water St and E1 Sutherland St fill the east half of the north fan.
  exits: [
    { id: 'A1', x: -88, side: -1, zh: '皇后大道西・東華醫院',   en: "Queen's Rd West · Tung Wah Hospital" },
    { id: 'A2', x: -60, side: -1, zh: '德輔道西・中山紀念公園', en: 'Des Voeux Rd W · Sun Yat Sen Park' },
    { id: 'B1', x: -34, side: 1,  zh: '第一街・正街街市',       en: 'First St · Centre St Market' },
    { id: 'B2', x: 14,  side: 1,  zh: '第二街・西營盤街市',     en: 'Second St · Sai Ying Pun Market' },
    { id: 'B3', x: 78,  side: 1,  zh: '奇靈里・第三街',         en: 'Ki Ling Lane · Third Street' },
    { id: 'C',  x: -52, side: 1,  zh: '般咸道',                en: 'Bonham Road' },
    { id: 'D',  x: 20,  side: -1, zh: '水街・西營盤郵局・西區警署', en: 'Water St · Sai Ying Pun Post Office · Western Police Station' },
    { id: 'E1', x: 60,  side: -1, zh: '修打蘭街',             en: 'Sutherland St' },
  ],

  lifts: [
    { frame: 'sypConc', x: -8,  z: 0,   levels: ['L1', 'L2'] },   // paid lift onto the island
    { frame: 'sypConc', x: -96, z: 15,  levels: ['G', 'L1'] },    // Bonham Rd lift tower (exit C)
    { frame: 'sypConc', x: 96,  z: 15,  levels: ['G', 'L1'] },    // Ki Ling Lane lift tower (B3)
  ],

  kioskXs:  [-32, 4, 36],
  kioskXsS: [-16, 40],

  walkRects: {
    G:  [{ x0: -102, z0: -28, x1: 102, z1: 28 }],
    L1: [{ x0: -98,  z0: -19, x1: 98,  z1: 19 }],
    L2: [{ x0: -92,  z0: -4.9, x1: 92,  z1: 4.9 }],
  },

  people: { G: 12, L1: 38, L2: 30 },
});
