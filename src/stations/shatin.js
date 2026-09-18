// Sha Tin Station 沙田 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/shs.pdf) + Wikipedia. EAL
// through-stop at grade in the Sha Tin new-town centre — New Town Plaza
// galleries over the platforms, town hall and park alongside. The real
// station carries a centre island + side platform; condensed to the
// schematic side-platform pair. Livery: maroon.
// Exits (per Wikipedia, condensed): A New Town Plaza, B Sha Tin town
// hall / park, C Royal Park Hotel, D Pai Tau village.

import { atGradeSide } from './template.js';

export const SHS = atGradeSide({
  id: 'SHS', zh: '沙田', en: 'Sha Tin',
  livery: '#a0344c',
  cx: 1100, cz: -2760,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '新城市廣場',         en: 'New Town Plaza' },
    { id: 'B', x:  15, side: -1, zh: '沙田大會堂・公園',   en: 'Town Hall · Sha Tin Park' },
    { id: 'C', x:  60, side: 1,  zh: '帝都酒店・市中心',   en: 'Royal Park Hotel · Centre' },
    { id: 'D', x: -15, side: 1,  zh: '排頭村・沙田鄉事會', en: 'Pai Tau Village' },
  ],

  people: { U1: 44, G: 18, P: 46 },
});
