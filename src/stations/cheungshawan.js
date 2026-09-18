// Cheung Sha Wan Station 長沙灣 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/csw.pdf) +
// Wikipedia. Under Cheung Sha Wan Rd between Tonkin St and Fat Tseung
// St — garment wholesale district gone startup/industrial-loft, with
// Un Chau Estate and the Cheung Sha Wan wholesale markets west, IVE
// (Haking Wong) and the playground east. Standard island platform
// (template.js recipe). Livery: mustard yellow / brown.
// Exits (6): A1 Cheung Sha Wan Rd, A2 Tonkin St, A3 Tonkin St (Lei
// Cheng Uk Han Tomb / Cheung Sha Wan Estate — lift podium), B Fat
// Tseung St (playground / IVE), C1 Wing Lung St, C2 Un Chau Estate.

import { twlIsland } from './template.js';

export const CSW = twlIsland({
  id: 'CSW', zh: '長沙灣', en: 'Cheung Sha Wan',
  livery: '#a16207',   // CSW's mustard-yellow/brown mosaic
  cz: -1600,

  // exits — north (-z) side reaches Cheung Sha Wan Rd / Tonkin St /
  // Fat Tseung St; south (+z) side reaches Wing Lung St / Un Chau
  exits: [
    { id: 'A1', x: -70, side: -1, zh: '長沙灣道',             en: 'Cheung Sha Wan Road' },
    { id: 'A2', x: -38, side: -1, zh: '東京街',              en: 'Tonkin Street' },
    { id: 'A3', x:  -8, side: -1, zh: '東京街・李鄭屋漢墓',   en: 'Tonkin St · Han Tomb' },
    { id: 'B',  x:  40, side: -1, zh: '發祥街・保安道遊樂場', en: 'Fat Tseung St · Playground' },
    { id: 'C1', x: -30, side: 1,  zh: '永隆街',              en: 'Wing Lung Street' },
    { id: 'C2', x:  30, side: 1,  zh: '元州邨',              en: 'Un Chau Estate' },
  ],

  people: { G: 20, L1: 54, L2: 40 },
});
