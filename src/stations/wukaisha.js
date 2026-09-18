// Wu Kai Sha Station 烏溪沙 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/wks.pdf) + Wikipedia.
// The TML east terminus at grade on the Three Fathoms Cove shore —
// Double Cove / Lake Silver slabs and the village edge. Both faces use
// the west portal; overrun east toward the cove. Livery: silver.
// Exits: A Double Cove, B Wu Kai Sha village / beach.

import { atGradeSide } from './template.js';

export const WKS = atGradeSide({
  id: 'WKS', zh: '烏溪沙', en: 'Wu Kai Sha',
  livery: '#9aa5aa',
  cx: 3450, cz: -3650,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platforms',

  terminus: true, tail: 1,   // dead end east — buffers toward the cove
  faces: [
    { num: 1, line: 'TML', side: -1, dir: -1, to: { zh: '終點站', en: 'Terminus' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, zh: '迎海・銀湖天峰',   en: 'Double Cove · Lake Silver' },
    { id: 'B', x:  40, side: 1,  zh: '烏溪沙村・青年新村', en: 'Wu Kai Sha Village' },
  ],

  people: { U1: 34, G: 12, P: 38 },
});
