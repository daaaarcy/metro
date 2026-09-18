// Shek Mun Station 石門 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/shm.pdf) + Wikipedia.
// TML viaduct stop in the Shek Mun business/industrial fringe on the
// Shing Mun bank. Livery: blue.
// Exits: A Shek Mun business area, B Siu Lek Yuen, C On Lai St.

import { twlViaduct } from './template.js';

export const SHM = twlViaduct({
  id: 'SHM', zh: '石門', en: 'Shek Mun',
  livery: '#4a6a9a',
  cx: 2250, cz: -2870,
  platZh: '月台・屯馬綫', platEn: 'Tuen Ma Line Platform',

  faces: [
    { num: 1, line: 'TML', side: -1, dir: 1,  to: { zh: '往烏溪沙', en: 'to Wu Kai Sha' } },
    { num: 2, line: 'TML', side: 1,  dir: -1, to: { zh: '往屯門',   en: 'to Tuen Mun' } },
  ],

  exits: [
    { id: 'A', x: -40, side: -1, door: true, box: 'shmConc', zh: '石門商貿區',     en: 'Shek Mun Business Area' },
    { id: 'B', x:  20, side: -1, door: true, box: 'shmConc', zh: '小瀝源・安麗街', en: 'Siu Lek Yuen' },
    { id: 'C', x:  55, side: 1,  door: true, box: 'shmConc', zh: '安睦街・安心街', en: 'On Muk St' },
  ],

  people: { G: 12, GC: 30, U1: 34 },
});
