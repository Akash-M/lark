/** Non-reactive shared state for the local player's live transform.
 *  Written by <Player> every frame, read by <Landmarks>, <Compass>, and the
 *  networking throttle — kept out of React/zustand so it never triggers renders. */
export const localPos = { x: 0, z: 0, ry: 0 };

/** Random spawn point within a radius (metres) of a centre. */
export function spawn(radius: number, cx = 0, cz = 0) {
  const a = Math.random() * Math.PI * 2;
  const r = radius * (0.4 + Math.random() * 0.6);
  return { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r };
}
