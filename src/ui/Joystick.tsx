'use client';
import { useRef } from 'react';
import { useGame } from '@/lib/useGameStore';

/** On-screen movement joystick (touch + mouse). Writes to the input store. */
export function Joystick() {
  const setInput = useGame((s) => s.setInput);
  const baseRef = useRef<HTMLDivElement>(null);
  const nubRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const pid = useRef(-1);

  const move = (e: React.PointerEvent) => {
    if (!active.current || e.pointerId !== pid.current) return;
    const b = baseRef.current!.getBoundingClientRect();
    let dx = e.clientX - (b.left + b.width / 2);
    let dy = e.clientY - (b.top + b.height / 2);
    const max = 44;
    const L = Math.hypot(dx, dy);
    if (L > max) { dx *= max / L; dy *= max / L; }
    if (nubRef.current) nubRef.current.style.transform = `translate(${dx}px,${dy}px)`;
    setInput(-dy / max, dx / max);
  };
  const start = (e: React.PointerEvent) => {
    active.current = true;
    pid.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    move(e);
  };
  const end = (e: React.PointerEvent) => {
    if (e.pointerId !== pid.current) return;
    active.current = false;
    setInput(0, 0);
    if (nubRef.current) nubRef.current.style.transform = 'translate(0,0)';
  };

  return (
    <div ref={baseRef} className="stick" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <div ref={nubRef} className="nub" />
    </div>
  );
}
