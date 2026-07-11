'use client';
import { useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { useGame } from './useGameStore';
import type { GameMsg, PosMsg } from './types';

/** Connects to a Supabase Realtime channel for the room and wires presence
 *  (who is here) + broadcast (live positions and game events) into the store. */
export function useRoom() {
  const myId = useGame((s) => s.myId);
  const name = useGame((s) => s.name);
  const color = useGame((s) => s.color);
  const room = useGame((s) => s.room);
  const setConnected = useGame((s) => s.setConnected);
  const upsertPlayer = useGame((s) => s.upsertPlayer);
  const removeMissing = useGame((s) => s.removeMissing);
  const applyGame = useGame((s) => s.applyGame);

  const chRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !room || !name) {
      setConnected(false);
      return;
    }
    const ch = sb.channel(`wander:${room}`, {
      config: { presence: { key: myId }, broadcast: { self: false } },
    });

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, Array<{ name: string; color: string }>>;
      const ids = Object.keys(state);
      for (const id of ids) {
        if (id === myId) continue;
        const meta = state[id]?.[0];
        if (meta) upsertPlayer({ id, name: meta.name, color: meta.color });
      }
      removeMissing(ids.filter((id) => id !== myId));
    });

    ch.on('broadcast', { event: 'pos' }, ({ payload }) => {
      const p = payload as PosMsg;
      if (p.id === myId) return;
      upsertPlayer({ id: p.id, name: p.name, color: p.color, x: p.x, z: p.z, ry: p.ry, t: p.t });
    });

    ch.on('broadcast', { event: 'game' }, ({ payload }) => applyGame(payload as GameMsg));

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ name, color });
        setConnected(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setConnected(false);
      }
    });

    chRef.current = ch;
    return () => {
      sb.removeChannel(ch);
      chRef.current = null;
      setConnected(false);
    };
  }, [room, myId, name, color, setConnected, upsertPlayer, removeMissing, applyGame]);

  const sendPos = useCallback(
    (x: number, z: number, ry: number) => {
      const ch = chRef.current;
      if (!ch) return;
      ch.send({ type: 'broadcast', event: 'pos', payload: { id: myId, name, color, x, z, ry, t: Date.now() } });
    },
    [myId, name, color],
  );

  const sendGame = useCallback(
    (m: GameMsg) => {
      applyGame(m); // apply locally since broadcast is configured self:false
      const ch = chRef.current;
      if (!ch) return;
      ch.send({ type: 'broadcast', event: 'game', payload: m });
    },
    [applyGame],
  );

  return { sendPos, sendGame };
}
