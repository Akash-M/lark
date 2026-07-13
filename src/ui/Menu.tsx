'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/useGameStore';
import type { GameMsg, Mode } from '@/lib/types';

const RUSH_SECONDS = 300;

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={onClick}>
      <span className="knob" />
    </button>
  );
}

/** The hub: everything lives here — room, mode selection, zoom, hint, minimap,
 *  leave. Opens automatically while idle so players see the mode choices. */
export function Menu({ sendGame }: { sendGame: (m: GameMsg) => void }) {
  const router = useRouter();
  const room = useGame((s) => s.room);
  const connected = useGame((s) => s.connected);
  const players = useGame((s) => s.players);
  const mode = useGame((s) => s.mode);
  const hint = useGame((s) => s.hint);
  const showMinimap = useGame((s) => s.showMinimap);
  const toggleHint = useGame((s) => s.toggleHint);
  const toggleMinimap = useGame((s) => s.toggleMinimap);
  const [open, setOpen] = useState(() => useGame.getState().mode === 'idle');
  const [copied, setCopied] = useState(false);

  const count = Object.keys(players).length + 1;
  const zoomBy = (d: number) => useGame.getState().setZoom(useGame.getState().zoom + d);
  const copy = () => { navigator.clipboard?.writeText(room); setCopied(true); setTimeout(() => setCopied(false), 1200); };

  const pick = (m: Mode) => {
    if (m === 'reunite') sendGame({ action: 'start', mode: 'reunite', endsAt: null, seed: Math.random() });
    else if (m === 'rush') sendGame({ action: 'start', mode: 'rush', endsAt: Date.now() + RUSH_SECONDS * 1000, seed: Math.random() });
    setOpen(false);
  };

  return (
    <>
      <button className="burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
        <span className={`burger-icon ${open ? 'x' : ''}`}><i /><i /><i /></span>
      </button>

      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="menu-panel">
            <div className="menu-head">
              <div>
                <div className="brand">Lark</div>
                <button className="code" onClick={copy}>{room || '—'} <span className="copy">{copied ? 'copied ✓' : 'copy'}</span></button>
              </div>
              <span className="players"><span className={`dot ${connected ? 'on' : 'off'}`} />{count}</span>
            </div>

            <div className="menu-group">
              <span className="menu-label">Play together</span>
              <div className="mode-cards">
                <button className={`mode-card blue ${mode === 'reunite' ? 'active' : ''}`} onClick={() => pick('reunite')}>
                  <span className="mc-emoji">💗</span>
                  <span className="mc-title">Reunite</span>
                  <span className="mc-sub">Find each other</span>
                </button>
                <button className={`mode-card amber ${mode === 'rush' ? 'active' : ''}`} onClick={() => pick('rush')}>
                  <span className="mc-emoji">🏁</span>
                  <span className="mc-title">Landmark Rush</span>
                  <span className="mc-sub">Beat the clock</span>
                </button>
              </div>
            </div>

            <div className="menu-group">
              <span className="menu-label">View</span>
              <div className="opt-row">
                <span className="opt-name">Zoom</span>
                <div className="stepper">
                  <button onClick={() => zoomBy(3)} aria-label="Zoom out">－</button>
                  <button onClick={() => zoomBy(-3)} aria-label="Zoom in">＋</button>
                </div>
              </div>
              <div className="opt-row">
                <span className="opt-name">Direction hint</span>
                <Switch on={hint} onClick={toggleHint} />
              </div>
              <div className="opt-row">
                <span className="opt-name">Minimap</span>
                <Switch on={showMinimap} onClick={toggleMinimap} />
              </div>
            </div>

            <button className="leave-btn" onClick={() => router.push('/')}>Leave game</button>
          </div>
        </>
      )}
    </>
  );
}
