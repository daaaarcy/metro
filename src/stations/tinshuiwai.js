// Tin Shui Wai Station 天水圍 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tis.pdf) + Wikipedia.
// TML viaduct stop in the northwest new town — Tin Shui Wai slabs and
// the wetland park edge. Livery: dusty rose.
// Exits: A Tin Shui Wai town centre, B Kingswood Villas, C Wetland Park.

import { twlViaduct } from './template.js';

export const TIS = twlViaduct({
  id: 'TIS', zh: '天水圍', en: 'Tin Shui Wai',
  livery: '#b06a8a',
  cx: -2400, cz: -3500,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'tisConc', zh: '天水圍市中心',     en: 'Tin Shui Wai Centre' },
    { id: 'B', x:  20, side: -1, door: true, box: 'tisConc', zh: '嘉湖山莊・天恩',   en: 'Kingswood Villas' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'tisConc', zh: '濕地公園・天秀路', en: 'Wetland Park' },
  ],

  people: { G: 14, GC: 36, U1: 40 },
});
