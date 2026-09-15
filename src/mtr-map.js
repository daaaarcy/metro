// Schematic MTR system map — bottom-right mini-map for station-to-station
// navigation. Built (constructed) stations are clickable; every other stop
// renders grey and inert. Topology/interchanges follow the real network;
// geography is straightened for clarity like the official map.

// id: [x, y, 中文, English]
const ST = {
  // Island Line (HK Island spine, y≈170)
  KET: [28, 170, '堅尼地城', 'Kennedy Town'], HKU: [50, 170, '香港大學', 'HKU'],
  SYP: [72, 170, '西營盤', 'Sai Ying Pun'], SHW: [96, 170, '上環', 'Sheung Wan'],
  CEN: [120, 170, '中環', 'Central'], ADM: [165, 170, '金鐘', 'Admiralty'],
  WAC: [195, 170, '灣仔', 'Wan Chai'], CAB: [218, 170, '銅鑼灣', 'Causeway Bay'],
  TIH: [240, 170, '天后', 'Tin Hau'], FOH: [262, 170, '炮台山', 'Fortress Hill'],
  NOP: [284, 170, '北角', 'North Point'], QUB: [306, 170, '鰂魚涌', 'Quarry Bay'],
  TAK: [328, 170, '太古', 'Tai Koo'], SWH: [350, 170, '西灣河', 'Sai Wan Ho'],
  SKW: [372, 170, '筲箕灣', 'Shau Kei Wan'], HFC: [394, 170, '杏花邨', 'Heng Fa Chuen'],
  CHW: [416, 170, '柴灣', 'Chai Wan'],
  HOK: [75, 192, '香港', 'Hong Kong'],
  // Tsuen Wan Line (harbour crossing + NW Kowloon)
  TST: [178, 125, '尖沙咀', 'Tsim Sha Tsui'], JOR: [192, 113, '佐敦', 'Jordan'],
  YMT: [206, 102, '油麻地', 'Yau Ma Tei'], MOK: [218, 92, '旺角', 'Mong Kok'],
  PRE: [228, 82, '太子', 'Prince Edward'], SSP: [236, 72, '深水埗', 'Sham Shui Po'],
  CSW: [244, 62, '長沙灣', 'Cheung Sha Wan'], LCK: [252, 53, '荔枝角', 'Lai Chi Kok'],
  MEF: [168, 64, '美孚', 'Mei Foo'], LAK: [140, 70, '荔景', 'Lai King'],
  KWF: [126, 60, '葵芳', 'Kwai Fong'], KWH: [114, 50, '葵興', 'Kwai Hing'],
  TWH: [102, 41, '大窩口', 'Tai Wo Hau'], TSW: [86, 29, '荃灣', 'Tsuen Wan'],
  // Kwun Tong Line
  WHA: [148, 112, '黃埔', 'Whampoa'], HOM: [172, 104, '何文田', 'Ho Man Tin'],
  SKM: [242, 78, '石硤尾', 'Shek Kip Mei'], KOT: [262, 70, '九龍塘', 'Kowloon Tong'],
  LOF: [276, 64, '樂富', 'Lok Fu'], WTS: [290, 58, '黃大仙', 'Wong Tai Sin'],
  DIH: [304, 52, '鑽石山', 'Diamond Hill'], CHH: [318, 48, '彩虹', 'Choi Hung'],
  KOB: [332, 46, '九龍灣', 'Kowloon Bay'], NTK: [346, 44, '牛頭角', 'Ngau Tau Kok'],
  KWT: [360, 42, '觀塘', 'Kwun Tong'], LAT: [372, 44, '藍田', 'Lam Tin'],
  YAT: [386, 50, '油塘', 'Yau Tong'], TKL: [400, 58, '調景嶺', 'Tiu Keng Leng'],
  // Tseung Kwan O Line (east harbour crossing)
  TKW: [414, 66, '將軍澳', 'Tseung Kwan O'], HAH: [428, 72, '坑口', 'Hang Hau'],
  POL: [442, 78, '寶琳', 'Po Lam'], LHP: [414, 44, '康城', 'LOHAS Park'],
  // East Rail Line (north corridor)
  EXC: [188, 142, '會展', 'Exhibition Centre'], HUH: [208, 116, '紅磡', 'Hung Hom'],
  MKE: [232, 94, '旺角東', 'Mong Kok East'], TAW: [280, 54, '大圍', 'Tai Wai'],
  SHS: [296, 42, '沙田', 'Sha Tin'], FOT: [312, 34, '火炭', 'Fo Tan'],
  UNI: [328, 28, '大學', 'University'], TPM: [344, 24, '大埔墟', 'Tai Po Market'],
  TAO: [360, 20, '太和', 'Tai Wo'], FAN: [376, 17, '粉嶺', 'Fanling'],
  SHU: [392, 14, '上水', 'Sheung Shui'], LOW: [418, 12, '羅湖', 'Lo Wu'],
  LMC: [406, 28, '落馬洲', 'Lok Ma Chau'],
  // Tuen Ma Line (NW loop + Ma On Shan)
  TUM: [8, 12, '屯門', 'Tuen Mun'], SIH: [22, 16, '兆康', 'Siu Hong'],
  TIS: [36, 20, '天水圍', 'Tin Shui Wai'], LOP: [50, 24, '朗屏', 'Long Ping'],
  YUL: [64, 28, '元朗', 'Yuen Long'], KSR: [78, 32, '錦上路', 'Kam Sheung Road'],
  TWW: [94, 36, '荃灣西', 'Tsuen Wan West'], AUS: [100, 118, '柯士甸', 'Austin'],
  ETS: [160, 118, '尖東', 'East Tsim Sha Tsui'], TOS: [196, 96, '土瓜灣', 'To Kwa Wan'],
  SUW: [222, 84, '宋皇臺', 'Sung Wong Toi'], KAT: [250, 66, '啟德', 'Kai Tak'],
  HIK: [291, 55, '顯徑', 'Hin Keng'], CKT: [288, 46, '車公廟', 'Che Kung Temple'],
  STW: [303, 38, '沙田圍', 'Sha Tin Wai'], CIO: [316, 32, '第一城', 'City One'],
  SHM: [329, 27, '石門', 'Shek Mun'], TSH: [341, 23, '大水坑', 'Tai Shui Hang'],
  HEO: [353, 19, '恆安', 'Heng On'], MOS: [365, 15, '馬鞍山', 'Ma On Shan'],
  WKS: [381, 11, '烏溪沙', 'Wu Kai Sha'],
  // Tung Chung Line + Airport Express (west arm)
  KOW: [80, 150, '九龍', 'Kowloon'], OLY: [95, 128, '奧運', 'Olympic'],
  NAC: [108, 105, '南昌', 'Nam Cheong'], TSY: [60, 62, '青衣', 'Tsing Yi'],
  SUN: [36, 50, '欣澳', 'Sunny Bay'], TUC: [14, 36, '東涌', 'Tung Chung'],
  AIR: [30, 42, '機場', 'Airport'], AWE: [10, 26, '博覽館', 'AsiaWorld-Expo'],
  DIS: [24, 64, '迪士尼', 'Disneyland'],
  // South Island Line
  OCP: [158, 196, '海洋公園', 'Ocean Park'], WCH: [148, 218, '黃竹坑', 'Wong Chuk Hang'],
  LET: [136, 238, '利東', 'Lei Tung'], SOH: [126, 254, '海怡半島', 'South Horizons'],
};

