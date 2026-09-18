// Lam Tin Station 藍田 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/lat.pdf) + Wikipedia.
// The KTL drops off the viaduct into a hillside cutting — at-grade side
// platforms under a gallery, estate towers climbing the slope.
// Livery: blue.
// Exits (per Wikipedia, condensed): A Lam Tin Estate, B Lei Yue Mun Rd,
// C Kai Tin Rd.

import { atGradeSide } from './template.js';

export const LAT = atGradeSide({
  id: 'LAT', zh: '藍田', en: 'Lam Tin',
  livery: '#2d5f9e',
  cx: 3260, cz: -1880,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platforms',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '藍田邨',           en: 'Lam Tin Estate' },
    { id: 'B', x:  20, side: -1, zh: '鯉魚門道',         en: 'Lei Yue Mun Road' },
    { id: 'C', x:  55, side: 1,  zh: '啟田道・啟田邨',   en: 'Kai Tin Rd · Kai Tin Estate' },
  ],

  people: { U1: 38, G: 14, P: 40 },
});
