// The night's flow: title, then for each of three jobs a planning board, the heist itself,
// a caught card or a results ledger, and a finale once Vellmar's last vault is empty.

import { LEVELS } from '../world/levels.js';
import { createRun, stepRun, scoreRun } from '../systems/heist.js';
import { TOOLS, emptyKit, kitCost } from '../systems/tools.js';
import { SHOP_CARD } from '../render/plan-board.js';
import { playCue, setTension } from '../audio/synth.js';
import { C } from '../render/palette.js';

export function createGame() {
  const game = { scene: 'title', index: 0, purse: 0, grades: [], plan: null, run: null, toast: null, shake: 0, best: 0, paused: false };
  game.attract = createRun(LEVELS[0], emptyKit(), 0);
  game.attract.thief.x = -999; // an empty building: wardens walk their rounds behind the title
  return game;
}

export function startPlan(game, index) {
  const level = LEVELS[index];
  const kit = emptyKit();
  kit.smoke = 1; kit.lure = 1; // a starter kit, already inside the budget
  game.index = index;
  game.plan = { index, level, kit, entry: 0, budget: level.budget + Math.floor(game.purse * 0.2), hover: null, run: createRun(level, kit, 0) };
  game.scene = 'plan';
}

export function startHeist(game, retries = 0) {
  const p = game.plan;
  game.run = createRun(p.level, p.kit, p.entry);
  game.run.retries = retries;
  game.scene = 'heist';
  game.toast = { text: `Job ${p.index + 1}: ${p.level.target}. Stay out of the light.`, life: 3, color: C.text };
}

function updatePlan(game, input) {
  const p = game.plan;
  const m = input.mouse;
  p.hover = null;
  TOOLS.forEach((t, i) => {
    const x = SHOP_CARD.x0 + i * SHOP_CARD.step;
    if (m.x >= x && m.x <= x + SHOP_CARD.w && m.y >= SHOP_CARD.y && m.y <= SHOP_CARD.y + SHOP_CARD.h) {
      p.hover = i;
      if (m.clicked) buy(p, t, 1);
      if (m.rightClicked) buy(p, t, -1);
    }
    if (input.wasPressed(t.key)) buy(p, t, 1);
  });
  if (input.wasPressed('Backspace')) { for (const t of TOOLS) p.kit[t.id] = 0; playCue('ui'); }
  if (input.wasPressed('Tab')) { p.entry = (p.entry + 1) % p.run.map.entries.length; playCue('ui'); }
  // click an entry ring on the board to choose it
  if (m.clicked && m.y < 640) {
    p.run.map.entries.forEach((e, i) => {
      if (Math.hypot(m.x - e.cx, m.y - 64 - e.cy) < 24) { p.entry = i; playCue('ui'); }
    });
  }
  if (input.wasPressed('Enter')) { playCue('ui'); startHeist(game); }
}

function buy(plan, tool, delta) {
  const n = plan.kit[tool.id] + delta;
  if (n < 0 || n > tool.max) { playCue('deny'); return; }
  const next = { ...plan.kit, [tool.id]: n };
  if (kitCost(next) > plan.budget) { playCue('deny'); return; }
  plan.kit = next;
  playCue('ui');
}

const EVENT_TOASTS = {
  loot: (e) => [`+$${e.value} in valuables`, C.loot, 'loot'],
  smash: (e) => [`+$${e.value}, but the glass shattered. Wardens heard it!`, C.lanternHot, 'smash'],
  alert: (e) => [`${e.name} raised the alarm!`, C.lanternHot, 'alert'],
  target: () => [null, C.exit, 'target'],
  laser: () => ['Laser grid tripped!', C.laser, 'laser'],
  unlock: () => ['Lock picked without a sound', C.text, 'unlock'],
  loop: () => ['Camera looped for 12 s', C.camera, 'loop'],
  smoke: () => [null, null, 'smoke'],
  bell: () => [null, null, 'bell'],
  tick: () => [null, null, 'tick'],
  deny: (e) => [e.reason || 'Nothing left of that tool', C.textDim, 'deny'],
  caught: () => [null, null, 'caught'],
  lockdown: () => [null, null, 'lockdown'],
  escaped: () => [null, null, 'escaped'],
};

function updateHeist(game, input, dt) {
  const run = game.run;
  if (input.wasPressed('Escape')) game.paused = !game.paused;
  if (game.paused) return;
  stepRun(run, input, dt);
  for (const e of run.events) {
    const f = EVENT_TOASTS[e.type];
    if (!f) continue;
    let [text, color, cue] = f(e);
    if (e.type === 'target') text = `You have ${run.level.target}! Run for the boat.`;
    if (text) game.toast = { text, life: 2.6, color };
    if (cue) playCue(cue);
    if (e.type === 'alert' || e.type === 'smash' || e.type === 'laser') game.shake = 0.5;
  }
  run.events.length = 0;
  setTension(run.alarm.value / 100 + (run.getaway ? 0.3 : 0));
  if (run.outcome === 'caught' || run.outcome === 'lockdown') game.scene = 'caught';
  if (run.outcome === 'escaped') {
    game.score = scoreRun(run);
    game.purse += game.score.total;
    game.grades[game.index] = game.score.grade;
    game.best = Math.max(game.best, game.purse);
    game.scene = 'results';
  }
}

/** Advance whichever scene is showing by one fixed tick. */
export function updateGame(game, input, dt) {
  game.time = (game.time || 0) + dt;
  if (game.toast) game.toast.life -= dt;
  game.shake = Math.max(0, game.shake - dt);
  switch (game.scene) {
    case 'title':
      stepRun(game.attract, { isDown: () => false, wasPressed: () => false, mouse: { clicked: false } }, dt);
      if (input.wasPressed('Enter') || input.mouse.clicked) { playCue('ui'); game.purse = 0; game.grades = []; startPlan(game, 0); }
      break;
    case 'plan':
      updatePlan(game, input);
      break;
    case 'heist':
      updateHeist(game, input, dt);
      break;
    case 'caught':
      setTension(0.1);
      if (input.wasPressed('r')) startHeist(game, game.run.retries + 1);
      else if (input.wasPressed('p')) startPlan(game, game.index);
      break;
    case 'results':
      if (input.wasPressed('Enter')) {
        if (game.index + 1 < LEVELS.length) startPlan(game, game.index + 1);
        else game.scene = 'finale';
      }
      break;
    case 'finale':
      if (input.wasPressed('Enter')) game.scene = 'title';
      break;
  }
}
