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

export function lineMat(hex) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.55 });
}
