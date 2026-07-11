export type Pt = [number, number];

export interface Building { pts: Pt[]; h: number; }
export interface Road { pts: Pt[]; w: number; }
export interface Poly { pts: Pt[]; }
export interface Landmark { id: string; name: string; x: number; z: number; }

export interface City {
  name: string;
  attribution: string;
  center: { lat: number; lon: number };
  size_m: { x: number; z: number };
  counts: Record<string, number>;
  buildings: Building[];
  roads: Road[];
  water: Poly[];
  green: Poly[];
  landmarks: Landmark[];
}

export type Mode = 'idle' | 'reunite' | 'rush';

export interface Player {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  ry: number;
  t: number;
}

/** Broadcast payloads */
export interface PosMsg { id: string; name: string; color: string; x: number; z: number; ry: number; t: number; }
export type GameMsg =
  | { action: 'start'; mode: Mode; endsAt: number | null; seed: number }
  | { action: 'found'; landmarkId: string; by: string }
  | { action: 'reunited'; a: string; b: string };
