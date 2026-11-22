// Moth the thief, lantern wardens, wall cameras, smoke, bells and the noise rings they leave.

import { C, font } from './palette.js';
import { cameraActive } from '../actors/camera.js';

export function drawThief(g, t, time) {
  const bob = t.moving ? Math.sin(t.bob) * 1.5 : 0;
  g.save();
  g.translate(t.x, t.y + bob);
  g.scale(1.3, 1.3);
  if (t.inVent) g.globalAlpha = 0.45;
  // soft halo so the thief never gets lost on the dark floor
  g.fillStyle = 'rgba(143,211,255,0.18)';
  g.beginPath(); g.arc(0, 0, 17, 0, Math.PI * 2); g.fill();
  g.rotate(t.facing);
  // moth-wing cloak
  const spread = t.sneaking ? 0.6 : 1;
  g.fillStyle = C.wing;
  g.beginPath();
  g.moveTo(-2, 0);
  g.quadraticCurveTo(-12, -16 * spread, -15, -6 * spread);
  g.quadraticCurveTo(-10, 0, -15, 6 * spread);
  g.quadraticCurveTo(-12, 16 * spread, -2, 0);
  g.fill();
  g.fillStyle = '#3d6e8c';
  g.beginPath(); g.arc(-9, -6 * spread, 2, 0, Math.PI * 2); g.arc(-9, 6 * spread, 2, 0, Math.PI * 2); g.fill();
  // body and hooded head
  g.fillStyle = '#26323a';
  g.beginPath(); g.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.thief;
  g.beginPath(); g.arc(3, 0, 5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#26323a';
  g.beginPath(); g.arc(5, 0, 2.2, 0, Math.PI * 2); g.fill();
  g.restore();
  g.font = font(11, 'bold');
  g.textAlign = 'center';
  g.fillStyle = C.wing;
  g.fillText(t.sneaking ? 'Moth (sneaking)' : 'Moth', t.x, t.y + 27);
  if (t.carrying) {
    g.fillStyle = C.loot;
    g.beginPath(); g.arc(t.x - 9, t.y - 11, 4, 0, Math.PI * 2); g.fill();
  }
  void time;
}

export function drawGuard(g, guard, time) {
  g.save();
  g.translate(guard.x, guard.y);
  g.scale(1.2, 1.2);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.ellipse(2, 4, 12, 9, 0, 0, Math.PI * 2); g.fill();
  g.rotate(guard.angle);
  g.fillStyle = C.guardDark;
  g.beginPath(); g.ellipse(-1, 0, 10, 11, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.guard;
  g.beginPath(); g.ellipse(0, 0, 8, 9, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e9c9a0';
  g.beginPath(); g.arc(3, 0, 4.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2a1410';
  g.fillRect(0, -6, 3, 12); // cap brim
  // lantern held forward
  g.fillStyle = C.lantern;
  g.beginPath(); g.arc(11, 6, 3.5 + Math.sin(time * 14 + guard.id) * 0.4, 0, Math.PI * 2); g.fill();
  g.restore();
  drawSuspicion(g, guard, time);
}

function drawSuspicion(g, guard, time) {
  if (guard.state === 'patrol' && guard.suspicion < 0.05) return;
  const x = guard.x, y = guard.y - 24;
  g.font = font(11, 'bold');
  g.textAlign = 'center';
  g.fillStyle = guard.state === 'alert' ? C.lanternHot : C.lantern;
  const mood = { alert: 'alerted', investigate: 'investigating', search: 'searching', suspicious: 'suspicious', pause: 'uneasy', patrol: 'uneasy' }[guard.state];
  g.fillText(`${guard.name}: ${mood}`, x, guard.y + 30);
  if (guard.state === 'alert') {
    g.fillStyle = C.lanternHot;
    g.font = font(20, 'bold');
    g.textAlign = 'center';
    g.fillText('!', x, y + 4 + Math.sin(time * 20) * 1.5);
    return;
  }
  // a filling eye-ring: how close this warden is to raising the alarm
  g.lineWidth = 3;
  g.strokeStyle = 'rgba(0,0,0,0.6)';
  g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = guard.suspicion > 0.55 ? C.lanternHot : C.lantern;
  g.beginPath(); g.arc(x, y, 7, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2); g.stroke();
  g.fillStyle = C.text;
  g.font = font(11, 'bold');
  g.textAlign = 'center';
  g.fillText('?', x, y + 4);
}

export function drawCamera(g, cam, time) {
  g.save();
  g.translate(cam.x, cam.y);
  g.fillStyle = '#1b1f24';
  g.beginPath(); g.arc(0, 0, 9, 0, Math.PI * 2); g.fill();
  g.rotate(cam.angle);
  g.fillStyle = cameraActive(cam) ? '#d8d2e8' : '#6d6878';
  g.fillRect(-4, -5, 14, 10);
  g.fillStyle = cameraActive(cam) ? (cam.seen ? C.cameraHot : C.camera) : '#444';
  g.beginPath(); g.arc(10, 0, 3, 0, Math.PI * 2); g.fill();
  g.restore();
  // a blinking record light
  if (cameraActive(cam) && Math.sin(time * 5 + cam.id) > 0) {
    g.fillStyle = '#ff3b3b';
    g.beginPath(); g.arc(cam.x - 6, cam.y - 6, 2, 0, Math.PI * 2); g.fill();
  }
  if (!cameraActive(cam)) {
    g.fillStyle = C.camera;
    g.font = font(10, 'bold');
    g.textAlign = 'center';
    g.fillText(`looped ${Math.ceil(cam.looped)}s`, cam.x, cam.y - 13);
  }
}

export function drawSmoke(g, smokes, time) {
  for (const s of smokes) {
    const fade = Math.min(1, s.life / 1.2);
    const r = s.r * (0.4 + 0.6 * s.grow);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + time * 0.3;
      const ox = Math.cos(a) * r * 0.45, oy = Math.sin(a) * r * 0.45;
      g.fillStyle = `rgba(200,214,220,${0.32 * fade})`;
      g.beginPath(); g.arc(s.x + ox, s.y + oy, r * 0.62, 0, Math.PI * 2); g.fill();
    }
  }
}

export function drawBells(g, bells, time) {
  for (const b of bells) {
    const ring = (2.4 - b.life) * 120;
    g.strokeStyle = `rgba(255,213,74,${Math.max(0, b.life / 2.4) * 0.8})`;
    g.lineWidth = 2;
    g.beginPath(); g.arc(b.x, b.y, ring % 90, 0, Math.PI * 2); g.stroke();
    g.fillStyle = C.loot;
    g.beginPath(); g.arc(b.x, b.y + Math.sin(time * 30) * 1.2, 5, 0, Math.PI * 2); g.fill();
  }
}

export function drawNoises(g, noises) {
  for (const n of noises) {
    if (n.kind === 'lure') continue;
    const k = 1 - n.life / 0.6;
    g.strokeStyle = n.kind === 'step' ? `rgba(241,232,214,${0.35 * (1 - k)})` : `rgba(255,74,61,${0.7 * (1 - k)})`;
    g.lineWidth = n.kind === 'step' ? 1 : 3;
    g.beginPath(); g.arc(n.x, n.y, n.radius * (0.3 + 0.7 * k), 0, Math.PI * 2); g.stroke();
  }
}
