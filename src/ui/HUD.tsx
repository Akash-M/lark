'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/lib/useGameStore';
import type { City, GameMsg } from '@/lib/types';
import { IconTrophy, IconClock } from './icons';

const RUSH_SECONDS = 300;

/** Gameplay HUD: Rush timer + checklist and win/lose overlays. Mode selection,
 *  room, zoom, hint and minimap all live in the burger Menu now. */
export function HUD({ city, sendGame }: { city: City; sendGame: (m: GameMsg) => void }) {
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

  const startRush = () => sendGame({ action: 'start', mode: 'rush', endsAt: Date.now() + RUSH_SECONDS * 1000, seed: Math.random() });
  const toMenu = () => sendGame({ action: 'start', mode: 'idle', endsAt: null, seed: 0 });

  const rushWon = mode === 'rush' && total > 0 && foundCount >= total;
  const rushLost = mode === 'rush' && remaining <= 0 && foundCount < total;

  return (
    <>
      {mode === 'rush' && (
        <div className="rush-bar">
          <div className={`timer ${remaining < 30 ? 'danger' : ''}`}>{mmss}</div>
          <div className="found">{foundCount}/{total} found</div>
          <div className="chips">
            {city.landmarks.map((l) => (
              <span key={l.id} className={`chip ${found[l.id] ? 'got' : ''}`}>{l.name}</span>
            ))}
          </div>
        </div>
      )}

      {rushWon && (
        <div className="overlay"><div className="card big">
          <div className="huge"><IconTrophy size={54} /></div><h2>All landmarks found!</h2>
          <p>{foundCount}/{total} with {mmss} to spare.</p>
          <div className="row">
            <button className="big-btn amber" onClick={startRush}>Play again</button>
            <button className="big-btn ghost" onClick={toMenu}>Menu</button>
          </div>
        </div></div>
      )}

      {rushLost && (
        <div className="overlay"><div className="card big">
          <div className="huge"><IconClock size={54} /></div><h2>Time!</h2>
          <p>You found {foundCount}/{total}. So close!</p>
          <div className="row">
            <button className="big-btn amber" onClick={startRush}>Try again</button>
            <button className="big-btn ghost" onClick={toMenu}>Menu</button>
          </div>
        </div></div>
      )}

      <div className="attrib">© OpenStreetMap contributors · {city.name}</div>
    </>
  );
}
