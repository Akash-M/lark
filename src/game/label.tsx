'use client';
import * as THREE from 'three';
import { useMemo } from 'react';

export function labelTexture(text: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(15,25,35,0.6)';
  ctx.strokeText(text, 128, 34);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/** Billboard text label used above avatars and landmarks. */
export function Label({ text, y = 3, w = 3.6 }: { text: string; y?: number; w?: number }) {
  const tex = useMemo(() => labelTexture(text), [text]);
  return (
    <sprite position={[0, y, 0]} scale={[w, w * 0.25, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} />
    </sprite>
  );
}
