'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import type { GameMsg } from '@/lib/types';
import type { Spot } from '@/game/Landmarks';

type Guide = { heading: number; bearing: number; dist: number; label: string } | null;

/** Directional guide + compass. Points to your objective — your partner in
 *  Reunite, the nearest un-found landmark in Rush. The arrow/label show only
 *  when the hint toggle is on; the compass ring (N) always shows. */
export function Compass({ sendGame, spots }: { sendGame: (m: GameMsg) => void; spots: Spot[] }) {
  const mode = useGame((s) => s.mode);
  const reunited = useGame((s) => s.reunited);
  const hint = useGame((s) => s.hint);
  const myId = useGame((s) => s.myId);
  const [g, setG] = useState<Guide>(null);

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
      if (tx === null) { setG({ heading: localPos.ry, bearing: 0, dist: -1, label: '' }); return; }
      const dx = tx - localPos.x, dz = tz - localPos.z;
      const dist = Math.hypot(dx, dz);
      setG({ heading: localPos.ry, bearing: Math.atan2(dx, dz), dist, label });
      if (mode === 'reunite' && dist < 8 && !st.reunited) sendGame({ action: 'reunited', a: myId, b: targetId });
    }, 120);
    return () => clearInterval(iv);
  }, [mode, spots, myId, sendGame]);

  if (mode !== 'reunite' && mode !== 'rush') return null;

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

  const heading = g?.heading ?? 0;
  const rel = g ? g.bearing - heading : 0;
  const hasTarget = !!g && g.dist >= 0;
  const warm = !hasTarget ? '' : g!.dist < 40 ? 'warm' : g!.dist < 120 ? 'mid' : 'cold';

  return (
    <div className="compass">
      <div className={`dial ${warm}`}>
        {/* rotating compass ring with North marker */}
        <div className="ring" style={{ transform: `rotate(${Math.PI - heading}rad)` }}>
          <span className="north">N</span>
        </div>
        {hint && hasTarget && (
          <div className="arrow" style={{ transform: `rotate(${rel}rad)` }}>▲</div>
        )}
      </div>
      <div className="cinfo">
        {!hasTarget ? (
          <span className="muted">{mode === 'reunite' ? 'Waiting for your partner…' : 'All landmarks found!'}</span>
        ) : hint ? (
          <>
            <strong>{Math.round(g!.dist)} m</strong>
            <span>to {g!.label} · {warm === 'warm' ? 'very warm 🔥' : warm === 'mid' ? 'getting closer' : 'far ❄️'}</span>
          </>
        ) : (
          <span className="muted">Tap 🧭 for a hint</span>
        )}
      </div>
    </div>
  );
}
