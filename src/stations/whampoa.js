// Whampoa Station 黃埔 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/wha.pdf) + Wikipedia. The
// KTL's west terminus on the Hung Hom waterfront — Whampoa Garden slabs
// and the ship-shaped Whampoa mall alongside. Both faces dispatch east
// through the Ho Man Tin portal. Livery: blue.
// Exits (per Wikipedia, condensed): A Whampoa Garden, B Tak On Estate /
// Hung Hom Rd, C The Whampoa / Gourmet Place.

import { atGradeSide } from './template.js';

export const WHA = atGradeSide({
  id: 'WHA', zh: '黃埔', en: 'Whampoa',
  livery: '#5a8fb8',
  cx: 660, cz: -880,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platforms',

  terminus: true, tail: 1,  // KTL west end — overrun siding east toward Ho Man Tin
  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1, to: { zh: '終點站',   en: 'Terminus' } },
    { num: 2, line: 'KTL', side: 1,  dir: 1, to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '黃埔花園',         en: 'Whampoa Garden' },
    { id: 'B', x:  20, side: -1, zh: '紅磡道・德安邨',   en: 'Hung Hom Rd · Tak On Estate' },
    { id: 'C', x:  55, side: 1,  zh: '黃埔號・美食坊',   en: 'The Whampoa · Gourmet Place' },
  ],

  people: { U1: 40, G: 16, P: 42 },
});
