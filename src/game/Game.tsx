'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/useGameStore';
import { useRoom } from '@/lib/useRoom';
import { loadCity } from '@/lib/cities';
import { spawn } from '@/lib/localState';
import type { City } from '@/lib/types';
import { CityView } from './City';
import { Player } from './Player';
import { RemotePlayers } from './RemotePlayers';
import { Landmarks, type Spot } from './Landmarks';
import { Collider } from './collision';
import { Joystick } from '@/ui/Joystick';
import { HUD } from '@/ui/HUD';
import { Compass } from '@/ui/Compass';
import { Minimap } from '@/ui/Minimap';
import { Menu } from '@/ui/Menu';

export default function Game() {
  const router = useRouter();
  const name = useGame((s) => s.name);
  const cityId = useGame((s) => s.city);
  const mode = useGame((s) => s.mode);
  const seed = useGame((s) => s.seed);
  const showMinimap = useGame((s) => s.showMinimap);
  const { sendPos, sendGame } = useRoom();
  const [city, setCity] = useState<City | null>(null);
  const [spawnAt, setSpawnAt] = useState({ x: 0, z: 20 });

  const collider = useMemo(() => (city ? new Collider(city) : null), [city]);

  // landmark collectibles placed on reachable ground (shared by 3D + minimap + guide)
  const spots = useMemo<Spot[]>(() => {
    if (!city) return [];
    return city.landmarks.map((lm) => {
      const [x, z] = collider ? collider.findOpen(lm.x, lm.z) : [lm.x, lm.z];
      return { id: lm.id, name: lm.name, x, z };
    });
  }, [city, collider]);

  useEffect(() => { if (!name) router.replace('/'); }, [name, router]);

  useEffect(() => {
    let ok = true;
    loadCity(cityId).then((c) => { if (ok) setCity(c); }).catch(() => {});
    return () => { ok = false; };
  }, [cityId]);

  useEffect(() => {
    let base: { x: number; z: number };
    if (mode === 'reunite') base = spawn(160);
    else if (mode === 'rush') base = spawn(30, 0, 30);
    else base = { x: 0, z: 20 };
    if (collider) { const [x, z] = collider.findOpen(base.x, base.z); base = { x, z }; }
    setSpawnAt(base);
  }, [mode, seed, collider]);

  if (!name) return null;

  return (
    <div className="game-root">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 60, near: 0.5, far: 3000, position: [0, 14, 26] }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
      >
        <color attach="background" args={['#cfe0ee']} />
        <fog attach="fog" args={['#cfe0ee', 150, 620]} />
        <hemisphereLight args={['#bfd8ff', '#6b5c48', 0.85]} />
        <ambientLight intensity={0.15} />
        <directionalLight
          castShadow
          position={[130, 200, 90]}
          intensity={1.5}
          color="#fff1dc"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={620}
          shadow-camera-left={-240}
          shadow-camera-right={240}
          shadow-camera-top={240}
          shadow-camera-bottom={-240}
          shadow-normalBias={0.6}
          shadow-bias={-0.0004}
        />
        {city && <CityView city={city} />}
        <Player sendPos={sendPos} spawnAt={spawnAt} collider={collider} />
        <RemotePlayers />
        {city && <Landmarks spots={spots} sendGame={sendGame} />}
      </Canvas>

      {!city && <div className="loader">Loading {cityId}…</div>}
      <Joystick />
      <Menu sendGame={sendGame} />
      {city && showMinimap && <Minimap city={city} spots={spots} />}
      {city && <HUD city={city} sendGame={sendGame} />}
      <Compass sendGame={sendGame} spots={spots} />
    </div>
  );
}
