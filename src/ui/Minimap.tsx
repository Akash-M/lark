'use client';
import { useEffect, useRef } from 'react';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import type { City, Pt } from '@/lib/types';
import type { Spot } from '@/game/Landmarks';

const SIZE = 152;
const PAD = 6;
const B = 240; // world half-extent (metres) to fit

function poly(ctx: CanvasRenderingContext2D, pts: Pt[], toMM: (x: number, z: number) => [number, number]) {
  ctx.beginPath();
  pts.forEach(([x, z], i) => {
    const [mx, my] = toMM(x, z);
    if (i === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
  });
  ctx.closePath();
}

/** Top-down minimap: static city (buildings/green/water/roads) + live dots for
 *  landmarks, the partner, and a heading arrow for you. North is up. */
export function Minimap({ city, spots }: { city: City; spots: Spot[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);

  const toMM = (x: number, z: number): [number, number] => [
    PAD + ((x + B) / (2 * B)) * (SIZE - 2 * PAD),
    PAD + ((z + B) / (2 * B)) * (SIZE - 2 * PAD),
  ];

  // build static background once
  useEffect(() => {
    const bg = document.createElement('canvas');
    bg.width = SIZE; bg.height = SIZE;
    const ctx = bg.getContext('2d')!;
    ctx.fillStyle = '#e7e0d0'; ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#9cc27a';
    for (const g of city.green) { poly(ctx, g.pts, toMM); ctx.fill(); }
    ctx.fillStyle = '#7bb0dd';
    for (const w of city.water) { poly(ctx, w.pts, toMM); ctx.fill(); }
    ctx.strokeStyle = '#c9c0ad'; ctx.lineWidth = 0.6;
    for (const r of city.roads) {
      ctx.beginPath();
      r.pts.forEach(([x, z], i) => { const [mx, my] = toMM(x, z); if (i === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my); });
      ctx.stroke();
    }
    ctx.fillStyle = '#c1b096';
    for (const b of city.buildings) { if (b.pts.length < 3) continue; poly(ctx, b.pts, toMM); ctx.fill(); }
    bgRef.current = bg;
  }, [city]);

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const c = canvasRef.current, bg = bgRef.current;
      if (c && bg) {
        const ctx = c.getContext('2d')!;
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.drawImage(bg, 0, 0);
        const st = useGame.getState();

        // landmarks
        for (const s of spots) {
          const [mx, my] = toMM(s.x, s.z);
          ctx.beginPath(); ctx.arc(mx, my, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = st.found[s.id] ? '#2f9e4f' : '#f0a72e';
          ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#fff'; ctx.stroke();
        }
        // partner(s)
        for (const p of Object.values(st.players)) {
          const [mx, my] = toMM(p.x, p.z);
          ctx.beginPath(); ctx.arc(mx, my, 3.6, 0, Math.PI * 2);
          ctx.fillStyle = p.color || '#e5568a'; ctx.fill();
          ctx.lineWidth = 1.4; ctx.strokeStyle = '#fff'; ctx.stroke();
        }
        // me (heading arrow)
        const [mx, my] = toMM(localPos.x, localPos.z);
        const th = Math.atan2(Math.sin(localPos.ry), -Math.cos(localPos.ry));
        ctx.save(); ctx.translate(mx, my); ctx.rotate(th);
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath();
        ctx.fillStyle = st.color || '#3a7ca5'; ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [spots]);

  return (
    <div className="minimap">
      <canvas ref={canvasRef} width={SIZE} height={SIZE} />
    </div>
  );
}
