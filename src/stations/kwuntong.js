// Kwun Tong Station 觀塘 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/kwt.pdf) + Wikipedia.
// KTL viaduct stop at the town centre — apm mall and Yue Man Square
// below the deck. Livery: light blue.
// Exits (per Wikipedia, condensed): A Kwun Tong town centre, B apm /
// Yue Man Sq, C Kwun Tong Rd east.

import { twlViaduct } from './template.js';

export const KWT = twlViaduct({
  id: 'KWT', zh: '觀塘', en: 'Kwun Tong',
  livery: '#7fb8e0',
  cx: 3000, cz: -1800,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, door: true, box: 'kwtConc', zh: '觀塘市中心・裕民坊', en: 'Kwun Tong Centre · Yue Man Sq' },
    { id: 'B', x:  10, side: -1, door: true, box: 'kwtConc', zh: 'apm・創紀之城',      en: 'apm · Millennium City' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'kwtConc', zh: '觀塘道東',           en: 'Kwun Tong Rd East' },
  ],

  kioskXs:  [-34, 8, 48],
  kioskXsS: [-48, -8, 30],

  people: { G: 18, GC: 40, U1: 44 },
});
