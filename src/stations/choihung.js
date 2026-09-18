// Choi Hung Station 彩虹 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/chh.pdf) + Wikipedia.
// KTL underground island past the Lion Rock silhouette — the famous
// rainbow estate above, where the line surfaces toward Kowloon Bay.
// Livery: rainbow blue.
// Exits (per Wikipedia, condensed): A Choi Hung Estate, B Ngau Chi Wan,
// C Choi Hung Rd / bus stops.

import { twlIsland } from './template.js';

export const CHH = twlIsland({
  id: 'CHH', zh: '彩虹', en: 'Choi Hung',
  livery: '#3f6fb5',
  cx: 2160, cz: -1620,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '彩虹邨',           en: 'Choi Hung Estate' },
    { id: 'B', x:  10, side: -1, zh: '牛池灣村',         en: 'Ngau Chi Wan Village' },
    { id: 'C', x:  60, side: 1,  zh: '彩虹道・巴士站',   en: 'Choi Hung Rd · Bus Stops' },
  ],

  people: { G: 16, L1: 40, L2: 42 },
});
