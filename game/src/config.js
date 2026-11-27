// Every tuning number and colour for Turkey Run lives here. The playfield is a
// fixed 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size. The turkey runs right, the farm scrolls
// left, and the farmer chases from behind: every number is about that race.

export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The turkey: a runner, not a dodger. It always moves right; the player jumps, flaps and slides. */
export const TURKEY = {
  x: 250,
  width: 64,
  height: 52,
  runSpeed: 340,
  jumpVelocity: -1150,
  flapVelocity: -800,
  maxFlaps: 1,
  gravity: 2100,
  slideTime: 0.55,
  slideHeight: 30,
  stumbleTime: 0.9,
};

/** The farmer: how far behind the turkey he starts, and how he gains and loses ground. */
export const FARMER = {
  startGap: 210,
  gainOnHit: 55,
  gainOnStumble: 20,
  recoverPerSecond: 40,
  catchGap: 40,
  minGap: 60,
};

/** Three hearts. A hit costs one and shoves the farmer closer; the third hit ends the run. */
export const LIVES = 3;

/** The escape: reach the forest gate at this distance and the turkey is free. */
export const ESCAPE_DISTANCE = 1500;

/** Obstacles. Each kind has its own shape, height and the skill it tests. */
export const OBSTACLES = {
  fence: { width: 46, height: 64, score: 5 },
  haybale: { width: 62, height: 58, score: 5 },
  oven: { width: 84, height: 96, score: 10 },
  knife: { width: 30, height: 130, score: 10 },
  puddle: { width: 110, height: 14, score: 5 },
};

/** Pickups: corn for points, a golden feather for a big bonus. */
export const PICKUPS = {
  corn: { size: 26, points: 10 },
  feather: { size: 30, points: 50 },
};

/** Difficulty ramps with distance: faster scrolling, tighter gaps, more knives. */
export const DIFFICULTY = {
  baseSpeed: 340,
  maxSpeed: 560,
  speedRampPerMetre: 0.14,
  spawnGapMin: 320,
  spawnGapMax: 640,
  gapShrinkPerMetre: 0.09,
  minGap: 260,
  knifeChanceStart: 0.08,
  knifeChancePerMetre: 0.00012,
};

/** Seconds of grace after a hit during which the turkey cannot be hurt again. */
export const INVULNERABLE = 2.0;

/** Points for each metre run, on top of pickups and dodges. */
export const POINTS_PER_METRE = 2;

export const PALETTE = {
  skyTop: '#2b1e4f',
  skyMid: '#b34a5e',
  skyLow: '#f08a3c',
  sun: '#ffd97a',
  sunGlow: 'rgba(255, 217, 122, 0.35)',
  hillFar: '#5a3a5e',
  hillNear: '#3f2c46',
  barn: '#7a2e2e',
  barnRoof: '#4a1f1f',
  ground: '#6b4a26',
  grass: '#7d9b3f',
  grassDark: '#5d7a2e',
  fenceWood: '#8a5a30',
  turkeyBody: '#8a5a30',
  turkeyBelly: '#c98d4e',
  turkeyTail: ['#a0522d', '#d2691e', '#e8a33c', '#7a3b1e'],
  turkeyHead: '#d97b6c',
  turkeyWattle: '#e5534b',
  turkeyBeak: '#f2c94c',
  turkeyLeg: '#e8a33c',
  farmerShirt: '#4a6b8a',
  farmerOveralls: '#2e4a66',
  farmerHat: '#c9a86a',
  farmerSkin: '#e8b98a',
  ovenBody: '#3a3f4a',
  ovenDoor: '#1c1f26',
  ovenGlow: '#ff9a3c',
  knifeBlade: '#d7dce3',
  knifeHandle: '#5a2e1e',
  hay: '#d9b45c',
  hayDark: '#b8933f',
  puddle: '#7a4a1e',
  puddleShine: '#c98d4e',
  corn: '#f2c94c',
  cornHusk: '#5d7a2e',
  feather: '#ffd97a',
  panel: 'rgba(24, 16, 40, 0.82)',
  panelEdge: '#ffd97a',
  text: '#fff6e0',
  muted: '#d8c9a8',
  danger: '#ff5a4b',
  good: '#8be06a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'turkey-run.best';
