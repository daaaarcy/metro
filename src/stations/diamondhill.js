// Diamond Hill Station 鑽石山 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/dih.pdf) + Wikipedia.
// KTL underground island at the Kowloon Peak foot — Plaza Hollywood and
// Galaxia above; the real station interchanges with the Tuen Ma Line
// (condensed to KTL faces). Livery: black with silver flecks.
// Exits (per Wikipedia, condensed): A Plaza Hollywood, B Lung Cheung Rd,
// C Galaxia / Tai Hom.

import { twlIsland } from './template.js';

export const DIH = twlIsland({
  id: 'DIH', zh: '鑽石山', en: 'Diamond Hill',
  livery: '#2a2a2e',
  cx: 1830, cz: -1440,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '荷里活廣場',         en: 'Plaza Hollywood' },
    { id: 'B', x:  20, side: -1, zh: '龍翔道・志蓮淨苑',   en: 'Lung Cheung Rd · Chi Lin Nunnery' },
    { id: 'C', x:  60, side: 1,  zh: '星河明居・大磡村',   en: 'Galaxia · Tai Hom' },
  ],

  people: { G: 16, L1: 44, L2: 48 },
});
