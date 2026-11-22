// The planning board: the blueprint with every warden route, camera arc and entry point drawn
// on it, and the kit shop along the bottom.

import { MAP_Y, TILE } from '../world/map.js';
import { staticLayerFor } from './scene-heist.js';
import { drawDynamicWorld } from './world.js';
import { drawCamera, drawGuard } from './actors.js';
import { drawToolIcon } from '../ui/hud.js';
import { TOOLS, kitCost } from '../systems/tools.js';
import { C, font, FONT_DISPLAY } from './palette.js';
import { CAMERA_RANGE, CAMERA_HALF } from '../actors/camera.js';
import { planRoutes } from '../systems/routes.js';
import { drawRoutes } from './routes-overlay.js';

export const SHOP_CARD = { x0: 14, w: 150, step: 158, y: 650, h: 60 };

export function drawPlanBoard(g, plan, time) {
  const { run, level } = plan;
  g.save();
  g.translate(0, MAP_Y);
  g.drawImage(staticLayerFor(run), 0, 0);
  drawDynamicWorld(g, run, time);
  g.fillStyle = 'rgba(10,30,40,0.35)';
  g.fillRect(0, 0, 1280, 576);

  // warden routes, with a dot that walks the loop so you can read the timing
  run.guards.forEach((guard, i) => {
    const r = guard.route;
    g.strokeStyle = 'rgba(255,182,72,0.85)';
    g.lineWidth = 2;
    g.setLineDash([7, 5]);
    g.beginPath();
    r.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.closePath();
    g.stroke();
    g.setLineDash([]);
    for (const p of r) {
      g.fillStyle = C.lantern;
      g.beginPath(); g.arc(p.x, p.y, 4, 0, Math.PI * 2); g.fill();
    }
    const lap = (time * 0.12 + i * 0.37) % 1;
    const pos = pointOnLoop(r, lap);
    g.fillStyle = '#fff1c9';
    g.beginPath(); g.arc(pos.x, pos.y, 3, 0, Math.PI * 2); g.fill();
    drawGuard(g, { ...guard, angle: Math.atan2(r[1 % r.length].y - r[0].y, r[1 % r.length].x - r[0].x), state: 'patrol', suspicion: 0 }, time);
    g.font = font(12, 'bold');
    g.textAlign = 'left';
    g.fillStyle = C.lantern;
    g.fillText(guard.name, r[0].x + 12, r[0].y - 12);
  });

  // camera arcs: the whole sweep, faint
  for (const cam of run.cameras) {
    g.fillStyle = 'rgba(181,140,255,0.13)';
    g.beginPath();
    g.moveTo(cam.x, cam.y);
    g.arc(cam.x, cam.y, CAMERA_RANGE, cam.base - cam.sweep - CAMERA_HALF, cam.base + cam.sweep + CAMERA_HALF);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(181,140,255,0.6)';
    g.setLineDash([3, 4]);
    g.stroke();
    g.setLineDash([]);
    drawCamera(g, cam, time);
  }

  // the ways in, for the chosen entry
  const entry = run.map.entries[plan.entry];
  if (!plan.routes || plan.routesFor !== plan.entry) { plan.routes = planRoutes(run.map, entry); plan.routesFor = plan.entry; }
  drawRoutes(g, plan.routes, time, 0.95);

  // entry points
  run.map.entries.forEach((e, i) => {
    const sel = i === plan.entry;
    g.strokeStyle = sel ? C.exit : 'rgba(111,227,255,0.5)';
    g.lineWidth = sel ? 3 : 1.5;
    g.beginPath(); g.arc(e.cx, e.cy, 13 + (sel ? Math.sin(time * 5) * 2 : 0), 0, Math.PI * 2); g.stroke();
    g.fillStyle = sel ? C.exit : C.textDim;
    g.font = font(12, 'bold');
    g.textAlign = 'left';
    g.fillText(sel ? `Entry ${i + 1} (chosen)` : `Entry ${i + 1}`, e.cx + 18, e.cy + 4);
  });
  g.restore();

  // top band
  g.fillStyle = C.hud;
  g.fillRect(0, 0, 1280, MAP_Y);
  g.fillStyle = C.hudLine;
  g.fillRect(0, MAP_Y - 2, 1280, 2);
  g.textAlign = 'left';
  g.font = font(13, 'bold');
  g.fillStyle = C.textDim;
  g.fillText(`Planning job ${plan.index + 1} of 3, ${level.district}`, 18, 22);
  g.font = font(24, 'bold', FONT_DISPLAY);
  g.fillStyle = C.text;
  g.fillText(`${level.name}: steal ${level.target}`, 18, 50);
  const spent = kitCost(plan.kit);
  g.textAlign = 'right';
  g.font = font(13);
  g.fillStyle = C.textDim;
  g.fillText('Kit budget', 1262, 22);
  g.font = font(24, 'bold');
  g.fillStyle = C.loot;
  g.fillText(`$${plan.budget - spent} of $${plan.budget}`, 1262, 50);

  // shop
  g.fillStyle = C.hud;
  g.fillRect(0, 640, 1280, 80);
  g.fillStyle = C.hudLine;
  g.fillRect(0, 640, 1280, 2);
  TOOLS.forEach((t, i) => {
    const x = SHOP_CARD.x0 + i * SHOP_CARD.step, y = SHOP_CARD.y;
    const n = plan.kit[t.id];
    g.fillStyle = n ? '#1d3e48' : '#10252c';
    g.fillRect(x, y, SHOP_CARD.w, SHOP_CARD.h);
    g.strokeStyle = n ? C.loot : C.hudLine;
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, SHOP_CARD.w, SHOP_CARD.h);
    drawToolIcon(g, t.id, x + 22, y + 30, true);
    g.textAlign = 'left';
    g.font = font(13, 'bold');
    g.fillStyle = C.text;
    g.fillText(`${t.name} $${t.cost}`, x + 42, y + 20);
    g.font = font(12);
    g.fillStyle = C.textDim;
    g.fillText(`have ${n}/${t.max}   key ${t.key}`, x + 42, y + 38);
    g.fillStyle = C.loot;
    g.fillText('click buys, right sells', x + 42, y + 54);
  });
  const hover = TOOLS[plan.hover ?? -1];
  g.textAlign = 'left';
  g.font = font(14, 'bold');
  g.fillStyle = C.text;
  g.fillText(hover ? hover.name : 'Wardens slow down in Calm, speed up as the alarm climbs.', 812, 668);
  g.font = font(13);
  g.fillStyle = C.textDim;
  g.fillText(hover ? hover.blurb : 'Shadow cover and vents are free; every tool costs.', 812, 690);
  g.fillText('Enter: start the job    Tab: next entry    1-5: buy', 812, 710);
}

function pointOnLoop(pts, t) {
  const segs = pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
  const lens = segs.map(([a, b]) => Math.hypot(b.x - a.x, b.y - a.y));
  let d = lens.reduce((s, l) => s + l, 0) * t;
  for (let i = 0; i < segs.length; i++) {
    if (d <= lens[i]) {
      const [a, b] = segs[i];
      const k = d / lens[i];
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    d -= lens[i];
  }
  return pts[0];
}

export function tileToView(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE + MAP_Y };
}
