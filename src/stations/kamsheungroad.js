// Kam Sheung Road Station 錦上路 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/ksr.pdf) +
// Wikipedia. TML viaduct stop in the Kam Tin valley — weekend market and
// village edge, Pat Sin Leng foothills. Livery: maroon.
// Exits: A Kam Tin market, B Kam Sheung Rd villages, C Pat Sin hills.

import { twlViaduct } from './template.js';

export const KSR = twlViaduct({
  id: 'KSR', zh: '錦上路', en: 'Kam Sheung Road',
  livery: '#8a4a5a',
  cx: -1300, cz: -2700,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'ksrConc', zh: '錦田市集・錦上路', en: 'Kam Tin Market' },
    { id: 'B', x:  20, side: -1, door: true, box: 'ksrConc', zh: '錦田鄉村・八鄉',   en: 'Kam Tin Villages' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'ksrConc', zh: '大刀屻・林村',     en: 'Pat Sin Foothills' },
  ],

  people: { G: 10, GC: 26, U1: 30 },
});
