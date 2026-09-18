// Fanling Station 粉嶺 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/fan.pdf) + Wikipedia. EAL
// through-stop at grade in the Fanling/Sheung Shui new town — Fanling
// Centre and the estate slabs. Livery: lime.
// Exits (per Wikipedia, condensed): A Fanling Centre, B Fanling town
// centre, C Flora Plaza / estate, D Wah Sum Estate.

import { atGradeSide } from './template.js';

export const FAN = atGradeSide({
  id: 'FAN', zh: '粉嶺', en: 'Fanling',
  livery: '#9fbf3a',
  cx: 3150, cz: -3140,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '粉嶺中心',         en: 'Fanling Centre' },
    { id: 'B', x:  15, side: -1, zh: '粉嶺市中心・璧峰路', en: 'Fanling Town Centre' },
    { id: 'C', x:  60, side: 1,  zh: '花都廣場',         en: 'Flora Plaza' },
    { id: 'D', x: -15, side: 1,  zh: '華心邨・百和路',   en: 'Wah Sum Estate · Pak Wo Rd' },
  ],

  people: { U1: 40, G: 16, P: 42 },
});
