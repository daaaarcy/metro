// Yau Tong Station 油塘 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/yat.pdf) + Wikipedia.
// At-grade side platforms in the cutting under Lei Yue Mun Rd — the
// (unbuilt) TKO line dives east toward the harbour tunnel here.
// Livery: yellow.
// Exits (per Wikipedia, condensed): A Yau Tong Estate, B Cha Kwo Ling
// Rd, C Lei Yue Mun estates.

import { atGradeSide } from './template.js';

export const YAT = atGradeSide({
  id: 'YAT', zh: '油塘', en: 'Yau Tong',
  livery: '#e8b832',
  cx: 3520, cz: -1960,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platforms',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '油塘邨',           en: 'Yau Tong Estate' },
    { id: 'B', x:  20, side: -1, zh: '茶果嶺道',         en: 'Cha Kwo Ling Road' },
    { id: 'C', x:  55, side: 1,  zh: '鯉魚門邨・三家村', en: 'Lei Yue Mun Est · Sam Ka Tsuen' },
  ],

  people: { U1: 34, G: 12, P: 36 },
});
