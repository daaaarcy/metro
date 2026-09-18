// Long Ping Station 朗屏 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/lop.pdf) + Wikipedia.
// TML viaduct stop over Long Ping Rd — estate slabs and the Yuen Long
// town edge. Livery: peach.
// Exits: A Long Ping Estate, B Yuen Long town, C Wang Chau.

import { twlViaduct } from './template.js';

export const LOP = twlViaduct({
  id: 'LOP', zh: '朗屏', en: 'Long Ping',
  livery: '#d08a5a',
  cx: -2000, cz: -3300,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'lopConc', zh: '朗屏邨・屏山',   en: 'Long Ping Estate' },
    { id: 'B', x:  20, side: -1, door: true, box: 'lopConc', zh: '元朗市中心',     en: 'Yuen Long Centre' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'lopConc', zh: '橫洲・公庵路',   en: 'Wang Chau' },
  ],

  people: { G: 12, GC: 34, U1: 38 },
});
