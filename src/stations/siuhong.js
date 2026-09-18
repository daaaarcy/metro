// Siu Hong Station 兆康 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/sih.pdf) + Wikipedia.
// TML viaduct stop beside the depot and Siu Hong Court. Livery: teal.
// Exits: A Siu Hong Court, B depot / Lingnan, C Butterfly Beach.

import { twlViaduct } from './template.js';

export const SIH = twlViaduct({
  id: 'SIH', zh: '兆康', en: 'Siu Hong',
  livery: '#4f8f8f',
  cx: -2900, cz: -3350,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'sihConc', zh: '兆康苑・青松觀', en: 'Siu Hong Court' },
    { id: 'B', x:  20, side: -1, door: true, box: 'sihConc', zh: '車廠・嶺南大學', en: 'Depot · Lingnan Univ' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'sihConc', zh: '蝴蝶邨・湖山路', en: 'Butterfly Estate' },
  ],

  people: { G: 12, GC: 32, U1: 36 },
});
