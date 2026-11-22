// The blueprint minimap in the corner: the whole building, every warden and camera with its
// cone, the target, the getaway, Moth, and the frame of what the close view shows.

import { MAP_Y } from '../world/map.js';
import { staticLayerFor } from './scene-heist.js';
import { guardCone } from '../actors/guard.js';
import { cameraActive, cameraCone } from '../actors/camera.js';
import { alarmTier } from '../systems/alarm.js';
import { C, font } from './palette.js';

const SCALE = 0.2;
const W = 1280 * SCALE, H = 576 * SCALE;

export function drawMinimap(g, run, view, time) {
  // sits bottom-left, and hops to the top-right whenever Moth walks underneath it
  const tx = (run.thief.x - view.ox) * view.zoom, ty = (run.thief.y - view.oy) * view.zoom + MAP_Y;
  const under = tx < W + 60 && ty > 640 - H - 80;
  const x0 = under ? 1280 - W - 12 : 12, y0 = under ? MAP_Y + 12 : 640 - H - 32;
  g.save();
  g.fillStyle = 'rgba(8,21,27,0.9)';
  g.fillRect(x0 - 6, y0 - 6, W + 12, H + 26);
  g.strokeStyle = C.wallTop;
  g.lineWidth = 1.5;
  g.strokeRect(x0 - 5.5, y0 - 5.5, W + 11, H + 25);
  g.globalAlpha = 0.85;
  g.drawImage(staticLayerFor(run), x0, y0, W, H);
  g.globalAlpha = 1;
  g.translate(x0, y0);
  g.scale(SCALE, SCALE);
  const tier = alarmTier(run.alarm);
  const wedge = (w, cone, color) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(w.x, w.y);
    g.arc(w.x, w.y, cone.range * 0.8, cone.angle - cone.half, cone.angle + cone.half);
    g.closePath();
    g.fill();
  };
  for (const cam of run.cameras) {
    if (cameraActive(cam)) wedge(cam, cameraCone(cam), 'rgba(181,140,255,0.45)');
    g.fillStyle = C.camera;
    g.fillRect(cam.x - 14, cam.y - 14, 28, 28);
  }
  for (const guard of run.guards) {
    wedge(guard, guardCone(guard, tier), guard.state === 'alert' ? 'rgba(255,74,61,0.6)' : 'rgba(255,182,72,0.5)');
    g.fillStyle = guard.state === 'alert' ? C.lanternHot : C.guard;
    g.beginPath(); g.arc(guard.x, guard.y, 22, 0, Math.PI * 2); g.fill();
  }
  const v = run.map.vault;
  if (v && !v.cracked) {
    g.fillStyle = C.loot;
    g.beginPath(); g.arc(v.cx, v.cy, 26 + Math.sin(time * 4) * 6, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = C.exit;
  for (const e of run.map.exits) g.fillRect(e.x * 32, e.y * 32, 32, 32);
  g.fillStyle = C.wing;
  g.beginPath(); g.arc(run.thief.x, run.thief.y, 26, 0, Math.PI * 2); g.fill();
  g.strokeStyle = C.text;
  g.lineWidth = 8;
  g.strokeRect(view.ox, view.oy, view.vw, view.vh);
  g.restore();
  g.font = font(11, 'bold');
  g.textAlign = 'left';
  g.fillStyle = C.textDim;
  g.fillText('Blueprint', x0, y0 + H + 14);
  g.textAlign = 'right';
  g.fillStyle = C.lantern;
  g.fillText(`${run.guards.length} wardens  ${run.cameras.length} cameras`, x0 + W, y0 + H + 14);
}
