// Sha Tin Wai Station 沙田圍 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/stw.pdf) + Wikipedia.
// TML viaduct stop over the Sha Tin Wai estate slabs. Livery: pink.
// Exits: A Sha Tin Wai Estate, B Kok Kwok village, C Sha Tin Rd.

import { twlViaduct } from './template.js';

export const STW = twlViaduct({
  id: 'STW', zh: '沙田圍', en: 'Sha Tin Wai',
  livery: '#c86a8a',
  cx: 1500, cz: -2700,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'stwConc', zh: '沙田圍邨・博康', en: 'Sha Tin Wai Estate' },
    { id: 'B', x:  20, side: -1, door: true, box: 'stwConc', zh: '覺豪・沙角街',   en: 'Kok Kwok · Sha Kok St' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'stwConc', zh: '沙田路・圍洲角', en: 'Sha Tin Rd' },
  ],

  people: { G: 12, GC: 32, U1: 36 },
});
