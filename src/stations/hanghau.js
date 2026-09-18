// Hang Hau Station 坑口 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/hah.pdf) + Wikipedia.
// TKO line underground island — East Point City podium and the Hau Tak
// estate slabs. Livery: mint.
// Exits (per Wikipedia, condensed): A Hang Hau town centre, B East
// Point City, C Hau Tak Estate.

import { twlIsland } from './template.js';

export const HAH = twlIsland({
  id: 'HAH', zh: '坑口', en: 'Hang Hau',
  livery: '#6fc0b8',
  cx: 4700, cz: -2280,
  platZh: '月台・將軍澳綫', platEn: 'Tseung Kwan O Line Platform',

  faces: [
    { num: 1, line: 'TKO', side: -1, dir: 1,  to: { zh: '往寶琳/康城', en: 'to Po Lam/LOHAS Park' } },
    { num: 2, line: 'TKO', side: 1,  dir: -1, to: { zh: '往北角',     en: 'to North Point' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '坑口市中心',       en: 'Hang Hau Town Centre' },
    { id: 'B', x:  20, side: -1, zh: '東港城',           en: 'East Point City' },
    { id: 'C', x:  60, side: 1,  zh: '厚德邨・常寧路',   en: 'Hau Tak Estate · Sheung Ning Rd' },
  ],

  people: { G: 14, L1: 38, L2: 40 },
});
