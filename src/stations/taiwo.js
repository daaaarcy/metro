// Tai Wo Station 太和 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/tao.pdf) + Wikipedia. EAL
// through-stop on the viaduct over Tai Wo estate — grade concourse under
// the opposed side decks, Tai Wo Plaza footbridge. Livery: green.
// Exits (per Wikipedia, condensed): A Tai Wo Plaza, B Tai Wo Estate,
// C Po Nga Rd.

import { twlViaduct } from './template.js';

export const TAO = twlViaduct({
  id: 'TAO', zh: '太和', en: 'Tai Wo',
  livery: '#4f8f4f',
  cx: 2800, cz: -3080,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platform',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'taoConc', zh: '太和廣場',         en: 'Tai Wo Plaza' },
    { id: 'B', x:  20, side: -1, door: true, box: 'taoConc', zh: '太和邨・寶雅路',   en: 'Tai Wo Estate · Po Nga Rd' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'taoConc', zh: '大埔頭・汀角路',   en: 'Tai Po Tau · Ting Kok Rd' },
  ],

  people: { G: 14, GC: 34, U1: 36 },
});
