// Po Lam Station 寶琳 — schematic data based on the official MTR layout
// (mtr.com.hk/archive/ch/services/layouts/pol.pdf) + Wikipedia. The TKO
// line's north terminus — underground island under Metro City, buffer
// stops on the east dead end. Both faces use the west portal: trains
// reverse on the off-map wrap. Livery: orange.
// Exits (per Wikipedia, condensed): A Metro City / Po Lam Estate, B
// Po Lam Rd North, C Mau Wu Tsai.

import { twlIsland } from './template.js';

export const POL = twlIsland({
  id: 'POL', zh: '寶琳', en: 'Po Lam',
  livery: '#e07b39',
  cx: 5080, cz: -2380,
  platZh: '月台・將軍澳綫', platEn: 'Tseung Kwan O Line Platform',

  terminus: true, bufDir: 1,   // dead end east — buffers past the platform
  faces: [
    { num: 1, line: 'TKO', side: -1, dir: -1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'TKO', side: 1,  dir: -1, to: { zh: '往北角',   en: 'to North Point' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '新都城・寶林邨',   en: 'Metro City · Po Lam Estate' },
    { id: 'B', x:  10, side: -1, zh: '寶琳北路',         en: 'Po Lam Road North' },
    { id: 'C', x:  60, side: 1,  zh: '茅湖仔・將軍澳村', en: 'Mau Wu Tsai · TKO Village' },
  ],

  people: { G: 16, L1: 42, L2: 46 },
});