// lines: real MTR colours; off = small uniform offset so shared segments
// (e.g. TWL/ISL between Central–Admiralty) draw side by side
const LN = [
  { id: 'TWL', color: '#e2231a', off: [0, 3.5], stops: ['CEN', 'ADM', 'TST', 'JOR', 'YMT', 'MOK', 'PRE', 'SSP', 'CSW', 'LCK', 'MEF', 'LAK', 'KWF', 'KWH', 'TWH', 'TSW'] },
  { id: 'KTL', color: '#00ab4e', off: [0, -3.5], stops: ['WHA', 'HOM', 'YMT', 'MOK', 'PRE', 'SKM', 'KOT', 'LOF', 'WTS', 'DIH', 'CHH', 'KOB', 'NTK', 'KWT', 'LAT', 'YAT', 'TKL'] },
  { id: 'ISL', color: '#0071ce', off: [0, 0], stops: ['KET', 'HKU', 'SYP', 'SHW', 'CEN', 'ADM', 'WAC', 'CAB', 'TIH', 'FOH', 'NOP', 'QUB', 'TAK', 'SWH', 'SKW', 'HFC', 'CHW'] },
  { id: 'SIL', color: '#a2c614', off: [0, 0], stops: ['ADM', 'OCP', 'WCH', 'LET', 'SOH'] },
  { id: 'TKO', color: '#7d499d', off: [0, -3.5], stops: ['NOP', 'QUB', 'YAT', 'TKL', 'TKW', 'HAH', 'POL'] },
  { id: 'TKO2', color: '#7d499d', off: [0, -3.5], stops: ['TKL', 'LHP'] },
  { id: 'EAL', color: '#5eb6e4', off: [0, 0], stops: ['ADM', 'EXC', 'HUH', 'MKE', 'KOT', 'TAW', 'SHS', 'FOT', 'UNI', 'TPM', 'TAO', 'FAN', 'SHU', 'LOW'] },
  { id: 'EAL2', color: '#5eb6e4', off: [0, 0], stops: ['SHU', 'LMC'] },
  { id: 'TML', color: '#9a3b26', off: [0, 0], stops: ['TUM', 'SIH', 'TIS', 'LOP', 'YUL', 'KSR', 'TWW', 'MEF', 'NAC', 'AUS', 'ETS', 'HUH', 'HOM', 'TOS', 'SUW', 'KAT', 'DIH', 'HIK', 'TAW', 'CKT', 'STW', 'CIO', 'SHM', 'TSH', 'HEO', 'MOS', 'WKS'] },
  { id: 'TCL', color: '#f7943e', off: [0, 0], stops: ['HOK', 'KOW', 'OLY', 'NAC', 'LAK', 'TSY', 'SUN', 'TUC'] },
  { id: 'AEX', color: '#00888a', off: [2.5, -2.5], stops: ['HOK', 'KOW', 'TSY', 'AIR', 'AWE'] },
  { id: 'DRL', color: '#f550a6', off: [0, 0], stops: ['SUN', 'DIS'] },
];

