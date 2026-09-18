// Hin Keng Station 顯徑 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/hik.pdf) + Wikipedia.
// TML underground island in the hill saddle between Diamond Hill and
// Tai Wai — Hin Keng estate slabs. Livery: green-grey.
// Exits: A Hin Keng Estate, B Che Kung Miu Rd, C Hin Tin.

import { twlIsland } from './template.js';

export const HIK = twlIsland({
  id: 'HIK', zh: '顯徑', en: 'Hin Keng',
  livery: '#6a8a6a',
  cx: 1300, cz: -1850,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '顯徑邨・顯田',     en: 'Hin Keng Estate' },
    { id: 'B', x:  10, side: -1, zh: '車公廟路・顯徑街', en: 'Che Kung Miu Rd' },
    { id: 'C', x:  60, side: 1,  zh: '顯田遊樂場',       en: 'Hin Tin Playground' },
  ],

  people: { G: 12, L1: 32, L2: 34 },
});
