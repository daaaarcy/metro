// Live next-train times for Admiralty (ADM) from data.gov.hk / MTR Open Data.
// https://data.gov.hk — GET /v1/transport/mtr/getSchedule.php?line=X&sta=ADM
// Returns UP/DOWN arrays of {seq,dest,plat,time,ttnt,valid,timeType}:
//   plat   — MTR platform number, matches our PLATFORMS faces (1-8)
//   time   — arrival time; for terminus services it's the DEPARTURE (timeType:'D')
// Falls back silently to the synthetic headways whenever the API is unreachable.
import { TRAIN_SPEC } from '../station-data.js';

const API = 'https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php';
// (line, station) pairs the live feed can serve — the API only knows real
// stations, and each returns UP/DOWN arrays keyed by platform number
const FEEDS = [
  ['TWL', 'ADM'], ['ISL', 'ADM'], ['EAL', 'ADM'], ['SIL', 'ADM'],
  ['TWL', 'CEN'], ['ISL', 'CEN'],
  ['TCL', 'HOK'], ['AEX', 'HOK'],
  ['ISL', 'WAC'], ['ISL', 'CAB'], ['ISL', 'SHW'], ['ISL', 'SYP'], ['ISL', 'HKU'], ['ISL', 'KET'],
  ['ISL', 'TIH'], ['ISL', 'FOH'], ['ISL', 'NOP'], ['TKO', 'NOP'],
  ['ISL', 'QUB'], ['TKO', 'QUB'], ['ISL', 'TAK'], ['ISL', 'SWH'], ['ISL', 'SKW'], ['ISL', 'HFC'],
  ['TKO', 'TKW'], ['TKO', 'HAH'], ['TKO', 'POL'], ['TKO', 'LHP'],
  ['ISL', 'CHW'],
  ['TWL', 'TST'],
  ['TWL', 'JOR'],
  ['TWL', 'YMT'], ['KTL', 'YMT'],
  ['TWL', 'MOK'], ['KTL', 'MOK'],
  ['TWL', 'PRE'], ['KTL', 'PRE'],
  ['TWL', 'SSP'],
  ['TWL', 'CSW'],
  ['TWL', 'LCK'],
  ['TWL', 'MEF'], ['TML', 'MEF'],
  ['TWL', 'LAK'], ['TCL', 'LAK'],
  ['TWL', 'KWF'],
  ['TWL', 'KWH'],
  ['TWL', 'TWH'],
  ['TWL', 'TSW'],
  ['TCL', 'KOW'], ['AEX', 'KOW'],
  ['TCL', 'OLY'],
  ['TCL', 'TSY'], ['AEX', 'TSY'],
  ['TCL', 'SUN'], ['TCL', 'TUC'],
  ['AEX', 'AIR'], ['AEX', 'AWE'],
  ['DRL', 'SUN'], ['DRL', 'DIS'],
  ['SIL', 'OCP'],
  ['SIL', 'WCH'],
  ['SIL', 'LET'],
  ['SIL', 'SOH'],
  ['EAL', 'EXC'],
  ['EAL', 'HUH'],
  ['EAL', 'MKE'],
  ['EAL', 'KOT'],
  ['EAL', 'TAW'],
  ['EAL', 'SHS'], ['EAL', 'FOT'], ['EAL', 'UNI'], ['EAL', 'TPM'], ['EAL', 'TAO'],
  ['EAL', 'FAN'], ['EAL', 'SHU'], ['EAL', 'LOW'], ['EAL', 'LMC'],
  ['KTL', 'SKM'],
  ['KTL', 'LOF'],
  ['KTL', 'WTS'],
  ['KTL', 'DIH'],
  ['KTL', 'CHH'],
  ['KTL', 'KOB'],
  ['KTL', 'NTK'],
  ['KTL', 'KWT'],
  ['KTL', 'LAT'],
  ['KTL', 'YAT'],
  ['KTL', 'TKL'],
  ['KTL', 'HOM'],
  ['KTL', 'WHA'],
  // TML interchanges (HUH/HOM/DIH/TAW) number their TML faces 3/4 while
  // the feed returns plats 1/2 — they'd leak onto the other line's
  // faces, so only the standalone stations poll.
  ['TML', 'TUM'], ['TML', 'SIH'], ['TML', 'TIS'], ['TML', 'LOP'],
  ['TML', 'YUL'], ['TML', 'KSR'], ['TML', 'TWW'], ['TML', 'NAC'],
  ['TML', 'AUS'], ['TML', 'ETS'], ['TML', 'TOS'], ['TML', 'SUW'],
  ['TML', 'KAT'], ['TML', 'HIK'], ['TML', 'CKT'], ['TML', 'STW'],
  ['TML', 'CIO'], ['TML', 'SHM'], ['TML', 'TSH'], ['TML', 'HEO'],
  ['TML', 'MOS'], ['TML', 'WKS'],
];
const POLL_S = 45;

