// Moth, the thief: movement, sneaking, vents, shadow cover and footstep noise.

import { TILE, moveCircle, blocksThief, tileAtPx } from '../world/map.js';

export const THIEF_RADIUS = 9;
export const WALK_SPEED = 128;
export const SNEAK_SPEED = 66;
export const VENT_SPEED = 52;
const STEP_INTERVAL = 0.38;
export const STEP_NOISE_RADIUS = 92;

export function createThief(entry) {
  return {
    x: entry.cx,
    y: entry.cy,
    facing: 0,
    sneaking: false,
    moving: false,
    inVent: false,
    inShadow: false,
    stepTimer: 0,
    bob: 0,
    carrying: false,
    busy: null, // { kind, target, progress, need }
  };
}

/** Advance the thief one tick from the held keys. Returns a footstep noise or null. */
export function updateThief(thief, map, input, dt) {
  let mx = 0, my = 0;
  if (input.isDown('w') || input.isDown('ArrowUp')) my -= 1;
  if (input.isDown('s') || input.isDown('ArrowDown')) my += 1;
  if (input.isDown('a') || input.isDown('ArrowLeft')) mx -= 1;
  if (input.isDown('d') || input.isDown('ArrowRight')) mx += 1;
  thief.sneaking = input.isDown('Shift');
  const here = tileAtPx(map, thief.x, thief.y);
  thief.inVent = here === '=';
  thief.inShadow = here === ':';

  if (thief.busy) { mx = 0; my = 0; }
  thief.moving = mx !== 0 || my !== 0;
  if (!thief.moving) return null;

  const len = Math.hypot(mx, my);
  const speed = thief.inVent ? VENT_SPEED : thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
  thief.facing = Math.atan2(my, mx);
  moveCircle(map, thief, (mx / len) * speed * dt, (my / len) * speed * dt, THIEF_RADIUS, blocksThief);
  thief.bob += dt * (thief.sneaking ? 6 : 11);

  thief.stepTimer -= dt;
  if (thief.stepTimer <= 0) {
    thief.stepTimer = STEP_INTERVAL;
    if (!thief.sneaking && !thief.inVent) {
      return { x: thief.x, y: thief.y, radius: STEP_NOISE_RADIUS, strength: 0.18, kind: 'step' };
    }
  }
  return null;
}

export function thiefTile(thief) {
  return { tx: Math.floor(thief.x / TILE), ty: Math.floor(thief.y / TILE) };
}
