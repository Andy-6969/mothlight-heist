// One heist in progress: ties the thief, wardens, cameras, lasers, tools and alarm together.

import { parseMap, openDoor, TILE, tileAtPx } from '../world/map.js';
import { createThief, updateThief } from '../actors/thief.js';
import { createGuard, updateGuard, guardCone, hearNoise } from '../actors/guard.js';
import { createCamera, updateCamera, cameraCone, cameraActive } from '../actors/camera.js';
import { coneSees, exposureRate, SHADOW_SIGHT } from './vision.js';
import { createAlarm, raiseAlarm, coolAlarm, alarmTier, isLockdown } from './alarm.js';
import { TOOLS, throwPoint, SMOKE_SECONDS, SMOKE_RADIUS } from './tools.js';
import { nearestJob, jobSeconds } from './interact.js';
import { dist } from '../core/math.js';
import { screenToWorld } from '../world/viewport.js';
import { planRoutes } from './routes.js';

export const GETAWAY_SECONDS = 75;
const LASER_ON = 2.1;
const LASER_OFF = 1.7;

export function createRun(level, kit, entryIndex = 0) {
  const map = parseMap(level);
  const entry = map.entries[Math.min(entryIndex, map.entries.length - 1)];
  return {
    level,
    map,
    kit: { ...kit },
    thief: createThief(entry),
    guards: level.guards.map(createGuard),
    cameras: level.cameras.map(createCamera),
    alarm: createAlarm(),
    smokes: [],
    bells: [],
    noises: [],
    fx: [],
    events: [],
    selected: 'smoke',
    time: 0,
    lootValue: 0,
    lootCount: 0,
    getaway: null,
    outcome: null, // null | 'caught' | 'lockdown' | 'escaped'
    caughtBy: null,
    retries: 0,
    alerts: 0,
    job: null,
    laserTouch: false,
    routes: planRoutes(map, entry),
    routeTimer: 12,
    routesPinned: false,
  };
}

export function lasersOn(run) {
  const t = run.time % (LASER_ON + LASER_OFF);
  return t < LASER_ON;
}

function emit(run, type, data = {}) {
  run.events.push({ type, ...data });
}

function makeNoise(run, noise) {
  run.noises.push({ ...noise, life: 0.6 });
  for (const g of run.guards) hearNoise(g, run.map, noise);
}

function useTool(run, input) {
  const tool = TOOLS.find((t) => t.id === run.selected);
  if (!tool || !(run.kit[tool.id] > 0)) { emit(run, 'deny'); return; }
  const { thief } = run;
  const m = screenToWorld(run, input.mouse.x, input.mouse.y);
  if (tool.id === 'smoke') {
    const p = throwPoint(thief, tool, m.x, m.y);
    run.smokes.push({ x: p.x, y: p.y, r: SMOKE_RADIUS, life: SMOKE_SECONDS, grow: 0 });
    run.kit.smoke--;
    emit(run, 'smoke', p);
  } else if (tool.id === 'lure') {
    const p = throwPoint(thief, tool, m.x, m.y);
    run.bells.push({ x: p.x, y: p.y, life: 2.4 });
    run.kit.lure--;
    makeNoise(run, { x: p.x, y: p.y, radius: 260, strength: 0.3, kind: 'lure' });
    emit(run, 'bell', p);
  } else if (tool.id === 'loop') {
    let best = null;
    for (const c of run.cameras) {
      const d = dist(thief.x, thief.y, c.x, c.y);
      if (cameraActive(c) && d < tool.reach && (!best || d < best.d)) best = { c, d };
    }
    if (!best) { emit(run, 'deny', { reason: 'No camera in reach' }); return; }
    best.c.looped = 12;
    run.kit.loop--;
    emit(run, 'loop', { x: best.c.x, y: best.c.y });
  }
}

function workJob(run, input, dt) {
  const job = nearestJob(run);
  run.job = job;
  const holding = input.isDown('e');
  if (!job || !holding) { run.thief.busy = null; return; }
  const need = jobSeconds(job, run);
  if (!isFinite(need)) { if (input.wasPressed('e')) emit(run, 'deny', { reason: 'You need a lockpick' }); return; }
  if (!run.thief.busy || run.thief.busy.target !== job.target) run.thief.busy = { kind: job.kind, target: job.target, progress: 0, need };
  const busy = run.thief.busy;
  busy.progress += dt;
  if (Math.floor(busy.progress * 4) !== Math.floor((busy.progress - dt) * 4)) emit(run, 'tick', { kind: job.kind });
  if (busy.progress < need) return;

  const t = job.target;
  if (job.kind === 'pick') {
    run.kit.pick--;
    openDoor(run.map, t);
    emit(run, 'unlock', { x: t.cx, y: t.cy });
  } else if (job.kind === 'case') {
    t.opened = true;
    run.lootValue += t.value;
    run.lootCount++;
    if (run.kit.cutter > 0) {
      run.kit.cutter--;
      emit(run, 'loot', { x: t.cx, y: t.cy, value: t.value });
    } else {
      makeNoise(run, { x: t.cx, y: t.cy, radius: 300, strength: 0.6, kind: 'smash' });
      raiseAlarm(run.alarm, 26, 'Glass smashed');
      emit(run, 'smash', { x: t.cx, y: t.cy, value: t.value });
    }
  } else if (job.kind === 'vault') {
    t.cracked = true;
    run.thief.carrying = true;
    run.lootValue += run.level.targetValue;
    run.lootCount++;
    run.getaway = { left: GETAWAY_SECONDS };
    emit(run, 'target', { x: t.cx, y: t.cy, value: run.level.targetValue });
  }
  run.thief.busy = null;
}

