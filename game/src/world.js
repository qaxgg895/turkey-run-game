// The world the turkey runs through: obstacles, pickups, the chasing farmer,
// drifting leaves and the farm scenery scrolling past. Spawning is seeded, so
// the same seed builds the same farm; difficulty grows with distance.

import { DIFFICULTY, ESCAPE_DISTANCE, FARMER, FIELD, OBSTACLES, PICKUPS } from './config.js';
import { makeRandom, pickWeighted } from './random.js';

const OBSTACLE_KINDS = ['fence', 'haybale', 'oven', 'knife', 'puddle'];

export function createWorld(seed) {
  return {
    random: makeRandom(seed),
    seed,
    distance: 0,
    speed: DIFFICULTY.baseSpeed,
    obstacles: [],
    pickups: [],
    leaves: [],
    nextSpawnX: 1400,
    farmerGap: FARMER.startGap,
    scroll: 0,
    spawned: 0,
  };
}

export function worldSpeed(world) {
  const ramp = Math.min(1, world.distance / ESCAPE_DISTANCE);
  return Math.min(
    DIFFICULTY.maxSpeed,
    DIFFICULTY.baseSpeed + world.distance * DIFFICULTY.speedRampPerMetre,
  ) * (1 + ramp * 0.1);
}

function spawnGap(world) {
  const shrink = Math.min(1, world.distance / ESCAPE_DISTANCE);
  const max = DIFFICULTY.spawnGapMax - (DIFFICULTY.spawnGapMax - DIFFICULTY.spawnGapMin) * shrink;
  const gap = DIFFICULTY.spawnGapMin + world.random() * (max - DIFFICULTY.spawnGapMin);
  return Math.max(DIFFICULTY.minGap, gap);
}

function knifeChance(world) {
  return Math.min(0.35, DIFFICULTY.knifeChanceStart + world.distance * DIFFICULTY.knifeChancePerMetre);
}

function spawnObstacle(world, x) {
  const roll = world.random();
  let kind;
  if (roll < knifeChance(world)) kind = 'knife';
  else kind = pickWeighted(world.random, [
    ['fence', 3],
    ['haybale', 3],
    ['oven', 2],
    ['puddle', 2],
  ]);
  const spec = OBSTACLES[kind];
  const obstacle = {
    kind,
    x,
    width: spec.width,
    height: spec.height,
    y: FIELD.groundY - spec.height,
    passed: false,
    hit: false,
  };
  if (kind === 'knife') {
    // A carving knife hangs from above: jump under it while sliding, or time a
    // jump over its low blade — it swings, so its danger zone moves.
    obstacle.y = FIELD.groundY - spec.height;
    obstacle.swing = world.random() * Math.PI * 2;
    obstacle.swingSpeed = 1.6 + world.random() * 1.2;
  }
  if (kind === 'puddle') {
    obstacle.y = FIELD.groundY - spec.height;
  }
  world.obstacles.push(obstacle);
  world.spawned += 1;
  return obstacle;
}

function spawnPickup(world, x, y) {
  const kind = world.random() < 0.12 ? 'feather' : 'corn';
  const spec = PICKUPS[kind];
  world.pickups.push({ kind, x, y, size: spec.size, bob: world.random() * Math.PI * 2, taken: false });
}

function spawnPattern(world, x) {
  // Most spawns are one obstacle with a pickup arc over it; sometimes two
  // close obstacles make a combo, sometimes a lone pickup trail.
  const roll = world.random();
  if (roll < 0.62) {
    const obstacle = spawnObstacle(world, x);
    const arcHeight = 90 + world.random() * 60;
    const count = 2 + Math.floor(world.random() * 2);
    for (let i = 0; i < count; i += 1) {
      spawnPickup(world, x - 40 + i * 44, FIELD.groundY - arcHeight - Math.sin((i / (count - 1)) * Math.PI) * 30);
    }
    if (world.random() < 0.3) {
      spawnPickup(world, x + 130, FIELD.groundY - 60);
    }
  } else if (roll < 0.82) {
    spawnObstacle(world, x);
    spawnObstacle(world, x + 150 + world.random() * 80);
  } else {
    const count = 3 + Math.floor(world.random() * 3);
    for (let i = 0; i < count; i += 1) {
      spawnPickup(world, x + i * 52, FIELD.groundY - 70 - Math.sin(i * 0.9) * 40);
    }
  }
}

function spawnLeaf(world, x) {
  world.leaves.push({
    x: x ?? FIELD.width + 20,
    y: 40 + world.random() * 260,
    vy: 24 + world.random() * 30,
    sway: 20 + world.random() * 30,
    phase: world.random() * Math.PI * 2,
    size: 6 + world.random() * 7,
    color: ['#e8a33c', '#d2691e', '#c94f3d', '#f2c94c'][Math.floor(world.random() * 4)],
  });
}

export function updateWorld(world, dt, stumbled) {
  world.speed = worldSpeed(world);
  const dx = world.speed * dt;
  world.distance += dx / 14; // 14 pixels a metre, roughly.
  world.scroll += dx;

  // The farmer gains on a stumble and slowly falls back while the turkey runs clean.
  if (stumbled) world.farmerGap = Math.max(FARMER.minGap, world.farmerGap - FARMER.gainOnStumble);
  else world.farmerGap = Math.min(FARMER.startGap, world.farmerGap + FARMER.recoverPerSecond * dt);

  // Spawn ahead of the screen.
  world.nextSpawnX -= dx;
  while (world.nextSpawnX < FIELD.width + 200) {
    spawnPattern(world, world.nextSpawnX);
    world.nextSpawnX += spawnGap(world);
  }

  // Move everything left and drop what scrolled off.
  for (const obstacle of world.obstacles) {
    obstacle.x -= dx;
    if (obstacle.kind === 'knife') obstacle.swing += obstacle.swingSpeed * dt;
  }
  world.obstacles = world.obstacles.filter((o) => o.x + o.width > -80);
  for (const pickup of world.pickups) {
    pickup.x -= dx;
    pickup.bob += dt * 3;
  }
  world.pickups = world.pickups.filter((p) => p.x > -60 && !p.taken);

  // Leaves drift down and left.
  if (world.random() < dt * 6) spawnLeaf(world);
  for (const leaf of world.leaves) {
    leaf.x -= dx * 0.35 + leaf.sway * dt * Math.cos(leaf.phase);
    leaf.y += leaf.vy * dt;
    leaf.phase += dt * 2;
  }
  world.leaves = world.leaves.filter((l) => l.x > -30 && l.y < FIELD.height);
}

export function worldProgress(world) {
  return Math.min(1, world.distance / ESCAPE_DISTANCE);
}

export function boxesOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** The knife's danger zone swings: its box is narrower and lower than its sprite.
 *  The blade hangs to 36 px above the ground, so a sliding turkey (30 px tall)
 *  passes under it while a standing one (52 px) is caught. */
export function knifeBox(obstacle) {
  const swing = Math.sin(obstacle.swing) * 26;
  return {
    x: obstacle.x + 6 + swing,
    y: obstacle.y + 30,
    width: obstacle.width - 12,
    height: obstacle.height - 66,
  };
}

export function obstacleBox(obstacle) {
  if (obstacle.kind === 'knife') return knifeBox(obstacle);
  if (obstacle.kind === 'puddle') {
    return { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
  }
  return { x: obstacle.x + 4, y: obstacle.y + 6, width: obstacle.width - 8, height: obstacle.height - 6 };
}
