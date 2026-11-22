// Chalk route lines on the map, each with a tag naming its way in and its price.

import { routePoints } from '../systems/routes.js';
import { font } from './palette.js';

const NUDGE = { A: -6, B: 0, C: 6, G: 3 };

export function drawRoutes(g, routes, time, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  for (const r of routes) {
    const pts = simplify(routePoints(r, NUDGE[r.id] ?? 0));
    g.strokeStyle = r.color;
    g.lineWidth = r.id === 'G' ? 2.5 : 3;
    g.setLineDash(r.id === 'G' ? [3, 7] : [10, 7]);
    g.lineDashOffset = -time * 18;
    g.lineCap = 'round';
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.stroke();
    g.setLineDash([]);
  }
  for (const r of routes) {
    const pts = routePoints(r, NUDGE[r.id] ?? 0);
    const at = pts[Math.floor(pts.length * (r.id === 'G' ? 0.5 : 0.72))];
    tag(g, at.x, at.y - 14, `${r.id === 'G' ? '' : r.id + '  '}${r.label}`, r.color);
  }
  g.restore();
}

function tag(g, x, y, text, color) {
  g.font = font(12, 'bold');
  g.textAlign = 'center';
  const w = g.measureText(text).width + 14;
  x = Math.max(w / 2 + 4, Math.min(1276 - w / 2, x));
  g.fillStyle = 'rgba(8,21,27,0.86)';
  g.fillRect(x - w / 2, y - 11, w, 18);
  g.strokeStyle = color;
  g.lineWidth = 1.5;
  g.strokeRect(x - w / 2 + 0.5, y - 10.5, w - 1, 17);
  g.fillStyle = color;
  g.fillText(text, x, y + 3);
}

/** Keep only the corners of a tile path, so the dashes run smoothly along straight stretches. */
function simplify(pts) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    if ((b.x - a.x) * (c.y - b.y) !== (b.y - a.y) * (c.x - b.x)) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
