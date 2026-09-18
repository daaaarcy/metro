// Sung Wong Toi Station 宋皇臺 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/suw.pdf) +
// Wikipedia. TML underground island beside the Sung Wong Toi garden —
// the old Kai Tak approach edge. Livery: gold.
// Exits: A Sung Wong Toi garden, B Ma Tau Chung Rd, C Kai Tak edge.

import { twlIsland } from './template.js';

export const SUW = twlIsland({
  id: 'SUW', zh: '宋皇臺', en: 'Sung Wong Toi',
  livery: '#c8a03a',
  cx: 1400, cz: -1300,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '宋皇臺公園・石碑',   en: 'Sung Wong Toi Garden' },
    { id: 'B', x:  10, side: -1, zh: '馬頭涌道・九龍城',   en: 'Ma Tau Chung Rd · Kowloon City' },
    { id: 'C', x:  60, side: 1,  zh: '啟德・世運道',       en: 'Kai Tak · Olympic Ave' },
  ],

  people: { G: 14, L1: 36, L2: 38 },
});
