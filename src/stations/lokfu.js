// Lok Fu Station 樂富 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/lof.pdf) + Wikipedia. KTL
// underground island at the Lion Rock foot — Lok Fu Plaza and the Wang
// Tau Hom estate blocks. Livery: orange.
// Exits (per Wikipedia, condensed): A Lok Fu Plaza, B Wang Tau Hom,
// C Lok Fu Recreation Ground.

import { twlIsland } from './template.js';

export const LOF = twlIsland({
  id: 'LOF', zh: '樂富', en: 'Lok Fu',
  livery: '#d4692a',
  cx: 1250, cz: -1460,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '樂富廣場',         en: 'Lok Fu Plaza' },
    { id: 'B', x:  30, side: -1, zh: '橫頭磡邨',         en: 'Wang Tau Hom Estate' },
    { id: 'C', x:  60, side: 1,  zh: '樂富遊樂場',       en: 'Lok Fu Recreation Ground' },
  ],

  people: { G: 14, L1: 38, L2: 40 },
});
