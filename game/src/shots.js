// Deterministic screenshot staging. With ?shot=start|play|escaped|caught the
// game opens already posed in that state, driven by a fixed seed, so a
// screenshot taken of it looks the same every time. Normal play ignores it.

import { FIELD } from './config.js';
import { createTurkey, turkeyBox, turkeyJump, turkeySlide, updateTurkey } from './turkey.js';
import { createWorld, updateWorld } from './world.js';

function simulateRun(world, turkey, seconds, brain) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i += 1) {
    brain(world, turkey, i);
    updateWorld(world, 1 / 60, false);
    updateTurkey(turkey, 1 / 60, world.speed);
  }
}

/** A simple autopilot: jump when an obstacle is close, slide under a knife.
 *  It jumps late enough that the turkey is still high when the obstacle passes
 *  under it, and flaps mid-air when a second obstacle follows close behind.
 *  The flap is gated to a genuinely close obstacle: flapping the moment after
 *  a jump would cut the jump short. It fires only while the turkey is falling:
 *  a rising turkey clears the obstacle anyway, and the one flap must be saved
 *  for the follower in a combo, not spent on the obstacle already cleared. */
export function autopilot(world, turkey) {
  const box = turkeyBox(turkey);
  const falling = !turkey.grounded && turkey.vy > 0;
  for (const obstacle of world.obstacles) {
    const gap = obstacle.x - (box.x + box.width);
    if (gap < 0 || gap > 220) continue;
    if (obstacle.kind === 'knife') {
      if (turkey.grounded && gap < 150) turkeySlide(turkey, { slide() {} });
      else if (falling && gap < 120) turkeyJump(turkey, { jump() {}, flap() {} });
    } else if (obstacle.kind === 'puddle') {
      if (turkey.grounded && gap < 140) turkeyJump(turkey, { jump() {}, flap() {} });
      else if (falling && gap < 120) turkeyJump(turkey, { jump() {}, flap() {} });
    } else if (turkey.grounded && gap < 190) {
      turkeyJump(turkey, { jump() {}, flap() {} });
    } else if (falling && gap < 120) {
      turkeyJump(turkey, { jump() {}, flap() {} });
    }
  }
}

export function stageShot(shot, seed) {
  const world = createWorld(seed);
  const turkey = createTurkey();
  const silent = { jump() {}, flap() {}, slide() {}, corn() {}, feather() {}, hit() {}, gobble() {}, escaped() {}, caught() {} };

  if (shot === 'start') {
    // Title screen over a quiet farm: a few obstacles and corn already placed.
    simulateRun(world, turkey, 1.2, () => {});
    return { state: 'title', world, turkey, audio: silent, score: 0, corn: 0, dodged: 0, lives: 3 };
  }

  if (shot === 'play') {
    // Mid-run with the farmer closing in: simulate a lively stretch, then pose
    // the turkey mid-jump over an oven with corn in the air.
    simulateRun(world, turkey, 9, (w, t) => autopilot(w, t));
    turkeyJump(turkey, silent);
    simulateRun(world, turkey, 0.25, () => {});
    return {
      state: 'playing',
      world,
      turkey,
      audio: silent,
      score: 1240,
      corn: 14,
      dodged: 23,
      lives: 2,
      distanceOverride: 612,
    };
  }

  if (shot === 'escaped') {
    simulateRun(world, turkey, 6, (w, t) => autopilot(w, t));
    return {
      state: 'end',
      world,
      turkey,
      audio: silent,
      score: 3420,
      corn: 31,
      dodged: 58,
      lives: 2,
      distanceOverride: 1500,
      result: { won: true, score: 3420, distance: 1500, corn: 31, dodged: 58, newBest: true },
    };
  }

  // caught
  simulateRun(world, turkey, 5, (w, t) => autopilot(w, t));
  return {
    state: 'end',
    world,
    turkey,
    audio: silent,
    score: 860,
    corn: 9,
    dodged: 15,
    lives: 0,
    distanceOverride: 430,
    result: { won: false, score: 860, distance: 430, corn: 9, dodged: 15, newBest: false },
  };
}
