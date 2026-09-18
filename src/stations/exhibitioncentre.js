// Exhibition Centre Station 會展 — schematic data based on the official
// MTR layout (mtr.com.hk/archive/ch/services/layouts/exc.pdf) + Wikipedia.
// The EAL's harbourfront stop on the Wan Chai North reclamation —
// underground island between Admiralty and the harbour dive. The real
// station stacks two side platforms; the schematic uses the standard
// island form. Livery: sea green.
// Exits (per Wikipedia, condensed): A HKCEC / Convention Ave, B1 Expo
// Drive, B2 Wan Chai Ferry Pier, C Harbour Rd / Great Eagle Centre.

import { twlIsland } from './template.js';

export const EXC = twlIsland({
  id: 'EXC', zh: '會展', en: 'Exhibition Centre',
  livery: '#7fbf9e',   // Exhibition Centre's sea-green mosaic
  cx: 600, cz: -50,
  platZh: '月台・東鐵綫', platEn: 'East Rail Line Platform',

  // EAL faces — P1 northbound under the harbour to Lo Wu / Lok Ma Chau,
  // P2 back to the Admiralty terminus
  faces: [
    { num: 1, line: 'EAL', side: -1, dir: 1,  to: { zh: '往羅湖・落馬洲', en: 'to Lo Wu · Lok Ma Chau' } },
    { num: 2, line: 'EAL', side: 1,  dir: -1, to: { zh: '往金鐘',         en: 'to Admiralty' } },
  ],

  exits: [
    { id: 'A',  x: -50, side: -1, zh: '會議道・會展中心',   en: 'Convention Ave · HKCEC' },
    { id: 'B1', x:  10, side: -1, zh: '博覽道・渡輪碼頭',   en: 'Expo Drive · Ferry Pier' },
    { id: 'B2', x:  60, side: -1, zh: '港灣道・海港中心',   en: 'Harbour Rd · Harbour Centre' },
    { id: 'C',  x: -20, side: 1,  zh: '告士打道・入境大樓', en: 'Gloucester Rd · Immigration Tower' },
  ],

  people: { G: 16, L1: 46, L2: 48 },
});
