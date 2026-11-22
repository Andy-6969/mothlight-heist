// Draws the building: blueprint floor, hatched shadow cover, plaster walls, vents, doors,
// lasers, display cases, loose valuables, the vault and the getaway.

import { TILE, tileAt } from '../world/map.js';
import { C, font } from './palette.js';

/** Paint the parts of the map that never move into an offscreen layer. */
export function buildStaticLayer(map) {
  const layer = document.createElement('canvas');
  layer.width = map.cols * TILE;
  layer.height = map.rows * TILE;
  const g = layer.getContext('2d');
  g.fillStyle = C.floor;
  g.fillRect(0, 0, layer.width, layer.height);
  drawBlueprintGrid(g, layer.width, layer.height);
  for (let y = 0; y < map.rows; y++) {
    for (let x = 0; x < map.cols; x++) {
      const t = tileAt(map, x, y);
      if (t === ':') drawShadowTile(g, map, x, y);
    }
  }
  for (let y = 0; y < map.rows; y++) {
    for (let x = 0; x < map.cols; x++) {
      const t = tileAt(map, x, y);
      if (t === '#') drawWallTile(g, map, x, y);
      else if (t === '=') drawVentTile(g, x, y);
      else if (t === 'T') drawCrate(g, x, y);
      else if (t === 'd') drawDoorway(g, map, x, y);
    }
  }
  return layer;
}

function drawBlueprintGrid(g, w, h) {
  g.lineWidth = 1;
  for (let x = 0; x <= w; x += TILE / 2) {
    g.strokeStyle = x % (TILE * 4) === 0 ? C.floorLineMajor : C.floorLine;
    g.globalAlpha = x % TILE === 0 ? 0.7 : 0.25;
    g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke();
  }
  for (let y = 0; y <= h; y += TILE / 2) {
    g.strokeStyle = y % (TILE * 4) === 0 ? C.floorLineMajor : C.floorLine;
    g.globalAlpha = y % TILE === 0 ? 0.7 : 0.25;
    g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke();
  }
  g.globalAlpha = 1;
}

function drawShadowTile(g, map, x, y) {
  const px = x * TILE, py = y * TILE;
  g.fillStyle = C.shadow;
  g.fillRect(px, py, TILE, TILE);
  g.save();
  g.beginPath(); g.rect(px, py, TILE, TILE); g.clip();
  g.strokeStyle = C.shadowHatch;
  g.globalAlpha = 0.55;
  g.lineWidth = 1.5;
  for (let k = -TILE; k < TILE * 2; k += 8) {
    g.beginPath(); g.moveTo(px + k, py); g.lineTo(px + k - TILE, py + TILE); g.stroke();
  }
  g.restore();
  // a bright edge where cover ends, so the boundary of safety reads at a glance
  g.strokeStyle = C.shadowEdge;
  g.lineWidth = 2;
  const edge = (nx, ny) => tileAt(map, nx, ny) !== ':' && tileAt(map, nx, ny) !== '#';
  g.beginPath();
  if (edge(x, y - 1)) { g.moveTo(px, py + 1); g.lineTo(px + TILE, py + 1); }
  if (edge(x, y + 1)) { g.moveTo(px, py + TILE - 1); g.lineTo(px + TILE, py + TILE - 1); }
  if (edge(x - 1, y)) { g.moveTo(px + 1, py); g.lineTo(px + 1, py + TILE); }
  if (edge(x + 1, y)) { g.moveTo(px + TILE - 1, py); g.lineTo(px + TILE - 1, py + TILE); }
  g.stroke();
}

function drawWallTile(g, map, x, y) {
  const px = x * TILE, py = y * TILE;
  const below = tileAt(map, x, y + 1);
  g.fillStyle = C.wallDark;
  g.fillRect(px, py, TILE, TILE);
  g.fillStyle = C.wallTop;
  g.fillRect(px, py, TILE, below === '#' ? TILE : TILE - 9);
  if (below !== '#') {
    g.fillStyle = C.wallSide;
    g.fillRect(px, py + TILE - 9, TILE, 9);
  }
  g.strokeStyle = 'rgba(74,63,49,0.35)';
  g.lineWidth = 1;
  g.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
}

