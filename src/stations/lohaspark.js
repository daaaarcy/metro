// LOHAS Park Station 康城 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/lhp.pdf) + Wikipedia.
// The TKO branch terminus at grade beside the depot — The LOHAS mall
// podium and the Capitol estate towers over the platforms. Trains
// reverse on the off-map wrap west toward the depot sidings.
// Livery: burnt orange.
// Exits (per Wikipedia, condensed): A The LOHAS mall, B estate towers /
// Capitol.

import { atGradeSide } from './template.js';

export const LHP = atGradeSide({
  id: 'LHP', zh: '康城', en: 'LOHAS Park',
  livery: '#c07b3a',
  cx: 4520, cz: -2560,
  platZh: '月台・將軍澳綫', platEn: 'Tseung Kwan O Line Platforms',

  terminus: true, tail: -1,   // branch terminus — overrun west into the depot sidings
  faces: [
    { num: 1, line: 'TKO', side: -1, dir: -1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'TKO', side: 1,  dir: -1, to: { zh: '往北角',   en: 'to North Point' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: 'The LOHAS 商場',       en: 'The LOHAS Mall' },
    { id: 'B', x:  40, side: 1,  zh: '首都・領都・康城站',   en: 'The Capitol · Le Prestige' },
  ],

  people: { U1: 36, G: 14, P: 38 },
});
