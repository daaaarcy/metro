import * as THREE from 'three';

export const M = {
  floor:      new THREE.MeshStandardMaterial({ color: 0x9fa4ab, roughness: 0.85 }),
  concFloor:  new THREE.MeshStandardMaterial({ color: 0xb9bdc4, roughness: 0.7, metalness: 0.05 }),
  platFloor:  new THREE.MeshStandardMaterial({ color: 0xc4c8cd, roughness: 0.75 }),
  slabEdge:   new THREE.MeshStandardMaterial({ color: 0x6b7076, roughness: 0.9 }),
  ceiling:    new THREE.MeshStandardMaterial({ color: 0xdde0e4, roughness: 0.9 }),
  wall:       new THREE.MeshStandardMaterial({ color: 0xcfd3d8, roughness: 0.85 }),
  wallDark:   new THREE.MeshStandardMaterial({ color: 0x565b62, roughness: 0.9 }),
  column:     new THREE.MeshStandardMaterial({ color: 0x8b9096, roughness: 0.6, metalness: 0.2 }),
  bed:        new THREE.MeshStandardMaterial({ color: 0x2e3236, roughness: 0.95 }),
  rail:       new THREE.MeshStandardMaterial({ color: 0xb9c0c7, roughness: 0.25, metalness: 0.9 }),
  sleeper:    new THREE.MeshStandardMaterial({ color: 0x3d3a36, roughness: 0.95 }),
  glass:      new THREE.MeshStandardMaterial({ color: 0x9fc4d8, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.28 }),
  balGlass:   new THREE.MeshStandardMaterial({ color: 0xbcdcec, roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.13, depthWrite: false }),
  glassDark:  new THREE.MeshStandardMaterial({ color: 0x35586e, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.45 }),
  steel:      new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.35, metalness: 0.75 }),
  stepMetal:  new THREE.MeshStandardMaterial({ color: 0x9aa0a7, roughness: 0.55, metalness: 0.18 }),
  tactile:    new THREE.MeshStandardMaterial({ color: 0xd8b400, roughness: 0.8 }),
  paid:       new THREE.MeshStandardMaterial({ color: 0xaac4dd, roughness: 0.8 }),
  unpaid:     new THREE.MeshStandardMaterial({ color: 0xe8d98a, roughness: 0.8 }),
  bridgeDeck: new THREE.MeshStandardMaterial({ color: 0xd9cd7e, roughness: 0.8 }),
  ground:     new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.95 }),
  pavement:   new THREE.MeshStandardMaterial({ color: 0x8e9298, roughness: 0.9 }),
  pavilion:   new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.6, metalness: 0.3 }),
  mtrRed:     new THREE.MeshStandardMaterial({ color: 0xe2231a, roughness: 0.5 }),
  gate:       new THREE.MeshStandardMaterial({ color: 0x2f7a4d, roughness: 0.5, metalness: 0.3 }),
  booth:      new THREE.MeshStandardMaterial({ color: 0x2c6e9e, roughness: 0.4, metalness: 0.2 }),
  shop:       new THREE.MeshStandardMaterial({ color: 0x6e5a7e, roughness: 0.7 }),
  buffer:     new THREE.MeshStandardMaterial({ color: 0xb03030, roughness: 0.6 }),
  lightStrip: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 1 }),
  signPost:   new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.6, metalness: 0.4 }),
};

// line colours repeat across every level — share one material instance per
// colour so identical bands merge instead of staying separate draw calls
const lineCache = new Map();
export function lineMat(hex) {
  let m = lineCache.get(hex);
  if (!m) lineCache.set(hex, m = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.55 }));
  return m;
}

// Station liveries — the small-square mosaic tiles that give every classic
// MTR station its colour (Admiralty blue, Central crimson, Wan Chai lime…).
// A canvas texture of shade-jittered tiles over dark grout; callers pass a
// repeat so a tile stays ~0.3 m square whatever the wall piece's length.
const TILES_X = 32, TILES_Y = 8;
const mosaicCache = new Map();
export function mosaicMat(hex, rx = 8, ry = 2) {
  const key = `${hex}|${rx}|${ry}`;
  let m = mosaicCache.get(key);
  if (!m) {
    const c = document.createElement('canvas');
    c.width = TILES_X * 8; c.height = TILES_Y * 8;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#26292e'; ctx.fillRect(0, 0, c.width, c.height);   // grout
    const base = new THREE.Color(hex), cc = new THREE.Color();
    for (let y = 0; y < TILES_Y; y++) for (let x = 0; x < TILES_X; x++) {
      const j = Math.abs((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1);
      cc.copy(base).multiplyScalar(0.88 + j * 0.24);
      ctx.fillStyle = `#${cc.getHexString()}`;
      ctx.fillRect(x * 8 + 0.5, y * 8 + 0.5, 7, 7);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    tex.anisotropy = 4;
    mosaicCache.set(key, m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72 }));
  }
  return m;
}
