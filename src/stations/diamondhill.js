// Diamond Hill Station 鑽石山 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/dih.pdf) + Wikipedia.
// KTL/TML underground interchange at the Kowloon Peak foot — Plaza
// Hollywood and Galaxia above; the TML island stacks at L3 below the
// KTL platform. Livery: black with silver flecks.
// Exits (per Wikipedia, condensed): A Plaza Hollywood, B Lung Cheung Rd,
// C Galaxia / Tai Hom.

import { twlIsland } from './template.js';

const dih = twlIsland({
  id: 'DIH', zh: '鑽石山', en: 'Diamond Hill',
  livery: '#2a2a2e',
  cx: 1830, cz: -1440,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '荷里活廣場',         en: 'Plaza Hollywood' },
    { id: 'B', x:  20, side: -1, zh: '龍翔道・志蓮淨苑',   en: 'Lung Cheung Rd · Chi Lin Nunnery' },
    { id: 'C', x:  60, side: 1,  zh: '星河明居・大磡村',   en: 'Galaxia · Tai Hom' },
  ],

  people: { G: 16, L1: 44, L2: 48 },
});

// The TML island at L3 below the KTL platform — transfer is down the
// mid-platform escalator pair. Faces 3/4 keep clear of the KTL feed's
// plat keys.
dih.boxes.dihTml = { cx: 1830, cz: -1440, len: 190, wid: 24, rot: 0 };
dih.levels.push(
  { id: 'L3', y: -21, box: 'dihTml', zh: '月台・屯馬綫', en: 'Tuen Ma Line Platform', type: 'platform' },
);
dih.platforms.L3 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 4, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],
};
dih.escalators = [
  ...dih.escalators,
  { from: 'L2', to: 'L3', frame: 'dihTml', cx: -40, cz: 0, dir: [-1, 0], n: 2 },
];
dih.lifts = [
  ...dih.lifts,
  { frame: 'dihTml', x: 10, z: 0, levels: ['L2', 'L3'] },
];
dih.walkRects.L3 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
dih.people.L3 = 44;

export const DIH = dih;
