// Turkey Run: the game loop. States: title → playing → end (escaped or
// caught), with pause on top of playing. A fixed 60 Hz step keeps the
// simulation identical on any display; rendering scales the 1280x720 field to
// the window. ?shot= stages a screenshot pose; ?autoplay=1 plays itself, so
// the game can be exercised headlessly.

import {
  BEST_KEY,
  ESCAPE_DISTANCE,
  FARMER,
  FIELD,
  LIVES,
  OBSTACLES,
  PICKUPS,
  POINTS_PER_METRE,
  STEP,
} from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawEnd, drawHud, drawPaused, drawTitle, drawWorld } from './render.js';
import { autopilot, stageShot } from './shots.js';
import {
  createTurkey,
  turkeyBox,
  turkeyJump,
  turkeySlide,
  turkeyStumble,
  updateTurkey,
} from './turkey.js';
import { boxesOverlap, createWorld, obstacleBox, updateWorld, worldProgress } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const autoplay = params.get('autoplay') === '1';
const seed = Number(params.get('seed') || 20261127);

const input = createInput(canvas);
const audio = createAudio();

let world;
let turkey;
let state = 'title';
let paused = false;
let score = 0;
let corn = 0;
let dodged = 0;
let lives = LIVES;
let best = 0;
let result = null;
let distanceShown = 0;
let runTime = 0;
let hits = [];
let lastStatus = '';

try {
  best = Number(localStorage.getItem(BEST_KEY) || 0) || 0;
} catch {
  best = 0;
}

function reset(seedValue) {
  world = createWorld(seedValue);
  turkey = createTurkey();
  score = 0;
  corn = 0;
  dodged = 0;
  lives = LIVES;
  result = null;
  distanceShown = 0;
  runTime = 0;
  hits = [];
}

function startRun() {
  reset((seed + Math.floor(Math.random() * 100000)) >>> 0);
  state = 'playing';
  paused = false;
  audio.unlock();
  audio.gobble();
  input.clear();
  announce('Running! Jump the fences and ovens, slide under the knives, grab the corn.');
}

function endRun(won) {
  state = 'end';
  const finalScore = score;
  const newBest = finalScore > best;
  if (newBest) {
    best = finalScore;
    try {
      localStorage.setItem(BEST_KEY, String(best));
    } catch {
      // Best score is a nicety; a browser that blocks storage still plays.
    }
  }
  result = {
    won,
    score: finalScore,
    distance: world.distance,
    corn,
    dodged,
    newBest,
  };
  if (won) audio.escaped();
  else audio.caught();
  announce(won ? 'Escaped! Score ' + finalScore : 'Caught! Score ' + finalScore + '. Press space to run again.');
}

function announce(text) {
  if (text === lastStatus) return;
  lastStatus = text;
  statusEl.textContent = text;
}

function resize() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = Math.round(FIELD.width * scale);
  canvas.height = Math.round(FIELD.height * scale);
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
}

function step() {
  // A staged screenshot pose is frozen: the pose is the screenshot.
  if (shot) return;
  if (state !== 'playing' || paused) return;
  runTime += STEP;

  // Player input.
  if (input.tappedJump()) turkeyJump(turkey, audio);
  if (input.tappedSlide()) turkeySlide(turkey, audio);
  // A staged play screenshot keeps dodging on its own so its pose stays lively.
  if (autoplay || shot === 'play') autopilot(world, turkey);

  const stumbled = turkey.stumbleTimer > 0;
  updateWorld(world, STEP, stumbled);
  updateTurkey(turkey, STEP, world.speed);

  // Distance score.
  score += Math.round(world.speed * STEP * POINTS_PER_METRE / 14);

  // Obstacles: dodge points, and hits.
  const box = turkeyBox(turkey);
  for (const obstacle of world.obstacles) {
    if (!obstacle.passed && obstacle.x + obstacle.width < box.x) {
      obstacle.passed = true;
      dodged += 1;
      score += OBSTACLES[obstacle.kind].score;
    }
    if (!obstacle.hit && turkey.invulnerableTimer <= 0 && boxesOverlap(box, obstacleBox(obstacle))) {
      obstacle.hit = true;
      lives -= 1;
      hits.push({ time: Math.round(runTime * 10) / 10, kind: obstacle.kind, gap: Math.round(world.farmerGap), lives });
      audio.hit();
      turkeyStumble(turkey);
      world.farmerGap = Math.max(FARMER.minGap, world.farmerGap - FARMER.gainOnHit);
      if (lives <= 0) {
        endRun(false);
        return;
      }
      announce('Ouch! ' + lives + (lives === 1 ? ' life' : ' lives') + ' left — the farmer is closer!');
    }
  }

  // Pickups.
  for (const pickup of world.pickups) {
    if (pickup.taken) continue;
    const pickupBox = { x: pickup.x - pickup.size / 2, y: pickup.y - pickup.size / 2, width: pickup.size, height: pickup.size };
    if (boxesOverlap(box, pickupBox)) {
      pickup.taken = true;
      corn += pickup.kind === 'corn' ? 1 : 0;
      score += PICKUPS[pickup.kind].points;
      if (pickup.kind === 'corn') audio.corn();
      else audio.feather();
    }
  }

  // Caught by the farmer, or escaped to the forest.
  if (world.farmerGap <= FARMER.catchGap) {
    endRun(false);
    return;
  }
  if (world.distance >= ESCAPE_DISTANCE) {
    endRun(true);
    return;
  }
}

