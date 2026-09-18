// Hung Hom Station 紅磡 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/huh.pdf) + Wikipedia.
// The old KCR terminus — a broad at-grade platform trench under a
// gallery concourse, where the EAL surfaces after the harbour crossing,
// with the Tuen Ma Line island stacked beneath (L1 transfer concourse
// + L2 island). Livery: maroon.
// Exits (per Wikipedia, condensed): A PTI / Cross-Harbour Tunnel, B HK
// Coliseum · PolyU, C tunnel bus plaza, D Hung Hom town.

import { atGradeSide } from './template.js';

const huh = atGradeSide({
  id: 'HUH', zh: '紅磡', en: 'Hung Hom',
  livery: '#8a3537',   // Hung Hom's maroon panels
  cx: 800, cz: -980,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A',  x: -60, side: -1, zh: '巴士總站・海底隧道',   en: 'PTI · Cross-Harbour Tunnel' },
    { id: 'B',  x:  20, side: -1, zh: '香港體育館・理大',     en: 'HK Coliseum · PolyU' },
    { id: 'C',  x:  70, side: -1, zh: '隧道巴士廣場',         en: 'Tunnel Bus Plaza' },
    { id: 'D',  x: -30, side: 1,  zh: '紅磡・都會',           en: 'Hung Hom · Metropolis' },
    { id: 'D2', x:  50, side: 1,  zh: '紅磡南・海濱',         en: 'Hung Hom South · Waterfront' },
  ],
  exitZ: 22,

  kioskXs:  [-30, 12, 52],
  kioskXsS: [-52, -10, 36],

  people: { U1: 50, G: 20, P: 46 },
});

// The TML interchange below the EAL trench: an L1 subway concourse over
// the L2 island — same stacking as KOT's KTL splice. Express escalators
// drop from the U1 gallery through the platform-trench slab cut. Faces
// 3/4 keep clear of the EAL feed's plat keys.
huh.boxes.huhTml = { cx: 800, cz: -980, len: 190, wid: 24, rot: 0 };
huh.levels.push(
  { id: 'L1', y: -7,  box: 'huhTml', zh: '大堂・屯馬綫', en: 'Tuen Ma Line Concourse', type: 'concourse' },
  { id: 'L2', y: -14, box: 'huhTml', zh: '月台・屯馬綫', en: 'Tuen Ma Line Platform',  type: 'platform'  },
);
huh.platforms.L2 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 4, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],
};
huh.escalators = [
  ...huh.escalators,
  { from: 'U1', to: 'L1', frame: 'huhTml', cx: -50, cz: 0, dir: [-1, 0], n: 2, runLen: 30 },
  { from: 'L1', to: 'L2', frame: 'huhTml', cx:  40, cz: 0, dir: [ 1, 0], n: 3 },
];
huh.lifts = [
  ...huh.lifts,
  { frame: 'huhTml', x: -10, z: 0, levels: ['U1', 'L1', 'L2'] },
];
huh.walkRects.L1 = [{ x0: -85, z0: -9, x1: 85, z1: 9 }];
huh.walkRects.L2 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
huh.people.L1 = 36;
huh.people.L2 = 44;

export const HUH = huh;
