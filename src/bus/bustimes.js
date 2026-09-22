// Live bus ETAs from the Citybus open-data API (data.gov.hk).
//   GET /v2/transport/citybus/eta/CTB/{stopId}/{route}
// Returns data[] of {eta:'YYYY-MM-DDTHH:mm:ss+08:00', rmk_tc, rmk_en, dest_*}.
// No key needed, bilingual. Falls back silently to synthetic headways whenever
// the API is unreachable so stop boards always show something.
import { BUS_ROUTE } from './bus-data.js';

const API = 'https://rt.data.gov.hk/v2/transport/citybus/eta';
const POLL_S = 60;
const HEADWAY_MS = 12 * 60 * 1000;   // 5B runs ~10-20 min; 12 is typical daytime

export class BusTimes {
  // stops: resolved stop list (with real stopId); one ETA feed per unique id
  constructor(stops) {
    this.stops = stops;
    this.route = BUS_ROUTE.id;
    this.byStop = {};        // stopId -> sorted [epochMs]
    this.live = false;
    this.timer = 3;          // first fetch shortly after load
    this.onchange = null;    // busstops hooks this to redraw ETA boards
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = POLL_S; this.refresh(); }
  }

  async refresh() {
    const ids = [...new Set(this.stops.map(s => s.stopId))];
    const out = {};
    await Promise.all(ids.map(async id => {
      try {
        const r = await fetch(`${API}/${BUS_ROUTE.co}/${id}/${this.route}`);
        if (!r.ok) return;
        const d = await r.json();
        for (const e of d.data || []) {
          const t = new Date(e.eta).getTime();
          if (Number.isFinite(t)) (out[id] ??= []).push(t);
        }
      } catch { /* offline / blocked — keep whatever we already had */ }
    }));
    const now = Date.now();
    for (const k of Object.keys(out)) {
      out[k] = out[k].filter(t => t > now - 30000).sort((a, b) => a - b);
      if (!out[k].length) delete out[k];
    }
    this._live = out;
    this._topUp();
    this.onchange?.();
  }

  // same trick as the MTR feed — when the route winds down the API returns
  // nothing, so pad each stop to ~3 upcoming slots on the route headway.
  _topUp() {
    const now = Date.now(), synth = this._synth ??= {}, merged = {};
    for (const { stopId } of this.stops) {
      const liveArr = this._live?.[stopId] ?? [];
      const want = Math.max(0, 3 - liveArr.filter(t => t < now + 3 * HEADWAY_MS).length);
      const s = synth[stopId] ??= [];
      while (s.length && s[0] <= now - 30000) s.shift();
      s.length = Math.min(s.length, want);
      let t = s[s.length - 1] ?? 0;
      if (t < now + HEADWAY_MS * 0.2) t = now - HEADWAY_MS * (0.3 + Math.random() * 0.6);
      while (s.length < want) { t += HEADWAY_MS; s.push(t); }
      merged[stopId] = [...liveArr, ...s].sort((a, b) => a - b);
    }
    this.byStop = merged;
    if (this._live && Object.keys(this._live).length) this.live = true;
  }

  // next N ETAs for a stop as {t, live} — synthetic slots flagged so the board
  // can style them if it wants
  nextEtas(stopId, n = 3) {
    const live = new Set(this._live?.[stopId] ?? []);
    return (this.byStop[stopId] ?? [])
      .filter(t => t > Date.now() - 30000).slice(0, n)
      .map(t => ({ t, live: live.has(t) }));
  }
}
