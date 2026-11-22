// Night falls over the map: a dark veil with holes burned out by lanterns, cone light,
// display-case glow, the vault and the getaway lamps. Shadow cover stays darkest of all.

import { conePolygon } from '../systems/vision.js';
import { guardCone } from '../actors/guard.js';
import { alarmTier } from '../systems/alarm.js';

let veil = null;

function hole(v, x, y, r, strength = 1) {
  const grad = v.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, `rgba(0,0,0,${strength})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  v.fillStyle = grad;
  v.beginPath(); v.arc(x, y, r, 0, Math.PI * 2); v.fill();
}

export function drawNightVeil(g, run, smokes, time, darkness = 0.5) {
  if (!veil) {
    veil = document.createElement('canvas');
    veil.width = 1280;
    veil.height = 576;
  }
  const v = veil.getContext('2d');
  v.globalCompositeOperation = 'source-over';
  v.clearRect(0, 0, 1280, 576);
  v.fillStyle = `rgba(3,9,14,${darkness})`;
  v.fillRect(0, 0, 1280, 576);
  v.globalCompositeOperation = 'destination-out';
  const tier = alarmTier(run.alarm);
  for (const guard of run.guards) {
    hole(v, guard.x, guard.y, 70, 0.9);
    const pts = conePolygon(run.map, smokes, guard, guardCone(guard, tier), 30);
    v.fillStyle = 'rgba(0,0,0,0.75)';
    v.beginPath();
    v.moveTo(pts[0].x, pts[0].y);
    for (const p of pts) v.lineTo(p.x, p.y);
    v.closePath();
    v.fill();
  }
  for (const c of run.map.cases) if (!c.opened) hole(v, c.cx, c.cy, 34, 0.7);
  for (const l of run.map.loot) if (!l.taken) hole(v, l.cx, l.cy, 30, 0.7);
  if (run.map.vault) hole(v, run.map.vault.cx, run.map.vault.cy, 80 + Math.sin(time * 2.5) * 6, 0.9);
  for (const e of run.map.exits) hole(v, e.cx, e.cy, 48, 0.8);
  for (const cam of run.cameras) hole(v, cam.x, cam.y, 30, 0.6);
  if (run.thief.x > 0) hole(v, run.thief.x, run.thief.y, 46, 0.55);
  // shadow cover gets darker instead
  v.globalCompositeOperation = 'source-over';
  g.drawImage(veil, 0, 0);
}
