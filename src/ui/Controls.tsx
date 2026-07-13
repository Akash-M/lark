'use client';
import { useGame } from '@/lib/useGameStore';

/** Right-edge controls: zoom in/out + toggle the direction hint. */
export function Controls() {
  const hint = useGame((s) => s.hint);
  const toggleHint = useGame((s) => s.toggleHint);
  const zoomBy = (d: number) => useGame.getState().setZoom(useGame.getState().zoom + d);

  return (
    <div className="controls">
      <button onClick={() => zoomBy(-3)} aria-label="Zoom in">＋</button>
      <button onClick={() => zoomBy(3)} aria-label="Zoom out">－</button>
      <button className={hint ? 'on' : ''} onClick={toggleHint} aria-label="Toggle direction hint" title="Direction hint">🧭</button>
    </div>
  );
}
