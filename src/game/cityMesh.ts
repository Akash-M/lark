import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { City, Poly, Pt } from '@/lib/types';

const WALL_COLORS = ['#efe6d6', '#e9dcc4', '#e3d0b0', '#ddc9b4', '#d8bfa0', '#cdbb9c', '#e6d3b3', '#d6c2a8', '#c9b596', '#e2d8c2'];
const ROOF_COLORS = ['#a5553e', '#8a4b39', '#7d6b5d', '#95674c', '#6f5a48', '#b06a4c', '#8f7a63', '#7a5347'];

function hash(i: number): number {
  let h = (i * 2654435761) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

function shapeFrom(pts: Pt[]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], -pts[i][1]);
  return s;
}

function pointInPoly(x: number, z: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
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
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xb4ab9b, roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}

/** Extruded buildings with per-building wall + roof colours and base-to-top
 *  shading, baked as vertex colours into one merged mesh. */
function buildBuildings(city: City): THREE.Mesh {
  const geoms: THREE.BufferGeometry[] = [];
  let bi = 0;
  for (const b of city.buildings) {
    if (b.pts.length < 3) continue;
    const h = b.h;
    const geo = new THREE.ExtrudeGeometry(shapeFrom(b.pts), { depth: h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.deleteAttribute('uv');
    geo.computeVertexNormals();
    const hv = hash(bi++);
    const wall = new THREE.Color(WALL_COLORS[hv % WALL_COLORS.length]);
    const roof = new THREE.Color(ROOF_COLORS[(hv >> 8) % ROOF_COLORS.length]);
    const pos = geo.attributes.position;
    const nrm = geo.attributes.normal;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const ny = nrm.getY(i);
      const y = pos.getY(i);
      if (ny > 0.5) c.copy(roof);
      else if (ny < -0.5) c.copy(roof).multiplyScalar(0.5);
      else {
        const t = Math.min(1, y / Math.max(h, 1));
        c.copy(wall).multiplyScalar(0.68 + 0.32 * t); // darker at the base
      }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geoms.push(geo);
  }
  const mesh = new THREE.Mesh(
    mergeGeometries(geoms, false),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Low-poly trees scattered inside park/green polygons (instanced). */
function buildTrees(city: City): THREE.Object3D | null {
  const spots: Pt[] = [];
  for (const g of city.green) {
    if (g.pts.length < 3) continue;
    let minx = Infinity, minz = Infinity, maxx = -Infinity, maxz = -Infinity;
    for (const [x, z] of g.pts) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (z < minz) minz = z; if (z > maxz) maxz = z; }
    const area = (maxx - minx) * (maxz - minz);
    const tries = Math.min(24, Math.max(3, Math.floor(area / 400)));
    for (let k = 0; k < tries && spots.length < 60; k++) {
      const x = minx + Math.random() * (maxx - minx);
      const z = minz + Math.random() * (maxz - minz);
      if (pointInPoly(x, z, g.pts)) spots.push([x, z]);
    }
  }
  if (!spots.length) return null;

  const trunk = new THREE.CylinderGeometry(0.28, 0.4, 2, 6);
  trunk.translate(0, 1, 0);
  trunk.deleteAttribute('uv');
  paint(trunk, '#7a5a3a');
  const foliage = new THREE.ConeGeometry(1.7, 4, 7);
  foliage.translate(0, 4.1, 0);
  foliage.deleteAttribute('uv');
  paint(foliage, '#6ea24d');
  const tree = mergeGeometries([trunk, foliage], false);

  const mesh = new THREE.InstancedMesh(tree, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), spots.length);
  mesh.castShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  spots.forEach(([x, z], i) => {
    const sc = 0.8 + Math.random() * 0.6;
    p.set(x, 0, z);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    s.set(sc, sc, sc);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function paint(geo: THREE.BufferGeometry, hex: string) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
}

export function buildCity(city: City): THREE.Group {
  const g = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 2400),
    new THREE.MeshStandardMaterial({ color: 0xd8cfbd, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  g.add(ground);

  addFlat(g, city.green, 0.05, new THREE.MeshStandardMaterial({ color: 0x86ad63, roughness: 1, side: THREE.DoubleSide }));
  addFlat(g, city.water, 0.08, new THREE.MeshStandardMaterial({ color: 0x4f8fc4, roughness: 0.25, metalness: 0.1, side: THREE.DoubleSide }));
  g.add(buildRoads(city));
  g.add(buildBuildings(city));
  const trees = buildTrees(city);
  if (trees) g.add(trees);

  return g;
}
