// Tai Po Market Station 大埔墟 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/tpm.pdf) +
// Wikipedia. EAL through-stop at grade in the Tai Po new town — market
// streets and the old Tai Po Kau green edge. Livery: violet.
// Exits (per Wikipedia, condensed): A Tai Po Plaza, B market / Heung Sze
// Wui St, C Uptown Plaza, D Tai Po complex.

import { atGradeSide } from './template.js';

export const TPM = atGradeSide({
  id: 'TPM', zh: '大埔墟', en: 'Tai Po Market',
  livery: '#7a5a9e',
  cx: 2450, cz: -3000,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platforms',

  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, zh: '大埔超級城',       en: 'Tai Po Mega Mall' },
    { id: 'B', x:  15, side: -1, zh: '墟市・鄉事會坊',   en: 'Market · Heung Sze Wui St' },
    { id: 'C', x:  60, side: 1,  zh: '新達廣場',         en: 'Uptown Plaza' },
    { id: 'D', x: -15, side: 1,  zh: '大埔綜合大樓',     en: 'Tai Po Complex' },
  ],

  people: { U1: 40, G: 16, P: 42 },
});
