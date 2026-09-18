// Tai Wai Station 大圍 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/taw.pdf) + Wikipedia.
// EAL/TML interchange in the Shing Mun valley north of the Lion Rock
// tunnel — the EAL keeps the viaduct form (grade concourse under
// opposed side decks) while the TML island sits at L1 beneath.
// Livery: navy.
// Exits (per Wikipedia, condensed): A Tai Wai village, B Festival City,
// C Che Kung Temple, D Hin Keng.

import { twlViaduct } from './template.js';

const taw = twlViaduct({
  id: 'TAW', zh: '大圍', en: 'Tai Wai',
  livery: '#1f4a8c',   // Tai Wai's navy mosaic
  cx: 640, cz: -2140,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platform',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, door: true, box: 'tawConc', zh: '大圍村・積福街',     en: 'Tai Wai Village · Chik Fuk St' },
    { id: 'B', x:  10, side: -1, door: true, box: 'tawConc', zh: '名城・車公廟路',     en: 'Festival City · Che Kung Miu Rd' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'tawConc', zh: '車公廟・海福花園',   en: 'Che Kung Temple · Holford Gdns' },
    { id: 'D', x: -20, side: 1,  door: true, box: 'tawConc', zh: '顯徑・美田路',       en: 'Hin Keng · Mei Tin Rd' },
  ],

  kioskXs:  [-34, 8, 48],
  kioskXsS: [-48, -8, 30],

  people: { G: 18, GC: 40, U1: 44 },
});

// The TML island at L1 under the grade concourse — riders drop from the
// U1 decks through GC onto the island. Faces 3/4 keep clear of the EAL
// feed's plat keys.
taw.boxes.tawTml = { cx: 640, cz: -2140, len: 190, wid: 24, rot: 0 };
taw.levels.push(
  { id: 'L1', y: -7, box: 'tawTml', zh: '月台・屯馬綫', en: 'Tuen Ma Line Platform', type: 'platform' },
);
taw.platforms.L1 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 4, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],
};
taw.escalators = [
  ...taw.escalators,
  { from: 'GC', to: 'L1', frame: 'tawTml', cx: -40, cz: 0, dir: [-1, 0], n: 2 },
];
taw.lifts = [
  ...taw.lifts,
  { frame: 'tawTml', x: 10, z: 0, levels: ['GC', 'L1'] },
];
taw.walkRects.L1 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
taw.people.L1 = 40;

export const TAW = taw;
