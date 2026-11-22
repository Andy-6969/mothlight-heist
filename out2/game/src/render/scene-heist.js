// Composes one frame of a heist: world layers, cones, actors, then the HUD on top.

import { MAP_Y } from '../world/map.js';
import { buildStaticLayer, drawDynamicWorld, drawExitLabel } from './world.js';
import { drawCones } from './cones.js';
import { drawThief, drawGuard, drawCamera, drawSmoke, drawBells, drawNoises } from './actors.js';
import { drawTopBar, drawToolBelt, drawJobPrompt, drawToast } from '../ui/hud.js';
import { lasersOn } from '../systems/heist.js';
import { TOOLS } from '../systems/tools.js';
import { C } from './palette.js';
import { drawNightVeil } from './lighting.js';

const layers = new WeakMap();

export function staticLayerFor(run) {
  let entry = layers.get(run.map);
  const doorKey = run.map.doors.map((d) => (d.open ? 1 : 0)).join('');
  if (!entry || entry.doorKey !== doorKey) {
    entry = { canvas: buildStaticLayer(run.map), doorKey };
    layers.set(run.map, entry);
  }
  return entry.canvas;
}

export function drawHeistFrame(g, run, time, opts = {}) {
  const smokes = run.smokes.map((s) => ({ x: s.x, y: s.y, r: s.r * (0.4 + 0.6 * s.grow) }));
  run.lasersOn = lasersOn(run);
  g.save();
  if (opts.shake) g.translate(Math.sin(time * 70) * opts.shake, Math.cos(time * 53) * opts.shake);
  g.translate(0, MAP_Y);
  g.drawImage(staticLayerFor(run), 0, 0);
  drawDynamicWorld(g, run, time);
  drawNightVeil(g, run, smokes, time);
  drawCones(g, run, smokes, time);
  drawNoises(g, run.noises);
  drawBells(g, run.bells, time);
  for (const cam of run.cameras) drawCamera(g, cam, time);
  for (const guard of run.guards) drawGuard(g, guard, time);
  drawThief(g, run.thief, time);
  drawSmoke(g, run.smokes, time);
  drawExitLabel(g, run);
  if (opts.aim) drawAim(g, run, opts.aim);
  drawJobPrompt(g, run);
  g.restore();
  if (run.alarm.flash > 0) {
    g.fillStyle = `rgba(255,61,90,${run.alarm.flash * 0.18})`;
    g.fillRect(0, MAP_Y, 1280, 576);
  }
  drawTopBar(g, run, time);
  drawToolBelt(g, run);
  drawToast(g, opts.toast);
}

/** The throw line and landing ring of the selected tool. */
function drawAim(g, run, mouse) {
  const tool = TOOLS.find((t) => t.id === run.selected);
  if (!tool || !tool.reach || !(run.kit[tool.id] > 0)) return;
  const t = run.thief;
  const mx = mouse.x, my = mouse.y - MAP_Y;
  const d = Math.hypot(mx - t.x, my - t.y);
  const k = d > tool.reach ? tool.reach / d : 1;
  const px = t.x + (mx - t.x) * k, py = t.y + (my - t.y) * k;
  g.strokeStyle = 'rgba(241,232,214,0.35)';
  g.setLineDash([4, 6]);
  g.lineWidth = 1.5;
  g.beginPath(); g.arc(t.x, t.y, tool.reach, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(t.x, t.y); g.lineTo(px, py); g.stroke();
  g.setLineDash([]);
  g.strokeStyle = tool.id === 'loop' ? C.camera : C.loot;
  g.beginPath(); g.arc(px, py, tool.id === 'smoke' ? 20 : 9, 0, Math.PI * 2); g.stroke();
}
