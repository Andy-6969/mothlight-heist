// Staged moments for the screenshots (?shot=<name>): each one runs the real simulation to a
// set point and then holds the frame still.

import { startPlan, startHeist } from './scenes/flow.js';
import { stepRun, scoreRun } from './systems/heist.js';
import { raiseAlarm } from './systems/alarm.js';
import { TILE } from './world/map.js';

const idle = { isDown: () => false, wasPressed: () => false, mouse: { x: 0, y: 0, clicked: false } };

function advance(game, seconds) {
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    game.time = (game.time || 0) + 1 / 60;
    stepRun(game.run, idle, 1 / 60);
  }
  game.run.events.length = 0;
}

function place(run, tx, ty) {
  run.thief.x = (tx + 0.5) * TILE;
  run.thief.y = (ty + 0.5) * TILE;
}

export function stageShot(game, name) {
  if (name === 'heist') {
    startPlan(game, 0);
    game.plan.kit = { smoke: 2, lure: 2, loop: 1, pick: 1, cutter: 1 };
    startHeist(game);
    const run = game.run;
    place(run, 1, 9);
    advance(game, 6.2);
    place(run, 33, 10);
    run.thief.facing = -1.2;
    run.lootValue = 380;
    run.lootCount = 2;
    run.map.loot[0].taken = true;
    run.map.cases[0].opened = true;
    run.kit.cutter = 0;
    raiseAlarm(run.alarm, 41, 'Camera spotted you');
    run.alarm.flash = 0;
    run.smokes.push({ x: 29.5 * TILE, y: 13 * TILE, r: 58, life: 5, grow: 1 });
    advance(game, 0.3);
    const [osric, hale, pim] = run.guards;
    Object.assign(hale, { x: 27.5 * TILE, y: 9.6 * TILE, angle: 0.08, state: 'suspicious', suspicion: 0.46, path: [] });
    Object.assign(pim, { x: 36.5 * TILE, y: 12.5 * TILE, angle: -2.2, state: 'patrol', suspicion: 0, path: [] });
    void osric;
    run.thief.sneaking = true;
    run.thief.moving = true;
    run.thief.inShadow = true;
    run.routeTimer = 0;
    run.time = 74;
    game.toast = null;
  } else if (name === 'plan') {
    startPlan(game, 1);
    game.plan.kit = { smoke: 2, lure: 2, loop: 1, pick: 1, cutter: 0 };
    game.plan.hover = 2;
    game.time = 3.1;
  } else if (name === 'caught') {
    startPlan(game, 2);
    game.plan.kit = { smoke: 1, lure: 2, loop: 1, pick: 1, cutter: 1 };
    startHeist(game);
    advance(game, 3);
    const run = game.run;
    const g = run.guards[2];
    run.thief.x = g.x + Math.cos(g.angle) * 26;
    run.thief.y = g.y + Math.sin(g.angle) * 26;
    raiseAlarm(run.alarm, 58, 'Warden Lune raised the alarm');
    run.outcome = 'caught';
    run.caughtBy = { name: g.name, x: g.x, y: g.y, seenFor: 1.8, inShadow: false, sneaking: false };
    game.scene = 'caught';
  } else if (name === 'getaway') {
    startPlan(game, 2);
    game.plan.kit = { smoke: 2, lure: 1, loop: 2, pick: 2, cutter: 1 };
    startHeist(game);
    const run = game.run;
    advance(game, 4);
    run.map.vault.cracked = true;
    run.thief.carrying = true;
    run.lootValue = 2200 + 380;
    run.getaway = { left: 38 };
    run.routeTimer = 0;
    place(run, 33, 13);
    run.thief.facing = 0.2;
    run.thief.moving = true;
    raiseAlarm(run.alarm, 72, 'Captain Rook raised the alarm');
    run.alarm.flash = 0;
    run.guards[3].state = 'alert';
    run.guards[3].suspicion = 1;
    run.time = 162;
    game.toast = { text: 'You have the Orrery Heart! Run for the boat.', life: 2, color: '#6fe3ff' };
  } else if (name === 'results') {
    startPlan(game, 0);
    startHeist(game);
    const run = game.run;
    advance(game, 2);
    run.lootValue = 900 + 380;
    run.time = 128;
    run.alarm.peak = 18;
    run.outcome = 'escaped';
    game.score = scoreRun(run);
    game.purse = game.score.total;
    game.scene = 'results';
  }
}
