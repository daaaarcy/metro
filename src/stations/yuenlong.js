// Yuen Long Station 元朗 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/yul.pdf) + Wikipedia.
// TML viaduct stop over the town centre — YOHO Mall and the estate
// towers. Livery: lime.
// Exits: A YOHO Mall, B Yuen Long town, C Tai Tong Rd.

import { twlViaduct } from './template.js';

export const YUL = twlViaduct({
  id: 'YUL', zh: '元朗', en: 'Yuen Long',
  livery: '#8aa83a',
  cx: -1700, cz: -3000,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'yulConc', zh: 'YOHO Mall・形點', en: 'YOHO Mall' },
    { id: 'B', x:  20, side: -1, door: true, box: 'yulConc', zh: '元朗市中心・大棠', en: 'Yuen Long Centre' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'yulConc', zh: '大棠路・雞地',   en: 'Tai Tong Rd' },
  ],

  people: { G: 16, GC: 40, U1: 44 },
});
