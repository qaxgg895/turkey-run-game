// Synthesised sound effects, WebAudio only, no audio files. Everything is a
// short oscillator blip so the game stays silent until the player first
// presses a key (browsers block audio before a gesture), and mute is one key.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  /** A short tone that slides from one frequency to another. */
  function blip(fromHz, toHz, seconds, type, gainValue, delay = 0) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(fromHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), start + seconds);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    jump() {
      blip(320, 640, 0.14, 'sine', 0.12);
    },
    flap() {
      blip(500, 900, 0.1, 'triangle', 0.08);
    },
    slide() {
      blip(220, 120, 0.12, 'sawtooth', 0.05);
    },
    corn() {
      blip(880, 1320, 0.09, 'sine', 0.1);
      blip(1320, 1760, 0.1, 'sine', 0.08, 0.07);
    },
    feather() {
      blip(660, 990, 0.12, 'triangle', 0.1);
      blip(990, 1480, 0.12, 'triangle', 0.1, 0.09);
      blip(1480, 1980, 0.14, 'sine', 0.08, 0.18);
    },
    hit() {
      blip(220, 60, 0.28, 'sawtooth', 0.16);
    },
    gobble() {
      // A turkey gobble: three quick low clucks.
      blip(180, 90, 0.09, 'square', 0.07);
      blip(170, 85, 0.09, 'square', 0.07, 0.11);
      blip(190, 80, 0.14, 'square', 0.08, 0.22);
    },
    escaped() {
      // A little rising fanfare for making it to the forest.
      blip(523, 523, 0.14, 'triangle', 0.12);
      blip(659, 659, 0.14, 'triangle', 0.12, 0.14);
      blip(784, 784, 0.16, 'triangle', 0.12, 0.28);
      blip(1047, 1047, 0.3, 'triangle', 0.12, 0.44);
    },
    caught() {
      blip(392, 392, 0.2, 'sawtooth', 0.1);
      blip(330, 330, 0.2, 'sawtooth', 0.1, 0.2);
      blip(262, 180, 0.4, 'sawtooth', 0.12, 0.4);
    },
  };
}
