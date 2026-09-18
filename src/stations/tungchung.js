// Tung Chung Station 東涌 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/tuc.pdf) + Wikipedia.
// The TCL terminus — underground island under Citygate mall and the
// Tung Chung new-town slabs; both faces use the east portal, buffers on
// the west dead end. Livery: blue-purple.
// Exits (per Wikipedia, condensed): A Citygate outlets, B Tung Chung
// Crescent, C Fu Tung Estate, D Ngong Ping 360 cable car.

import { twlIsland } from './template.js';

export const TUC = twlIsland({
  id: 'TUC', zh: '東涌', en: 'Tung Chung',
  livery: '#5a5aa8',
  cx: -3000, cz: -2300,
  platZh: '月台・東涌綫', platEn: 'Tung Chung Line Platform',

  terminus: true,   // dead end west — both faces berth from the east portal
  faces: [
    { num: 1, line: 'TCL', side: -1, dir: 1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'TCL', side: 1,  dir: 1, to: { zh: '往香港',   en: 'to Hong Kong' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '東薈城・纜車站',   en: 'Citygate · Ngong Ping 360' },
    { id: 'B', x:  10, side: -1, zh: '東涌市中心',       en: 'Tung Chung Town Centre' },
    { id: 'C', x:  60, side: 1,  zh: '富東邨・東堤灣畔', en: 'Fu Tung Est · Tung Chung Cres' },
  ],

  people: { G: 18, L1: 44, L2: 48 },
});
