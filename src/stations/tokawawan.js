// To Kwa Wan Station 土瓜灣 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tos.pdf) + Wikipedia.
// TML underground island under the old-town streets — Ma Tau Wai Rd
// shops and the estate slabs. Livery: light blue.
// Exits: A Ma Tau Wai Rd, B To Kwa Wan market, C Lok Shan Rd.

import { twlIsland } from './template.js';

export const TOS = twlIsland({
  id: 'TOS', zh: '土瓜灣', en: 'To Kwa Wan',
  livery: '#5a9ac8',
  cx: 1100, cz: -1180,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '馬頭圍道・土瓜灣街市', en: 'Ma Tau Wai Rd · Market' },
    { id: 'B', x:  10, side: -1, zh: '土瓜灣市政大廈',       en: 'To Kwa Wan Complex' },
    { id: 'C', x:  60, side: 1,  zh: '樂善堂・落山道',       en: 'Lok Shan Rd' },
  ],

  people: { G: 14, L1: 38, L2: 40 },
});
