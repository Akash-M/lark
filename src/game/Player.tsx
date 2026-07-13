'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/useGameStore';
import { localPos } from '@/lib/localState';
import { Avatar } from './Avatar';
import type { Collider } from './collision';

/** Local player: joystick/keyboard movement with collision + wall sliding, a
 *  user-zoomable follow camera (wheel / pinch / buttons) that pulls in to avoid
 *  clipping walls, and a ~10Hz position broadcast. */
export function Player({
  sendPos,
  spawnAt,
  collider,
}: {
  sendPos: (x: number, z: number, ry: number) => void;
  spawnAt: { x: number; z: number };
  collider: Collider | null;
}) {
  const ref = useRef<THREE.Group>(null);
  const name = useGame((s) => s.name);
  const color = useGame((s) => s.color);
  const yaw = useRef(0);
  const acc = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const { camera, gl } = useThree();
  const colliderRef = useRef(collider);
  colliderRef.current = collider;
  const tmp = useRef(new THREE.Vector3());

  useEffect(() => {
    if (ref.current) ref.current.position.set(spawnAt.x, 0, spawnAt.z);
    localPos.x = spawnAt.x;
    localPos.z = spawnAt.z;
  }, [spawnAt.x, spawnAt.z]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const ku = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const dom = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let lastX = 0;
    let lastPinch = 0;

    const pd = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) lastX = e.clientX;
    };
    const pm = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        yaw.current -= (e.clientX - lastX) * 0.005;
        lastX = e.clientX;
      } else {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinch) useGame.getState().setZoom(useGame.getState().zoom - (d - lastPinch) * 0.05);
        lastPinch = d;
      }
    };
    const pu = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      lastPinch = 0;
      const rest = [...pointers.values()][0];
      if (rest) lastX = rest.x;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      useGame.getState().setZoom(useGame.getState().zoom + Math.sign(e.deltaY) * 1.5);
    };

    dom.addEventListener('pointerdown', pd);
    dom.addEventListener('pointermove', pm);
    dom.addEventListener('pointerup', pu);
    dom.addEventListener('pointercancel', pu);
    dom.addEventListener('wheel', wheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      dom.removeEventListener('pointerdown', pd);
      dom.removeEventListener('pointermove', pm);
      dom.removeEventListener('pointerup', pu);
      dom.removeEventListener('pointercancel', pu);
      dom.removeEventListener('wheel', wheel);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const col = colliderRef.current;

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
    // right vector = forward rotated -90° (screen-right maps to world here)
    const rx = Math.sin(yaw.current - Math.PI / 2), rz = Math.cos(yaw.current - Math.PI / 2);
    let mx = fx * f + rx * r, mz = fz * f + rz * r;
    const L = Math.hypot(mx, mz);
    if (L > 0.001) {
      mx /= L; mz /= L;
      const step = 9 * dt;
      let nx = g.position.x + mx * step;
      let nz = g.position.z + mz * step;
      if (col) [nx, nz] = col.resolve(g.position.x, g.position.z, mx * step, mz * step);
      const b = 230;
      g.position.x = Math.max(-b, Math.min(b, nx));
      g.position.z = Math.max(-b, Math.min(b, nz));
      g.rotation.y = Math.atan2(mx, mz);
    }

    // user-controlled follow camera, pulled in if it would clip a building
    const zoom = st.zoom;
    const hgt = zoom * 0.62;
    let camDist = zoom;
    if (col) {
      let guard = 0;
      while (camDist > 3.5 && guard++ < 16 &&
        col.blocked(g.position.x - fx * camDist, g.position.z - fz * camDist, 0.5)) {
        camDist -= 0.8;
      }
    }
    tmp.current.set(g.position.x - fx * camDist, hgt, g.position.z - fz * camDist);
    camera.position.lerp(tmp.current, 1 - Math.pow(0.0016, dt));
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
