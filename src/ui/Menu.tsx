'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/useGameStore';
import type { GameMsg } from '@/lib/types';

/** Single top-left burger menu holding all the loose controls: room code,
 *  connection/players, zoom, direction hint, change mode, and leave. */
export function Menu({ sendGame }: { sendGame: (m: GameMsg) => void }) {
  const router = useRouter();
  const room = useGame((s) => s.room);
  const connected = useGame((s) => s.connected);
  const players = useGame((s) => s.players);
  const mode = useGame((s) => s.mode);
  const hint = useGame((s) => s.hint);
  const toggleHint = useGame((s) => s.toggleHint);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const count = Object.keys(players).length + 1;
  const zoomBy = (d: number) => useGame.getState().setZoom(useGame.getState().zoom + d);
  const copy = () => { navigator.clipboard?.writeText(room); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  const modeLabel = mode === 'reunite' ? '💗 Reunite' : mode === 'rush' ? '🏁 Landmark Rush' : 'Free roam';

  return (
    <>
      <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">{open ? '✕' : '☰'}</button>
      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="menu-panel">
            <div className="menu-row">
              <button className="code" onClick={copy}>{room || '—'} {copied ? '✓' : '⧉'}</button>
              <span className={`dot ${connected ? 'on' : 'off'}`} />
              <span className="muted">{count} here</span>
            </div>

            <div className="menu-sec">
              <span className="menu-label">View</span>
              <div className="menu-row">
                <button className="mbtn" onClick={() => zoomBy(-3)} aria-label="Zoom in">＋</button>
                <button className="mbtn" onClick={() => zoomBy(3)} aria-label="Zoom out">－</button>
                <button className={`mbtn wideish ${hint ? 'on' : ''}`} onClick={toggleHint}>🧭 Hint {hint ? 'on' : 'off'}</button>
              </div>
            </div>

            <div className="menu-sec">
              <span className="menu-label">Mode · {modeLabel}</span>
              <div className="menu-row">
                {mode !== 'idle' && (
                  <button className="mbtn wideish" onClick={() => { sendGame({ action: 'start', mode: 'idle', endsAt: null, seed: 0 }); setOpen(false); }}>
                    Change mode
                  </button>
                )}
                <button className="mbtn danger" onClick={() => router.push('/')}>Leave</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