function frame(time) {
  // Fixed-step simulation, then one render.
  let accumulator = frame.accumulator ?? 0;
  accumulator += Math.min(0.1, (time - (frame.last ?? time)) / 1000);
  frame.last = time;
  while (accumulator >= STEP) {
    step();
    accumulator -= STEP;
  }
  frame.accumulator = accumulator;

  // Global keys, handled once a frame.
  if (input.tapped('KeyP') && state === 'playing') {
    paused = !paused;
    input.clear();
  }
  if (input.tapped('KeyM')) {
    audio.toggleMute();
  }
  if (state === 'title' && input.tappedAny()) {
    startRun();
  } else if (state === 'end' && input.tappedAny() && runTime >= 0) {
    startRun();
  }

  render(time / 1000);
  requestAnimationFrame(frame);
}

function render(time) {
  const scaleX = canvas.width / FIELD.width;
  const scaleY = canvas.height / FIELD.height;
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);

  const shownDistance = distanceShown || world.distance;
  drawWorld(ctx, world, turkey, time);
  if (state === 'playing' || state === 'end') {
    drawHud(ctx, {
      score,
      distance: shownDistance,
      corn,
      lives,
      best,
      muted: audio.muted,
    });
  }
  if (state === 'title') drawTitle(ctx, best);
  if (state === 'end' && result) drawEnd(ctx, result);
  if (paused && state === 'playing') drawPaused(ctx);
}

// Boot: a staged screenshot pose, or a fresh title screen.
if (shot) {
  const staged = stageShot(shot, seed);
  world = staged.world;
  turkey = staged.turkey;
  state = staged.state;
  score = staged.score;
  corn = staged.corn;
  dodged = staged.dodged;
  lives = staged.lives;
  result = staged.result ?? null;
  distanceShown = staged.distanceOverride ?? 0;
  world.distance = staged.distanceOverride ?? world.distance;
} else {
  reset(seed);
}
if (autoplay && state === 'title') startRun();

window.addEventListener('resize', resize);
resize();
render(0);
requestAnimationFrame(frame);

// A handle for headless play-tests: the state the game is in, nothing more.
window.__turkeyRun = {
  get state() {
    return state;
  },
  get score() {
    return score;
  },
  get distance() {
    return world.distance;
  },
  get lives() {
    return lives;
  },
  get corn() {
    return corn;
  },
  get dodged() {
    return dodged;
  },
  get farmerGap() {
    return world.farmerGap;
  },
  get hits() {
    return hits;
  },
  get turkeyY() {
    return Math.round(turkey.y);
  },
  get grounded() {
    return turkey.grounded;
  },
  get speed() {
    return Math.round(world.speed);
  },
  get nearest() {
    const box = turkeyBox(turkey);
    let best = null;
    for (const o of world.obstacles) {
      const gap = Math.round(o.x - (box.x + box.width));
      if (gap >= -50 && (!best || gap < best.gap)) best = { kind: o.kind, gap, x: Math.round(o.x) };
    }
    return best;
  },
  get paused() {
    return paused;
  },
  start: () => startRun(),
  jump: () => turkeyJump(turkey, audio),
  slide: () => turkeySlide(turkey, audio),
};
