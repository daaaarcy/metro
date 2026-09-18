// Tsing Yi Station 青衣 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tsy.pdf) + Wikipedia.
// Shared TCL/AEX stop on Tsing Yi island — the real station is at grade
// with the two lines side by side; condensed to TCL sides at grade with
// an AEX island spliced at L1 (the KOT/YAT splice pattern). Maritime
// Square podium over the dig. Livery: green.
// Exits (per Wikipedia, condensed): A Maritime Square, B Tsing Yi
// Estate, C Tsing Yi Park.

import { atGradeSide } from './template.js';

const tsy = atGradeSide({
  id: 'TSY', zh: '青衣', en: 'Tsing Yi',
  livery: '#4f9f4f',
  cx: -1900, cz: -1400,
  platZh: '月台・東涌綫', platEn: 'Tung Chung Line Platforms',

  faces: [
    { num: 1, line: 'TCL', side: -1, dir: -1, to: { zh: '往東涌', en: 'to Tung Chung' } },
    { num: 2, line: 'TCL', side: 1,  dir: 1,  to: { zh: '往香港', en: 'to Hong Kong' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '青衣城・海濱',   en: 'Maritime Sq · Waterfront' },
    { id: 'B', x:  20, side: -1, zh: '青衣邨・青綠街', en: 'Tsing Yi Est · Tsing Luk St' },
    { id: 'C', x:  55, side: 1,  zh: '青衣公園・青衣墟', en: 'Tsing Yi Park · Town' },
  ],

  people: { U1: 38, G: 14, P: 40 },
});

// AEX island at L1 under the TCL trench — the Airport Express arm of
// the shared stop.
tsy.boxes.tsyAex = { cx: -1900, cz: -1400, len: 190, wid: 24, rot: 0 };
tsy.levels.push(
  { id: 'L1', y: -7, box: 'tsyAex', zh: '月台・機場快綫', en: 'Airport Express Platform', type: 'platform' },
);
tsy.platforms.L1 = {
  kind: 'island',
  faces: [
    { num: 3, line: 'AEX', side: -1, dir: -1, to: { zh: '往機場・博覽館', en: 'to Airport · AsiaWorld-Expo' } },
    { num: 4, line: 'AEX', side: 1,  dir: 1,  to: { zh: '往香港',         en: 'to Hong Kong' } },
  ],
};
tsy.escalators = [
  ...tsy.escalators,
  { from: 'U1', to: 'L1', frame: 'tsyAex', cx: -50, cz: 0, dir: [-1, 0], n: 2, runLen: 30 },
  { from: 'U1', to: 'L1', frame: 'tsyAex', cx:  50, cz: 0, dir: [ 1, 0], n: 2, runLen: 30 },
];
tsy.lifts = [
  ...tsy.lifts,
  { frame: 'tsyAex', x: -10, z: 0, levels: ['U1', 'L1'] },
];
tsy.walkRects.L1 = [{ x0: -92, z0: -4.9, x1: 92, z1: 4.9 }];
tsy.people.L1 = 30;

export const TSY = tsy;
