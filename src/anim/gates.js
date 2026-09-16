import { GATES } from '../registry.js';

const OPEN_TIME = 3.2;   // seconds the flaps stay open after a tap
const SWING = 1.35;      // radians the paddles fold back

// Octopus gate state: open fraction per lane, auto-close timer.
export function openGate(gate, audio) {
  if (gate.timer > 0) return;
  gate.timer = OPEN_TIME;
  audio?.octopusBeep(gate);
}

export function updateGates(dt) {
  for (const g of GATES) {
    if (g.timer > 0) g.timer -= dt;
    const target = g.timer > 0 ? 1 : 0;
    g.open += Math.sign(target - g.open) * Math.min(Math.abs(target - g.open), dt * 3.2);
    if (g.open !== g._applied) {
      g._applied = g.open;
      for (const f of g.flaps) f.pivot.rotation.y = f.dir * g.open * SWING;
    }
  }
}

// Is the lane blocking right now? (closed = solid)
export function gateBlocks(g) { return g.open < 0.6; }

// nearest gate lane to a world point within maxDist
export function nearestGate(x, z, maxDist = 2.2) {
  let best = null, bd = maxDist;
  for (const g of GATES) {
    const d = Math.hypot(x - g.x, z - g.z);
    if (d < bd) { bd = d; best = g; }
  }
  return best;
}
