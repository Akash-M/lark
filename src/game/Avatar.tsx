'use client';
import { Label } from './label';

/** A simple, cute low-poly avatar: capsule body + head, with a floating name. */
export function Avatar({ color, name }: { color: string; name?: string }) {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.55, 1, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial color="#ffe0bd" roughness={0.85} />
      </mesh>
      {name ? <Label text={name} y={3.0} /> : null}
    </group>
  );
}
