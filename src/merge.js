// Draw-call reduction: collapse static meshes into one BatchedMesh per
// material (+ attribute signature) across the whole network. Each level's
// merged geometry becomes one batch instance, so per-level visibility still
// works via setVisibleAt — and the renderer's per-instance frustum culling
// skips off-screen levels inside the same single GL draw.
// Colliders were snapshotted in buildColliders() before this runs and dynamic
// geometry is skipped — InstancedMeshes (PSD door leaves, escalator steps,
// crowd parts) and gate flap pivots keep animating.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// attribute signature — mergeGeometries/batching need identical attribute sets
function geoSig(g) {
  return Object.keys(g.attributes).sort().join(',') + (g.index ? '|i' : '|n');
}

// material signature — builders spawn thousands of identical materials as
// separate instances, so batching by uuid alone leaves them unmerged. Any
// parameter that changes the draw goes in the key (texture uuids keep unique
// sign canvases apart); equal-parameter materials share the first instance.
function matSig(m) {
  return [m.type, m.color?.getHex(), m.roughness, m.metalness, m.transparent,
    m.opacity, m.emissive?.getHex(), m.emissiveIntensity, m.side, m.flatShading,
    m.vertexColors, m.alphaTest, m.blending, m.toneMapped, m.wireframe,
    m.depthWrite, m.depthTest, m.map?.uuid, m.normalMap?.uuid,
    m.emissiveMap?.uuid, m.roughnessMap?.uuid, m.metalnessMap?.uuid,
    m.aoMap?.uuid, m.bumpMap?.uuid].join('|');
}

export function mergeStation(scene, root, levelGroups, togglables) {
  root.updateMatrixWorld(true);
  const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();

  const gather = node => {
    const out = [];
    (function walk(o) {
      if (o.userData?.mergeSkip) return;
      // leaf meshes only — merging a mesh that has children could strand
      // them when the parent is removed
      if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.children.length === 0) out.push(o);
      for (const c of o.children) walk(c);
    })(node);
    return out;
  };

  // every leaf mesh becomes one batch candidate carrying its level uid —
  // bucketed per visibility scope first so a level's share of a material
  // collapses into a single instance
  const items = [];   // {key, mat, geo, uid, cast, recv, ro, src}
  const collect = (meshes, uid) => {
    const byKey = new Map();
    for (const m of meshes) {
      const key = matSig(m.material) + '|' + geoSig(m.geometry);
      let b = byKey.get(key);
      if (!b) byKey.set(key, b = { mat: m.material, geos: [], src: [], cast: false, recv: false, ro: 0 });
      b.geos.push(m.geometry.clone().applyMatrix4(
        new THREE.Matrix4().multiplyMatrices(rootInv, m.matrixWorld)));
      b.src.push(m);
      b.cast ||= m.castShadow; b.recv ||= m.receiveShadow;
      if (m.renderOrder > b.ro) b.ro = m.renderOrder;
    }
    for (const [key, b] of byKey) {
      const merged = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
      if (!merged) { b.geos.forEach(g => g.dispose()); continue; }
      items.push({ key, mat: b.mat, geo: merged, uid, cast: b.cast, recv: b.recv, ro: b.ro, src: b.src });
    }
  };

  const consumed = new Set();   // source geometries baked into batch items
  for (const [uid, g] of Object.entries(levelGroups)) collect(gather(g), uid);
  for (const [uid, entries] of Object.entries(togglables)) {
    collect(entries.flatMap(gather), uid);
    // emptied groups drop out of the toggle list (kept entries still hold
    // unmerged content — instanced meshes, collider barriers, signs)
    togglables[uid] = entries.filter(e => {
      if (e.isMesh || e.children.length > 0) return true;
      e.removeFromParent();
      return false;
    });
  }

  // one BatchedMesh per material+signature — but only when it actually
  // saves draws; a key used once network-wide (unique sign textures) stays
  // an ordinary mesh inside its level group
  const byKey = new Map();
  for (const it of items) {
    let b = byKey.get(it.key);
    if (!b) byKey.set(it.key, b = { mat: it.mat, items: [], verts: 0, idx: 0 });
    b.items.push(it);
    b.verts += it.geo.attributes.position.count;
    b.idx += it.geo.index ? it.geo.index.count : it.geo.attributes.position.count;
  }
  const visItems = new Map();   // uid -> [{batch, id}]
  const I4 = new THREE.Matrix4();
  for (const b of byKey.values()) {
    if (b.items.length < 2) {
      for (const it of b.items) it.geo.dispose();
      continue;
    }
    const batch = new THREE.BatchedMesh(b.items.length, b.verts, b.idx, b.mat);
    batch.sortObjects = b.mat.transparent === true;   // opaque draws in add order
    for (const it of b.items) {
      it.geo.computeBoundingSphere();
      const id = batch.addInstance(batch.addGeometry(it.geo));
      batch.setMatrixAt(id, I4);
      batch.castShadow ||= it.cast;
      batch.receiveShadow ||= it.recv;
      if (it.ro > batch.renderOrder) batch.renderOrder = it.ro;
      let l = visItems.get(it.uid);
      if (!l) visItems.set(it.uid, l = []);
      l.push({ batch, id });
      for (const m of it.src) { consumed.add(m.geometry); m.removeFromParent(); }
    }
    batch.computeBoundingSphere();
    root.add(batch);
  }

  // free GPU buffers of baked-away geometries no surviving mesh references
  const live = new Set();
  scene.traverse(o => { if (o.isMesh) live.add(o.geometry); });
  for (const geo of consumed) if (!live.has(geo)) geo.dispose();
  return visItems;
}
