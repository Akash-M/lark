import type { City, Pt } from '@/lib/types';

/** 2D collision against building footprints (XZ plane, metres).
 *  Uses a uniform spatial grid so only nearby buildings are tested each frame,
 *  and treats the player as a circle (radius R) so the body never enters walls. */

function pointInPoly(x: number, z: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function segDist2(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  let t = l2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + t * dx, cz = az + t * dz;
  const ex = px - cx, ez = pz - cz;
  return ex * ex + ez * ez;
}

interface BBox { minx: number; minz: number; maxx: number; maxz: number; }

export class Collider {
  private polys: Pt[][] = [];
  private bboxes: BBox[] = [];
  private grid = new Map<string, number[]>();
  private readonly cell = 25;
  readonly R = 0.7;

  constructor(city: City) {
    for (const b of city.buildings) {
      if (!b.pts || b.pts.length < 3) continue;
      const idx = this.polys.length;
      this.polys.push(b.pts);
      let minx = Infinity, minz = Infinity, maxx = -Infinity, maxz = -Infinity;
      for (const [x, z] of b.pts) {
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (z < minz) minz = z; if (z > maxz) maxz = z;
      }
      this.bboxes.push({ minx, minz, maxx, maxz });
      const c = this.cell, r = this.R;
      for (let gx = Math.floor((minx - r) / c); gx <= Math.floor((maxx + r) / c); gx++) {
        for (let gz = Math.floor((minz - r) / c); gz <= Math.floor((maxz + r) / c); gz++) {
          const key = gx + ',' + gz;
          const arr = this.grid.get(key);
          if (arr) arr.push(idx); else this.grid.set(key, [idx]);
        }
      }
    }
  }

  private candidates(x: number, z: number): number[] {
    return this.grid.get(Math.floor(x / this.cell) + ',' + Math.floor(z / this.cell)) ?? [];
  }

  /** Is a circle of radius r at (x,z) intersecting any building? */
  blocked(x: number, z: number, r = this.R): boolean {
    const r2 = r * r;
    for (const i of this.candidates(x, z)) {
      const bb = this.bboxes[i];
      if (x < bb.minx - r || x > bb.maxx + r || z < bb.minz - r || z > bb.maxz + r) continue;
      const poly = this.polys[i];
      if (pointInPoly(x, z, poly)) return true;
      for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
        if (segDist2(x, z, poly[b][0], poly[b][1], poly[a][0], poly[a][1]) < r2) return true;
      }
    }
    return false;
  }

  /** Move from (x,z) by (dx,dz), sliding along walls when blocked. */
  resolve(x: number, z: number, dx: number, dz: number): [number, number] {
    if (!this.blocked(x + dx, z + dz)) return [x + dx, z + dz];
    if (dx !== 0 && !this.blocked(x + dx, z)) return [x + dx, z];
    if (dz !== 0 && !this.blocked(x, z + dz)) return [x, z + dz];
    return [x, z];
  }

  /** Nearest open point to (x,z) — spirals outward. Used for spawns + landmarks. */
  findOpen(x: number, z: number): [number, number] {
    if (!this.blocked(x, z)) return [x, z];
    for (let rad = 2; rad <= 70; rad += 2) {
      for (let a = 0; a < 360; a += 18) {
        const rx = x + Math.cos((a * Math.PI) / 180) * rad;
        const rz = z + Math.sin((a * Math.PI) / 180) * rad;
        if (!this.blocked(rx, rz)) return [rx, rz];
      }
    }
    return [x, z];
  }
}
