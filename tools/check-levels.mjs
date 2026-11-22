// Level sanity: every entry reaches the vault and the getaway, with and without lockpicks,
// and the vents lead somewhere. Run: node tools/check-levels.mjs
import { LEVELS } from '../game/src/world/levels.js';

const SOLID = new Set(['#', 'T', 'C', 'V']);
let bad = 0;

function reach(grid, from, allowDoors) {
  const seen = new Set([from.join(',')]);
  const q = [from];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      const t = grid[ny]?.[nx];
      if (!t || SOLID.has(t) || (t === 'D' && !allowDoors) || seen.has(`${nx},${ny}`)) continue;
      seen.add(`${nx},${ny}`);
      q.push([nx, ny]);
    }
  }
  return seen;
}

for (const L of LEVELS) {
  const g = L.grid;
  const find = (ch) => g.flatMap((row, y) => [...row].map((c, x) => (c === ch ? [x, y] : null)).filter(Boolean));
  const [vault] = find('V');
  const exits = find('X');
  const vents = find('=');
  for (const entry of find('E')) {
    for (const doors of [false, true]) {
      const r = reach(g, entry, doors);
      const nearVault = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => r.has(`${vault[0] + dx},${vault[1] + dy}`));
      const toExit = exits.some(([x, y]) => r.has(`${x},${y}`));
      const label = `${L.id} entry ${entry} ${doors ? 'with picks' : 'no picks'}`;
      if (!nearVault || !toExit) { bad++; console.log(`FAIL ${label}: vault ${nearVault} exit ${toExit}`); }
      else console.log(`ok   ${label}`);
    }
  }
  for (const [x, y] of vents) {
    const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
      const t = g[y + dy]?.[x + dx];
      return t && (!SOLID.has(t) || t === 'V');
    });
    if (open.length < 2) { bad++; console.log(`FAIL ${L.id} vent at ${x},${y} is a dead end`); }
  }
}
process.exit(bad ? 1 : 0);
