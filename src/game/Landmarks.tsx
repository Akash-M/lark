'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import type { City, GameMsg } from '@/lib/types';
import type { Collider } from './collision';
import { Label } from './label';

const COLLECT_RADIUS = 9;

/** Glowing collectibles for Landmark Rush. Each marker is placed on open ground
 *  beside its building (via the collider) so it's always reachable now that
 *  players can't walk through walls. Auto-collects within range + broadcasts it. */
export function Landmarks({
  city,
  sendGame,
  collider,
}: {
  city: City;
  sendGame: (m: GameMsg) => void;
  collider: Collider | null;
}) {
  const mode = useGame((s) => s.mode);
  const name = useGame((s) => s.name);
  const found = useGame((s) => s.found);
  const groupRefs = useRef<Record<string, THREE.Group | null>>({});
  const orbRefs = useRef<Record<string, THREE.Mesh | null>>({});

  const spots = useMemo(
    () =>
      city.landmarks.map((lm) => {
        const [x, z] = collider ? collider.findOpen(lm.x, lm.z) : [lm.x, lm.z];
        return { ...lm, x, z };
      }),
    [city, collider],
  );

  useFrame((state) => {
    if (mode !== 'rush') return;
    const t = state.clock.elapsedTime;
    const foundNow = useGame.getState().found;
    for (const s of spots) {
      const orb = orbRefs.current[s.id];
      if (orb) orb.position.y = 7 + Math.sin(t * 2 + s.x) * 0.5;
      const grp = groupRefs.current[s.id];
      if (grp) grp.rotation.y = t * 0.6;
      if (!foundNow[s.id]) {
        const dx = localPos.x - s.x, dz = localPos.z - s.z;
        if (dx * dx + dz * dz < COLLECT_RADIUS * COLLECT_RADIUS) {
          sendGame({ action: 'found', landmarkId: s.id, by: name || 'A player' });
        }
      }
    }
  });

  if (mode !== 'rush') return null;

  return (
    <>
      {spots.map((s) => {
        const done = !!found[s.id];
        const main = done ? '#8fd694' : '#ffd24d';
        return (
          <group key={s.id} ref={(el) => { groupRefs.current[s.id] = el; }} position={[s.x, 0, s.z]}>
            <mesh ref={(el) => { orbRefs.current[s.id] = el; }} position={[0, 7, 0]}>
              <sphereGeometry args={[1.6, 20, 20]} />
              <meshStandardMaterial
                color={done ? '#8fd694' : '#ffcf3f'}
                emissive={done ? '#2f7d3a' : '#ff9a2e'}
                emissiveIntensity={done ? 0.6 : 1.2}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, 3.5, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 7, 10]} />
              <meshBasicMaterial color={main} transparent opacity={0.25} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
              <ringGeometry args={[2.6, 3.4, 28]} />
              <meshBasicMaterial color={main} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <Label text={done ? `✓ ${s.name}` : s.name} y={9.5} w={Math.max(4, s.name.length * 0.42)} />
          </group>
        );
      })}
    </>
  );
}
