// Mong Kok East Station 旺角東 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/mke.pdf) + Wikipedia.
// At-grade side platforms on the embankment east of Mong Kok — the old
// KCR surface stop, a footbridge hop from MOK's towers. Livery: dark
// green.
// Exits (per Wikipedia, condensed): B Grand Century Place, C Mong Kok
// Stadium, D footbridge link to Mong Kok.

import { atGradeSide } from './template.js';

export const MKE = atGradeSide({
  id: 'MKE', zh: '旺角東', en: 'Mong Kok East',
  livery: '#1f6b45',   // Mong Kok East's dark green
  cx: 750, cz: -1240,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'B', x: -40, side: -1, zh: '新世紀廣場',           en: 'Grand Century Place' },
    { id: 'C', x:  30, side: -1, zh: '旺角大球場',           en: 'Mong Kok Stadium' },
    { id: 'D', x:  60, side: 1,  zh: '旺角・行人天橋',        en: 'Mong Kok · Footbridge' },
  ],

  people: { U1: 40, G: 16, P: 38 },
});
