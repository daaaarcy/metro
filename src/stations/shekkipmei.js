// Shek Kip Mei Station 石硤尾 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/skm.pdf) + Wikipedia.
// KTL underground island east of the Nathan Road corridor — the line
// bends away from Prince Edward toward Kowloon Tong here. Livery:
// teal green.
// Exits (per Wikipedia, condensed): A Shek Kip Mei Estate, B Nam Cheong
// St, C Berwick St / City U side.

import { twlIsland } from './template.js';

export const SKM = twlIsland({
  id: 'SKM', zh: '石硤尾', en: 'Shek Kip Mei',
  livery: '#3a9e8f',
  cx: 950, cz: -1440,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '石硤尾邨',           en: 'Shek Kip Mei Estate' },
    { id: 'B', x:  20, side: -1, zh: '南昌街・大坑西邨',   en: 'Nam Cheong St · Tai Hang Sai' },
    { id: 'C', x:  60, side: 1,  zh: '巴域街・城市大學',   en: 'Berwick St · City U' },
  ],

  people: { G: 14, L1: 40, L2: 42 },
});
