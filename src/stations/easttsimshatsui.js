// East Tsim Sha Tsui Station 尖東 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/ets.pdf) +
// Wikipedia. TML underground island under the TST East podium —
// Middle Rd malls, the harbourfront promenade and the subway link west
// to Tsim Sha Tsui on the TWL. Livery: purple.
// Exits: A TST East / Avenue of Stars, B Middle Rd, C subway to TST,
// D Chatham Rd, E K11 / Victoria Dockside (harbourfront).

import { twlIsland } from './template.js';

export const ETS = twlIsland({
  id: 'ETS', zh: '尖東', en: 'East Tsim Sha Tsui',
  livery: '#8a5aa8',
  cx: 540, cz: -1015,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '尖東・星光大道',   en: 'TST East · Avenue of Stars' },
    { id: 'B', x:  10, side: -1, zh: '中間道・麼地道',   en: 'Middle Rd · Mody Rd' },
    { id: 'C', x:  60, side: 1,  zh: '尖沙咀站・隧道',   en: 'Tsim Sha Tsui (subway)' },
    { id: 'D', x: -20, side: 1,  zh: '漆咸道・科學館',   en: 'Chatham Rd · Science Museum' },
    { id: 'E', x: -70, side: 1,  zh: 'K11購物中心・維港文化匯', en: 'K11 Shopping Centre · Victoria Dockside' },
  ],

  people: { G: 18, L1: 44, L2: 48 },
});
