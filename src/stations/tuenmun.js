// Tuen Mun Station 屯門 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/tum.pdf) + Wikipedia. The TML
// west terminus on the viaduct over Tuen Mun town centre — V City podium
// below the deck, buffers west. Both faces use the east portal.
// Exits: A V City / Tuen Mun town centre, B Tuen Mun Park, C Pui To Rd.

import { twlViaduct } from './template.js';

export const TUM = twlViaduct({
  id: 'TUM', zh: '屯門', en: 'Tuen Mun',
  livery: '#3a6ea8',
  cx: -3300, cz: -3100,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  terminus: true, tail: -1,   // dead end west — overrun toward the depot
  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'TML', side: 1,  dir: 1, to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'tumConc', zh: 'V City・屯門市中心', en: 'V City · Town Centre' },
    { id: 'B', x:  20, side: -1, door: true, box: 'tumConc', zh: '屯門公園・屯喜路',   en: 'Tuen Mun Park' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'tumConc', zh: '杯渡路・工業區',     en: 'Pui To Rd · Industrial' },
  ],

  people: { G: 16, GC: 42, U1: 46 },
});
