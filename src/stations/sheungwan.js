// Sheung Wan Station 上環 — schematic data based on the official MTR
// layout (mtr.com.hk/archive/ch/services/layouts/shw.pdf).
// ~1.0 km west of Central along the harbour-front axis (-X).
// Island Line's western terminus 1986–2014 — trains still reverse in
// the overrun tunnel west of the station, which the ISL route reuses.
// One island platform serves both directions (P1 Chai Wan / P2 Kennedy
// Town); the official plan's two concourses (central Hillier St, east
// Rumsey St/Infinitus Plaza) merge into one L1 concourse here. The
// walled-off Rumsey Street ghost platforms east of L2 are omitted.
// Built on the islIsland() recipe.

import { islIsland } from './template.js';

export const SHW = islIsland({
  id: 'SHW', zh: '上環', en: 'Sheung Wan',
  livery: '#8f7a5e',   // SHW's khaki/light-brown mosaic tile
  cx: -2050,

  // Exit fan per Wikipedia/MTR — west cluster (central concourse):
  // D Shun Tak Centre/Macau Ferry, A1 Des Voeux Rd, A2 Wing Lok St,
  // B Hillier St/Western Market, C Connaught Rd; east cluster (east
  // concourse): E1/E2 Rumsey St, E3 Wing On Centre, E4/E5 Infinitus
  // Plaza. Shafts keep clear of the escalator wells (x∈±[55,69]).
  exits: [
    { id: 'D',  x: -100, side: -1, zh: '信德中心・港澳碼頭',    en: 'Shun Tak Centre · Macau Ferry' },
    { id: 'A1', x: -88,  side: -1, zh: '德輔道中',            en: 'Des Voeux Road Central' },
    { id: 'A2', x: -88,  side: 1,  zh: '永樂街・文咸東街',     en: 'Wing Lok St · Bonham Strand' },
    { id: 'B',  x: -74,  side: 1,  zh: '禧利街・西港城',       en: 'Hillier St · Western Market' },
    { id: 'C',  x: -50,  side: -1, zh: '干諾道中',            en: 'Connaught Road Central' },
    { id: 'E1', x: 50,   side: -1, zh: '林士街',              en: 'Rumsey Street' },
    { id: 'E2', x: 50,   side: 1,  zh: '林士街',              en: 'Rumsey Street' },
    { id: 'E4', x: 76,   side: -1, zh: '無限極廣場',          en: 'Infinitus Plaza' },
    { id: 'E5', x: 90,   side: -1, zh: '無限極廣場',          en: 'Infinitus Plaza' },
    { id: 'E3', x: 88,   side: 1,  zh: '永安中心',            en: 'Wing On Centre' },
  ],

  lifts: [
    { frame: 'shwConc', x: -8,  z: 0,   levels: ['L1', 'L2'] },   // paid lift onto the island
    { frame: 'shwConc', x: -80, z: -15, levels: ['G', 'L1'] },    // street lift — Des Voeux/A1 side
    { frame: 'shwConc', x: 96,  z: 15,  levels: ['G', 'L1'] },    // street lift — E3 wheelchair side
  ],

  kioskXs:  [-32, 0, 34],     // north band, dodging the exit shafts
  kioskXsS: [-36, -4, 30],    // south band

  people: { G: 14, L1: 42, L2: 34 },
});
