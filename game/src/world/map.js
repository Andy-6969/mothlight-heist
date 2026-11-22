// The tile map of one heist: parsing, what blocks whom, sight rays and guard paths.

export const TILE = 32;
export const MAP_COLS = 40;
export const MAP_ROWS = 18;
export const MAP_Y = 64; // the map is drawn below the top HUD band

const SOLID_FOR_ALL = new Set(['#', 'T', 'C', 'V']);

export function parseMap(level) {
  const tiles = level.grid.map((row) => row.split(''));
  const map = {
    tiles,
    cols: MAP_COLS,
    rows: MAP_ROWS,
    entries: [],
    exits: [],
    loot: [],
    cases: [],
    lasers: [],
    doors: [],
    vault: null,
  };
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      const t = tiles[y][x];
      const c = { x, y, cx: (x + 0.5) * TILE, cy: (y + 0.5) * TILE };
      if (t === 'E') { map.entries.push(c); tiles[y][x] = '.'; }
      else if (t === 'X') map.exits.push(c);
      else if (t === '$') { map.loot.push({ ...c, value: 120, taken: false }); tiles[y][x] = '.'; }
      else if (t === 'C') map.cases.push({ ...c, value: 260, opened: false });
      else if (t === 'L') map.lasers.push(c);
      else if (t === 'D') map.doors.push({ ...c, open: false, progress: 0 });
      else if (t === 'V') map.vault = { ...c, progress: 0, cracked: false };
    }
  }
  return map;
}

export function tileAt(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows) return '#';
  return map.tiles[ty][tx];
}

export function tileAtPx(map, px, py) {
  return tileAt(map, Math.floor(px / TILE), Math.floor(py / TILE));
}

/** Whether a tile stops the thief (vents and picked doors let the thief through). */
export function blocksThief(t) {
  return SOLID_FOR_ALL.has(t) || t === 'D';
}

/** Whether a tile stops a guard (guards never crawl vents). */
export function blocksGuard(t) {
  return SOLID_FOR_ALL.has(t) || t === 'D' || t === '=';
}

/** Whether a tile stops a line of sight. Vents and closed doors are opaque. */
export function blocksSight(t) {
  return SOLID_FOR_ALL.has(t) || t === 'D' || t === '=';
}

export function openDoor(map, door) {
  door.open = true;
  map.tiles[door.y][door.x] = 'd';
}

/** Move a circle by (dx, dy), sliding along tiles that `blocks` rejects. */
export function moveCircle(map, ent, dx, dy, r, blocks) {
  const tryAxis = (nx, ny) => {
    const x0 = Math.floor((nx - r) / TILE), x1 = Math.floor((nx + r) / TILE);
    const y0 = Math.floor((ny - r) / TILE), y1 = Math.floor((ny + r) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!blocks(tileAt(map, tx, ty))) continue;
        const qx = Math.max(tx * TILE, Math.min(nx, (tx + 1) * TILE));
        const qy = Math.max(ty * TILE, Math.min(ny, (ty + 1) * TILE));
        if ((nx - qx) ** 2 + (ny - qy) ** 2 < r * r) return false;
      }
    }
    return true;
  };
  if (tryAxis(ent.x + dx, ent.y)) ent.x += dx;
  if (tryAxis(ent.x, ent.y + dy)) ent.y += dy;
}

/**
 * March a ray through the grid (DDA) and return the distance to the first tile that blocks
 * sight, or maxDist. The tile the ray starts in never blocks, so wall-mounted cameras see out.
 */
export function castRay(map, ox, oy, angle, maxDist, blocks = blocksSight) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let tx = Math.floor(ox / TILE), ty = Math.floor(oy / TILE);
  const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
  const tDeltaX = Math.abs(TILE / (dx || 1e-9));
  const tDeltaY = Math.abs(TILE / (dy || 1e-9));
  let tMaxX = dx > 0 ? ((tx + 1) * TILE - ox) / dx : (ox - tx * TILE) / (-dx || 1e-9);
  let tMaxY = dy > 0 ? ((ty + 1) * TILE - oy) / dy : (oy - ty * TILE) / (-dy || 1e-9);
  let t = 0;
  while (t < maxDist) {
    if (tMaxX < tMaxY) { t = tMaxX; tMaxX += tDeltaX; tx += stepX; }
    else { t = tMaxY; tMaxY += tDeltaY; ty += stepY; }
    if (t >= maxDist) break;
    if (blocks(tileAt(map, tx, ty))) return t;
  }
  return maxDist;
}

/** Clear line between two points, by ray. */
export function hasLineOfSight(map, ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay);
  return castRay(map, ax, ay, Math.atan2(by - ay, bx - ax), d) >= d - 0.5;
}

/** Breadth-first path over tiles a guard may walk; returns pixel waypoints (tile centres). */
export function findPath(map, sx, sy, gx, gy) {
  const start = [Math.floor(sx / TILE), Math.floor(sy / TILE)];
  const goal = [Math.floor(gx / TILE), Math.floor(gy / TILE)];
  const key = (x, y) => y * map.cols + x;
  const prev = new Map([[key(...start), -1]]);
  const queue = [start];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let found = false;
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === goal[0] && y === goal[1]) { found = true; break; }
    for (const [ddx, ddy] of dirs) {
      const nx = x + ddx, ny = y + ddy;
      if (prev.has(key(nx, ny)) || blocksGuard(tileAt(map, nx, ny))) continue;
      if (ddx && ddy && (blocksGuard(tileAt(map, x + ddx, y)) || blocksGuard(tileAt(map, x, y + ddy)))) continue;
      prev.set(key(nx, ny), key(x, y));
      queue.push([nx, ny]);
    }
  }
  if (!found) return [];
  const path = [];
  for (let k = key(...goal); k !== -1; k = prev.get(k)) {
    path.push({ x: ((k % map.cols) + 0.5) * TILE, y: (Math.floor(k / map.cols) + 0.5) * TILE });
  }
  path.reverse();
  path.shift();
  return path;
}
