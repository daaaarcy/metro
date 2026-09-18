// Wong Chuk Hang Station 黃竹坑 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/wch.pdf) + Wikipedia.
// South Island Line elevated stop over Wong Chuk Hang Rd — the viaduct
// form (grade concourse, opposed side decks). The SOUTH horizon depot
// sits east of the dig; Nam Long Shan Rd drops south into the industrial
// blocks. Livery: mustard yellow.
// Exits (per Wikipedia, condensed): A1/A2 Heung Yip Rd / industrial side,
// B Nam Long Shan Rd / Wong Chuk Hang Rd south.

import { twlViaduct } from './template.js';

export const WCH = twlViaduct({
  id: 'WCH', zh: '黃竹坑', en: 'Wong Chuk Hang',
  livery: '#e3b320',   // Wong Chuk Hang's mustard mosaic
  cx: 560, cz: 600,
  platZh: '月台・南港島綫', platEn: 'South Island Line Platform',

  faces: [
    { num: 1, line: 'SIL', side: -1, dir: -1, to: { zh: '往海怡半島', en: 'to South Horizons' } },
    { num: 2, line: 'SIL', side: 1,  dir: 1,  to: { zh: '往金鐘',     en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A1', x: -50, side: -1, door: true, box: 'wchConc', zh: '香葉道・工業區',      en: 'Heung Yip Rd · Industrial Area' },
    { id: 'A2', x:  50, side: -1, door: true, box: 'wchConc', zh: '香葉道・巴士總站',     en: 'Heung Yip Rd · Bus Terminus' },
    { id: 'B',  x:   0, side: 1,  door: true, box: 'wchConc', zh: '南朗山道・黃竹坑道',   en: 'Nam Long Shan Rd · Wong Chuk Hang Rd' },
  ],

  kioskXs:  [-34, 8, 48],
  kioskXsS: [-48, -8, 30],

  people: { G: 14, GC: 30, U1: 36 },
});
