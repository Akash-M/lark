'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import { Avatar } from './Avatar';

/** Local player: reads joystick/keyboard, moves the avatar, drives a follow
 *  camera, and reports position to the room ~10x/second. */
export function Player({
  sendPos,
  spawnAt,
}: {
  sendPos: (x: number, z: number, ry: number) => void;
  spawnAt: { x: number; z: number };
}) {
  const ref = useRef<THREE.Group>(null);
  const name = useGame((s) => s.name);
  const color = useGame((s) => s.color);
  const yaw = useRef(0);
  const acc = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const { camera, gl } = useThree();

  // (re)spawn
  useEffect(() => {
    if (ref.current) ref.current.position.set(spawnAt.x, 0, spawnAt.z);
    localPos.x = spawnAt.x;
    localPos.z = spawnAt.z;
  }, [spawnAt.x, spawnAt.z]);

  // input listeners
  useEffect(() => {
    const kd = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const ku = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const dom = gl.domElement;
    let dragging = false, lastX = 0, pid = -1;
    const pd = (e: PointerEvent) => { dragging = true; pid = e.pointerId; lastX = e.clientX; };
    const pm = (e: PointerEvent) => {
      if (dragging && e.pointerId === pid) { yaw.current -= (e.clientX - lastX) * 0.005; lastX = e.clientX; }
    };
    const pu = (e: PointerEvent) => { if (e.pointerId === pid) dragging = false; };
    dom.addEventListener('pointerdown', pd);
    dom.addEventListener('pointermove', pm);
    dom.addEventListener('pointerup', pu);
    dom.addEventListener('pointercancel', pu);

    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      dom.removeEventListener('pointerdown', pd);
      dom.removeEventListener('pointermove', pm);
      dom.removeEventListener('pointerup', pu);
      dom.removeEventListener('pointercancel', pu);
    };
  }, [gl]);

  const tmp = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);

    const st = useGame.getState();
    let f = st.input.f, r = st.input.r;
    const k = keys.current;
    if (k['KeyW'] || k['ArrowUp']) f += 1;
    if (k['KeyS'] || k['ArrowDown']) f -= 1;
    if (k['KeyD'] || k['ArrowRight']) r += 1;
    if (k['KeyA'] || k['ArrowLeft']) r -= 1;
    f = Math.max(-1, Math.min(1, f));
    r = Math.max(-1, Math.min(1, r));

    const fx = Math.sin(yaw.current), fz = Math.cos(yaw.current);
    const rx = Math.sin(yaw.current + Math.PI / 2), rz = Math.cos(yaw.current + Math.PI / 2);
    let mx = fx * f + rx * r, mz = fz * f + rz * r;
    const L = Math.hypot(mx, mz);
    if (L > 0.001) {
      mx /= L; mz /= L;
      const speed = 9;
      g.position.x += mx * speed * dt;
      g.position.z += mz * speed * dt;
      g.rotation.y = Math.atan2(mx, mz);
      const b = 230;
      g.position.x = Math.max(-b, Math.min(b, g.position.x));
      g.position.z = Math.max(-b, Math.min(b, g.position.z));
    }

    // follow camera
    const dist = 11, hgt = 6.5;
    tmp.current.set(g.position.x - fx * dist, hgt, g.position.z - fz * dist);
    camera.position.lerp(tmp.current, 1 - Math.pow(0.0015, dt));
    camera.lookAt(g.position.x, 2.2, g.position.z);

    localPos.x = g.position.x;
    localPos.z = g.position.z;
    localPos.ry = yaw.current;

    acc.current += dt;
    if (acc.current >= 0.1) {
      acc.current = 0;
      sendPos(g.position.x, g.position.z, g.rotation.y);
    }
  });

  return (
    <group ref={ref}>
      <Avatar color={color} name={name} />
    </group>
  );
}
