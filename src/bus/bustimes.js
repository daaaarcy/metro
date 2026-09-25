// Live bus ETAs from the Citybus open-data API (data.gov.hk).
//   GET /v2/transport/citybus/eta/CTB/{stopId}/{route}
// Returns data[] of {eta:'YYYY-MM-DDTHH:mm:ss+08:00', ...}. No key, bilingual.
// With ~13 routes x ~12 stops the watch list is ~150 pairs — too many to poll
// at once, so refresh sweeps a rotating batch; boards refresh as data lands.
// Falls back silently to synthetic per-route headways when unreachable.
import { ROUTES } from './bus-data.js';

const API = 'https://rt.data.gov.hk/v2/transport/citybus/eta/CTB';
const POLL_S = 8;            // seconds between batch polls
const BATCH = 14;            // pairs per batch
const HEADWAYS = {};         // route -> ms headway for the synthetic fallback
for (const r of ROUTES) HEADWAYS[r.id] = (r.headway || 15) * 60 * 1000;

export class BusTimes {
  // zones: resolved furniture zones — each has stopIds: [{route, stopId}].
  // Lite generated stops carry no ETA board — they're left out of the watch list.
  constructor(zones) {
    this.zones = zones;
    this.pairs = [];
    for (const z of zones) { if (z.lite) continue; for (const s of z.stopIds) this.pairs.push(s); }
    this.byKey = {};         // 'route|stopId' -> [{t, live}]
    this.live = false;
    this.cursor = 0;
    this.timer = 2;          // first fetch shortly after load
    this.onchange = null;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) { this.timer = POLL_S; this.refresh(); }
  }

  async refresh() {
    const batch = this.pairs.slice(this.cursor, this.cursor + BATCH);
    this.cursor = (this.cursor + BATCH) % this.pairs.length;
    const now = Date.now();
    await Promise.all(batch.map(async ({ route, stopId }) => {
      const key = `${route}|${stopId}`;
      try {
        const r = await fetch(`${API}/${stopId}/${route}`);
        if (!r.ok) return;
        const d = await r.json();
        const ts = (d.data || [])
          .map(e => ({ t: new Date(e.eta).getTime(), live: true }))
          .filter(e => Number.isFinite(e.t) && e.t > now - 30000)
          .sort((a, b) => a.t - b.t);
        this.byKey[key] = ts;
        if (ts.length) this.live = true;
      } catch { /* offline — keep whatever we had */ }
    }));
    this._topUp();
    this.onchange?.();
  }

  // pad each pair to ~2 upcoming slots on the route's own headway
  _topUp() {
    const now = Date.now(), synth = this._synth ??= {};
    for (const { route, stopId } of this.pairs) {
      const key = `${route}|${stopId}`, hw = HEADWAYS[route] ?? 900000;
      const live = this.byKey[key] ?? [];
      const want = Math.max(0, 2 - live.filter(e => e.t < now + 3 * hw).length);
      const s = synth[key] ??= [];
      while (s.length && s[0] <= now - 30000) s.shift();
      s.length = Math.min(s.length, want);
      let t = s[s.length - 1] ?? 0;
      if (t < now + hw * 0.2) t = now - hw * (0.3 + Math.random() * 0.6);
      while (s.length < want) { t += hw; s.push(t); }
      this.byKey[key] = [...live, ...s.map(t => ({ t, live: false }))].sort((a, b) => a.t - b.t);
    }
  }

  // merged ETAs across every route calling at a zone: [{route, t, live}]
  nextEtas(zone, n = 3) {
    const all = [];
    for (const s of zone.stopIds)
      for (const e of this.byKey[`${s.route}|${s.stopId}`] ?? [])
        all.push({ route: s.route, t: e.t, live: e.live });
    return all.filter(e => e.t > Date.now() - 30000).sort((a, b) => a.t - b.t).slice(0, n);
  }
}
