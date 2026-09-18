// Shau Kei Wan Station 筲箕灣 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/skw.pdf).
// ~600 m east of Sai Wan Ho under Shau Kei Wan Road / Mong Lung St.
// Single island platform on L2 (P1 -> Chai Wan, P2 -> Kennedy Town)
// with the plan's signature unpaid corridor fan — ten exits reaching
// the tram terminus, Main Street East, Aldrich Bay and the hillside.
// Exits per Wikipedia: A1 Perfect Mount Gdns, A2 Po Man St, A3 Bus
// Terminus; B1 Main St East, B2 Museum of Coastal Defence, B3 Aldrich
// Bay Rd; C Mong Lung St; D1 Tam Kung Temple/HK Art School,
// D2 Aldrich Garden.
// Built on the islIsland() recipe — gate bands sit a notch wider like TAK.

import { islIsland } from './template.js';

export const SKW = islIsland({
  id: 'SKW', zh: '筲箕灣', en: 'Shau Kei Wan',
  livery: '#315dae',   // SKW's blue mosaic tile livery
  cx: 6000,

  // Exit fan: A-cluster south (Perfect Mount/Po Man St/Bus Terminus),
  // B-cluster north (Main St East/Coastal Defence Museum/Aldrich Bay),
  // C east (Mong Lung St), D west (Tam Kung Temple/Aldrich Garden).
  exits: [
    { id: 'A1', x: -90, side: 1,  zh: '峻峰花園',              en: 'Perfect Mount Gardens' },
    { id: 'A2', x: -74, side: 1,  zh: '寶文街',                en: 'Po Man Street' },
    { id: 'A3', x: -56, side: 1,  zh: '筲箕灣巴士總站',         en: 'Bus Terminus' },
    { id: 'B1', x: -50, side: -1, zh: '筲箕灣東大街',           en: 'Main Street East' },
    { id: 'B2', x: -66, side: -1, zh: '海防博物館',             en: 'Museum of Coastal Defence' },
    { id: 'B3', x: -84, side: -1, zh: '愛秩序灣道',             en: 'Aldrich Bay Road' },
    { id: 'C',  x: 92,  side: 1,  zh: '望隆街',                en: 'Mong Lung Street' },
    { id: 'D1', x: 62,  side: -1, zh: '譚公廟・香港藝術學院',    en: 'Tam Kung Temple · HK Art School' },
    { id: 'D2', x: 80,  side: -1, zh: '愛蝶灣',                en: 'Aldrich Garden' },
  ],

  lifts: [
    { frame: 'skwConc', x: 0,   z: 0,   levels: ['L1', 'L2'] },        // paid lift
    { frame: 'skwConc', x: -96, z: 15,  levels: ['G', 'L1'] },          // street lift — A side
    { frame: 'skwConc', x: 96,  z: -15, levels: ['G', 'L1'] },          // street lift — D side
  ],

  gateRows: [
    { z: -9, x0: -68, x1: -26 },
    { z: -9, x0:  26, x1:  68 },
    { z:  9, x0: -68, x1: -26 },
    { z:  9, x0:  26, x1:  68 },
  ],
  gateEnds: { x0: -74, x1: 74 },

  kioskXs:  [-44, -8, 34],
  kioskXsS: [-38, 8, 42],

  people: { G: 14, L1: 46, L2: 36 },
});
