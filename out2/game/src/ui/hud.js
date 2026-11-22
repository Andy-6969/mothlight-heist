// The heist HUD: objective, alarm meter, loot and clock on top; the tool belt and legend below.

import { C, font, FONT_DISPLAY } from '../render/palette.js';
import { ALARM_TIERS, alarmTier } from '../systems/alarm.js';
import { TOOLS } from '../systems/tools.js';
import { formatTime } from '../core/math.js';

export const HUD_TOP = 64;
export const HUD_BOTTOM_Y = 640;

export function drawTopBar(g, run, time) {
  g.fillStyle = C.hud;
  g.fillRect(0, 0, 1280, HUD_TOP);
  g.fillStyle = C.hudLine;
  g.fillRect(0, HUD_TOP - 2, 1280, 2);

  g.textAlign = 'left';
  g.fillStyle = C.text;
  g.font = font(22, 'bold', FONT_DISPLAY);
  g.fillText(run.level.name, 18, 27);
  g.font = font(14);
  g.fillStyle = run.getaway ? C.exit : C.textDim;
  g.fillText(run.getaway ? `Got ${run.level.target}. Run for the getaway boat!` : `Objective: crack the vault for ${run.level.target}, then escape by boat`, 18, 50);

  drawAlarmMeter(g, run.alarm, 640, 12, time);

  g.textAlign = 'right';
  g.font = font(13);
  g.fillStyle = C.textDim;
  g.fillText('Loot', 1150, 24);
  g.fillText(run.getaway ? 'Getaway' : 'Time', 1262, 24);
  g.font = font(24, 'bold');
  g.fillStyle = C.loot;
  g.fillText(`$${run.lootValue}`, 1150, 51);
  if (run.getaway) {
    const left = run.getaway.left;
    g.fillStyle = left < 15 && Math.sin(time * 12) > 0 ? C.lanternHot : C.exit;
    g.fillText(formatTime(left), 1262, 51);
  } else {
    g.fillStyle = C.text;
    g.fillText(formatTime(run.time), 1262, 51);
  }
}

export function drawAlarmMeter(g, alarm, x, y, time) {
  const w = 380, h = 18;
  const tier = alarmTier(alarm);
  g.textAlign = 'left';
  g.font = font(13, 'bold');
  g.fillStyle = C.textDim;
  g.fillText('Alarm', x, y + 12);
  g.textAlign = 'right';
  g.fillStyle = tier.color;
  g.fillText(`${tier.name} ${Math.round(alarm.value)}%`, x + w, y + 12);
  const by = y + 20;
  g.fillStyle = '#05100f';
  g.fillRect(x, by, w, h);
  const shake = alarm.flash > 0 ? Math.sin(time * 60) * alarm.flash * 2 : 0;
  // segmented fill so the meter reads as a meter even when tiny
  const segs = 30;
  for (let i = 0; i < segs; i++) {
    const v = ((i + 1) / segs) * 100;
    if (v > alarm.value + 100 / segs) break;
    const t = ALARM_TIERS.slice().reverse().find((tt) => v > tt.from) ?? ALARM_TIERS[0];
    g.fillStyle = t.color;
    g.fillRect(x + 2 + (i * (w - 4)) / segs + shake, by + 2, (w - 4) / segs - 2, h - 4);
  }
  for (const t of ALARM_TIERS.slice(1, 3)) {
    g.fillStyle = C.text;
    g.fillRect(x + (t.from / 100) * w, by - 3, 2, h + 6);
  }
  g.strokeStyle = tier.color;
  g.lineWidth = 2;
  g.strokeRect(x, by, w, h);
  if (alarm.floor > 0) {
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(x + (alarm.floor / 100) * w - 1, by + h, 2, 4);
  }
}

export function drawToolBelt(g, run) {
  g.fillStyle = C.hud;
  g.fillRect(0, HUD_BOTTOM_Y, 1280, 80);
  g.fillStyle = C.hudLine;
  g.fillRect(0, HUD_BOTTOM_Y, 1280, 2);
  let x = 14;
  for (const t of TOOLS) {
    const count = run.kit[t.id] || 0;
    const sel = run.selected === t.id && (t.id === 'smoke' || t.id === 'lure' || t.id === 'loop');
    g.fillStyle = sel ? '#1d3e48' : '#10252c';
    g.fillRect(x, HUD_BOTTOM_Y + 10, 150, 60);
    g.strokeStyle = sel ? C.loot : count ? C.hudLine : '#1b2e33';
    g.lineWidth = sel ? 2 : 1;
    g.strokeRect(x + 0.5, HUD_BOTTOM_Y + 10.5, 150, 60);
    drawToolIcon(g, t.id, x + 26, HUD_BOTTOM_Y + 40, count > 0);
    g.textAlign = 'left';
    g.font = font(14, 'bold');
    g.fillStyle = count ? C.text : '#5d7076';
    g.fillText(t.name, x + 50, HUD_BOTTOM_Y + 33);
    g.font = font(12);
    g.fillStyle = C.textDim;
    g.fillText(`key ${t.key}   left ${count}`, x + 50, HUD_BOTTOM_Y + 53);
    x += 158;
  }
  drawLegend(g, 812, HUD_BOTTOM_Y + 14);
}

