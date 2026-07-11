'use client';
import { create } from 'zustand';
import type { Mode, Player, GameMsg } from './types';

const COLORS = ['#3a7ca5', '#e5568a', '#f4a12e', '#4caf7d', '#9b6bd6', '#e0563b'];
export const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
export const PALETTE = COLORS;
export const randomCode = () =>
  Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');

const uuid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

interface GameState {
  myId: string;
  name: string;
  color: string;
  room: string;
  city: string;

  connected: boolean;
  players: Record<string, Player>;
  input: { f: number; r: number };

  mode: Mode;
  endsAt: number | null;
  seed: number;
  found: Record<string, string>;
  reunited: boolean;

  configure: (p: { name: string; color: string; room: string; city: string }) => void;
  setConnected: (v: boolean) => void;
  setInput: (f: number, r: number) => void;
  upsertPlayer: (p: Partial<Player> & { id: string }) => void;
  removeMissing: (ids: string[]) => void;
  applyGame: (m: GameMsg) => void;
  reset: () => void;
}

export const useGame = create<GameState>((set) => ({
  myId: uuid(),
  name: '',
  color: randomColor(),
  room: '',
  city: 'munich',

  connected: false,
  players: {},
  input: { f: 0, r: 0 },

  mode: 'idle',
  endsAt: null,
  seed: 0,
  found: {},
  reunited: false,

  configure: ({ name, color, room, city }) => set({ name, color, room, city }),
  setConnected: (v) => set({ connected: v }),
  setInput: (f, r) => set({ input: { f, r } }),

  upsertPlayer: (p) =>
    set((s) => {
      const prev = s.players[p.id] ?? { id: p.id, name: '', color: '#888', x: 0, z: 0, ry: 0, t: 0 };
      return { players: { ...s.players, [p.id]: { ...prev, ...p } as Player } };
    }),

  removeMissing: (ids) =>
    set((s) => {
      const next: Record<string, Player> = {};
      for (const id of ids) if (s.players[id]) next[id] = s.players[id];
      return { players: next };
    }),

  applyGame: (m) =>
    set((s) => {
      if (m.action === 'start')
        return { mode: m.mode, endsAt: m.endsAt, seed: m.seed, found: {}, reunited: false };
      if (m.action === 'found') return { found: { ...s.found, [m.landmarkId]: m.by } };
      if (m.action === 'reunited') return { reunited: true };
      return {};
    }),

  reset: () => set({ mode: 'idle', endsAt: null, found: {}, reunited: false }),
}));
