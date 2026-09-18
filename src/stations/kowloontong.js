// Kowloon Tong Station 九龍塘 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/kot.pdf) + Wikipedia.
// The EAL's surface stop where the line leaves the urban corridor for
// the Lion Rock tunnel — at-grade side platforms under a gallery, with
// the (unbuilt) KTL interchange beneath. Livery: light blue.
// Exits (per Wikipedia, condensed): A Festival Walk / KTL link, B
// Suffolk Rd, C Baptist University, E Broadcast Drive.

import { atGradeSide } from './template.js';

const kot = atGradeSide({
  id: 'KOT', zh: '九龍塘', en: 'Kowloon Tong',
  livery: '#6ea4d4',   // Kowloon Tong's light blue
  cx: 600, cz: -1420,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '又一城・觀塘綫',       en: 'Festival Walk · Kwun Tong Line' },
    { id: 'B', x:  20, side: -1, zh: '沙福道・九龍塘',       en: 'Suffolk Rd · Kowloon Tong' },
    { id: 'C', x:  60, side: 1,  zh: '浸會大學・城市大學',   en: 'Baptist U · City U' },
    { id: 'E', x: -20, side: 1,  zh: '廣播道',               en: 'Broadcast Drive' },
  ],

  people: { U1: 44, G: 18, P: 42 },
});

// The KTL interchange below the EAL trench: an L1 subway concourse
// over the L2 island. Express escalators drop from the U1 gallery
// through the platform-trench slab cut into the concourse, then on to
// the island. Faces 3/4 keep clear of the EAL feed's plat keys.
kot.boxes.kotKtl = { cx: 600, cz: -1420, len: 190, wid: 24, rot: 0 };
kot.levels.push(
  { id: 'L1', y: -7,  box: 'kotKtl', zh: '大堂・觀塘綫', en: 'Kwun Tong Line Concourse', type: 'concourse' },
  { id: 'L2', y: -14, box: 'kotKtl', zh: '月台・觀塘綫', en: 'Kwun Tong Line Platform',  type: 'platform'  },
);
kot.platforms.L2 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 4, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],
};
kot.escalators = [
  ...kot.escalators,
  { from: 'U1', to: 'L1', frame: 'kotKtl', cx: -50, cz: 0, dir: [-1, 0], n: 2, runLen: 30 },
  { from: 'L1', to: 'L2', frame: 'kotKtl', cx:  40, cz: 0, dir: [ 1, 0], n: 3 },
];
kot.lifts = [
  ...kot.lifts,
  { frame: 'kotKtl', x: -10, z: 0, levels: ['U1', 'L1', 'L2'] },
];
kot.walkRects.L1 = [{ x0: -85, z0: -9, x1: 85, z1: 9 }];
kot.walkRects.L2 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
kot.people.L1 = 34;
kot.people.L2 = 44;

export const KOT = kot;
