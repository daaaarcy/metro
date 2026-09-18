// Ho Man Tin Station 何文田 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/hom.pdf) + Wikipedia.
// KTL underground island on the Ho Man Tin uplands between Yau Ma Tei
// and the Whampoa waterfront. Faces run flipped vs the rest of the
// line: northbound departs the west portal (YMT is −x of here).
// Livery: pale green.
// Exits (per Wikipedia, condensed): A Oi Man Estate, B Sheung Lok St,
// C Fat Kwong St / Hong Kong Housing Society.

import { twlIsland } from './template.js';

export const HOM = twlIsland({
  id: 'HOM', zh: '何文田', en: 'Ho Man Tin',
  livery: '#8fbf9f',
  cx: 570, cz: -1130,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: -1, to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: 1,  to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '愛民邨',               en: 'Oi Man Estate' },
    { id: 'B', x:  10, side: -1, zh: '常樂街・佛光街',       en: 'Sheung Lok St · Fat Kwong St' },
    { id: 'C', x:  60, side: 1,  zh: '香港都會大學・佛光街', en: 'HK Metropolitan U · Fat Kwong St' },
  ],

  people: { G: 14, L1: 38, L2: 40 },
});
