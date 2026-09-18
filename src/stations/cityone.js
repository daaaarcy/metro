// City One Station 第一城 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/cio.pdf) + Wikipedia.
// TML viaduct stop serving the City One Shatin mega-estate — the slab
// rows march north along the river. Livery: orange-yellow.
// Exits: A City One plaza, B estate courts, C Yuen Chau Kok.

import { twlViaduct } from './template.js';

export const CIO = twlViaduct({
  id: 'CIO', zh: '第一城', en: 'City One',
  livery: '#d8903a',
  cx: 1900, cz: -2800,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'cioConc', zh: '第一城・置富',   en: 'City One Plaza' },
    { id: 'B', x:  20, side: -1, door: true, box: 'cioConc', zh: '第一城各座',     en: 'City One Blocks' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'cioConc', zh: '圓洲角・王屋村', en: 'Yuen Chau Kok' },
  ],

  people: { G: 14, GC: 36, U1: 40 },
});
