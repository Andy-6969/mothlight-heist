// Small vector and angle helpers shared by the simulation and the renderer.

export const TAU = Math.PI * 2;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Wrap an angle into (-PI, PI]. */
export function wrapAngle(a) {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
}

/** Signed shortest difference from angle a to angle b. */
export function angleDiff(a, b) {
  return wrapAngle(b - a);
}

/** Turn angle `from` toward `to` by at most `step` radians. */
export function turnToward(from, to, step) {
  const d = angleDiff(from, to);
  if (Math.abs(d) <= step) return to;
  return wrapAngle(from + Math.sign(d) * step);
}

export function approach(v, target, step) {
  if (v < target) return Math.min(target, v + step);
  return Math.max(target, v - step);
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