function drawVentTile(g, x, y) {
  const px = x * TILE, py = y * TILE;
  g.fillStyle = C.wallDark;
  g.fillRect(px, py, TILE, TILE);
  g.fillStyle = C.vent;
  g.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
  g.strokeStyle = '#8aa6b0';
  g.lineWidth = 2;
  for (let k = 7; k < TILE - 4; k += 6) {
    g.beginPath(); g.moveTo(px + 5, py + k); g.lineTo(px + TILE - 5, py + k); g.stroke();
  }
}

function drawCrate(g, x, y) {
  const px = x * TILE, py = y * TILE;
  g.fillStyle = '#5b4630';
  g.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  g.fillStyle = '#8b6a43';
  g.fillRect(px + 2, py + 2, TILE - 4, TILE - 10);
  g.strokeStyle = '#3a2c1d';
  g.lineWidth = 2;
  g.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
  g.beginPath(); g.moveTo(px + 4, py + 4); g.lineTo(px + TILE - 4, py + TILE - 10); g.stroke();
}

function drawDoorway(g, map, x, y) {
  const px = x * TILE, py = y * TILE;
  const vertical = tileAt(map, x, y - 1) === '#' || tileAt(map, x, y + 1) === '#';
  g.fillStyle = C.door;
  if (vertical) { g.fillRect(px + 2, py, 4, TILE); g.fillRect(px + TILE - 6, py, 4, TILE); }
  else { g.fillRect(px, py + 2, TILE, 4); g.fillRect(px, py + TILE - 6, TILE, 4); }
}

/** Draw the parts that change: locked doors, lasers, cases, loot, vault and exits. */
export function drawDynamicWorld(g, run, time) {
  const { map } = run;
  for (const door of map.doors) if (!door.open) drawLockedDoor(g, door, time);
  drawLasers(g, run, time);
  for (const c of map.cases) drawCase(g, c, time);
  for (const l of map.loot) if (!l.taken) drawCoins(g, l, time);
  if (map.vault) drawVault(g, map.vault, run, time);
  for (const x of map.exits) drawExit(g, x, run, time);
}