export class Timetable {
  constructor() {
    this.byPlat = {};   // 'ADM:1'..'HOK:4' -> sorted [epochMs]
    this.live = false;
    this.timer = 2;     // first fetch shortly after load
  }

  // the platforms the sim actually serves — TrainSim hands these over once,
  // so the feed can top up entries when real service winds down overnight
  setPlatforms(list) { this._plats = list; this._topUp(); }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = POLL_S; this.refresh(); }
  }

  async refresh() {
    const out = {};
    await Promise.all(FEEDS.map(async ([line, stn]) => {
      try {
        const r = await fetch(`${API}?line=${line}&sta=${stn}`);
        if (!r.ok) return;
        const d = (await r.json()).data?.[`${line}-${stn}`];
        for (const dir of ['UP', 'DOWN']) {
          for (const e of d?.[dir] || []) {
            if (e.valid !== 'Y') continue;
            const t = new Date(e.time.replace(' ', 'T') + '+08:00').getTime();
            if (Number.isFinite(t)) (out[`${stn}:${e.plat}`] ??= []).push(t);
          }
        }
      } catch { /* offline / blocked — keep whatever we already had */ }
    }));
    const now = Date.now();
    for (const k of Object.keys(out)) {
      out[k] = out[k].filter(t => t > now - 20000).sort((a, b) => a - b);
      if (!out[k].length) delete out[k];
    }
    this._live = out;
    this._topUp();
  }

  // after the last real train the feed returns nothing — keep the service
  // running by topping every platform up to ~4 upcoming slots on the line's
  // own headway. Synthetic slots form a rolling per-platform stream merged
  // over whatever live entries remain, so claims and boards keep working
  // all night; dense live service suppresses the padding entirely.
  _topUp() {
    if (!this._plats?.length) return;
    const now = Date.now();
    const synth = this._synth ??= {};
    const merged = {};
    for (const { stn, plat, line, hw: fleetHw } of this._plats) {
      const key = `${stn}:${plat}`;
      // never promise tighter spacing than the fleet can physically serve —
      // slots that pass unclaimed are trains that never arrive
      const hw = Math.max(TRAIN_SPEC[line]?.headway ?? 90, fleetHw ?? 0) * 1000;
      const liveArr = this._live?.[key] ?? [];
      const liveUp = liveArr.filter(t => t < now + 4 * hw).length;
      const want = Math.max(0, 4 - liveUp);
      const s = synth[key] ??= [];
      while (s.length && s[0] <= now - 20000) s.shift();
      s.length = Math.min(s.length, want);
      let t = s[s.length - 1] ?? 0;
      // when the well is dry seed just behind now so the first train lands
      // soon instead of a whole headway out
      if (t < now + hw * 0.2) t = now - hw * (0.3 + Math.random() * 0.6);
      while (s.length < want) { t += hw; s.push(t); }
      const all = [...liveArr, ...s].sort((a, b) => a - b);
      if (all.length) merged[key] = all;
    }
    this.byPlat = merged;
    if (Object.keys(merged).length) this.live = true;
  }

  // next scheduled event (arrival, or departure for termini) for a platform,
  // skipping anything already consumed (`after`) or too far in the past.
  // Stations/lines the feed doesn't cover get null → synthetic headways.
  next(stn, plat, after = 0) {
    const min = Math.max(Date.now() - 20000, after);
    return (this.byPlat[`${stn}:${plat}`] || []).find(t => t > min) ?? null;
  }

  // like next(), but advances a per-platform watermark so the following
  // consist claims the slot after — arrivals get handed out in order.
  // Entries drop out of byPlat on refresh once they pass, so a watermark
  // can only ever sit below the remaining times.
  claim(stn, plat, after = 0) {
    const key = `${stn}:${plat}`;
    const min = Math.max(Date.now() - 20000, after, this._claimed?.[key] ?? 0);
    const t = (this.byPlat[key] || []).find(t => t > min);
    if (t == null) return null;
    (this._claimed ??= {})[key] = t;
    return t;
  }
}
