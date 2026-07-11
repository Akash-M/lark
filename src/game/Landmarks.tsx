'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import type { City, GameMsg } from '@/lib/types';
import { Label } from './label';

const COLLECT_RADIUS = 7;

/** Glowing collectible landmarks, shown in Landmark Rush mode. Auto-collects
 *  when the local player walks within range and broadcasts the discovery. */
export function Landmarks({ city, sendGame }: { city: City; sendGame: (m: GameMsg) => void }) {
  const mode = useGame((s) => s.mode);
  const name = useGame((s) => s.name);
  const found = useGame((s) => s.found);
  const groupRefs = useRef<Record<string, THREE.Group | null>>({});
  const orbRefs = useRef<Record<string, THREE.Mesh | null>>({});

  useFrame((state) => {
    if (mode !== 'rush') return;
    const t = state.clock.elapsedTime;
    const foundNow = useGame.getState().found;
    for (const lm of city.landmarks) {
      const orb = orbRefs.current[lm.id];
      if (orb) orb.position.y = 7 + Math.sin(t * 2 + lm.x) * 0.5;
      const grp = groupRefs.current[lm.id];
      if (grp) grp.rotation.y = t * 0.6;
      if (!foundNow[lm.id]) {
        const dx = localPos.x - lm.x, dz = localPos.z - lm.z;
        if (dx * dx + dz * dz < COLLECT_RADIUS * COLLECT_RADIUS) {
          sendGame({ action: 'found', landmarkId: lm.id, by: name || 'A player' });
        }
      }
    }
  });

  if (mode !== 'rush') return null;

  return (
    <>
      {city.landmarks.map((lm) => {
        const done = !!found[lm.id];
        const main = done ? '#8fd694' : '#ffd24d';
        return (
          <group key={lm.id} ref={(el) => { groupRefs.current[lm.id] = el; }} position={[lm.x, 0, lm.z]}>
            <mesh ref={(el) => { orbRefs.current[lm.id] = el; }} position={[0, 7, 0]}>
              <sphereGeometry args={[1.6, 20, 20]} />
              <meshStandardMaterial
                color={done ? '#8fd694' : '#ffcf3f'}
                emissive={done ? '#2f7d3a' : '#ff9a2e'}
                emissiveIntensity={done ? 0.6 : 1.2}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, 7, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 14, 10]} />
              <meshBasicMaterial color={main} transparent opacity={0.25} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
              <ringGeometry args={[2.6, 3.4, 28]} />
              <meshBasicMaterial color={main} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <Label text={done ? `✓ ${lm.name}` : lm.name} y={9.5} w={Math.max(4, lm.name.length * 0.42)} />
          </group>
        );
      })}
    </>
  );
}
