// Lok Ma Chau Station 落馬洲 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/lmc.pdf) + Wikipedia.
// The EAL spur terminus at grade on the wetlands edge — Futian control
// point across the Shenzhen River. Trains reverse on the off-map wrap.
// Livery: teal.
// Exits (per Wikipedia, condensed): A Lok Ma Chau control point, B
// wetlands / San Tin.

import { atGradeSide } from './template.js';

export const LMC = atGradeSide({
  id: 'LMC', zh: '落馬洲', en: 'Lok Ma Chau',
  livery: '#4f9f8f',
  cx: 3520, cz: -3520,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  terminus: true, tail: -1,  // spur terminus — overrun west into the wetlands
  faces: [
    { num: 1, line: 'EAL', side: -1, dir: -1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',   en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '落馬洲管制站・福田', en: 'Lok Ma Chau Ctrl Pt · Futian' },
    { id: 'B', x:  40, side: 1,  zh: '濕地・新田',         en: 'Wetlands · San Tin' },
  ],

  people: { U1: 32, G: 12, P: 34 },
});
