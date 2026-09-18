// Jordan Station 佐敦 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/jor.pdf).
// One stop up Nathan Road from Tsim Sha Tsui — island platform (L2)
// under a concourse (L1) with exits fanned along both sides of the
// corridor: A Yue Hwa Emporium; B1 Eaton/Novotel, B2 Diocesan Girls'/
// Queen Elizabeth Hospital; C1 Austin Rd/Kowloon Park, C2 Bowring St/
// Xiqu Centre; D Austin Rd/Observatory; E Prudential Centre (Wikipedia).
// Standard island platform (template.js recipe). Livery: dark green /
// light green mosaic.

import { twlIsland } from './template.js';

export const JOR = twlIsland({
  id: 'JOR', zh: '佐敦', en: 'Jordan',
  livery: '#5b7f3c',   // Jordan's green mosaic (dark + light bands)
  cz: -1000,

  // exit fan along the Nathan Road corridor — north (-z) side reaches
  // Jordan Rd / Eaton hotel / the hospital; south (+z) side reaches
  // Bowring St / Austin Rd / Prudential
  exits: [
    { id: 'A',  x: -60, side: -1, zh: '裕華國貨',              en: 'Yue Hwa Emporium' },
    { id: 'B1', x: -20, side: -1, zh: '伊敦酒店・諾富特',       en: 'Eaton · Novotel' },
    { id: 'B2', x:  30, side: -1, zh: '拔萃女書院・伊利沙伯醫院', en: 'Diocesan Girls\' · QE Hospital' },
    { id: 'C1', x: -50, side: 1,  zh: '柯士甸道・九龍公園',     en: 'Austin Road · Kowloon Park' },
    { id: 'C2', x: -10, side: 1,  zh: '寶靈街・戲曲中心',       en: 'Bowring Street · Xiqu Centre' },
    { id: 'D',  x:  40, side: 1,  zh: '柯士甸道・香港天文台',   en: 'Austin Road · Observatory' },
    { id: 'E',  x:  75, side: 1,  zh: '恒豐中心・恒豐酒店',     en: 'Prudential Centre · Hotel' },
  ],

  // kiosks dodge the exit stair shafts
  kioskXsS: [-32, 20, 58],

  people: { G: 18, L1: 48, L2: 38 },
});
