// Yau Tong Station 油塘 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/yat.pdf) + Wikipedia.
// At-grade side platforms in the cutting under Lei Yue Mun Rd — the
// (unbuilt) TKO line dives east toward the harbour tunnel here.
// Livery: yellow.
// Exits (per Wikipedia, condensed): A Yau Tong Estate, B Cha Kwo Ling
// Rd, C Lei Yue Mun estates.

import { atGradeSide } from './template.js';

const yat = atGradeSide({
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

// TKO island at L1 under the KTL trench — the harbour-tunnel arm of the
// interchange. Escalators drop from the U1 gallery through the platform
// trench slab cut, same as the KOT splice. Faces 3/4 keep clear of the
// KTL feed's plat keys.
yat.boxes.yatTko = { cx: 3520, cz: -1960, len: 190, wid: 24, rot: 0 };
yat.levels.push(
  { id: 'L1', y: -7, box: 'yatTko', zh: '月台・將軍澳綫', en: 'Tseung Kwan O Line Platform', type: 'platform' },
);
yat.platforms.L1 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'TKO', side: -1, dir: 1,  to: { zh: '往寶琳/康城', en: 'to Po Lam/LOHAS Park' } },
    { num: 4, line: 'TKO', side: 1,  dir: -1, to: { zh: '往北角',     en: 'to North Point' } },
  ],
};
yat.escalators = [
  ...yat.escalators,
  { from: 'U1', to: 'L1', frame: 'yatTko', cx: -50, cz: 0, dir: [-1, 0], n: 2, runLen: 30 },
  { from: 'U1', to: 'L1', frame: 'yatTko', cx:  50, cz: 0, dir: [ 1, 0], n: 2, runLen: 30 },
];
yat.lifts = [
  ...yat.lifts,
  { frame: 'yatTko', x: -10, z: 0, levels: ['U1', 'L1'] },
];
yat.walkRects.L1 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
yat.people.L1 = 36;

export const YAT = yat;
