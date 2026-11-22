// Sight: who can see the thief, and the visible shape of every cone (clipped by walls and smoke).

import { castRay, hasLineOfSight } from '../world/map.js';
import { angleDiff, dist } from '../core/math.js';

export const SHADOW_SIGHT = 0.42; // a cone reaches this share of its range into shadow cover

/** Distance along a ray at which the first smoke cloud starts, or Infinity. */
export function smokeHit(smokes, ox, oy, angle, maxDist) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let best = Infinity;
  for (const s of smokes) {
    const fx = ox - s.x, fy = oy - s.y;
    const b = fx * dx + fy * dy;
    const c = fx * fx + fy * fy - s.r * s.r;
    if (c < 0) return 0; // the watcher stands inside the smoke
    const disc = b * b - c;
    if (disc < 0) continue;
    const t = -b - Math.sqrt(disc);
    if (t > 0 && t < best && t < maxDist) best = t;
  }
  return best;
}

/** Can a watcher with this cone see the point? Returns the distance, or -1. */
export function coneSees(map, smokes, watcher, cone, px, py, rangeScale = 1) {
  const d = dist(watcher.x, watcher.y, px, py);
  if (d > cone.range * rangeScale) return -1;
  const a = Math.atan2(py - watcher.y, px - watcher.x);
  if (Math.abs(angleDiff(cone.angle, a)) > cone.half && d > 14) return -1;
  if (!hasLineOfSight(map, watcher.x, watcher.y, px, py)) return -1;
  if (smokeHit(smokes, watcher.x, watcher.y, a, d) < d) return -1;
  return d;
}

/** Polygon points of a cone as drawn: rays fanned across it, cut short by walls and smoke. */
export function conePolygon(map, smokes, watcher, cone, rays = 36) {
  const angles = [], dists = [];
  for (let i = 0; i <= rays; i++) {
    const a = cone.angle - cone.half + (2 * cone.half * i) / rays;
    const d = castRay(map, watcher.x, watcher.y, a, cone.range);
    angles.push(a);
    dists.push(Math.min(d, smokeHit(smokes, watcher.x, watcher.y, a, d)));
  }
  // a lone ray far longer than both neighbours slipped through a seam: trim it
  for (let i = 1; i < rays; i++) {
    const near = Math.max(dists[i - 1], dists[i + 1]);
    if (dists[i] > near + 48) dists[i] = near;
  }
  const pts = [{ x: watcher.x, y: watcher.y }];
  for (let i = 0; i <= rays; i++) pts.push({ x: watcher.x + Math.cos(angles[i]) * dists[i], y: watcher.y + Math.sin(angles[i]) * dists[i] });
  return pts;
}

/** How fast a sighting fills suspicion: closer, lit and upright is worse. */
export function exposureRate(d, range, thief) {
  const closeness = 1.25 - d / range;
  let rate = 0.3 + closeness * 1.0;
  if (thief.sneaking) rate *= 0.62;
  if (thief.moving) rate *= 1.15;
  return Math.max(0.25, rate);
}
