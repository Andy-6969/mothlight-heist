// The kit Moth buys before each job: every tool has a price and a limited count.

import { dist } from '../core/math.js';

export const TOOLS = [
  { id: 'smoke', key: '1', name: 'Smoke vial', cost: 90, max: 3, blurb: 'Throw a cloud that blocks every cone for 7 s.', reach: 190 },
  { id: 'lure', key: '2', name: 'Brass bell', cost: 30, max: 4, blurb: 'Ring it far away; wardens walk off to look.', reach: 240 },
  { id: 'loop', key: '3', name: 'Camera loop', cost: 110, max: 2, blurb: 'Freeze a camera you can reach for 12 s.', reach: 170 },
  { id: 'pick', key: '4', name: 'Lockpick', cost: 60, max: 3, blurb: 'Open one locked door, silently.', reach: 0 },
  { id: 'cutter', key: '5', name: 'Glass cutter', cost: 40, max: 4, blurb: 'Open one display case without a sound.', reach: 0 },
];

export const SMOKE_SECONDS = 7;
export const SMOKE_RADIUS = 58;

export function toolById(id) {
  return TOOLS.find((t) => t.id === id);
}

export function emptyKit() {
  return Object.fromEntries(TOOLS.map((t) => [t.id, 0]));
}

export function kitCost(kit) {
  return TOOLS.reduce((sum, t) => sum + t.cost * (kit[t.id] || 0), 0);
}

/** Clamp a throw target to the tool's reach from the thief. */
export function throwPoint(thief, tool, mx, my) {
  const d = dist(thief.x, thief.y, mx, my);
  if (d <= tool.reach) return { x: mx, y: my };
  const k = tool.reach / d;
  return { x: thief.x + (mx - thief.x) * k, y: thief.y + (my - thief.y) * k };
}