function drawLockedDoor(g, door, time) {
  const px = door.x * TILE, py = door.y * TILE;
  g.fillStyle = C.doorLocked;
  g.fillRect(px + 1, py + 6, TILE - 2, TILE - 12);
  g.fillStyle = '#ffdf8a';
  g.beginPath(); g.arc(px + TILE / 2, py + TILE / 2, 4, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2b0f0a';
  g.lineWidth = 2;
  g.strokeRect(px + 1, py + 6, TILE - 2, TILE - 12);
  if (door.progress > 0) {
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(px, py - 4, TILE * door.progress, 3);
  }
  void time;
}

function drawLasers(g, run, time) {
  const on = run.lasersOn;
  for (const l of run.map.lasers) {
    const px = l.x * TILE, py = l.y * TILE;
    g.fillStyle = on ? 'rgba(255,62,122,0.16)' : 'rgba(255,62,122,0.05)';
    g.fillRect(px, py, TILE, TILE);
    g.strokeStyle = C.laser;
    g.globalAlpha = on ? 0.85 + Math.sin(time * 30) * 0.15 : 0.22;
    g.lineWidth = on ? 2 : 1;
    for (let k = 6; k < TILE; k += 10) {
      g.beginPath(); g.moveTo(px, py + k); g.lineTo(px + TILE, py + k); g.stroke();
    }
    g.globalAlpha = 1;
  }
}

function drawCase(g, c, time) {
  const px = c.x * TILE, py = c.y * TILE;
  g.fillStyle = '#2a3e47';
  g.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
  if (!c.opened) {
    const glow = 0.5 + Math.sin(time * 3 + c.x) * 0.2;
    g.fillStyle = `rgba(255,213,74,${glow})`;
    g.beginPath(); g.arc(px + TILE / 2, py + TILE / 2, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.loot;
    g.beginPath();
    g.moveTo(px + TILE / 2, py + 10); g.lineTo(px + TILE / 2 + 5, py + TILE / 2);
    g.lineTo(px + TILE / 2, py + TILE - 10); g.lineTo(px + TILE / 2 - 5, py + TILE / 2);
    g.fill();
  }
  g.strokeStyle = c.opened ? '#5d7680' : '#bfe8ff';
  g.lineWidth = 2;
  g.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
  g.strokeStyle = 'rgba(191,232,255,0.5)';
  g.beginPath(); g.moveTo(px + 7, py + 9); g.lineTo(px + 13, py + 5); g.stroke();
}

function drawCoins(g, l, time) {
  const bob = Math.sin(time * 4 + l.x) * 1.5;
  g.fillStyle = 'rgba(255,213,74,0.25)';
  g.beginPath(); g.arc(l.cx, l.cy, 11, 0, Math.PI * 2); g.fill();
  for (const [ox, oy] of [[-4, 2], [3, 3], [0, -2]]) {
    g.fillStyle = C.lootDeep;
    g.beginPath(); g.ellipse(l.cx + ox, l.cy + oy + bob + 1, 5, 3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.loot;
    g.beginPath(); g.ellipse(l.cx + ox, l.cy + oy + bob, 5, 3, 0, 0, Math.PI * 2); g.fill();
  }
}

function drawVault(g, v, run, time) {
  const x = v.cx, y = v.cy;
  if (!v.cracked) {
    const pulse = 0.55 + Math.sin(time * 2.5) * 0.25;
    const grad = g.createRadialGradient(x, y, 4, x, y, 58);
    grad.addColorStop(0, `rgba(255,213,74,${0.55 * pulse})`);
    grad.addColorStop(1, 'rgba(255,213,74,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, 58, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#3b4248';
  g.beginPath(); g.arc(x, y, 15, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#d8b25a';
  g.lineWidth = 3;
  g.beginPath(); g.arc(x, y, 15, 0, Math.PI * 2); g.stroke();
  if (!v.cracked) {
    // the target sits behind the dial: a gold moth-wing jewel
    g.fillStyle = C.loot;
    g.beginPath();
    g.ellipse(x - 5, y, 6, 9, -0.5, 0, Math.PI * 2);
    g.ellipse(x + 5, y, 6, 9, 0.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff6c9';
    g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.text;
    g.font = font(11, 'bold');
    g.textAlign = 'center';
    g.fillText('TARGET', x, y - 22);
  } else {
    g.strokeStyle = '#6b6b6b';
    g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + 8, y); g.stroke();
  }
  const busy = run.thief.busy;
  if (busy && busy.kind === 'vault') {
    g.strokeStyle = C.loot;
    g.lineWidth = 4;
    g.beginPath(); g.arc(x, y, 22, -Math.PI / 2, -Math.PI / 2 + (busy.progress / busy.need) * Math.PI * 2); g.stroke();
  }
}

function drawExit(g, e, run, time) {
  const live = !!run.getaway;
  const a = live ? 0.55 + Math.sin(time * 6) * 0.3 : 0.25;
  g.fillStyle = `rgba(111,227,255,${a * 0.35})`;
  g.fillRect(e.x * TILE, e.y * TILE, TILE, TILE);
  g.strokeStyle = `rgba(111,227,255,${a})`;
  g.lineWidth = 2;
  g.strokeRect(e.x * TILE + 3, e.y * TILE + 3, TILE - 6, TILE - 6);
}

export function drawExitLabel(g, run) {
  const ex = run.map.exits;
  if (!ex.length) return;
  const groups = [];
  for (const e of ex) {
    const near = groups.find((gr) => Math.abs(gr.x - e.cx) < 70 && Math.abs(gr.y - e.cy) < 70);
    if (near) { near.x = (near.x + e.cx) / 2; near.y = (near.y + e.cy) / 2; } else groups.push({ x: e.cx, y: e.cy });
  }
  g.font = font(11, 'bold');
  g.textAlign = 'center';
  for (const gr of groups) {
    g.fillStyle = run.getaway ? C.exit : 'rgba(111,227,255,0.6)';
    g.fillText(run.getaway ? 'GETAWAY BOAT' : 'getaway', gr.x - 6, gr.y - 20);
  }
}
