// Tiu Keng Leng Station 調景嶺 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/tkl.pdf) +
// Wikipedia. The KTL's east terminus at grade under the TKO hills —
// trains reverse on the off-map wrap toward the Tseung Kwan O line.
// Livery: orange.
// Exits (per Wikipedia, condensed): A TKO Gateway / Sheung Tak, B Tiu
// Keng Leng village side.

import { atGradeSide } from './template.js';

export const TKL = atGradeSide({
  id: 'TKL', zh: '調景嶺', en: 'Tiu Keng Leng',
  livery: '#e08838',
  cx: 3780, cz: -2040,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platforms',

  terminus: true, tail: 1,  // KTL east end — overrun dives toward the TKO tunnel
  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '都會駅・尚德',       en: 'Metro Town · Sheung Tak' },
    { id: 'B', x:  40, side: 1,  zh: '調景嶺・健明邨',     en: 'Tiu Keng Leng · Kin Ming Estate' },
  ],

  people: { U1: 36, G: 14, P: 38 },
});
