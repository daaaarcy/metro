// Che Kung Temple Station 車公廟 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/ckt.pdf) +
// Wikipedia. TML viaduct stop on the Shing Mun bank — the temple and
// the Sha Tin edge. Livery: yellow.
// Exits: A Che Kung Temple, B Shing Mun River, C Tai Wai Rd.

import { twlViaduct } from './template.js';

export const CKT = twlViaduct({
  id: 'CKT', zh: '車公廟', en: 'Che Kung Temple',
  livery: '#c8b03a',
  cx: 950, cz: -2480,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'cktConc', zh: '車公廟・廟宇',   en: 'Che Kung Temple' },
    { id: 'B', x:  20, side: -1, door: true, box: 'cktConc', zh: '城門河畔・沙田頭', en: 'Shing Mun River' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'cktConc', zh: '大圍道・秦石邨', en: 'Tai Wai Rd · Chun Shek' },
  ],

  people: { G: 12, GC: 30, U1: 34 },
});
