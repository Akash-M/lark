'use client';
import dynamic from 'next/dynamic';

const Game = dynamic(() => import('@/game/Game'), {
  ssr: false,
  loading: () => <div className="loader">Loading…</div>,
});

export default function PlayPage() {
  return <Game />;
}
