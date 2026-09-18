// Nam Cheong Station 南昌 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/nac.pdf) + Wikipedia.
// TML at-grade stop in the West Kowloon reclamation — the real station
// shares a cross-platform with the Tung Chung Line; condensed to the
// TML faces + the V·Walk / Cullinan slabs above.
// Exits: A V·Walk / Cullinan, B Fu Cheong Estate, C Nam Cheong Park.

import { atGradeSide } from './template.js';

export const NAC = atGradeSide({
  id: 'NAC', zh: '南昌', en: 'Nam Cheong',
  livery: '#d8b03a',
  cx: 700, cz: -1700,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platforms',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '匯璽・V Walk',       en: 'Cullinan · V Walk' },
    { id: 'B', x:  20, side: -1, zh: '富昌邨・深旺道',     en: 'Fu Cheong Est · Sham Mong Rd' },
    { id: 'C', x:  55, side: 1,  zh: '南昌公園・欽州街',   en: 'Nam Cheong Park' },
  ],

  people: { U1: 40, G: 16, P: 44 },
});