/** Advance the heist one fixed tick. */
export function stepRun(run, input, dt) {
  if (run.outcome) return;
  run.time += dt;
  const { thief, map, alarm } = run;
  const tier = alarmTier(alarm);

  for (const t of TOOLS) if (input.wasPressed(t.key)) run.selected = t.id;
  if (input.wasPressed('q')) { run.routesPinned = !(run.routesPinned || run.routeTimer > 0); run.routeTimer = 0; }
  run.routeTimer = Math.max(0, run.routeTimer - dt);
  if (input.mouse.clicked || input.wasPressed(' ')) useTool(run, input);

  const step = updateThief(thief, map, input, dt);
  if (step) makeNoise(run, step);
  workJob(run, input, dt);

  // loose valuables are scooped up by walking over them
  for (const l of map.loot) {
    if (!l.taken && dist(thief.x, thief.y, l.cx, l.cy) < 18) {
      l.taken = true;
      run.lootValue += l.value;
      run.lootCount++;
      emit(run, 'loot', { x: l.cx, y: l.cy, value: l.value });
    }
  }

  // lasers
  const onLaser = tileAtPx(map, thief.x, thief.y) === 'L';
  if (onLaser && lasersOn(run)) {
    if (!run.laserTouch) {
      raiseAlarm(alarm, 30, 'Laser grid tripped');
      makeNoise(run, { x: thief.x, y: thief.y, radius: 340, strength: 0.7, kind: 'smash' });
      emit(run, 'laser', { x: thief.x, y: thief.y });
    }
    run.laserTouch = true;
  } else run.laserTouch = false;

  // smoke and bells fade
  for (const s of run.smokes) { s.life -= dt; s.grow = Math.min(1, s.grow + dt * 3); }
  run.smokes = run.smokes.filter((s) => s.life > 0);
  for (const b of run.bells) b.life -= dt;
  run.bells = run.bells.filter((b) => b.life > 0);
  for (const n of run.noises) n.life -= dt;
  run.noises = run.noises.filter((n) => n.life > 0);
  const smokes = run.smokes.map((s) => ({ x: s.x, y: s.y, r: s.r * (0.4 + 0.6 * s.grow) }));

  const hidden = thief.inVent;
  const rangeScale = thief.inShadow ? SHADOW_SIGHT : 1;
  let watched = false;

  for (const cam of run.cameras) {
    updateCamera(cam, run.time, dt);
    cam.seen = false;
    if (!cameraActive(cam) || hidden) { cam.lock = Math.max(0, cam.lock - dt); continue; }
    const d = coneSees(map, smokes, cam, cameraCone(cam), thief.x, thief.y, rangeScale);
    if (d >= 0) {
      cam.seen = true;
      watched = true;
      cam.lock = Math.min(1, cam.lock + dt * 1.4);
      if (cam.lock > 0.35) {
        raiseAlarm(alarm, dt * 24, 'Camera spotted you');
        for (const g of run.guards) {
          if (g.state === 'patrol' || g.state === 'pause') {
            if (dist(g.x, g.y, cam.x, cam.y) < 420) hearNoise(g, map, { x: thief.x, y: thief.y, radius: 420, strength: 0.45, kind: 'lure' });
          }
        }
      }
    } else cam.lock = Math.max(0, cam.lock - dt * 0.8);
  }

  for (const g of run.guards) {
    const cone = guardCone(g, tier);
    const d = hidden ? -1 : coneSees(map, smokes, g, cone, thief.x, thief.y, rangeScale);
    if (d >= 0) watched = true;
    const rate = d >= 0 ? exposureRate(d, cone.range * rangeScale, thief) : 0;
    const { becameAlert, caught } = updateGuard(g, map, thief, d, rate, tier, dt);
    if (becameAlert) {
      run.alerts++;
      raiseAlarm(alarm, 22, `${g.name} raised the alarm`);
      emit(run, 'alert', { x: g.x, y: g.y, name: g.name });
    }
    if (caught && !run.outcome) {
      run.outcome = 'caught';
      run.caughtBy = { name: g.name, x: g.x, y: g.y, seenFor: g.seenFor, inShadow: thief.inShadow, sneaking: thief.sneaking };
      emit(run, 'caught');
    }
  }

  coolAlarm(alarm, dt, !watched && run.guards.every((g) => g.state !== 'alert'));

  if (run.getaway) {
    run.getaway.left -= dt;
    if (run.getaway.left <= 0) raiseAlarm(alarm, 100, 'The canal watch sealed the quay');
    if (map.exits.some((x) => dist(thief.x, thief.y, x.cx, x.cy) < 22)) {
      run.outcome = 'escaped';
      emit(run, 'escaped');
    }
  }
  if (!run.outcome && isLockdown(alarm)) {
    run.outcome = 'lockdown';
    emit(run, 'lockdown');
  }
}

/** The figures the results card shows. */
export function scoreRun(run) {
  const timeBonus = Math.max(0, Math.round((run.level.par - run.time) * 3));
  const stealth = run.alerts === 0 ? 400 : 0;
  const heat = Math.round(run.alarm.peak * 4) + run.retries * 150;
  const total = Math.max(0, run.lootValue + timeBonus + stealth - heat);
  const ratio = total / (run.level.targetValue + 800);
  const grade = ratio > 1.05 ? 'S' : ratio > 0.85 ? 'A' : ratio > 0.65 ? 'B' : ratio > 0.45 ? 'C' : 'D';
  return { loot: run.lootValue, timeBonus, stealth, heat, total, grade };
}

export function tileCenter(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}
