// Shared build-time registries. Builders push into these; controls/anim read them.

// meshes that block horizontal movement (walls, PSD, kerbs, gates, columns...)
export const SOLIDS = [];

// meshes you can stand/walk on (floors, escalator ramps, stairs, decks)
// userData.walkable: {} flat | {esc:run} escalator ramp | {ramp:run} staircase
export const WALKABLES = [];

// escalator runs in world space:
// {x1,z1,y1,x2,z2,y2,w,from,to,going,len,drop,slopeLen,dx,dz}
export const ESC_RUNS = [];

// Octopus gate lanes (world space, all on L1):
// {x,z,half,open,timer,rect,flaps:[{pivot,dir}]}
export const GATES = [];

// per-level animated fittings populated by builders:
// { [levelId]: { doorSets:[{doors,xs,y,z,face,track,level,terminus}] } }
export const FITTINGS = {};

export function solid(mesh) { mesh.userData.solid = true; SOLIDS.push(mesh); return mesh; }
export function walkable(mesh, data = {}) { mesh.userData.walkable = data; WALKABLES.push(mesh); return mesh; }
