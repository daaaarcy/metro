// Tai Shui Hang Station 大水坑 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/tsh.pdf) +
// Wikipedia. TML viaduct stop on the Ma On Shan approach — Kam Hay
// Court and the hillside. Livery: light green.
// Exits: A Kam Hay Court, B Tai Shui Hang village, C Chevalier Garden.

import { twlViaduct } from './template.js';

export const TSH = twlViaduct({
  id: 'TSH', zh: '大水坑', en: 'Tai Shui Hang',
  livery: '#7aa86a',
  cx: 2700, cz: -2950,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'tshConc', zh: '錦禧苑・大水坑村', en: 'Kam Hay Court' },
    { id: 'B', x:  20, side: -1, door: true, box: 'tshConc', zh: '大水坑村・亞公角', en: 'Tai Shui Hang Village' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'tshConc', zh: '富安花園',       en: 'Chevalier Garden' },
  ],

  people: { G: 10, GC: 28, U1: 32 },
});
