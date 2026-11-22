// Mothlight boots here: canvas and letterboxing, a fixed 60 Hz loop, and the draw of each scene.

import { createInput, VIEW_W, VIEW_H } from './core/input.js';
import { createGame, updateGame } from './scenes/flow.js';
import { drawHeistFrame } from './render/scene-heist.js';
import { drawPlanBoard } from './render/plan-board.js';
import { drawTitle, drawCaught, drawResults, drawFinale } from './render/overlays.js';
import { unlockAudio } from './audio/synth.js';
import { LEVELS } from './world/levels.js';
import { stageShot } from './shots.js';
import { C, font } from './render/palette.js';

const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
const view = { scale: 1, offX: 0, offY: 0 };
const input = createInput(canvas, view);
const game = createGame();
const STEP = 1 / 60;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  const s = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  view.scale = s;
  view.offX = (window.innerWidth - VIEW_W * s) / 2;
  view.offY = (window.innerHeight - VIEW_H * s) / 2;
  view.dpr = dpr;
}
window.addEventListener('resize', resize);
resize();
window.addEventListener('keydown', unlockAudio);
window.addEventListener('mousedown', unlockAudio);

function draw() {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = C.ink;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.setTransform(view.scale * view.dpr, 0, 0, view.scale * view.dpr, view.offX * view.dpr, view.offY * view.dpr);
  g.save();
  g.beginPath(); g.rect(0, 0, VIEW_W, VIEW_H); g.clip();
  const t = game.time || 0;
  switch (game.scene) {
    case 'title':
      drawHeistFrame(g, game.attract, t);
      drawTitle(g, t, game.best);
      break;
    case 'plan':
      drawPlanBoard(g, game.plan, t);
      break;
    case 'heist':
      drawHeistFrame(g, game.run, t, { aim: input.mouse, toast: game.toast, shake: game.shake * 6 });
      if (game.paused) drawPaused();
      break;
    case 'caught':
      drawHeistFrame(g, game.run, t);
      drawCaught(g, game.run, t);
      break;
    case 'results':
      drawHeistFrame(g, game.run, t);
      drawResults(g, game.run, game.score, game.purse, t, game.index === LEVELS.length - 1);
      break;
    case 'finale':
      drawHeistFrame(g, game.run, t);
      drawFinale(g, game.purse, game.grades, t);
      break;
  }
  g.restore();
}

function drawPaused() {
  g.fillStyle = 'rgba(6,16,20,0.6)';
  g.fillRect(0, 0, VIEW_W, VIEW_H);
  g.textAlign = 'center';
  g.fillStyle = C.text;
  g.font = font(40, 'bold');
  g.fillText('Paused', 640, 340);
  g.font = font(18);
  g.fillText('Escape: back to the job', 640, 380);
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
let acc = 0;
let last = performance.now();
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!shot) {
    while (acc >= STEP) {
      updateGame(game, input, STEP);
      input.endFrame();
      acc -= STEP;
    }
  }
  draw();
  requestAnimationFrame(frame);
}

if (shot) stageShot(game, shot, Number(params.get('seed') || 1));

// a small handle for automated play-tests
window.__mothlight = {
  game,
  input,
  step(frames = 1) { for (let i = 0; i < frames; i++) { updateGame(game, input, STEP); input.endFrame(); } },
};
requestAnimationFrame(frame);
