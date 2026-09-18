// Fo Tan Station 火炭 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/fot.pdf) + Wikipedia. EAL
// through-stop at grade beside the Ho Tung Lau depot and the Fo Tan
// industrial lofts. Livery: orange-brown.
// Exits (per Wikipedia, condensed): A Fo Tan village, B depot / Ho Tung
// Lau, C industrial area, D Jubilee Garden.

import { atGradeSide } from './template.js';

export const FOT = atGradeSide({
  id: 'FOT', zh: '火炭', en: 'Fo Tan',
  livery: '#b5622e',
  cx: 1500, cz: -2840,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '火炭村・坳背灣街', en: 'Fo Tan Village · Au Pui Wan St' },
    { id: 'B', x:  15, side: -1, zh: '何東樓車廠',       en: 'Ho Tung Lau Depot' },
    { id: 'C', x:  60, side: 1,  zh: '火炭工業區',       en: 'Fo Tan Industrial Area' },
    { id: 'D', x: -15, side: 1,  zh: '駿景園・樂信徑',   en: 'Jubilee Garden · Lok Shun Path' },
  ],

  people: { U1: 34, G: 14, P: 36 },
});
