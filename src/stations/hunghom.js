// Hung Hom Station 紅磡 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/huh.pdf) + Wikipedia.
// The old KCR terminus — a broad at-grade platform trench under a
// gallery concourse, where the EAL surfaces after the harbour crossing.
// (The real station also carries the Tuen Ma Line on a second island —
// condensed here to the EAL faces.) Livery: maroon.
// Exits (per Wikipedia, condensed): A PTI / Cross-Harbour Tunnel, B HK
// Coliseum · PolyU, C tunnel bus plaza, D Hung Hom town.

import { atGradeSide } from './template.js';

export const HUH = atGradeSide({
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
