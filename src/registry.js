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
// {x,z,half,open,timer,rect,level,flaps:[{x,y,z,s,dir,inst,idx}]}
// flaps hold level-local hinge points + the instanced-mesh slot that draws
// the paddle (filled by initGateFlaps after build)
export const GATES = [];

// PSD door bays (world space): each bay is a dynamic barrier — solid unless
// the consist berthed there (ds.openSvc) is dwelling with its doors open.
// {level, ds, rect:{x0,z0,x1,z1,y0,y1}}
export const PSD_BAYS = [];

// lift landing doors (world space): dynamic barriers — solid while the car
// isn't berthed open at that level. {x0,z0,x1,z1,y0,y1,open}
export const LIFT_DOORS = [];

// per-level animated fittings populated by builders:
// { [levelId]: { doorSets:[{doors,xs,y,z,face,track,level,terminus}] } }
export const FITTINGS = {};

// static stair runs pedestrians can use (world space):
// {top:{x,z,y}, bot:{x,z,y}, ux,uz (unit top→bot), horiz, drop, slope, from, to}
// `from` = level at the TOP end, `to` = level at the BOTTOM end
export const STAIR_RUNS = [];

export function solid(mesh) { mesh.userData.solid = true; SOLIDS.push(mesh); return mesh; }
export function walkable(mesh, data = {}) { mesh.userData.walkable = data; WALKABLES.push(mesh); return mesh; }
