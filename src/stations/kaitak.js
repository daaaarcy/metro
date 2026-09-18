// Kai Tak Station 啟德 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/kat.pdf) + Wikipedia. TML
// underground island in the old runway redevelopment — AIRSIDE mall and
// the new district slabs. Livery: orange.
// Exits: A AIRSIDE, B Kai Tak Sports Park, C Muk On St.

import { twlIsland } from './template.js';

export const KAT = twlIsland({
  id: 'KAT', zh: '啟德', en: 'Kai Tak',
  livery: '#e07b3a',
  cx: 1700, cz: -1250,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: 'AIRSIDE・沐元街',   en: 'AIRSIDE · Muk Yuen St' },
    { id: 'B', x:  10, side: -1, zh: '啟德體育園',         en: 'Kai Tak Sports Park' },
    { id: 'C', x:  60, side: 1,  zh: '沐安街・啟德河',     en: 'Muk On St · Kai Tak River' },
  ],

  people: { G: 16, L1: 40, L2: 42 },
});
