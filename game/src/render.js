// All drawing: the sunset farm, the obstacles, the farmer, the HUD and the
// title and end screens. The game is canvas-only, no images: every sprite is
// drawn from shapes, so the game runs offline from its own files.

import { ESCAPE_DISTANCE, FIELD, OBSTACLES, PALETTE } from './config.js';
import { drawTurkey } from './turkey.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, scroll) {
  const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
  gradient.addColorStop(0, PALETTE.skyTop);
  gradient.addColorStop(0.55, PALETTE.skyMid);
  gradient.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, FIELD.width, FIELD.groundY + 2);

  // Low sun with a soft glow.
  const sunX = 1010;
  const sunY = 150;
  ctx.fillStyle = PALETTE.sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 58, 0, Math.PI * 2);
  ctx.fill();

  // A few early stars up high.
  ctx.fillStyle = 'rgba(255, 246, 224, 0.7)';
  for (let i = 0; i < 24; i += 1) {
    const x = (i * 397 + 53) % FIELD.width;
    const y = (i * 173 + 29) % 150;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawHills(ctx, scroll) {
  // Far hills.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.groundY);
  for (let x = 0; x <= FIELD.width; x += 80) {
    const hillX = x - ((scroll * 0.15) % 320);
    ctx.lineTo(hillX, FIELD.groundY - 120 - Math.sin((x + scroll * 0.15) * 0.006) * 46);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.closePath();
  ctx.fill();

  // Near hills with trees.
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, FIELD.groundY);
  for (let x = 0; x <= FIELD.width; x += 64) {
    ctx.lineTo(x, FIELD.groundY - 60 - Math.sin((x + scroll * 0.3) * 0.008) * 26);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.closePath();
  ctx.fill();

  // Bare autumn trees on the near hill.
  ctx.strokeStyle = '#2c1e33';
  ctx.lineWidth = 5;
  for (let i = 0; i < 5; i += 1) {
    const treeX = ((i * 331 + 180 - scroll * 0.3) % (FIELD.width + 200) + FIELD.width + 200) % (FIELD.width + 200) - 100;
    const treeY = FIELD.groundY - 62 - Math.sin((treeX + scroll * 0.3) * 0.008) * 26;
    ctx.beginPath();
    ctx.moveTo(treeX, treeY);
    ctx.lineTo(treeX, treeY - 52);
    ctx.moveTo(treeX, treeY - 30);
    ctx.lineTo(treeX - 18, treeY - 52);
    ctx.moveTo(treeX, treeY - 36);
    ctx.lineTo(treeX + 20, treeY - 58);
    ctx.stroke();
  }
}

function drawBarn(ctx, scroll) {
  // The barn drifts past slowly, far behind the action.
  const barnX = ((1150 - scroll * 0.45) % 2600 + 2600) % 2600 - 700;
  if (barnX < -320 || barnX > FIELD.width + 60) return;
  const y = FIELD.groundY - 190;
  ctx.fillStyle = PALETTE.barn;
  ctx.fillRect(barnX, y + 40, 220, 150);
  ctx.fillStyle = PALETTE.barnRoof;
  ctx.beginPath();
  ctx.moveTo(barnX - 14, y + 44);
  ctx.lineTo(barnX + 110, y - 30);
  ctx.lineTo(barnX + 234, y + 44);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8d9b0';
  ctx.fillRect(barnX + 82, y + 110, 56, 80);
  ctx.strokeStyle = '#5a1f1f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(barnX + 82, y + 110);
  ctx.lineTo(barnX + 138, y + 190);
  ctx.moveTo(barnX + 138, y + 110);
  ctx.lineTo(barnX + 82, y + 190);
  ctx.stroke();
}

function drawGround(ctx, scroll) {
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, 14);
  ctx.fillStyle = PALETTE.grassDark;
  // Grass tufts scrolling past.
  for (let i = 0; i < 40; i += 1) {
    const x = ((i * 173 + 40 - scroll) % (FIELD.width + 80) + FIELD.width + 80) % (FIELD.width + 80) - 40;
    ctx.fillRect(x, FIELD.groundY + 2, 3, 9);
    ctx.fillRect(x + 5, FIELD.groundY + 4, 3, 7);
  }
  // Fence posts along the ground, for speed.
  ctx.fillStyle = PALETTE.fenceWood;
  for (let i = 0; i < 9; i += 1) {
    const x = ((i * 173 - scroll * 1.0) % (FIELD.width + 200) + FIELD.width + 200) % (FIELD.width + 200) - 100;
    ctx.fillRect(x, FIELD.groundY - 26, 8, 30);
  }
}

function drawObstacle(ctx, obstacle, time) {
  const { kind, x, y, width, height } = obstacle;
  if (kind === 'fence') {
    ctx.fillStyle = PALETTE.fenceWood;
    ctx.fillRect(x, y + 6, 6, height);
    ctx.fillRect(x + width - 6, y + 6, 6, height);
    ctx.fillRect(x, y + 12, width, 8);
    ctx.fillRect(x, y + 34, width, 8);
  } else if (kind === 'haybale') {
    ctx.fillStyle = PALETTE.hay;
    roundRect(ctx, x, y + 8, width, height - 8, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hayDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2 + 4, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 16);
    ctx.lineTo(x + width - 8, y + 16);
    ctx.moveTo(x + 8, y + height - 12);
    ctx.lineTo(x + width - 8, y + height - 12);
    ctx.stroke();
  } else if (kind === 'oven') {
    ctx.fillStyle = PALETTE.ovenBody;
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.ovenDoor;
    roundRect(ctx, x + 10, y + 18, width - 20, height - 32, 5);
    ctx.fill();
    // The oven is hot: its door glows.
    const flicker = 0.6 + Math.sin(time * 9 + x) * 0.25;
    ctx.fillStyle = `rgba(255, 154, 60, ${flicker})`;
    roundRect(ctx, x + 16, y + 26, width - 32, height - 48, 4);
    ctx.fill();
    ctx.fillStyle = '#8a93a3';
    ctx.fillRect(x + width / 2 - 14, y + 6, 28, 5);
  } else if (kind === 'knife') {
    const swing = Math.sin(obstacle.swing) * 26;
    ctx.save();
    ctx.translate(x + width / 2, y - 6);
    ctx.rotate(Math.sin(obstacle.swing) * 0.22);
    // Rope from above.
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -FIELD.groundY + y + 6);
    ctx.lineTo(0, 0);
    ctx.stroke();
    // Blade, point down — its tip stops 36 px above the ground, so a slide passes under.
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.lineTo(13, 62);
    ctx.lineTo(0, 88);
    ctx.lineTo(-13, 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-8, 6, 3, 48);
    // Handle on top.
    ctx.fillStyle = PALETTE.knifeHandle;
    roundRect(ctx, -16, -22, 32, 24, 6);
    ctx.fill();
    ctx.restore();
  } else if (kind === 'puddle') {
    ctx.fillStyle = PALETTE.puddle;
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2 + 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.puddleShine;
    ctx.beginPath();
    ctx.ellipse(x + width / 2 - 14, y + 4, 22, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPickup(ctx, pickup, time) {
  const bobY = Math.sin(pickup.bob) * 5;
  const x = pickup.x;
  const y = pickup.y + bobY;
  if (pickup.kind === 'corn') {
    ctx.fillStyle = PALETTE.cornHusk;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 4);
    ctx.lineTo(x - 20, y + 16);
    ctx.lineTo(x - 8, y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.corn;
    ctx.beginPath();
    ctx.ellipse(x, y, 9, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a91f';
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(x + i * 5 - 1, y - 10, 2, 20);
    }
  } else {
    // Golden feather: bigger points, spins gently.
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 2 + pickup.bob) * 0.3);
    ctx.fillStyle = PALETTE.feather;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 15, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c98d2e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.lineTo(4, -12);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFarmer(ctx, gap, turkeyX, time) {
  // The farmer runs behind the turkey; the smaller the gap, the closer he is.
  const x = turkeyX - gap;
  if (x < -140) return;
  const y = FIELD.groundY;
  const run = time * 11;
  const bob = Math.abs(Math.sin(run)) * 4;
  ctx.save();
  ctx.translate(x, y - bob);

  // Legs.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(-6 + Math.sin(run) * 14, 0);
  ctx.moveTo(6, -52);
  ctx.lineTo(6 + Math.sin(run + Math.PI) * 14, 0);
  ctx.stroke();

  // Body: overalls and shirt.
  ctx.fillStyle = PALETTE.farmerOveralls;
  roundRect(ctx, -20, -104, 40, 56, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerShirt;
  roundRect(ctx, -22, -104, 44, 26, 8);
  ctx.fill();

  // Arm reaching forward, pitchfork in hand.
  ctx.strokeStyle = PALETTE.farmerSkin;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(10, -92);
  ctx.lineTo(38, -72);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a30';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(38, -72);
  ctx.lineTo(58, -128);
  ctx.stroke();
  ctx.strokeStyle = '#c9ced6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(58, -128);
  ctx.lineTo(50, -146);
  ctx.moveTo(58, -128);
  ctx.lineTo(58, -148);
  ctx.moveTo(58, -128);
  ctx.lineTo(66, -146);
  ctx.stroke();

  // Head with straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(0, -118, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(0, -128, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -146, 26, 18);
  // Angry eyes fixed on the turkey.
  ctx.fillStyle = '#1c1f26';
  ctx.fillRect(6, -122, 4, 4);
  ctx.fillRect(14, -122, 4, 4);

  ctx.restore();
}

function drawLeaves(ctx, leaves) {
  for (const leaf of leaves) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.phase);
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawWorld(ctx, world, turkey, time) {
  drawSky(ctx, world.scroll);
  drawHills(ctx, world.scroll);
  drawBarn(ctx, world.scroll);
  drawGround(ctx, world.scroll);
  for (const pickup of world.pickups) drawPickup(ctx, pickup, time);
  for (const obstacle of world.obstacles) drawObstacle(ctx, obstacle, time);
  drawLeaves(ctx, world.leaves);
  drawTurkey(ctx, turkey, time);
  drawFarmer(ctx, world.farmerGap, 250, time);
}

export function drawHud(ctx, state) {
  const { score, distance, corn, lives, best, muted } = state;
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, 16, 14, 300, 92, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 30px ' + "'system-ui', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('SCORE ' + score, 32, 52);
  ctx.font = '600 19px ' + "'system-ui', sans-serif";
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(Math.floor(distance) + ' m  ·  🌽 ' + corn, 32, 82);
  if (best > 0) ctx.fillText('BEST ' + best, 32, 100 - 4);

  // Lives as hearts, top right.
  for (let i = 0; i < 3; i += 1) {
    const x = FIELD.width - 40 - i * 44;
    const y = 44;
    ctx.fillStyle = i < lives ? '#ff5a4b' : 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 14, y - 6, x - 6, y - 16, x, y - 6);
    ctx.bezierCurveTo(x + 6, y - 16, x + 14, y - 6, x, y + 8);
    ctx.fill();
  }

  // Progress to the forest gate: turkey marker, farmer marker, gate at the end.
  const barX = 360;
  const barW = FIELD.width - 360 - 170;
  const barY = 34;
  const progress = Math.min(1, distance / ESCAPE_DISTANCE);
  ctx.fillStyle = 'rgba(24, 16, 40, 0.82)';
  roundRect(ctx, barX, barY, barW, 16, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.good;
  roundRect(ctx, barX, barY, Math.max(16, barW * progress), 16, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 15px ' + "'system-ui', sans-serif";
  ctx.fillText('🌲 FOREST GATE', barX, barY - 8);
  ctx.fillText('🦃', barX + barW * progress - 8, barY + 30);
  ctx.fillText('👨‍🌾', barX + barW * Math.max(0, progress - 0.06) - 8, barY + 30);

  if (muted) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '600 16px ' + "'system-ui', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('🔇 MUTED (M)', FIELD.width - 20, FIELD.height - 18);
    ctx.textAlign = 'left';
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
}

export function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(20, 12, 36, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 290, 110, 700, 470);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 64px ' + "'system-ui', sans-serif";
  ctx.fillText('🦃 TURKEY RUN', 640, 200);
  ctx.font = '700 30px ' + "'system-ui', sans-serif";
  ctx.fillStyle = PALETTE.sun;
  ctx.fillText('Thanksgiving Escape', 640, 246);
  ctx.font = '400 21px ' + "'system-ui', sans-serif";
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('Thanksgiving morning. The farmer is coming with his carving knife.', 640, 292);
  ctx.fillText('Run 1,500 m to the forest gate — and don’t become dinner.', 640, 322);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 22px ' + "'system-ui', sans-serif";
  ctx.fillText('SPACE / ↑ / CLICK — jump (again mid-air to flap)', 640, 386);
  ctx.fillText('↓ / S — slide under the swinging knives', 640, 418);
  ctx.fillText('🌽 corn +10  ·  🪶 golden feather +50  ·  P pause  ·  M mute', 640, 450);
  ctx.fillStyle = PALETTE.sun;
  ctx.font = '800 26px ' + "'system-ui', sans-serif";
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) ctx.fillText('PRESS SPACE TO RUN', 640, 512);
  if (best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '600 19px ' + "'system-ui', sans-serif";
    ctx.fillText('Best score: ' + best, 640, 548);
  }
  ctx.textAlign = 'left';
}

export function drawEnd(ctx, result) {
  ctx.fillStyle = 'rgba(20, 12, 36, 0.5)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  panel(ctx, 340, 130, 600, 440);
  ctx.textAlign = 'center';
  if (result.won) {
    ctx.fillStyle = PALETTE.good;
    ctx.font = '800 58px ' + "'system-ui', sans-serif";
    ctx.fillText('🎉 ESCAPED!', 640, 220);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '400 22px ' + "'system-ui', sans-serif";
    ctx.fillText('You made it to the forest. The turkey lives', 640, 268);
    ctx.fillText('to gobble another day — no dinner tonight!', 640, 298);
  } else {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = '800 58px ' + "'system-ui', sans-serif";
    ctx.fillText('😱 CAUGHT!', 640, 220);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '400 22px ' + "'system-ui', sans-serif";
    ctx.fillText('The farmer got you. The oven was already warm…', 640, 268);
    ctx.fillText('But every turkey deserves a second run.', 640, 298);
  }
  ctx.fillStyle = PALETTE.sun;
  ctx.font = '700 30px ' + "'system-ui', sans-serif";
  ctx.fillText('SCORE ' + result.score, 640, 368);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 20px ' + "'system-ui', sans-serif";
  ctx.fillText(
    Math.floor(result.distance) + ' m run  ·  🌽 ' + result.corn + ' corn  ·  ' + result.dodged + ' dodged',
    640,
    404,
  );
  if (result.newBest) {
    ctx.fillStyle = PALETTE.good;
    ctx.font = '800 22px ' + "'system-ui', sans-serif";
    ctx.fillText('★ NEW BEST SCORE ★', 640, 442);
  }
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  if (blink) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = '800 24px ' + "'system-ui', sans-serif";
    ctx.fillText('PRESS SPACE TO RUN AGAIN', 640, 510);
  }
  ctx.textAlign = 'left';
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 12, 36, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 52px ' + "'system-ui', sans-serif";
  ctx.fillText('⏸ PAUSED', 640, 340);
  ctx.font = '400 22px ' + "'system-ui', sans-serif";
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('Press P to keep running', 640, 384);
  ctx.textAlign = 'left';
}
