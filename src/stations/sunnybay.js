// Sunny Bay Station 欣澳 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/sun.pdf) + Wikipedia.
// The open-air interchange where the Disneyland Resort Line branches
// off the Tung Chung Line — the real station is all open platforms on
// the bay shore; condensed to TCL sides at grade with the DRL shuttle
// faces on an island spliced at L1. Livery: grey-green.
// Exits (per Wikipedia, condensed): A Sunny Bay promenade, B Yam O
// waterfront.

import { atGradeSide } from './template.js';

const sun = atGradeSide({
  id: 'SUN', zh: '欣澳', en: 'Sunny Bay',
  livery: '#8a9a8a',
  cx: -2450, cz: -1900,
  platZh: '月台・東涌綫', platEn: 'Tung Chung Line Platforms',

  faces: [
    { num: 1, line: 'TCL', side: -1, dir: -1, to: { zh: '往東涌', en: 'to Tung Chung' } },
    { num: 2, line: 'TCL', side: 1,  dir: 1,  to: { zh: '往香港', en: 'to Hong Kong' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '欣澳海濱',       en: 'Sunny Bay Promenade' },
    { id: 'B', x:  40, side: 1,  zh: '陰澳・大蠔灣',   en: 'Yam O · Tai Ho Wan' },
  ],

  people: { U1: 28, G: 10, P: 30 },
});

// DRL island at L1 — the Disneyland shuttle arrives on face 4 (from the
// east portal) and departs face 3 east toward the resort.
sun.boxes.sunDrl = { cx: -2450, cz: -1900, len: 190, wid: 24, rot: 0 };
sun.levels.push(
  { id: 'L1', y: -7, box: 'sunDrl', zh: '月台・迪士尼綫', en: 'Disneyland Resort Line Platform', type: 'platform' },
);
sun.platforms.L1 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'DRL', side: -1, dir: 1,  to: { zh: '往迪士尼', en: 'to Disneyland Resort' } },
    { num: 4, line: 'DRL', side: 1,  dir: -1, to: { zh: '終點站',   en: 'Terminus' } },
  ],
};
sun.escalators = [
  ...sun.escalators,
  { from: 'U1', to: 'L1', frame: 'sunDrl', cx: -50, cz: 0, dir: [-1, 0], n: 2, runLen: 30 },
  { from: 'U1', to: 'L1', frame: 'sunDrl', cx:  50, cz: 0, dir: [ 1, 0], n: 2, runLen: 30 },
];
sun.lifts = [
  ...sun.lifts,
  { frame: 'sunDrl', x: -10, z: 0, levels: ['U1', 'L1'] },
];
sun.walkRects.L1 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
sun.people.L1 = 26;

export const SUN = sun;
