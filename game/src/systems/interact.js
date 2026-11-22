// Hold-to-act jobs next to the thief: pick a lock, cut or smash a case, crack the vault.

import { dist } from '../core/math.js';

export const PICK_SECONDS = 1.6;
export const CUT_SECONDS = 1.2;
export const CRACK_SECONDS = 3.4;
const REACH = 46;

/** The nearest thing the thief can work on, with what it would cost or risk. */
export function nearestJob(run) {
  const { thief, map, kit } = run;
  let best = null;
  const consider = (target, kind, label) => {
    const d = dist(thief.x, thief.y, target.cx, target.cy);
    if (d < REACH && (!best || d < best.d)) best = { target, kind, label, d };
  };
  for (const door of map.doors) {
    if (!door.open) consider(door, 'pick', kit.pick > 0 ? 'Hold E: pick the lock' : 'Locked: no lockpick left');
  }
  for (const c of map.cases) {
    if (!c.opened) consider(c, 'case', kit.cutter > 0 ? 'Hold E: cut the glass (silent)' : 'Hold E: smash the case (loud)');
  }
  if (map.vault && !map.vault.cracked) consider(map.vault, 'vault', `Hold E: crack the vault for ${run.level.target}`);
  return best;
}

export function jobSeconds(job, run) {
  if (job.kind === 'pick') return run.kit.pick > 0 ? PICK_SECONDS : Infinity;
  if (job.kind === 'case') return run.kit.cutter > 0 ? CUT_SECONDS : 0.35;
  return CRACK_SECONDS;
}
