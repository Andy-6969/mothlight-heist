// Lantern wardens: patrol a route, pause and look around, grow suspicious, investigate, chase.

import { TILE, findPath, moveCircle, blocksGuard } from '../world/map.js';
import { turnToward, angleDiff, dist } from '../core/math.js';

export const GUARD_RADIUS = 10;
export const CONE_RANGE = 196;
export const CONE_HALF = 0.56;
export const CATCH_DISTANCE = 24;

export function createGuard(def, index) {
  const start = def.route[0];
  return {
    id: index,
    name: def.name,
    x: (start[0] + 0.5) * TILE,
    y: (start[1] + 0.5) * TILE,
    angle: 0,
    speed: def.speed,
    pauseFor: def.pause,
    route: def.route.map(([x, y]) => ({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE })),
    routeIndex: 1,
    path: [],
    state: 'patrol', // patrol | pause | suspicious | investigate | alert | search
    suspicion: 0,
    timer: 0,
    lookBase: 0,
    target: null,
    seen: false,
    seenFor: 0,
    knocked: 0,
  };
}

export function guardCone(guard, tier) {
  const alertBoost = guard.state === 'alert' ? 1.15 : 1;
  return { angle: guard.angle, half: CONE_HALF * (guard.state === 'alert' ? 1.2 : 1), range: CONE_RANGE * tier.cone * alertBoost };
}

function walkPath(guard, map, dt, speed) {
  if (!guard.path.length) return true;
  const next = guard.path[0];
  const d = dist(guard.x, guard.y, next.x, next.y);
  const want = Math.atan2(next.y - guard.y, next.x - guard.x);
  guard.angle = turnToward(guard.angle, want, dt * 5);
  const step = Math.min(d, speed * dt);
  if (d > 0.01) moveCircle(map, guard, ((next.x - guard.x) / d) * step, ((next.y - guard.y) / d) * step, GUARD_RADIUS, blocksGuard);
  if (d < 4) guard.path.shift();
  return guard.path.length === 0;
}

function headTo(guard, map, x, y) {
  guard.path = findPath(map, guard.x, guard.y, x, y);
  guard.target = { x, y };
}

/** Hear a noise: a calm guard turns and goes to look. */
export function hearNoise(guard, map, noise) {
  if (guard.state === 'alert') return;
  const d = dist(guard.x, guard.y, noise.x, noise.y);
  if (d > noise.radius) return;
  guard.suspicion = Math.min(0.95, guard.suspicion + noise.strength * (1 - d / noise.radius) + (noise.kind === 'lure' ? 0.4 : 0));
  if (noise.kind === 'lure' || noise.kind === 'smash' || guard.suspicion > 0.5) {
    guard.state = 'investigate';
    guard.timer = 0;
    headTo(guard, map, noise.x, noise.y);
  } else {
    guard.lookBase = Math.atan2(noise.y - guard.y, noise.x - guard.x);
  }
}

/** One tick of a guard's mind and feet. `sight` is the distance it sees the thief at, or -1. */
export function updateGuard(guard, map, thief, sight, rate, tier, dt) {
  const speed = guard.speed * tier.speed;
  guard.seen = sight >= 0;
  if (guard.seen) {
    guard.seenFor += dt;
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
  } else {
    guard.seenFor = Math.max(0, guard.seenFor - dt);
    if (guard.state !== 'alert') guard.suspicion = Math.max(0, guard.suspicion - dt * 0.2);
  }

  let becameAlert = false;
  if (guard.suspicion >= 1 && guard.state !== 'alert') {
    guard.state = 'alert';
    becameAlert = true;
  }

  switch (guard.state) {
    case 'patrol': {
      if (guard.seen && guard.suspicion > 0.2) { guard.state = 'suspicious'; guard.timer = 0; break; }
      if (!guard.path.length) {
        const wp = guard.route[guard.routeIndex];
        if (dist(guard.x, guard.y, wp.x, wp.y) < 6) {
          guard.state = 'pause';
          guard.timer = guard.pauseFor;
          guard.lookBase = guard.angle;
          guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
        } else headTo(guard, map, wp.x, wp.y);
      }
      walkPath(guard, map, dt, speed);
      break;
    }
    case 'pause': {
      guard.timer -= dt;
      const sweep = Math.sin((guard.pauseFor - guard.timer) * 2.4) * 0.9;
      guard.angle = turnToward(guard.angle, guard.lookBase + sweep, dt * 2.5);
      if (guard.seen && guard.suspicion > 0.2) { guard.state = 'suspicious'; guard.timer = 0; }
      else if (guard.timer <= 0) guard.state = 'patrol';
      break;
    }
    case 'suspicious': {
      guard.timer += dt;
      if (guard.seen) guard.angle = turnToward(guard.angle, Math.atan2(thief.y - guard.y, thief.x - guard.x), dt * 3);
      if (guard.suspicion > 0.55) {
        guard.state = 'investigate';
        headTo(guard, map, thief.x, thief.y);
      } else if (!guard.seen && guard.timer > 2.2) {
        guard.state = 'patrol';
        guard.path = [];
      }
      break;
    }
    case 'investigate': {
      if (guard.seen) {
        guard.target = { x: thief.x, y: thief.y };
        if (!guard.path.length || guard.timer > 0.6) { headTo(guard, map, thief.x, thief.y); guard.timer = 0; }
      }
      guard.timer += dt;
      const arrived = walkPath(guard, map, dt, speed * 0.9);
      if (arrived) {
        guard.state = 'search';
        guard.timer = 3.2;
        guard.lookBase = guard.angle;
      }
      break;
    }
    case 'search': {
      guard.timer -= dt;
      guard.angle = turnToward(guard.angle, guard.lookBase + Math.sin(guard.timer * 2.2) * 1.6, dt * 3);
      if (guard.seen && guard.suspicion > 0.5) { guard.state = 'investigate'; headTo(guard, map, thief.x, thief.y); }
      else if (guard.timer <= 0) { guard.state = 'patrol'; guard.path = []; guard.suspicion = Math.min(guard.suspicion, 0.3); }
      break;
    }
    case 'alert': {
      if (guard.seen) {
        guard.timer = 0;
        if (!guard.path.length || dist(guard.target?.x ?? 0, guard.target?.y ?? 0, thief.x, thief.y) > 20) headTo(guard, map, thief.x, thief.y);
        const want = Math.atan2(thief.y - guard.y, thief.x - guard.x);
        if (Math.abs(angleDiff(guard.angle, want)) < 1.2) guard.angle = turnToward(guard.angle, want, dt * 6);
      } else {
        guard.timer += dt;
        if (guard.timer > 5) {
          guard.state = 'search';
          guard.timer = 4;
          guard.suspicion = 0.6;
          guard.lookBase = guard.angle;
        }
      }
      walkPath(guard, map, dt, speed * 1.55);
      break;
    }
  }
  const caught = guard.state === 'alert' && guard.seen && dist(guard.x, guard.y, thief.x, thief.y) < CATCH_DISTANCE + 6;
  return { becameAlert, caught };
}
