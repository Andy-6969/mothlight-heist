// Wall-mounted cameras: they sweep a fixed arc and can be looped for a few seconds.

import { TILE } from '../world/map.js';

export const CAMERA_RANGE = 232;
export const CAMERA_HALF = 0.36;
export const LOOP_SECONDS = 12;

export function createCamera(def, index) {
  return {
    id: index,
    x: (def.x + 0.5) * TILE,
    y: (def.y + 0.5) * TILE,
    base: def.base,
    sweep: def.sweep,
    period: def.period,
    angle: def.base,
    looped: 0,
    lock: 0,
    seen: false,
  };
}

export function cameraCone(cam) {
  return { angle: cam.angle, half: CAMERA_HALF, range: CAMERA_RANGE };
}

export function updateCamera(cam, time, dt) {
  cam.looped = Math.max(0, cam.looped - dt);
  if (cam.looped > 0) return;
  cam.angle = cam.base + Math.sin((time / cam.period) * Math.PI * 2) * cam.sweep;
}

export function cameraActive(cam) {
  return cam.looped <= 0;
}
