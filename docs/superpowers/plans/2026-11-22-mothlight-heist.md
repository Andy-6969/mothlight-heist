# MOTHLIGHT: Heists of Vellmar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An original top-down stealth heist game for make.fun's "Make the best heist game" bounty, static files under `game/`, playable offline in desktop Chrome with keyboard and mouse.

**Architecture:** Plain Canvas 2D, ES modules, no library. A fixed-step simulation (`systems/`, `actors/`, `world/`) is kept apart from drawing (`render/`) and UI (`ui/`). `main.js` runs a small scene machine: title → plan → heist → caught / getaway → results. `?shot=<name>` stages deterministic scenes for screenshots.

**Tech Stack:** HTML5 Canvas 2D, Web Audio (procedural music and sound), Node 22 `main.ts` hand-in, Playwright (Python) tests.

**Spec:** the approved design (session message, 2026-11-22): 3 heists (gallery, bank, observatory), planning phase with tools at a cost, guards with vision cones and suspicion, sweeping cameras, laser grids, alarm meter, fair caught freeze-frame, getaway timer, graded results.

## Global Constraints

- Every file the game loads is under `game/` or a `data:` URI; no network request.
- Cover screenshot shows in one frame: the thief crossing a room, guards with vision cones, cameras, a loot target and the alarm meter.
- 3–4 screenshots, PNG/JPEG, ≤256 KiB, long side ≤1280, short side ≥480.
- `vendor/makefun-game.ts` unchanged; `main.ts` writes `/output` deterministically.
- Original names, art, sounds and music only.

## Review Focus

- Thief standing still in a shadow tile beside a guard: detection must be slow, never instant.
- Caught right at heist start (spawn inside a cone): spawns sit out of every cone's reach.
- Smoke cloud between guard and thief: rays stop at smoke, so the thief is unseen.
- Alarm reaching 100 while carrying loot: busted screen, retry from the last checkpoint keeps the bought tools.
- Window resize / small screens: canvas scales with letterboxing, mouse coordinates map correctly.

---

### Task 1: Core + world
**Files:** `game/src/core/{math,rng,input}.js`, `game/src/world/{levels,map}.js`
- [ ] Grid parse of ASCII levels (walls `#`, shadow `:`, vent `=`, locked door `D`, laser `L`, exits `X`, entries `E`), circle-vs-tile collision, DDA ray cast `castRay(map, x, y, angle, maxDist) -> dist`.

### Task 2: Actors and systems
**Files:** `game/src/actors/{thief,guard,camera}.js`, `game/src/systems/{vision,alarm,tools,loot,noise}.js`
- [ ] Guard states patrol → suspicious → investigate → alert; suspicion fill scaled by distance, shadow and sneak; camera sweep and loop; alarm tiers CALM/WARY/ALERT/LOCKDOWN.

### Task 3: Scenes, render, HUD, audio
**Files:** `game/src/scenes/*.js`, `game/src/render/*.js`, `game/src/ui/hud.js`, `game/src/audio/synth.js`, `game/src/main.js`, `game/index.html`, `game/style.css`
- [ ] Blueprint-noir look: ink floor with blueprint grid, hatched shadow cover, amber lantern cones, magenta camera cones, gold loot glow; HUD with alarm meter, objective, tools with cost, loot value, timer.

### Task 4: Tests, screenshots, hand-in
**Files:** `tests/test_game.py`, `tools/shoot.py`, `screenshots/*`, `shots.json`, `README.md`, `.makefun/owner.json`
- [ ] Playwright: boots with no console error, plan → heist, movement, cone detection raises suspicion, smoke blocks it, loot pickup, results; screenshots via `?shot=`; `node main.ts` twice gives identical bytes.
