'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import type { GameMsg } from '@/lib/types';

/** Reunite-mode helper: an arrow + distance readout pointing to the nearest
 *  partner, and the "reunited!" celebration when you get close. */
export function Compass({ sendGame }: { sendGame: (m: GameMsg) => void }) {
  const mode = useGame((s) => s.mode);
  const reunited = useGame((s) => s.reunited);
  const myId = useGame((s) => s.myId);
  const [info, setInfo] = useState<{ dist: number; angle: number; name: string } | null>(null);

  useEffect(() => {
    if (mode !== 'reunite') return;
    const iv = setInterval(() => {
      const st = useGame.getState();
      const others = Object.values(st.players);
      if (!others.length) { setInfo(null); return; }
      let best = others[0], bd = Infinity;
      for (const p of others) {
        const dx = p.x - localPos.x, dz = p.z - localPos.z;
        const d = dx * dx + dz * dz;
        if (d < bd) { bd = d; best = p; }
      }
      const dx = best.x - localPos.x, dz = best.z - localPos.z;
      const dist = Math.hypot(dx, dz);
      setInfo({ dist, angle: Math.atan2(dx, dz) - localPos.ry, name: best.name || 'Partner' });
      if (dist < 8 && !st.reunited) sendGame({ action: 'reunited', a: myId, b: best.id });
    }, 120);
    return () => clearInterval(iv);
  }, [mode, myId, sendGame]);

  if (mode !== 'reunite') return null;

  if (reunited) {
    return (
      <div className="overlay">
        <div className="card big">
          <div className="huge">💗</div>
          <h2>Reunited!</h2>
          <p>You found each other.</p>
          <div className="row">
            <button className="big-btn blue" onClick={() => sendGame({ action: 'start', mode: 'reunite', endsAt: null, seed: Math.random() })}>Again</button>
            <button className="big-btn ghost" onClick={() => sendGame({ action: 'start', mode: 'idle', endsAt: null, seed: 0 })}>Modes</button>
          </div>
        </div>
      </div>
    );
  }

  if (!info) return <div className="compass"><p className="muted">Waiting for your partner to join room…</p></div>;
  const warm = info.dist < 40 ? 'warm' : info.dist < 120 ? 'mid' : 'cold';
  const hint = warm === 'warm' ? 'very warm 🔥' : warm === 'mid' ? 'getting closer' : 'cold ❄️';
  return (
    <div className="compass">
      <div className={`dial ${warm}`}>
        <div className="arrow" style={{ transform: `rotate(${info.angle}rad)` }}>▲</div>
      </div>
      <div className="cinfo">
        <strong>{Math.round(info.dist)} m</strong>
        <span>to {info.name} · {hint}</span>
      </div>
    </div>
  );
}
