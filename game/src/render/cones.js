// Lantern cones for wardens and violet scan cones for cameras, cut by walls and smoke.

import { conePolygon } from '../systems/vision.js';
import { guardCone } from '../actors/guard.js';
import { cameraCone, cameraActive } from '../actors/camera.js';
import { alarmTier } from '../systems/alarm.js';
import { C } from './palette.js';

function fillPolygon(g, pts) {
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return A.map((v, i) => Math.round(v + (B[i] - v) * t));
}

export function drawCones(g, run, smokes, time) {
  const tier = alarmTier(run.alarm);
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const cam of run.cameras) {
    if (!cameraActive(cam)) continue;
    const cone = cameraCone(cam);
    const pts = conePolygon(run.map, smokes, cam, cone, 24);
    const [r, gg, b] = mix(C.camera, C.cameraHot, cam.lock);
    const grad = g.createRadialGradient(cam.x, cam.y, 6, cam.x, cam.y, cone.range);
    grad.addColorStop(0, `rgba(${r},${gg},${b},${0.42 + cam.lock * 0.3})`);
    grad.addColorStop(1, `rgba(${r},${gg},${b},0.04)`);
    g.fillStyle = grad;
    fillPolygon(g, pts);
    g.fill();
  }
  for (const guard of run.guards) {
    const cone = guardCone(guard, tier);
    const pts = conePolygon(run.map, smokes, guard, cone, 40);
    const heat = guard.state === 'alert' ? 1 : Math.min(1, guard.suspicion * 1.2);
    const [r, gg, b] = mix(C.lantern, C.lanternHot, heat);
    const flicker = 0.03 * Math.sin(time * 17 + guard.id * 3);
    const grad = g.createRadialGradient(guard.x, guard.y, 4, guard.x, guard.y, cone.range);
    grad.addColorStop(0, `rgba(${r},${gg},${b},${0.5 + flicker + heat * 0.2})`);
    grad.addColorStop(0.7, `rgba(${r},${gg},${b},${0.18 + heat * 0.12})`);
    grad.addColorStop(1, `rgba(${r},${gg},${b},0.03)`);
    g.fillStyle = grad;
    fillPolygon(g, pts);
    g.fill();
  }
  g.restore();
  // crisp outlines read as the danger edge even when the screen is shrunk
  g.lineWidth = 1.5;
  for (const guard of run.guards) {
    const pts = conePolygon(run.map, smokes, guard, guardCone(guard, tier), 40);
    g.strokeStyle = guard.state === 'alert' ? 'rgba(255,74,61,0.95)' : 'rgba(255,182,72,0.7)';
    fillPolygon(g, pts);
    g.stroke();
  }
  for (const cam of run.cameras) {
    if (!cameraActive(cam)) continue;
    const pts = conePolygon(run.map, smokes, cam, cameraCone(cam), 24);
    g.strokeStyle = 'rgba(181,140,255,0.75)';
    g.setLineDash([5, 4]);
    fillPolygon(g, pts);
    g.stroke();
    g.setLineDash([]);
  }
}