export function drawToolIcon(g, id, x, y, active) {
  g.save();
  g.translate(x, y);
  g.globalAlpha = active ? 1 : 0.35;
  if (id === 'smoke') {
    g.fillStyle = C.smoke;
    for (const [ox, oy, r] of [[-5, 2, 7], [5, 1, 8], [0, -5, 7]]) { g.beginPath(); g.arc(ox, oy, r, 0, Math.PI * 2); g.fill(); }
  } else if (id === 'lure') {
    g.fillStyle = C.loot;
    g.beginPath(); g.moveTo(-8, 6); g.quadraticCurveTo(-8, -10, 0, -10); g.quadraticCurveTo(8, -10, 8, 6); g.closePath(); g.fill();
    g.beginPath(); g.arc(0, 8, 3, 0, Math.PI * 2); g.fill();
  } else if (id === 'loop') {
    g.strokeStyle = C.camera; g.lineWidth = 3;
    g.beginPath(); g.arc(0, 0, 9, 0.4, Math.PI * 1.8); g.stroke();
    g.fillStyle = C.camera; g.beginPath(); g.moveTo(9, -6); g.lineTo(12, 2); g.lineTo(4, 0); g.fill();
  } else if (id === 'pick') {
    g.strokeStyle = '#d8d2c4'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-9, 9); g.lineTo(6, -6); g.lineTo(10, -4); g.stroke();
    g.beginPath(); g.moveTo(-9, 3); g.lineTo(4, -9); g.stroke();
  } else if (id === 'cutter') {
    g.fillStyle = '#bfe8ff';
    g.beginPath(); g.moveTo(0, -11); g.lineTo(9, 0); g.lineTo(0, 11); g.lineTo(-9, 0); g.fill();
    g.strokeStyle = '#26323a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.stroke();
  }
  g.restore();
}

function drawLegend(g, x, y) {
  const items = [
    ['shadow', 'Shadow cover: hard to see you'],
    ['lantern', 'Warden lantern cone'],
    ['camera', 'Camera scan'],
    ['laser', 'Laser grid (pulses)'],
    ['loot', 'Loot and the vault target'],
    ['vent', 'Vent: crawl unseen'],
  ];
  g.font = font(12);
  g.textAlign = 'left';
  items.forEach(([kind, label], i) => {
    const cx = x + (i % 2) * 232, cy = y + Math.floor(i / 2) * 19;
    swatch(g, kind, cx, cy);
    g.fillStyle = C.textDim;
    g.fillText(label, cx + 20, cy + 11);
  });
}

function swatch(g, kind, x, y) {
  const s = 14;
  if (kind === 'shadow') {
    g.fillStyle = C.shadow; g.fillRect(x, y, s, s);
    g.strokeStyle = C.shadowHatch; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x + 4, y); g.lineTo(x, y + 4); g.moveTo(x + 10, y); g.lineTo(x, y + 10); g.moveTo(x + s, y + 2); g.lineTo(x + 2, y + s); g.stroke();
    g.strokeStyle = C.shadowEdge; g.strokeRect(x, y, s, s);
  } else if (kind === 'lantern' || kind === 'camera') {
    g.fillStyle = kind === 'lantern' ? C.lantern : C.camera;
    g.beginPath(); g.moveTo(x, y + s / 2); g.lineTo(x + s, y); g.lineTo(x + s, y + s); g.fill();
  } else if (kind === 'laser') {
    g.strokeStyle = C.laser; g.lineWidth = 2;
    g.beginPath(); for (let k = 2; k < s; k += 5) { g.moveTo(x, y + k); g.lineTo(x + s, y + k); } g.stroke();
  } else if (kind === 'loot') {
    g.fillStyle = C.loot; g.beginPath(); g.arc(x + s / 2, y + s / 2, 6, 0, Math.PI * 2); g.fill();
  } else if (kind === 'vent') {
    g.fillStyle = C.vent; g.fillRect(x, y, s, s);
    g.strokeStyle = '#8aa6b0'; g.lineWidth = 1.5;
    g.beginPath(); for (let k = 3; k < s; k += 4) { g.moveTo(x + 2, y + k); g.lineTo(x + s - 2, y + k); } g.stroke();
  }
}

/** The prompt above the thief for the job in reach, with a progress bar while held. */
export function drawJobPrompt(g, run) {
  const job = run.job;
  if (!job) return;
  const t = run.thief;
  const busy = t.busy;
  g.font = font(13, 'bold');
  g.textAlign = 'center';
  const w = g.measureText(job.label).width + 20;
  const x = Math.min(Math.max(t.x, w / 2 + 4), 1276 - w / 2), y = t.y - 34;
  g.fillStyle = 'rgba(8,21,27,0.88)';
  g.fillRect(x - w / 2, y - 16, w, 24);
  g.strokeStyle = C.loot;
  g.lineWidth = 1;
  g.strokeRect(x - w / 2 + 0.5, y - 15.5, w - 1, 23);
  g.fillStyle = C.text;
  g.fillText(job.label, x, y + 1);
  if (busy) {
    g.fillStyle = C.loot;
    g.fillRect(x - w / 2, y + 9, w * Math.min(1, busy.progress / busy.need), 4);
  }
}

/** A short line at the bottom of the map: the latest thing that happened. */
export function drawToast(g, toast) {
  if (!toast || toast.life <= 0) return;
  g.globalAlpha = Math.min(1, toast.life);
  g.font = font(16, 'bold');
  g.textAlign = 'center';
  const w = g.measureText(toast.text).width + 28;
  g.fillStyle = 'rgba(8,21,27,0.9)';
  g.fillRect(640 - w / 2, 600, w, 30);
  g.fillStyle = toast.color || C.text;
  g.fillText(toast.text, 640, 621);
  g.globalAlpha = 1;
}
