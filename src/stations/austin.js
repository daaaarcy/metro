// Austin Station 柯士甸 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/aus.pdf) + Wikipedia.
// TML underground island under West Kowloon — the Xiqu Centre and the
// Elements approach; the express-rail terminus sits alongside.
// Exits: A Xiqu Centre, B West Kowloon Station, C Jordan Rd, D Austin
// Rd.

import { twlIsland } from './template.js';

export const AUS = twlIsland({
  id: 'AUS', zh: '柯士甸', en: 'Austin',
  livery: '#d8863a',
  cx: 350, cz: -1350,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '戲曲中心・西九文化區', en: 'Xiqu Centre · West Kowloon' },
    { id: 'B', x:  10, side: -1, zh: '高鐵西九龍站',         en: 'West Kowloon Station (XRL)' },
    { id: 'C', x:  60, side: 1,  zh: '佐敦道・官涌',         en: 'Jordan Rd · Kwun Chung' },
    { id: 'D', x: -20, side: 1,  zh: '柯士甸道・渡船街',     en: 'Austin Rd · Ferry St' },
  ],

  people: { G: 18, L1: 44, L2: 46 },
});