// paid-area walkway links (same-station transfers shown dashed)
const LINKS = [['CEN', 'HOK'], ['TST', 'ETS']];

// stations constructed in the viewer -> goto target level
const BUILT = { ADM: 'ADM:L1', CEN: 'CEN:L1', HOK: 'HOK:L1' };

// label placement for termini / interchanges / built stations
// [dx, dy, text-anchor]
const LAB = {
  KET: [0, -7, 'middle'], CHW: [7, 3, 'start'], TSW: [0, -7, 'middle'],
  TUC: [0, -7, 'middle'], AWE: [0, -7, 'middle'], DIS: [7, 3, 'start'],
  SOH: [7, 3, 'start'], LOW: [7, 3, 'start'], LMC: [7, 3, 'start'],
  TUM: [0, -6, 'middle'], WKS: [7, 3, 'start'], POL: [7, 3, 'start'],
  LHP: [7, -2, 'start'], WHA: [-6, 3, 'end'], TKL: [7, 4, 'start'],
  CEN: [0, 15, 'middle'], ADM: [0, 16, 'middle'], HOK: [0, 13, 'middle'],
  NOP: [0, -9, 'middle'], QUB: [0, 13, 'middle'], HUH: [0, 13, 'middle'],
  NAC: [0, -8, 'middle'], TSY: [0, -8, 'middle'], MEF: [0, -8, 'middle'],
  LAK: [0, -8, 'middle'], TAW: [0, 12, 'middle'], YAT: [0, 12, 'middle'],
  HOM: [0, -8, 'middle'], DIH: [0, -8, 'middle'], SUN: [0, -8, 'middle'],
  KOW: [-7, 3, 'end'],
};

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

// Build the schematic SVG. onGoto(uid) fires when a built station is clicked.
export function buildMiniMap({ onGoto }) {
  const svg = el('svg', { viewBox: '0 0 456 262', class: 'mtr-svg', role: 'img' });

  // station -> lines serving it (interchange detection)
  const used = {};
  for (const l of LN) for (const s of l.stops) (used[s] ??= []).push(l.id);

  // walkways behind the rails
  for (const [a, b] of LINKS) {
    const A = ST[a], B = ST[b];
    svg.appendChild(el('line', {
      x1: A[0], y1: A[1], x2: B[0], y2: B[1],
      stroke: '#8b939d', 'stroke-width': 2, 'stroke-dasharray': '3 2.4',
    }));
  }

  // line rails
  for (const l of LN) {
    const pts = l.stops.map(s => `${ST[s][0] + l.off[0]},${ST[s][1] + l.off[1]}`).join(' ');
    svg.appendChild(el('polyline', {
      points: pts, fill: 'none', stroke: l.color, 'stroke-width': 3,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round',
    }));
  }

  // stations on top
  for (const [id, [x, y, zh, en]] of Object.entries(ST)) {
    const built = BUILT[id];
    const inter = used[id].length > 1;
    const g = el('g', { class: built ? 'mst go' : 'mst' });
    if (built) {
      // pulse ring marks a navigable station
      g.appendChild(el('circle', { cx: x, cy: y, r: 7.5, class: 'pulse' }));
      g.appendChild(el('circle', {
        cx: x, cy: y, r: 4.6, fill: '#fff', stroke: '#222', 'stroke-width': 1.4,
      }));
    } else if (inter) {
      g.appendChild(el('circle', {
        cx: x, cy: y, r: 4, fill: '#c8ccd2', stroke: '#5c6470', 'stroke-width': 1.1,
      }));
    } else {
      g.appendChild(el('circle', {
        cx: x, cy: y, r: 2.6, fill: '#9aa4ae', stroke: '#6e7882', 'stroke-width': 0.8,
      }));
    }
    const lab = LAB[id];
    if (lab) {
      const cls = built ? 'mlab built' : 'mlab';
      g.appendChild(el('text', {
        x: x + lab[0], y: y + lab[1], 'text-anchor': lab[2], class: cls + ' zh',
      })).textContent = zh;
      g.appendChild(el('text', {
        x: x + lab[0], y: y + lab[1], 'text-anchor': lab[2], class: cls + ' en',
      })).textContent = en;
    }
    g.appendChild(el('title')).textContent = built ? `${zh} ${en} — click to go` : `${zh} ${en}`;
    if (built) {
      g.style.cursor = 'pointer';
      g.addEventListener('click', e => { e.stopPropagation(); onGoto(BUILT[id]); });
    }
    svg.appendChild(g);
  }
  return svg;
}
