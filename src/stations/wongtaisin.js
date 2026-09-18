// Wong Tai Sin Station 黃大仙 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/wts.pdf) + Wikipedia.
// KTL underground island under Lung Cheung Rd — the temple and Temple
// Mall sit north at the hill foot. Livery: yellow.
// Exits (per Wikipedia, condensed): A Wong Tai Sin Temple, B Ching Tak
// St, C Temple Mall, D Lower Wong Tai Sin Estate.

import { twlIsland } from './template.js';

export const WTS = twlIsland({
  id: 'WTS', zh: '黃大仙', en: 'Wong Tai Sin',
  livery: '#e8c832',
  cx: 1540, cz: -1440,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '嗇色園黃大仙祠',     en: 'Sik Sik Yuen Wong Tai Sin Temple' },
    { id: 'B', x:  10, side: -1, zh: '正德街・黃大仙中心', en: 'Ching Tak St · Temple Mall' },
    { id: 'C', x:  60, side: -1, zh: '黃大仙中心南館',     en: 'Temple Mall South' },
    { id: 'D', x: -20, side: 1,  zh: '黃大仙下邨',         en: 'Lower Wong Tai Sin Estate' },
  ],

  people: { G: 18, L1: 44, L2: 46 },
});
