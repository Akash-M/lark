'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/lib/useGameStore';
import { hasSupabase } from '@/lib/supabase';
import type { City, GameMsg } from '@/lib/types';

const RUSH_SECONDS = 300;

/** Gameplay HUD: Rush timer + checklist, the mode-select panel (idle), and
 *  win/lose overlays. Room/zoom/hint/leave now live in the burger Menu. */
export function HUD({ city, sendGame }: { city: City; sendGame: (m: GameMsg) => void }) {
  const room = useGame((s) => s.room);
  const mode = useGame((s) => s.mode);
  const endsAt = useGame((s) => s.endsAt);
  const found = useGame((s) => s.found);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);

  const foundCount = Object.keys(found).length;
  const total = city.landmarks.length;
  const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;
  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;

  const startReunite = () => sendGame({ action: 'start', mode: 'reunite', endsAt: null, seed: Math.random() });
  const startRush = () => sendGame({ action: 'start', mode: 'rush', endsAt: Date.now() + RUSH_SECONDS * 1000, seed: Math.random() });
  const toModes = () => sendGame({ action: 'start', mode: 'idle', endsAt: null, seed: 0 });

  const rushWon = mode === 'rush' && total > 0 && foundCount >= total;
  const rushLost = mode === 'rush' && remaining <= 0 && foundCount < total;

  return (
    <>
      {mode === 'rush' && (
        <div className="hud rush-bar">
          <div className={`timer ${remaining < 30 ? 'danger' : ''}`}>{mmss}</div>
          <div className="found">{foundCount}/{total} found</div>
          <div className="chips">
            {city.landmarks.map((l) => (
              <span key={l.id} className={`chip ${found[l.id] ? 'got' : ''}`}>{found[l.id] ? '✓ ' : ''}{l.name}</span>
            ))}
          </div>
        </div>
      )}

      {mode === 'idle' && (
        <div className="hud start-panel">
          <h3>Choose a mode</h3>
          <p className="muted">Everyone in room <b>{room}</b> plays the same one.</p>
          <div className="row">
            <button className="big-btn blue" onClick={startReunite}>💗 Reunite<small>Find each other</small></button>
            <button className="big-btn amber" onClick={startRush}>🏁 Landmark Rush<small>Split up · beat the clock</small></button>
          </div>
          {!hasSupabase() && <p className="warn">Single-player preview — add Supabase keys for real multiplayer (see README).</p>}
        </div>
      )}

      {rushWon && (
        <div className="overlay"><div className="card big">
          <div className="huge">🏆</div><h2>All landmarks found!</h2>
          <p>{foundCount}/{total} with {mmss} to spare.</p>
          <div className="row">
            <button className="big-btn amber" onClick={startRush}>Play again</button>
            <button className="big-btn ghost" onClick={toModes}>Modes</button>
          </div>
        </div></div>
      )}

      {rushLost && (
        <div className="overlay"><div className="card big">
          <div className="huge">⏰</div><h2>Time!</h2>
          <p>You found {foundCount}/{total}. So close!</p>
          <div className="row">
            <button className="big-btn amber" onClick={startRush}>Try again</button>
            <button className="big-btn ghost" onClick={toModes}>Modes</button>
          </div>
        </div></div>
      )}

      <div className="attrib">© OpenStreetMap contributors · {city.name}</div>
    </>
  );
}
