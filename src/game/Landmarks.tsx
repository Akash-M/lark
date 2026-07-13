'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import type { GameMsg } from '@/lib/types';
import { Label } from './label';

export type Spot = { id: string; name: string; x: number; z: number };
const COLLECT_RADIUS = 9;

/** Landmarks marked ON THE GROUND: a glowing disc + ring on the spot plus a low
 *  bobbing beacon and label. Shown in every mode so the world matches the
 *  minimap; in Rush they're the timed collectibles (auto-collect within range). */
export function Landmarks({ spots, sendGame }: { spots: Spot[]; sendGame: (m: GameMsg) => void }) {
  const mode = useGame((s) => s.mode);
  const name = useGame((s) => s.name);
  const found = useGame((s) => s.found);
  const beaconRefs = useRef<Record<string, THREE.Mesh | null>>({});
  const ringRefs = useRef<Record<string, THREE.Mesh | null>>({});

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const rush = useGame.getState().mode === 'rush';
    const foundNow = useGame.getState().found;
    for (const s of spots) {
      const beacon = beaconRefs.current[s.id];
      if (beacon) { beacon.position.y = 2.4 + Math.sin(t * 2 + s.x) * 0.3; beacon.rotation.y = t * 0.9; }
      const ring = ringRefs.current[s.id];
      if (ring) { const p = 1 + Math.sin(t * 2.4 + s.z) * 0.06; ring.scale.set(p, p, p); }
      if (rush && !foundNow[s.id]) {
        const dx = localPos.x - s.x, dz = localPos.z - s.z;
        if (dx * dx + dz * dz < COLLECT_RADIUS * COLLECT_RADIUS)
          sendGame({ action: 'found', landmarkId: s.id, by: name || 'A player' });
      }
    }
  });

  return (
    <>
      {spots.map((s) => {
        const done = !!found[s.id];
        const ground = done ? '#57c07a' : '#f0a13a';
        return (
          <group key={s.id} position={[s.x, 0, s.z]}>
            {/* filled disc on the ground */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.16, 0]}>
              <circleGeometry args={[3.4, 40]} />
              <meshBasicMaterial color={ground} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            {/* bright ring border */}
            <mesh ref={(el) => { ringRefs.current[s.id] = el; }} rotation-x={-Math.PI / 2} position={[0, 0.2, 0]}>
              <ringGeometry args={[3.4, 4.1, 44]} />
              <meshBasicMaterial color={ground} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            {/* low bobbing beacon */}
            <mesh ref={(el) => { beaconRefs.current[s.id] = el; }} position={[0, 2.4, 0]} castShadow>
              <octahedronGeometry args={[0.9, 0]} />
              <meshStandardMaterial
                color={done ? '#8fd694' : '#ffcf3f'}
                emissive={done ? '#2f7d3a' : '#ff9a2e'}
                emissiveIntensity={done ? 0.5 : 1.1}
                roughness={0.35}
              />
            </mesh>
            <Label text={done ? `✓ ${s.name}` : s.name} y={4.4} w={Math.max(4, s.name.length * 0.42)} />
          </group>
        );
      })}
    </>
  );
}
