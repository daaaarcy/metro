// Ngau Tau Kok Station 牛頭角 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/ntk.pdf) + Wikipedia.
// KTL viaduct stop over Kwun Tong Rd — garden estate blocks north,
// industrial Kwun Tong south. Livery: steel blue.
// Exits (per Wikipedia, condensed): A Ngau Tau Kok Garden Estate, B
// Kwun Tong Rd east.

import { twlViaduct } from './template.js';

export const NTK = twlViaduct({
  id: 'NTK', zh: '牛頭角', en: 'Ngau Tau Kok',
  livery: '#6a9ac0',
  cx: 2720, cz: -1740,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'ntkConc', zh: '牛頭角花園大廈',   en: 'Ngau Tau Kok Garden Estate' },
    { id: 'B', x:  40, side: 1,  door: true, box: 'ntkConc', zh: '觀塘道・創紀之城', en: 'Kwun Tong Rd · Millennium City' },
  ],

  kioskXs:  [-34, 8, 48],
  kioskXsS: [-48, -8, 30],

  people: { G: 14, GC: 34, U1: 38 },
});
