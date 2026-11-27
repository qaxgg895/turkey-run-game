# turkey-run-game

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/qaxgg895/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/qaxgg895/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Turkey Run** — a Thanksgiving escape game. It is Thanksgiving morning and the farmer is coming with his carving knife. You are the turkey: run 1,500 metres down the farm lane to the forest gate, jumping fences, hay bales and hot ovens, sliding under swinging carving knives, hopping gravy puddles, and grabbing corn on the way — while the farmer chases you with his pitchfork. Three stumbles and he catches you; reach the gate and you live to gobble another day.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network request — `game/` is plain static files.

## How to play

- **SPACE / ↑ / CLICK** — jump (press again mid-air to flap)
- **↓ / S** — slide under the swinging knives
- **P** — pause, **M** — mute

🌽 corn is +10, 🪶 a golden feather is +50, every metre run and every obstacle dodged adds to your score. The run gets faster and the obstacles come thicker the closer you get to the forest. Your best score is kept in the browser.

## How it is built

- `game/index.html` — the page; everything is drawn on one canvas.
- `game/src/config.js` — all tuning constants in one place.
- `game/src/main.js` — the game loop and state machine (title, playing, caught, escaped).
- `game/src/turkey.js` — the turkey: run, jump, flap, slide, stumble, and how it is drawn.
- `game/src/world.js` — obstacles, pickups, the chasing farmer, spawning and difficulty.
- `game/src/render.js` — all drawing: the sunset farm, the farmer, the HUD and the screens.
- `game/src/input.js` — keyboard, mouse and touch.
- `game/src/audio.js` — synthesised sound effects (WebAudio, no audio files).
- `game/src/shots.js` — deterministic screenshot poses (`?shot=start|play|escaped|caught`) and the autopilot used to play-test the game.
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=qaxgg895&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
