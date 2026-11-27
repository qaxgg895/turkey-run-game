// The turkey: physics (run, jump, flap, slide, stumble) and how it is drawn.
// The turkey never moves left or right on screen; the world scrolls past it.
// Its vertical position, slide state and stumble timer are the whole model.

import { FIELD, INVULNERABLE, TURKEY } from './config.js';

export function createTurkey() {
  return {
    y: FIELD.groundY - TURKEY.height,
    vy: 0,
    grounded: true,
    flapsLeft: TURKEY.maxFlaps,
    sliding: false,
    slideTimer: 0,
    stumbleTimer: 0,
    invulnerableTimer: 0,
    runCycle: 0,
    wingFlap: 0,
  };
}

export function turkeyHeight(turkey) {
  return turkey.sliding ? TURKEY.slideHeight : TURKEY.height;
}

export function turkeyBox(turkey) {
  const height = turkeyHeight(turkey);
  return {
    x: TURKEY.x,
    y: turkey.y + (TURKEY.height - height),
    width: TURKEY.width,
    height,
  };
}

export function turkeyJump(turkey, audio) {
  if (turkey.stumbleTimer > 0) return false;
  if (turkey.grounded) {
    turkey.vy = TURKEY.jumpVelocity;
    turkey.grounded = false;
    turkey.sliding = false;
    turkey.slideTimer = 0;
    turkey.wingFlap = 1;
    audio.jump();
    return true;
  }
  if (turkey.flapsLeft > 0) {
    turkey.flapsLeft -= 1;
    turkey.vy = TURKEY.flapVelocity;
    turkey.wingFlap = 1;
    audio.flap();
    return true;
  }
  return false;
}

export function turkeySlide(turkey, audio) {
  if (!turkey.grounded || turkey.stumbleTimer > 0) return false;
  turkey.sliding = true;
  turkey.slideTimer = TURKEY.slideTime;
  audio.slide();
  return true;
}

export function turkeyStumble(turkey) {
  turkey.stumbleTimer = TURKEY.stumbleTime;
  turkey.invulnerableTimer = Math.max(turkey.invulnerableTimer, INVULNERABLE);
  turkey.sliding = false;
  turkey.slideTimer = 0;
  turkey.vy = -260;
  turkey.grounded = false;
}

export function updateTurkey(turkey, dt, speed) {
  turkey.runCycle += dt * (speed / 34);
  if (turkey.wingFlap > 0) turkey.wingFlap = Math.max(0, turkey.wingFlap - dt * 3);
  if (turkey.invulnerableTimer > 0) turkey.invulnerableTimer -= dt;
  if (turkey.stumbleTimer > 0) turkey.stumbleTimer -= dt;

  if (turkey.slideTimer > 0) {
    turkey.slideTimer -= dt;
    if (turkey.slideTimer <= 0) turkey.sliding = false;
  }

  if (!turkey.grounded) {
    turkey.vy += TURKEY.gravity * dt;
    turkey.y += turkey.vy * dt;
    const floor = FIELD.groundY - TURKEY.height;
    if (turkey.y >= floor) {
      turkey.y = floor;
      turkey.vy = 0;
      turkey.grounded = true;
      turkey.flapsLeft = TURKEY.maxFlaps;
    }
  }
}

/** Draw the turkey at its screen position. `time` drives the run-cycle bob. */
export function drawTurkey(ctx, turkey, time) {
  const box = turkeyBox(turkey);
  const cx = box.x + box.width / 2;
  const ground = FIELD.groundY;
  const bob = turkey.grounded && !turkey.sliding ? Math.sin(turkey.runCycle * 2) * 2 : 0;
  const bodyY = box.y + box.height * 0.55 + bob;
  const blink = turkey.invulnerableTimer > 0 && Math.floor(time * 12) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.45;

  const slide = turkey.sliding;
  const stumble = turkey.stumbleTimer > 0;
  const lean = stumble ? -0.35 : slide ? 0.5 : 0.12;

  ctx.save();
  ctx.translate(cx, bodyY);
  ctx.rotate(lean);

  // Tail feathers, fanned behind.
  const tailColors = ['#a0522d', '#d2691e', '#e8a33c', '#7a3b1e'];
  for (let i = 0; i < 4; i += 1) {
    const angle = -0.9 + i * 0.42 - 0.2;
    ctx.save();
    ctx.translate(-26, -6);
    ctx.rotate(angle + (slide ? 0.5 : 0));
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(-14, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Body: a plump oval.
  ctx.fillStyle = '#8a5a30';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, slide ? 16 : 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98d4e';
  ctx.beginPath();
  ctx.ellipse(6, 6, 20, slide ? 10 : 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing, flapping when airborne.
  const wingLift = turkey.grounded ? Math.sin(turkey.runCycle * 2) * 3 : -14 - turkey.wingFlap * 10;
  ctx.fillStyle = '#6e4525';
  ctx.beginPath();
  ctx.ellipse(-4, -2 + wingLift * 0.4, 18, 10, -0.4 + wingLift * 0.02, 0, Math.PI * 2);
  ctx.fill();

  // Head and neck, up front and high.
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(20, -30, 9, 18);
  ctx.fillStyle = '#d97b6c';
  ctx.beginPath();
  ctx.arc(26, -34, 11, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.moveTo(35, -36);
  ctx.lineTo(46, -32);
  ctx.lineTo(35, -29);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.ellipse(30, -24, 4, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Eye: wide when running, squeezed shut while stumbling.
  ctx.fillStyle = '#1c1f26';
  if (stumble) {
    ctx.fillRect(27, -37, 6, 2);
  } else {
    ctx.beginPath();
    ctx.arc(29, -36, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Legs: scissoring with the run cycle on the ground, tucked up while airborne.
  if (!turkey.grounded) {
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 8, bodyY + 16);
    ctx.lineTo(cx - 12, bodyY + 34);
    ctx.moveTo(cx + 8, bodyY + 16);
    ctx.lineTo(cx + 12, bodyY + 34);
    ctx.stroke();
  } else if (!slide) {
    const phase = turkey.runCycle;
    const legA = Math.sin(phase) * 10;
    const legB = Math.sin(phase + Math.PI) * 10;
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 8, bodyY + 16);
    ctx.lineTo(cx - 8 + legA, ground);
    ctx.moveTo(cx + 8, bodyY + 16);
    ctx.lineTo(cx + 8 + legB, ground);
    ctx.stroke();
  }

  // Shadow: smaller and fainter the higher the turkey is above the ground.
  const heightAbove = Math.max(0, ground - (box.y + box.height));
  const shadowScale = Math.max(0.45, 1 - heightAbove / 700);
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.08, 0.25 * (1 - heightAbove / 500))})`;
  ctx.beginPath();
  ctx.ellipse(cx, ground + 6, 34 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}
