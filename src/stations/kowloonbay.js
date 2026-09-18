// Kowloon Bay Station 九龍灣 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/kob.pdf) + Wikipedia.
// The KTL emerges from tunnel onto the Kwun Tong Rd viaduct here —
// opposed side decks over the grade concourse, Kowloon Bay Depot and
// Telford Gardens alongside. Livery: light teal.
// Exits (per Wikipedia, condensed): A Telford Gardens / depot, B Wang
// Kwong Rd, C Telford Plaza.

import { twlViaduct } from './template.js';

export const KOB = twlViaduct({
  id: 'KOB', zh: '九龍灣', en: 'Kowloon Bay',
  livery: '#5f9fb0',
  cx: 2440, cz: -1680,
  platZh: '月台・觀塘綫', platEn: 'Kwun Tong Line Platform',

  faces: [
    { num: 1, line: 'KTL', side: -1, dir: 1,  to: { zh: '往調景嶺', en: 'to Tiu Keng Leng' } },
    { num: 2, line: 'KTL', side: 1,  dir: -1, to: { zh: '往黃埔',   en: 'to Whampoa' } },
  ],

  exits: [
    { id: 'A', x: -50, side: -1, door: true, box: 'kobConc', zh: '德福花園・車廠',   en: 'Telford Gardens · Depot' },
    { id: 'B', x:  10, side: -1, door: true, box: 'kobConc', zh: '宏照道・臨興街',   en: 'Wang Kwong Rd · Lam Hing St' },
    { id: 'C', x:  50, side: 1,  door: true, box: 'kobConc', zh: '德福廣場',         en: 'Telford Plaza' },
  ],

  kioskXs:  [-34, 8, 48],
  kioskXsS: [-48, -8, 30],

  people: { G: 16, GC: 36, U1: 40 },
});
