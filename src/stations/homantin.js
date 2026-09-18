// Ho Man Tin Station 何文田 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/hom.pdf) + Wikipedia.
// KTL/TML underground interchange on the Ho Man Tin uplands between
// Yau Ma Tei and the Whampoa waterfront — the TML island stacks at L3
// below the KTL platform. KTL faces run flipped vs the rest of the
// line: northbound departs the west portal (YMT is −x of here).
// Livery: pale green.
// Exits (per Wikipedia, condensed): A Oi Man Estate, B Sheung Lok St,
// C Fat Kwong St / Hong Kong Housing Society.

import { twlIsland } from './template.js';

const hom = twlIsland({
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

// The TML island at L3 below the KTL platform — transfer is down the
// mid-platform escalator pair. Faces 3/4 keep clear of the KTL feed's
// plat keys.
hom.boxes.homTml = { cx: 570, cz: -1130, len: 190, wid: 24, rot: 0 };
hom.levels.push(
  { id: 'L3', y: -21, box: 'homTml', zh: '月台・屯馬綫', en: 'Tuen Ma Line Platform', type: 'platform' },
);
hom.platforms.L3 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 4, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],
};
hom.escalators = [
  ...hom.escalators,
  { from: 'L2', to: 'L3', frame: 'homTml', cx: -40, cz: 0, dir: [-1, 0], n: 2 },
];
hom.lifts = [
  ...hom.lifts,
  { frame: 'homTml', x: 10, z: 0, levels: ['L2', 'L3'] },
];
hom.walkRects.L3 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
hom.people.L3 = 42;

export const HOM = hom;
