import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { City, Poly, Pt } from '@/lib/types';

function shapeFrom(pts: Pt[]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], -pts[i][1]);
  return s;
}

function addFlat(group: THREE.Group, polys: Poly[], y: number, mat: THREE.Material) {
  const geoms: THREE.BufferGeometry[] = [];
  for (const p of polys) {
    if (p.pts.length < 3) continue;
    const geo = new THREE.ShapeGeometry(shapeFrom(p.pts));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y, 0);
    geoms.push(geo);
  }
  if (!geoms.length) return;
  const mesh = new THREE.Mesh(mergeGeometries(geoms, false), mat);
  mesh.receiveShadow = true;
  group.add(mesh);
}

function buildRoads(city: City): THREE.Mesh {
  const pos: number[] = [];
  const y = 0.12;
  for (const r of city.roads) {
    const half = (r.w || 3.5) / 2;
    const p = r.pts;
    for (let i = 0; i < p.length - 1; i++) {
      const x1 = p[i][0], z1 = p[i][1], x2 = p[i + 1][0], z2 = p[i + 1][1];
      let dx = x2 - x1, dz = z2 - z1;
      const L = Math.hypot(dx, dz) || 1;
      dx /= L; dz /= L;
      const nx = -dz * half, nz = dx * half;
      pos.push(
        x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz, x2 - nx, y, z2 - nz,
        x1 + nx, y, z1 + nz, x2 - nx, y, z2 - nz, x2 + nx, y, z2 + nz,
      );
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const n = new Float32Array(pos.length);
  for (let i = 1; i < n.length; i += 3) n[i] = 1;
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xa9a294, roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}

function buildBuildings(city: City): THREE.Mesh {
  const geoms: THREE.BufferGeometry[] = [];
  for (const b of city.buildings) {
    if (b.pts.length < 3) continue;
    const geo = new THREE.ExtrudeGeometry(shapeFrom(b.pts), { depth: b.h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.deleteAttribute('uv');
    geoms.push(geo);
  }
  const merged = mergeGeometries(geoms, false);
  merged.computeVertexNormals();
  const mesh = new THREE.Mesh(
    merged,
    new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.92, metalness: 0 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Builds the whole static district as one THREE.Group (merged for performance). */
export function buildCity(city: City): THREE.Group {
  const g = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 2400),
    new THREE.MeshStandardMaterial({ color: 0xdcd3c2, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  g.add(ground);

  addFlat(g, city.green, 0.05, new THREE.MeshStandardMaterial({ color: 0x8fb56a, roughness: 1, side: THREE.DoubleSide }));
  addFlat(g, city.water, 0.08, new THREE.MeshStandardMaterial({ color: 0x5b93c7, roughness: 0.25, metalness: 0.1, side: THREE.DoubleSide }));
  g.add(buildRoads(city));
  g.add(buildBuildings(city));

  return g;
}
