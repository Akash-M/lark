'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import type { GameMsg } from '@/lib/types';
import type { Spot } from '@/game/Landmarks';
import { IconNav, IconHeart } from './icons';

type Guide = { rel: number; dist: number; label: string } | null;

/** Direction + distance guide (on by default). A clean chip that points, in
 *  the direction you're facing, toward your objective — your partner in
 *  Reunite, the nearest un-found landmark in Rush. */
export function Compass({ sendGame, spots }: { sendGame: (m: GameMsg) => void; spots: Spot[] }) {
  const mode = useGame((s) => s.mode);
  const reunited = useGame((s) => s.reunited);
  const hint = useGame((s) => s.hint);
  const myId = useGame((s) => s.myId);
  const [g, setG] = useState<Guide>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    if (mode !== 'reunite' && mode !== 'rush') { setG(null); return; }
    const iv = setInterval(() => {
      const st = useGame.getState();
      let tx: number | null = null, tz = 0, label = '', targetId = '';
      if (mode === 'reunite') {
        let bd = Infinity;
        for (const p of Object.values(st.players)) {
          const d = (p.x - localPos.x) ** 2 + (p.z - localPos.z) ** 2;
          if (d < bd) { bd = d; tx = p.x; tz = p.z; label = p.name || 'Partner'; targetId = p.id; }
        }
      } else {
        let bd = Infinity;
        for (const s of spots) {
          if (st.found[s.id]) continue;
          const d = (s.x - localPos.x) ** 2 + (s.z - localPos.z) ** 2;
          if (d < bd) { bd = d; tx = s.x; tz = s.z; label = s.name; }
        }
      }
      if (tx === null) { setEmpty(true); setG(null); return; }
      setEmpty(false);
      const dx = tx - localPos.x, dz = tz - localPos.z;
      const dist = Math.hypot(dx, dz);
      setG({ rel: Math.atan2(dx, dz) - localPos.ry, dist, label });
      if (mode === 'reunite' && dist < 8 && !st.reunited) sendGame({ action: 'reunited', a: myId, b: targetId });
    }, 110);
    return () => clearInterval(iv);
  }, [mode, spots, myId, sendGame]);

  if (mode !== 'reunite' && mode !== 'rush') return null;

  if (reunited) {
    return (
      <div className="overlay">
        <div className="card big">
          <div className="huge"><IconHeart size={54} /></div>
          <h2>Reunited!</h2>
          <p>You found each other.</p>
          <div className="row">
            <button className="big-btn blue" onClick={() => sendGame({ action: 'start', mode: 'reunite', endsAt: null, seed: Math.random() })}>Again</button>
            <button className="big-btn ghost" onClick={() => sendGame({ action: 'start', mode: 'idle', endsAt: null, seed: 0 })}>Menu</button>
          </div>
        </div>
      </div>
    );
  }

  if (!hint) return null; // guide toggled off in the menu

  if (empty || !g) {
    return (
      <div className="guide muted-guide">
        {mode === 'reunite' ? 'Waiting for your partner…' : 'All landmarks found! 🎉'}
      </div>
    );
  }

  const warm = g.dist < 40 ? 'warm' : g.dist < 120 ? 'mid' : 'cold';
  return (
    <div className={`guide ${warm}`}>
      <div className="guide-arrow" style={{ transform: `rotate(${g.rel}rad)` }}><IconNav size={22} /></div>
      <div className="guide-text">
        <strong>{Math.round(g.dist)} m</strong>
        <span>{g.label}</span>
      </div>
    </div>
  );
}
