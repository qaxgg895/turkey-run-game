// Keyboard, mouse and touch input. The game reads these three intents only:
// jump (or flap in the air), slide, and the generic "press" that starts the
// game and restarts it. Everything else (pause, mute) is a single key.

export function createInput(canvas) {
  const pressed = new Set();
  const queue = [];

  function note(code) {
    if (!pressed.has(code)) queue.push(code);
    pressed.add(code);
  }

  function release(code) {
    pressed.delete(code);
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    const code = event.code;
    if (code === 'Space' || code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight') {
      event.preventDefault();
    }
    note(code);
  }

  function onKeyUp(event) {
    release(event.code);
  }

  function onPointerDown(event) {
    event.preventDefault();
    note('Pointer');
    canvas.focus();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('touchstart', onPointerDown, { passive: false });

  return {
    /** True while the key is held down. */
    held(code) {
      return pressed.has(code);
    },
    /** True on the frame the key was pressed, then consumed. */
    tapped(code) {
      const index = queue.indexOf(code);
      if (index === -1) return false;
      queue.splice(index, 1);
      return true;
    },
    /** True on the frame any jump key or a click/tap happened, then consumed. */
    tappedJump() {
      return this.tapped('Space') || this.tapped('ArrowUp') || this.tapped('KeyW') || this.tapped('Pointer');
    },
    /** True on the frame any slide key happened, then consumed. */
    tappedSlide() {
      return this.tapped('ArrowDown') || this.tapped('KeyS');
    },
    /** True on the frame any "press to continue" key happened, then consumed. */
    tappedAny() {
      if (queue.length === 0) return false;
      queue.length = 0;
      return true;
    },
    /** Drop queued presses (used when the state changes). */
    clear() {
      queue.length = 0;
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('touchstart', onPointerDown);
    },
  };
}
