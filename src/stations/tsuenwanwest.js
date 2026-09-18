// Tsuen Wan West Station 荃灣西 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/tww.pdf) +
// Wikipedia. TML underground island on the reclamation waterfront —
// Ocean Pride / Tsuen Wan West towers above. Livery: rust.
// Exits: A Ocean Pride, B Tsuen Wan waterfront, C Nina Mall.

import { twlIsland } from './template.js';

export const TWW = twlIsland({
  id: 'TWW', zh: '荃灣西', en: 'Tsuen Wan West',
  livery: '#a85a3a',
  cx: -700, cz: -2500,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '海之戀・荃灣西站',   en: 'Ocean Pride' },
    { id: 'B', x:  10, side: -1, zh: '荃灣海濱・西樓角',   en: 'Tsuen Wan Waterfront' },
    { id: 'C', x:  60, side: 1,  zh: '如心廣場・荃新天地', en: 'Nina Mall' },
  ],

  people: { G: 16, L1: 40, L2: 44 },
});
