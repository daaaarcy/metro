// Sheung Shui Station 上水 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/shu.pdf) + Wikipedia.
// EAL through-stop at grade — the junction where the Lok Ma Chau spur
// leaves the Lo Wu mainline; Shek Wu Hui market streets and estate
// slabs. Livery: ochre.
// Exits (per Wikipedia, condensed): A Sheung Shui Plaza, B Shek Wu Hui,
// C Landmark North, D Choi Yuen Estate.

import { atGradeSide } from './template.js';

export const SHU = atGradeSide({
  id: 'SHU', zh: '上水', en: 'Sheung Shui',
  livery: '#c8a03a',
  cx: 3520, cz: -3200,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '上水廣場',         en: 'Sheung Shui Centre' },
    { id: 'B', x:  15, side: -1, zh: '石湖墟・符興街',   en: 'Shek Wu Hui · Fu Hing St' },
    { id: 'C', x:  60, side: 1,  zh: '北區大會堂',       en: 'North District Town Hall' },
    { id: 'D', x: -15, side: 1,  zh: '彩園邨・彩園路',   en: 'Choi Yuen Estate' },
  ],

  people: { U1: 42, G: 16, P: 44 },
});
