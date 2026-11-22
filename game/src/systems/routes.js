// The planner's chalk lines: for each job, the distinct ways from an entry to the vault
// (the vent, the picked door, the laser hall) and the getaway, found on the tile grid.

import { TILE, tileAt } from '../world/map.js';

const SOLID = new Set(['#', 'T', 'C', 'V']);

function bfs(map, start, isGoal, blocked) {
  const key = (x, y) => y * map.cols + x;
  const prev = new Map([[key(start.x, start.y), -1]]);
  const q = [[start.x, start.y]];
  let end = null;
  while (q.length) {
    const [x, y] = q.shift();
    if (isGoal(x, y)) { end = [x, y]; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      const t = tileAt(map, nx, ny);
      if (SOLID.has(t) || blocked(t) || prev.has(key(nx, ny))) continue;
      prev.set(key(nx, ny), key(x, y));
      q.push([nx, ny]);
    }
  }
  if (!end) return null;
  const cells = [];
  for (let k = key(end[0], end[1]); k !== -1; k = prev.get(k)) cells.push({ x: k % map.cols, y: Math.floor(k / map.cols) });
  return cells.reverse();
}

const nextToVault = (map) => (x, y) => !!map.vault && Math.abs(x - map.vault.x) + Math.abs(y - map.vault.y) === 1;

export const ROUTE_STYLE = {
  A: '#7fe0c0',
  B: '#ffd27a',
  C: '#ff7aa8',
  G: '#6fe3ff',
};

/** Distinct routes from an entry to the vault, plus the getaway from the vault. */
export function planRoutes(map, entry) {
  const start = { x: entry.x, y: entry.y };
  const routes = [];
  const seen = new Set();
  const add = (id, cells, label, cost) => {
    if (!cells) return;
    const sig = cells.map((c) => `${c.x},${c.y}`).join(';');
    if (seen.has(sig)) return;
    seen.add(sig);
    routes.push({ id, cells, label, cost, color: ROUTE_STYLE[id] });
  };
  const goal = nextToVault(map);
  const doorTile = (t) => t === 'D';
  const ventTile = (t) => t === '=';

  const quiet = bfs(map, start, goal, doorTile);
  if (quiet) add('A', quiet, quiet.some((c) => tileAt(map, c.x, c.y) === '=') ? 'Vent crawl: free, slow' : 'Back passage: free', 0);

  const picked = bfs(map, start, goal, ventTile);
  if (picked) add('B', picked, picked.some((c) => tileAt(map, c.x, c.y) === 'D') ? 'Pick the lock: $60' : 'Main hall: free, watched', 60);

  if (map.lasers.length) {
    const first = bfs(map, start, (x, y) => tileAt(map, x, y) === 'L', ventTile);
    if (first) {
      const last = first[first.length - 1];
      const rest = bfs(map, last, goal, ventTile);
      if (rest) add('C', first.concat(rest.slice(1)), 'Laser hall: time the pulse', 0);
    }
  }
  if (map.vault) {
    const vaultSide = routes[0]?.cells.at(-1) ?? null;
    if (vaultSide) {
      const exits = new Set(map.exits.map((e) => `${e.x},${e.y}`));
      const out = bfs(map, vaultSide, (x, y) => exits.has(`${x},${y}`), () => false);
      if (out) add('G', out, 'Getaway: 75 s to the boat', 0);
    }
  }
  return routes;
}

/** Pixel points of a route, nudged sideways a little so parallel routes stay apart. */
export function routePoints(route, nudge) {
  return route.cells.map((c) => ({ x: (c.x + 0.5) * TILE + nudge, y: (c.y + 0.5) * TILE + nudge }));
}
