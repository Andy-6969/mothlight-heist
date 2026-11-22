// Full-screen cards: the title, the caught freeze-frame, the results ledger and the finale.

import { MAP_Y } from '../world/map.js';
import { C, font, FONT_DISPLAY } from './palette.js';

function panel(g, x, y, w, h) {
  g.fillStyle = 'rgba(8,21,27,0.93)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = C.wallTop;
  g.lineWidth = 2;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.strokeStyle = 'rgba(217,203,176,0.3)';
  g.strokeRect(x + 6.5, y + 6.5, w - 13, h - 13);
}

export function drawMothMark(g, x, y, s, time) {
  const flap = 1 + Math.sin(time * 2.2) * 0.06;
  g.save();
  g.translate(x, y);
  g.scale(s * flap, s);
  g.fillStyle = C.wing;
  g.beginPath();
  g.moveTo(0, 0); g.bezierCurveTo(-30, -38, -62, -22, -50, 4); g.bezierCurveTo(-40, 22, -16, 14, 0, 0);
  g.moveTo(0, 0); g.bezierCurveTo(30, -38, 62, -22, 50, 4); g.bezierCurveTo(40, 22, 16, 14, 0, 0);
  g.fill();
  g.fillStyle = C.lantern;
  g.beginPath(); g.arc(-30, -6, 6, 0, Math.PI * 2); g.arc(30, -6, 6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#26323a';
  g.beginPath(); g.ellipse(0, 4, 5, 16, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}

export function drawTitle(g, time, best) {
  g.fillStyle = 'rgba(6,16,20,0.55)';
  g.fillRect(0, 0, 1280, 720);
  drawMothMark(g, 640, 190, 1.6, time);
  g.textAlign = 'center';
  g.fillStyle = C.text;
  g.font = font(92, 'bold', FONT_DISPLAY);
  g.fillText('Mothlight', 640, 330);
  g.font = font(24, 'italic', FONT_DISPLAY);
  g.fillStyle = C.lantern;
  g.fillText('Three heists in the lamplit city of Vellmar', 640, 372);
  panel(g, 360, 410, 560, 172);
  g.font = font(16);
  g.fillStyle = C.text;
  const lines = [
    'WASD or arrows: move     Shift: sneak (silent, slower)',
    'E (hold): pick locks, cut glass, crack the vault',
    '1-5: choose a tool     Click or Space: throw or use it',
    'Stay in hatched shadow, read the lantern cones, then move.',
    'Grab the target, reach the getaway boat before the quay seals.',
  ];
  lines.forEach((l, i) => g.fillText(l, 640, 446 + i * 28));
  g.font = font(22, 'bold');
  g.fillStyle = Math.sin(time * 4) > -0.3 ? C.loot : C.lootDeep;
  g.fillText('Press Enter to plan the first job', 640, 660);
  if (best) {
    g.font = font(14);
    g.fillStyle = C.textDim;
    g.fillText(`Best haul so far: $${best}`, 640, 690);
  }
}

export function drawCaught(g, run, time) {
  const cb = run.caughtBy;
  const lock = run.outcome === 'lockdown';
  g.fillStyle = 'rgba(30,4,8,0.45)';
  g.fillRect(0, MAP_Y, 1280, 576);
  if (cb && !lock) {
    // circle the warden and the thief, and draw the line of sight that caught you
    g.save();
    g.translate(0, MAP_Y);
    g.strokeStyle = C.lanternHot;
    g.lineWidth = 3;
    g.setLineDash([8, 6]);
    g.beginPath(); g.moveTo(cb.x, cb.y); g.lineTo(run.thief.x, run.thief.y); g.stroke();
    g.setLineDash([]);
    const r = 22 + Math.sin(time * 6) * 3;
    g.beginPath(); g.arc(cb.x, cb.y, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = C.wing;
    g.beginPath(); g.arc(run.thief.x, run.thief.y, r, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
  const x = 380, y = 200;
  panel(g, x, y, 520, 230);
  g.textAlign = 'center';
  g.font = font(46, 'bold', FONT_DISPLAY);
  g.fillStyle = C.lanternHot;
  g.fillText(lock ? 'Lockdown' : 'Caught', 640, y + 62);
  g.font = font(17);
  g.fillStyle = C.text;
  if (lock) {
    g.fillText(run.alarm.lastReason || 'The alarm hit 100%.', 640, y + 100);
    g.fillText('Every door in the building just sealed.', 640, y + 126);
  } else if (cb) {
    g.fillText(`${cb.name} had you in the lantern for ${cb.seenFor.toFixed(1)} s.`, 640, y + 100);
    const why = cb.inShadow ? 'Even shadow fails when a warden is this close.' : cb.sneaking ? 'You were sneaking, but standing in the light.' : 'You were walking upright in the light. Shift to sneak, hug the hatched shadow.';
    g.fillStyle = C.textDim;
    g.font = font(15);
    g.fillText(why, 640, y + 126);
  }
  g.font = font(18, 'bold');
  g.fillStyle = C.loot;
  g.fillText('R: retry this job with the same kit', 640, y + 172);
  g.fillStyle = C.textDim;
  g.font = font(15);
  g.fillText('P: back to the planning board', 640, y + 200);
}

export function drawResults(g, run, score, purse, time, isLast) {
  g.fillStyle = 'rgba(6,16,20,0.6)';
  g.fillRect(0, 0, 1280, 720);
  const x = 400, y = 120, w = 480;
  panel(g, x, y, w, 470);
  g.textAlign = 'center';
  g.font = font(16, 'bold');
  g.fillStyle = C.exit;
  g.fillText('Clean getaway', 640, y + 42);
  g.font = font(34, 'bold', FONT_DISPLAY);
  g.fillStyle = C.text;
  g.fillText(run.level.name, 640, y + 84);
  const rows = [
    ['Loot carried out', `$${score.loot}`],
    ['Speed bonus', `$${score.timeBonus}`],
    ['Ghost bonus (no warden alerted)', `$${score.stealth}`],
    ['Heat (alarm peak and retries)', `-$${score.heat}`],
  ];
  g.font = font(17);
  rows.forEach(([k, v], i) => {
    g.textAlign = 'left';
    g.fillStyle = C.textDim;
    g.fillText(k, x + 40, y + 140 + i * 34);
    g.textAlign = 'right';
    g.fillStyle = v.startsWith('-') ? C.lanternHot : C.text;
    g.fillText(v, x + w - 40, y + 140 + i * 34);
  });
  g.strokeStyle = C.hudLine;
  g.beginPath(); g.moveTo(x + 40, y + 276); g.lineTo(x + w - 40, y + 276); g.stroke();
  g.textAlign = 'left';
  g.font = font(20, 'bold');
  g.fillStyle = C.text;
  g.fillText('Take', x + 40, y + 308);
  g.textAlign = 'right';
  g.fillStyle = C.loot;
  g.fillText(`$${score.total}`, x + w - 40, y + 308);
  g.textAlign = 'center';
  g.font = font(84, 'bold', FONT_DISPLAY);
  g.fillStyle = score.grade === 'S' ? C.loot : C.text;
  g.fillText(score.grade, 640, y + 400);
  g.font = font(15);
  g.fillStyle = C.textDim;
  g.fillText(`Time ${Math.floor(run.time)} s   Alarm peak ${Math.round(run.alarm.peak)}%   Purse $${purse}`, 640, y + 432);
  g.font = font(18, 'bold');
  g.fillStyle = Math.sin(time * 4) > -0.3 ? C.loot : C.lootDeep;
  g.fillText(isLast ? 'Enter: count the whole haul' : 'Enter: plan the next job', 640, y + 500);
}

export function drawFinale(g, purse, grades, time) {
  g.fillStyle = 'rgba(6,16,20,0.75)';
  g.fillRect(0, 0, 1280, 720);
  drawMothMark(g, 640, 200, 1.3, time);
  g.textAlign = 'center';
  g.font = font(56, 'bold', FONT_DISPLAY);
  g.fillStyle = C.text;
  g.fillText('Vellmar sleeps', 640, 330);
  g.font = font(22, 'italic', FONT_DISPLAY);
  g.fillStyle = C.lantern;
  g.fillText('and nobody saw the moth.', 640, 368);
  g.font = font(30, 'bold');
  g.fillStyle = C.loot;
  g.fillText(`Total haul $${purse}`, 640, 440);
  g.font = font(18);
  g.fillStyle = C.text;
  g.fillText(`Grades: ${grades.join('  ')}`, 640, 478);
  g.fillStyle = C.textDim;
  g.fillText('Enter: start a new night', 640, 560);
}
