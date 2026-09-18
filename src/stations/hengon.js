// Heng On Station 恆安 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/heo.pdf) + Wikipedia.
// TML viaduct stop at the Ma On Shan new-town edge — Heng On Estate
// slabs and the town park. Livery: light blue.
// Exits: A Heng On Estate, B Ma On Shan park, C Yiu On Estate.

import { twlViaduct } from './template.js';

export const HEO = twlViaduct({
  id: 'HEO', zh: '恆安', en: 'Heng On',
  livery: '#5a9ab8',
  cx: 2850, cz: -3250,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'heoConc', zh: '恆安邨・恆康街', en: 'Heng On Estate' },
    { id: 'B', x:  20, side: -1, door: true, box: 'heoConc', zh: '馬鞍山公園',     en: 'Ma On Shan Park' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'heoConc', zh: '耀安邨・錦英苑', en: 'Yiu On · Kam Ying' },
  ],

  people: { G: 12, GC: 32, U1: 36 },
});
