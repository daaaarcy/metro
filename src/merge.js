// Draw-call reduction: collapse static meshes into one mesh per material
// per visibility bucket (each level group, plus each level's world-space
// togglables). Colliders were snapshotted in buildColliders() before this
// runs and dynamic geometry is skipped — InstancedMeshes (PSD door leaves,
// escalator steps, crowd parts) and gate flap pivots keep animating.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GATES } from './registry.js';

// attribute signature — mergeGeometries needs identical attribute sets
function geoSig(g) {
  return Object.keys(g.attributes).sort().join(',') + (g.index ? '|i' : '|n');
}

// merge `meshes` into per-material meshes parented to `parent`, baking each
// source mesh's parent-local transform into the geometry so visibility
// toggles on `parent` still apply. Returns the merged meshes created.
function mergeList(meshes, parent, consumed) {
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  const byKey = new Map();
  for (const m of meshes) {
    const key = m.material.uuid + '|' + geoSig(m.geometry);
    let b = byKey.get(key);
    if (!b) byKey.set(key, b = { mat: m.material, geos: [], src: [], cast: false, recv: false, ro: 0 });
    b.geos.push(m.geometry.clone().applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)));
    b.src.push(m);
    b.cast ||= m.castShadow; b.recv ||= m.receiveShadow;
    if (m.renderOrder > b.ro) b.ro = m.renderOrder;
  }
  const made = [];
  for (const b of byKey.values()) {
    if (b.geos.length < 2) { b.geos.forEach(g => g.dispose()); continue; }
    const merged = mergeGeometries(b.geos, false);
    if (!merged) { b.geos.forEach(g => g.dispose()); continue; }
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = b.cast; mesh.receiveShadow = b.recv;
    mesh.renderOrder = b.ro;
    mesh.matrixAutoUpdate = false;
    parent.add(mesh);
    for (const m of b.src) { consumed.add(m.geometry); m.removeFromParent(); }
    made.push(mesh);
  }
  return made;
}

export function mergeStation(scene, root, levelGroups, togglables) {
  root.updateMatrixWorld(true);
  // subtrees that keep their own transform — gate flap pivots swing on tap
  const skip = new Set();
  for (const g of GATES) for (const f of g.flaps) skip.add(f.pivot);

  const gather = node => {
    const out = [];
    (function walk(o) {
      if (skip.has(o) || o.userData?.mergeSkip) return;
      // leaf meshes only — merging a mesh that has children could strand
      // them when the parent is removed
      if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.children.length === 0) out.push(o);
      for (const c of o.children) walk(c);
    })(node);
    return out;
  };

  const consumed = new Set();   // source geometries baked into merged meshes
  for (const g of Object.values(levelGroups)) mergeList(gather(g), g, consumed);

  // togglables entries live at root level and share their level's fate —
  // merge across all of a level's entries, then repoint the toggle list
  for (const [id, entries] of Object.entries(togglables)) {
    const made = mergeList(entries.flatMap(gather), root, consumed);
    togglables[id] = [
      ...made,
      // keep entries that still hold unmerged content; drop emptied groups
      ...entries.filter(e => {
        if (e.isMesh || e.children.length > 0) return true;
        e.removeFromParent();
        return false;
      }),
    ];
  }

  // free GPU buffers of baked-away geometries no surviving mesh references
  const live = new Set();
  scene.traverse(o => { if (o.isMesh) live.add(o.geometry); });
  for (const geo of consumed) if (!live.has(geo)) geo.dispose();
}
