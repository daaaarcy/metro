// Ma On Shan Station 馬鞍山 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/mos.pdf) + Wikipedia.
// TML viaduct stop over Ma On Shan town centre — Sunshine City / MOSTown
// podium and the estate rows. Livery: orange-brown.
// Exits: A MOSTown, B Ma On Shan plaza, C Lee On Estate.

import { twlViaduct } from './template.js';

export const MOS = twlViaduct({
  id: 'MOS', zh: '馬鞍山', en: 'Ma On Shan',
  livery: '#b0763a',
  cx: 3150, cz: -3400,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'mosConc', zh: '新港城・MOSTown', en: 'MOSTown' },
    { id: 'B', x:  20, side: -1, door: true, box: 'mosConc', zh: '馬鞍山廣場',     en: 'Ma On Shan Plaza' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'mosConc', zh: '利安邨・頌安邨', en: 'Lee On · Chung On' },
  ],

  people: { G: 14, GC: 36, U1: 40 },
});
