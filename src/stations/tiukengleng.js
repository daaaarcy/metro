// Tiu Keng Leng Station 調景嶺 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/tkl.pdf) +
// Wikipedia. The KTL's east terminus at grade under the TKO hills —
// trains reverse on the off-map wrap toward the Tseung Kwan O line.
// Livery: orange.
// Exits (per Wikipedia, condensed): A TKO Gateway / Sheung Tak, B Tiu
// Keng Leng village side.

import { atGradeSide } from './template.js';

const tkl = atGradeSide({
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

// TKO island at L1 under the KTL trench — the cross-harbour arm of the
// interchange (TKO trains continue east to TKW/HAH/POL and south on the
// LHP shuttle). Escalators drop from the U1 gallery through the trench
// slab cut, same as the KOT splice.
tkl.boxes.tklTko = { cx: 3780, cz: -2040, len: 190, wid: 24, rot: 0 };
tkl.levels.push(
  { id: 'L1', y: -7, box: 'tklTko', zh: '月台・將軍澳綫', en: 'Tseung Kwan O Line Platform', type: 'platform' },
);
tkl.platforms.L1 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'TKO', side: -1, dir: 1,  to: { zh: '往寶琳/康城', en: 'to Po Lam/LOHAS Park' } },
    { num: 4, line: 'TKO', side: 1,  dir: -1, to: { zh: '往北角',     en: 'to North Point' } },
  ],
};
tkl.escalators = [
  ...tkl.escalators,
  { from: 'U1', to: 'L1', frame: 'tklTko', cx: -50, cz: 0, dir: [-1, 0], n: 2, runLen: 30 },
  { from: 'U1', to: 'L1', frame: 'tklTko', cx:  50, cz: 0, dir: [ 1, 0], n: 2, runLen: 30 },
];
tkl.lifts = [
  ...tkl.lifts,
  { frame: 'tklTko', x: -10, z: 0, levels: ['U1', 'L1'] },
];
tkl.walkRects.L1 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
tkl.people.L1 = 38;

export const TKL = tkl;
