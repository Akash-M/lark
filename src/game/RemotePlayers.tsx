'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { shallow } from 'zustand/shallow';
import * as THREE from 'three';
import { useGame } from '@/lib/useGameStore';
import { Avatar } from './Avatar';

function RemoteAvatar({ id }: { id: string }) {
  const ref = useRef<THREE.Group>(null);
  const meta = useGame((s) => {
    const p = s.players[id];
    return p ? { name: p.name, color: p.color } : null;
  }, shallow);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const p = useGame.getState().players[id];
    if (!p) return;
    const dt = Math.min(delta, 0.05);
    const k = 1 - Math.pow(0.002, dt);
    g.position.x += (p.x - g.position.x) * k;
    g.position.z += (p.z - g.position.z) * k;
    g.rotation.y = p.ry;
  });

  if (!meta) return null;
  return (
    <group ref={ref}>
      <Avatar color={meta.color} name={meta.name} />
    </group>
  );
}

export function RemotePlayers() {
  const ids = useGame((s) => Object.keys(s.players), shallow);
  return (
    <>
      {ids.map((id) => (
        <RemoteAvatar key={id} id={id} />
      ))}
    </>
  );
}
