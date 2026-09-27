# Star Scavenger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 60-second pixel-art dodge-and-collect survival game that a teacher can change live in front of absolute beginners, and that students can play on their phones from a public URL.

**Architecture:** Four hand-written files loaded as classic `<script>` tags — `config.js` (every tunable number), `sprites.js` (ASCII pixel art), `game.js` (loop, state, entities), `index.html` (canvas, styles, error net). No engine, no build step, no dependencies. Gameplay logic that can silently be wrong lives in pure functions on `Game.pure`, asserted by `tests.html` in a browser.

**Tech Stack:** HTML5 Canvas 2D, plain ES2015+ JavaScript, WebAudio (synthesised, no files), `python3 -m http.server` for local serving, GitHub Pages for deployment. No npm, no bundler, no framework, no test library.

**Spec:** `docs/superpowers/specs/2026-09-27-star-scavenger-design.md`

## Global Constraints

Every task's requirements implicitly include all of these. Values are copied verbatim from the spec.

- **No dependencies.** No npm, no bundler, no ES modules, no TypeScript, no test library. Nothing is installed to run or test this.
- **Classic script tags only**, loaded in this order: `config.js` → `sprites.js` → `game.js`. They share one global lexical scope, so every top-level `const` name must be unique across all three files.
- **Every gameplay number lives in `CONFIG` in `config.js`.** No gameplay constant may be hardcoded in `game.js`. This is the project's whole purpose; a magic number in `game.js` is a defect.
- **Arena is 400 × 400 logical units.** All entity coordinates are in logical units, never pixels.
- **Frame delta is clamped to 0.025 s (25 ms).** Not 50 — at 50 ms a head-on ship and asteroid close 18.0 px against a 10.8 px combined radius and pass through each other.
- **Canvas scale is an integer**, remainder letterboxed. Fractional scale plus disabled smoothing renders some source pixels 2 physical pixels wide and others 3.
- **Error handlers are installed in an inline `<script>` at the top of `index.html`**, never in `game.js`. A script that fails to parse never runs any of its own lines.
- **`game.js` must not start itself.** It defines `Game` and nothing else executes; `index.html` calls `Game.start(canvas)`. This is what lets `tests.html` load it.
- **Live asteroid cap is 20.** Frame delta clamp is 25 ms. Survive time is 60 s. Ship speed 220 px/s, ship radius 6, 3 lives, 1.5 s invincibility.
- **Image smoothing is always disabled** (`ctx.imageSmoothingEnabled = false`) on every context, including offscreen sprite canvases.
- **Touch input is speed-capped at `CONFIG.SHIP_SPEED`**, the same as the keyboard, so a phone cannot outscore a desktop.
- **Commit after every task.** Conventional-commit prefixes (`feat:`, `test:`, `docs:`, `chore:`).

## How to run the tests

There is no test runner to install. `tests.html` defines `window.__testResults = {passed, failed, failures: []}` and logs a single `TESTS` line to the console.

- **Human:** start the server (`./serve.command` or `python3 -m http.server 8000`), open `http://localhost:8000/tests.html`, read the page — green means pass.
- **Agentic worker:** navigate a real Chrome to `http://localhost:8000/tests.html`, then evaluate `() => JSON.stringify(window.__testResults)` and assert `failed === 0`. Reload the page to re-run; there is no watch mode.

Tests must be served over `http://`, not opened as `file://` — on `file://` a failing assertion's error text is masked as `"Script error."`.

## File structure

| File | Responsibility |
|---|---|
| `index.html` | Canvas element, page CSS, the inline error net, and the single `Game.start()` call. Contains no gameplay logic. |
| `config.js` | `const CONFIG` — every tunable number, grouped under comment banners, nothing else. |
| `sprites.js` | `const PALETTE` (character → colour) and `const SPRITES` (name → array of ASCII rows). No code. |
| `game.js` | `const Game` — `Game.start(canvas)`, `Game.pure` (the tested helpers), and all private loop/state/draw functions. The only file with behaviour. |
| `tests.html` | A ~40-line assertion harness plus every test, loading the three scripts. |
| `serve.command` | Executable. Double-click to serve on :8000 and open the game. |
| `README.md` | What it is, how to run it, the play URL. |
| `TEACHING.md` | The class cheat-sheet, the smoke checklist, and troubleshooting. |

`config.js` is separate from `game.js` so the projector never scrolls past the game loop to reach the number being changed. `game.js` is the one large file; it stays coherent because everything in it is the loop and the loop's helpers, and because all of its *numbers* live elsewhere.

---

### Task 1: Scaffolding and the error net

The safety net comes first, because every later task is debugged through it.

**Files:**
- Create: `index.html`, `config.js`, `sprites.js`, `game.js`, `serve.command`, `.gitignore`
- Test: manual verification in a browser (no pure logic exists yet)

**Interfaces:**
- Consumes: nothing.
- Produces: `CONFIG` (object, initially `{ARENA: 400}`), `SPRITES` (object, initially `{}`), `PALETTE` (object, initially `{}`), `Game.start(canvas)` (draws one frame of flat colour and returns undefined), and a global `window.__showError(message, source)` installed by `index.html`.

- [ ] **Step 1: Create `.gitignore`**

```
.DS_Store
```

- [ ] **Step 2: Create `serve.command` and make it executable**

```bash
#!/bin/bash
# Double-click this file to play. It serves the folder on port 8000 so that
# error messages show up properly, then opens the game in your browser.
cd "$(dirname "$0")" || exit 1
python3 -m http.server 8000 &
SERVER_PID=$!
until curl -sf -o /dev/null http://localhost:8000/index.html; do sleep 0.2; done
open http://localhost:8000/index.html
echo "Serving on http://localhost:8000/  — close this window to stop."
wait $SERVER_PID
```

Then: `chmod +x serve.command`

- [ ] **Step 3: Create `config.js` with only the arena size**

```javascript
// ═══════════════════════════════════════════════════════════════
//  STAR SCAVENGER — every number you can change lives in here.
//  Change one, save, and reload the page. That's the whole loop.
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // ── The playfield ────────────────────────────────────────────
  ARENA: 400,              // The game is 400 x 400 units, always.
};
```

- [ ] **Step 4: Create `sprites.js` as empty shells**

```javascript
// The pixel art. Each sprite is drawn with letters; each letter is a colour
// in PALETTE below. Change a letter, reload, and the art changes.

const PALETTE = {};

const SPRITES = {};
```

- [ ] **Step 5: Create `game.js` with a `start` that proves the canvas works**

```javascript
// The game itself. You should not need to change this file to change how the
// game plays — all the numbers are in config.js.

const Game = {
  pure: {},

  start: function (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    canvas.width = CONFIG.ARENA;
    canvas.height = CONFIG.ARENA;
    ctx.fillStyle = '#10131c';
    ctx.fillRect(0, 0, CONFIG.ARENA, CONFIG.ARENA);
    ctx.fillStyle = '#e8e8ff';
    ctx.font = '16px monospace';
    ctx.fillText('STAR SCAVENGER', 120, 200);
  },
};
```

- [ ] **Step 6: Create `index.html` with the error net installed first**

The error net is two layers. `try/catch` is primary because it keeps the real message even on `file://`; the window listener is the backstop for parse errors, which `try/catch` cannot reach.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Star Scavenger</title>
<style>
  html, body {
    margin: 0; height: 100%; background: #05060a;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    touch-action: none; user-select: none; -webkit-user-select: none;
    font-family: ui-monospace, Menlo, Consolas, monospace;
  }
  canvas { image-rendering: pixelated; display: block; }
  #error {
    display: none; position: fixed; inset: 0; padding: 24px;
    background: #2a0b12; color: #ffb3c0; font-size: 14px;
    line-height: 1.6; white-space: pre-wrap; overflow: auto; z-index: 10;
  }
  #error b { color: #fff; }
</style>
</head>
<body>

<!-- The error net is installed BEFORE any other script. A script that fails to
     parse never runs a single one of its own lines, so a handler living inside
     game.js is exactly the handler that is missing when game.js is what broke. -->
<script>
  window.__showError = function (message, source) {
    var box = document.getElementById('error');
    if (!box) return;
    var hint = '';
    if (location.protocol === 'file:') {
      hint = '\n\nYou opened this file directly, so the browser hides the real ' +
             'message.\nDouble-click serve.command and try again, or press ' +
             'Cmd-Option-J to see it in the console.';
    }
    box.innerHTML = '<b>The game stopped. Here is why:</b>\n\n' +
      String(message).replace(/[<&]/g, function (c) { return c === '<' ? '&lt;' : '&amp;'; }) +
      (source ? '\n\nin ' + source : '') + hint;
    box.style.display = 'block';
  };
  window.addEventListener('error', function (e) {
    window.__showError(e.message || 'Unknown error', (e.filename || '').split('/').pop());
  });
  window.addEventListener('unhandledrejection', function (e) {
    window.__showError('Unhandled promise rejection: ' + (e.reason && e.reason.message || e.reason), '');
  });
</script>

<div id="error"></div>
<canvas id="game"></canvas>

<script src="config.js"></script>
<script src="sprites.js"></script>
<script src="game.js"></script>
<script>
  // try/catch is the primary reporter: it keeps the real message and stack even
  // when the page is on file://, where the window listener only gets
  // "Script error." with no filename.
  try {
    Game.start(document.getElementById('game'));
  } catch (e) {
    window.__showError((e && e.stack) || String(e), 'game.js');
  }
</script>
</body>
</html>
```

- [ ] **Step 7: Verify the game draws**

Run: `./serve.command` (or `python3 -m http.server 8000` and open `http://localhost:8000/index.html`)
Expected: a dark square with "STAR SCAVENGER" in it. Console has no errors.

- [ ] **Step 8: Verify the error net catches a runtime error**

Temporarily change `game.js` line `const ctx = canvas.getContext('2d');` to `const ctx = canvas.getContextTYPO('2d');`, reload.
Expected: the red panel reads `TypeError: canvas.getContextTYPO is not a function` with a stack. **Revert the typo.**

- [ ] **Step 9: Verify the error net catches a parse error**

Temporarily append a lone `}` to the end of `config.js`, reload.
Expected: the red panel reads `Uncaught SyntaxError: Unexpected token '}'` and names `config.js`. **Remove the stray brace.**

This step is the one that proves the design. If it shows `"Script error."`, the page is being served from `file://` — use the server.

- [ ] **Step 10: Commit**

```bash
git add .gitignore serve.command config.js sprites.js game.js index.html
git commit -m "feat: scaffold game files and the on-screen error net"
```

---

### Task 2: Test harness and the pure helpers

**Files:**
- Create: `tests.html`
- Modify: `game.js` (add to `Game.pure`)

**Interfaces:**
- Consumes: `CONFIG`, `Game.pure` from Task 1.
- Produces:
  - `Game.pure.clamp(v, lo, hi) -> number`
  - `Game.pure.lerp(a, b, t) -> number`
  - `Game.pure.circlesOverlap(ax, ay, ar, bx, by, br) -> boolean`
  - `Game.pure.formatTime(seconds) -> string` — `"M:SS"`, never negative
  - `Game.pure.difficultyAt(elapsed, cfg) -> {spawnInterval: number, speed: number}`
  - `window.__testResults -> {passed: number, failed: number, failures: string[]}`

- [ ] **Step 1: Write the failing tests**

Create `tests.html`:

```html
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Star Scavenger tests</title>
<style>
  body { font: 14px ui-monospace, Menlo, monospace; background: #0d1017; color: #cfd6e6; padding: 24px; }
  .pass { color: #7ee787; } .fail { color: #ff7b72; font-weight: bold; }
  h1 { font-size: 18px; }
</style></head>
<body>
<h1>Star Scavenger tests</h1>
<div id="out"></div>

<script src="config.js"></script>
<script src="sprites.js"></script>
<script src="game.js"></script>
<script>
// ── A test harness in 20 lines, because we have no dependencies ──
var results = { passed: 0, failed: 0, failures: [] };
var lines = [];
function eq(actual, expected, what) {
  var a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { results.passed++; lines.push('<div class="pass">PASS ' + what + '</div>'); }
  else {
    results.failed++;
    var msg = what + ' — expected ' + e + ' but got ' + a;
    results.failures.push(msg);
    lines.push('<div class="fail">FAIL ' + msg + '</div>');
  }
}
function near(actual, expected, what, tol) {
  tol = tol === undefined ? 1e-9 : tol;
  if (Math.abs(actual - expected) <= tol) { results.passed++; lines.push('<div class="pass">PASS ' + what + '</div>'); }
  else {
    results.failed++;
    var msg2 = what + ' — expected ~' + expected + ' but got ' + actual;
    results.failures.push(msg2);
    lines.push('<div class="fail">FAIL ' + msg2 + '</div>');
  }
}
// A deterministic stand-in for Math.random: returns the given numbers in order,
// then repeats the last one forever.
function fakeRng(values) {
  var i = 0;
  return function () { var v = values[Math.min(i, values.length - 1)]; i++; return v; };
}

var P = Game.pure;

// ── clamp ──
eq(P.clamp(5, 0, 10), 5, 'clamp leaves a value inside the range alone');
eq(P.clamp(-3, 0, 10), 0, 'clamp raises a value below the range');
eq(P.clamp(99, 0, 10), 10, 'clamp lowers a value above the range');

// ── lerp ──
eq(P.lerp(0, 100, 0), 0, 'lerp at 0 gives the start');
eq(P.lerp(0, 100, 1), 100, 'lerp at 1 gives the end');
eq(P.lerp(0, 100, 0.25), 25, 'lerp interpolates');
near(P.lerp(1.2, 0.4, 0.5), 0.8, 'lerp counts downwards too');

// ── circlesOverlap ──
eq(P.circlesOverlap(0, 0, 5, 0, 9, 5), true, 'circles overlap when closer than the sum of radii');
eq(P.circlesOverlap(0, 0, 5, 0, 11, 5), false, 'circles miss when further than the sum of radii');
eq(P.circlesOverlap(0, 0, 5, 0, 10, 5), false, 'exactly touching does not count as a hit');
eq(P.circlesOverlap(0, 0, 6, 3, 4, 4.8), true, 'a ship and the smallest asteroid collide at 5 units apart');

// ── formatTime ──
eq(P.formatTime(60), '1:00', 'formatTime shows a full minute');
eq(P.formatTime(59.9), '0:59', 'formatTime floors partial seconds');
eq(P.formatTime(9), '0:09', 'formatTime zero-pads seconds');
eq(P.formatTime(0), '0:00', 'formatTime handles zero');
eq(P.formatTime(-2), '0:00', 'formatTime never shows a negative clock');

// ── difficultyAt ──
var d0 = P.difficultyAt(0, CONFIG);
near(d0.spawnInterval, 1.2, 'at 0s asteroids spawn every 1.2s');
near(d0.speed, 60, 'at 0s asteroids move at 60 px/s');
var d60 = P.difficultyAt(60, CONFIG);
near(d60.spawnInterval, 0.4, 'at 60s asteroids spawn every 0.4s');
near(d60.speed, 140, 'at 60s asteroids move at 140 px/s');
var d30 = P.difficultyAt(30, CONFIG);
near(d30.spawnInterval, 0.8, 'halfway through, the spawn interval is halfway');
near(d30.speed, 100, 'halfway through, the speed is halfway');
var dLate = P.difficultyAt(999, CONFIG);
near(dLate.speed, 140, 'difficulty stops rising past the end of the run');

document.getElementById('out').innerHTML =
  '<p>' + results.passed + ' passed, ' + results.failed + ' failed</p>' + lines.join('');
window.__testResults = results;
console.log('TESTS ' + JSON.stringify({ passed: results.passed, failed: results.failed, failures: results.failures }));
</script>
</body></html>
```

- [ ] **Step 2: Run the tests to verify they fail**

Serve the folder, open `http://localhost:8000/tests.html`.
Expected: every assertion FAILs with `P.clamp is not a function` style errors, or the page dies on the first call. Either way `window.__testResults.failed` is greater than 0.

- [ ] **Step 3: Add the difficulty numbers to `config.js`**

Append inside `CONFIG`:

```javascript
  // ── The clock ────────────────────────────────────────────────
  SURVIVE_SECONDS: 60,     // How long you have to stay alive.

  // ── Asteroids: how the game gets harder ──────────────────────
  ASTEROID_SPAWN_INTERVAL_START: 1.2,  // Seconds between rocks at the start.
  ASTEROID_SPAWN_INTERVAL_END: 0.4,    // ...and by the final second. Lower = harder.
  ASTEROID_SPEED_START: 60,            // How fast rocks fly at the start.
  ASTEROID_SPEED_END: 140,             // ...and at the end. Higher = harder.
```

- [ ] **Step 4: Implement the helpers in `game.js`**

Replace `pure: {},` with:

```javascript
  pure: {
    // Keep a number inside a range. clamp(15, 0, 10) is 10.
    clamp: function (v, lo, hi) {
      return v < lo ? lo : (v > hi ? hi : v);
    },

    // Slide from a to b. t=0 gives a, t=1 gives b, t=0.5 gives the middle.
    lerp: function (a, b, t) {
      return a + (b - a) * t;
    },

    // Do two circles touch? This is the entire collision system.
    circlesOverlap: function (ax, ay, ar, bx, by, br) {
      const dx = ax - bx;
      const dy = ay - by;
      const reach = ar + br;
      return dx * dx + dy * dy < reach * reach;
    },

    // 63.4 seconds becomes "1:03".
    formatTime: function (seconds) {
      const whole = Math.max(0, Math.floor(seconds));
      const mins = Math.floor(whole / 60);
      const secs = whole % 60;
      return mins + ':' + (secs < 10 ? '0' : '') + secs;
    },

    // How hard is the game right now? Both numbers slide from their START
    // value to their END value over the length of the run.
    difficultyAt: function (elapsed, cfg) {
      const t = Game.pure.clamp(elapsed / cfg.SURVIVE_SECONDS, 0, 1);
      return {
        spawnInterval: Game.pure.lerp(cfg.ASTEROID_SPAWN_INTERVAL_START, cfg.ASTEROID_SPAWN_INTERVAL_END, t),
        speed: Game.pure.lerp(cfg.ASTEROID_SPEED_START, cfg.ASTEROID_SPEED_END, t),
      };
    },
  },
```

- [ ] **Step 5: Run the tests to verify they pass**

Reload `http://localhost:8000/tests.html`.
Expected: `23 passed, 0 failed`. Agentic workers: assert `window.__testResults.failed === 0`.

- [ ] **Step 6: Commit**

```bash
git add tests.html game.js config.js
git commit -m "test: add dependency-free harness and cover the pure helpers"
```

---

### Task 3: Integer-scaled, letterboxed canvas with a scrolling starfield

**Files:**
- Modify: `game.js`, `config.js`, `tests.html`

**Interfaces:**
- Consumes: `Game.pure.clamp`, `CONFIG.ARENA`.
- Produces:
  - `Game.pure.computeScale(viewW, viewH, arena, dpr) -> {scale: number, cssSize: number, pixelSize: number}` — `scale` is the integer number of physical pixels per logical unit, minimum 1.
  - `Game.pure.makeStars(rng, cfg) -> [{x, y, bright}]`
  - `Game.pure.scrollStars(stars, dt, cfg) -> void` — mutates in place, wrapping at the arena edge.
  - Private in `game.js`: `resize(canvas)`, `drawStars(ctx, stars)`, and a running `requestAnimationFrame` loop.

- [ ] **Step 1: Write the failing tests**

Append to `tests.html` before the results line:

```javascript
// ── computeScale ──
var s1 = P.computeScale(800, 800, 400, 1);
eq(s1.scale, 2, 'an 800px viewport scales a 400-unit arena by exactly 2');
eq(s1.cssSize, 800, 'the canvas is 800 CSS px wide at scale 2');
eq(s1.pixelSize, 800, 'and 800 device px at dpr 1');
var s2 = P.computeScale(900, 900, 400, 1);
eq(s2.scale, 2, 'a 900px viewport still scales by 2, not 2.25 — fractional scale shimmers');
eq(s2.cssSize, 800, 'the extra 100px becomes letterbox, not a blurry half-pixel');
var s3 = P.computeScale(1280, 720, 400, 1);
eq(s3.scale, 1, 'the smaller side decides: 720/400 floors to 1');
var s4 = P.computeScale(390, 844, 400, 3);
eq(s4.scale, 1, 'a narrow phone falls back to scale 1 rather than 0');
eq(s4.pixelSize, 1200, 'at dpr 3 the backing store is 3x the CSS size');
eq(s4.cssSize, 400, 'while CSS size stays in CSS pixels');
var s5 = P.computeScale(100, 100, 400, 1);
eq(s5.scale, 1, 'scale never drops below 1 even on a tiny viewport');

// ── stars ──
var stars = P.makeStars(fakeRng([0.5]), CONFIG);
eq(stars.length, CONFIG.STAR_COUNT, 'makeStars makes STAR_COUNT stars');
eq(stars[0].x, 200, 'a star at rng 0.5 sits halfway across the arena');
var one = [{ x: 10, y: 395, bright: 1 }];
P.scrollStars(one, 1, CONFIG);
eq(one[0].y, 7, 'a star scrolling past the bottom wraps around to the top');
var two = [{ x: 10, y: 100, bright: 1 }];
P.scrollStars(two, 0.5, CONFIG);
eq(two[0].y, 106, 'stars drift down at STAR_SCROLL_SPEED');
```

- [ ] **Step 2: Run the tests to verify they fail**

Reload `tests.html`. Expected: the new assertions FAIL (`P.computeScale is not a function`).

- [ ] **Step 3: Add the starfield numbers to `config.js`**

```javascript
  // ── Background ───────────────────────────────────────────────
  STAR_COUNT: 60,          // How many stars drift past behind the game.
  STAR_SCROLL_SPEED: 12,   // How fast they drift, in units per second.
```

- [ ] **Step 4: Implement scaling and stars**

Add to `Game.pure`:

```javascript
    // Work out how big to draw the arena. The scale MUST be a whole number:
    // with smoothing off, a scale of 2.25 draws some pixels 2 wide and others
    // 3 wide, which makes the art look broken. We round down and letterbox.
    computeScale: function (viewW, viewH, arena, dpr) {
      const fit = Math.min(viewW, viewH) / arena;
      const scale = Math.max(1, Math.floor(fit));
      return {
        scale: scale,
        cssSize: arena * scale,
        pixelSize: arena * scale * (dpr || 1),
      };
    },

    makeStars: function (rng, cfg) {
      const stars = [];
      for (let i = 0; i < cfg.STAR_COUNT; i++) {
        stars.push({
          x: Math.floor(rng() * cfg.ARENA),
          y: Math.floor(rng() * cfg.ARENA),
          bright: 1 + Math.floor(rng() * 3),
        });
      }
      return stars;
    },

    scrollStars: function (stars, dt, cfg) {
      for (let i = 0; i < stars.length; i++) {
        stars[i].y += cfg.STAR_SCROLL_SPEED * dt;
        if (stars[i].y >= cfg.ARENA) stars[i].y -= cfg.ARENA;
      }
    },
```

- [ ] **Step 5: Replace `Game.start` with a real resizing loop**

```javascript
  start: function (canvas) {
    const ctx = canvas.getContext('2d');
    const P = Game.pure;

    const state = {
      stars: P.makeStars(Math.random, CONFIG),
      scale: 1,
    };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const fit = P.computeScale(window.innerWidth, window.innerHeight, CONFIG.ARENA, dpr);
      canvas.width = fit.pixelSize;
      canvas.height = fit.pixelSize;
      canvas.style.width = fit.cssSize + 'px';
      canvas.style.height = fit.cssSize + 'px';
      state.scale = fit.scale * dpr;
      ctx.imageSmoothingEnabled = false;
    }

    function draw() {
      ctx.setTransform(state.scale, 0, 0, state.scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#10131c';
      ctx.fillRect(0, 0, CONFIG.ARENA, CONFIG.ARENA);
      const shades = ['#2c3350', '#4a5580', '#8e9ccc'];
      for (let i = 0; i < state.stars.length; i++) {
        const s = state.stars[i];
        ctx.fillStyle = shades[s.bright - 1];
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
      }
    }

    let last = performance.now();
    function frame(now) {
      // Clamp the frame delta. Anything longer than MAX_FRAME_SECONDS lets fast
      // objects jump further than their own radius in one step, which means
      // collisions get skipped entirely.
      const dt = Math.min((now - last) / 1000, CONFIG.MAX_FRAME_SECONDS);
      last = now;
      try {
        P.scrollStars(state.stars, dt, CONFIG);
        draw();
      } catch (e) {
        window.__showError((e && e.stack) || String(e), 'game.js');
        return;   // stop the loop instead of throwing 60 errors a second
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
  },
```

- [ ] **Step 6: Add the frame clamp to `config.js`**

```javascript
  // ── Timing (don't change these without reading the comments) ─
  MAX_FRAME_SECONDS: 0.025,  // Longest step we allow. Bigger values let the
                             // ship pass straight through asteroids.
```

- [ ] **Step 7: Run the tests to verify they pass**

Reload `tests.html`. Expected: `37 passed, 0 failed`.

- [ ] **Step 8: Verify the starfield by eye**

Open `http://localhost:8000/index.html`, resize the window.
Expected: a dark square of stars drifting downwards, always a whole-number multiple of 400 on a side, with black letterbox around it. Nothing blurry.

- [ ] **Step 9: Commit**

```bash
git add game.js config.js tests.html
git commit -m "feat: integer-scaled letterboxed canvas with a scrolling starfield"
```

---

### Task 4: ASCII sprites rendered to offscreen canvases

**Files:**
- Modify: `sprites.js`, `game.js`, `tests.html`

**Interfaces:**
- Consumes: `PALETTE`, `SPRITES`, `Game.pure`.
- Produces:
  - `Game.pure.parseSprite(rows, palette) -> {w: number, h: number, pixels: [{x, y, color}]}` — skips `.` (transparent); an unknown character becomes `#ff00ff` so a typo is visible rather than fatal.
  - Private `Game._spriteCanvas(name) -> HTMLCanvasElement` — built once per name and cached on first use.
  - Private `Game._drawSprite(ctx, name, cx, cy, angle)` — draws centred on `(cx, cy)`, rotated by `angle` radians.
  - Sprite names available to later tasks: `ship`, `crystal`, `rock12`, `rock20`, `rock28`, `heart`.

- [ ] **Step 1: Write the failing tests**

Append to `tests.html`:

```javascript
// ── parseSprite ──
var tiny = P.parseSprite(['.R.', 'RRR'], { R: '#ff0000' });
eq(tiny.w, 3, 'parseSprite reads the width from the first row');
eq(tiny.h, 2, 'parseSprite reads the height from the row count');
eq(tiny.pixels.length, 4, 'dots are transparent and produce no pixel');
eq(tiny.pixels[0], { x: 1, y: 0, color: '#ff0000' }, 'a letter becomes a coloured pixel at its own position');
var oops = P.parseSprite(['Z'], { R: '#ff0000' });
eq(oops.pixels[0].color, '#ff00ff', 'an unknown letter turns magenta instead of crashing');

// ── every real sprite is well formed ──
var names = ['ship', 'crystal', 'rock12', 'rock20', 'rock28', 'heart'];
for (var n = 0; n < names.length; n++) {
  var sp = SPRITES[names[n]];
  eq(!!sp, true, names[n] + ' exists in SPRITES');
  var widths = {};
  for (var r = 0; r < sp.length; r++) widths[sp[r].length] = true;
  eq(Object.keys(widths).length, 1, names[n] + ' has rows that are all the same length');
  var parsed = P.parseSprite(sp, PALETTE);
  eq(parsed.pixels.length > 0, true, names[n] + ' draws at least one pixel');
  var bad = parsed.pixels.filter(function (px) { return px.color === '#ff00ff'; });
  eq(bad.length, 0, names[n] + ' uses only letters that exist in PALETTE');
}
eq(SPRITES.rock12.length, 12, 'rock12 is 12 rows tall, matching its name');
eq(SPRITES.rock20.length, 20, 'rock20 is 20 rows tall, matching its name');
eq(SPRITES.rock28.length, 28, 'rock28 is 28 rows tall, matching its name');
```

- [ ] **Step 2: Run the tests to verify they fail**

Reload `tests.html`. Expected: FAIL on `P.parseSprite is not a function` and on every missing sprite.

- [ ] **Step 3: Write the sprites**

Replace `sprites.js`. Every row of a sprite must be the same length — the test enforces it.

```javascript
// ═══════════════════════════════════════════════════════════════
//  THE PIXEL ART. This is drawn with letters.
//  Each letter is a colour from PALETTE. A dot is see-through.
//  Change a letter, save, reload — the art changes. Try it.
// ═══════════════════════════════════════════════════════════════

const PALETTE = {
  '.': null,        // see-through
  W: '#ffffff',     // White
  C: '#7df9ff',     // Cyan  — the ship's glass
  B: '#2b6cff',     // Blue  — the ship's body
  D: '#14307a',     // Dark blue — the ship's shadow
  F: '#ff9b3d',     // Flame
  Y: '#ffe66d',     // Yellow — crystals
  O: '#ffa62b',     // Orange — crystal shadow
  G: '#8d8f9a',     // Grey   — rock
  H: '#5b5d68',     // Heavy grey — rock shadow
  L: '#b9bcc9',     // Light grey — rock highlight
  R: '#ff4d6d',     // Red    — hearts
};

const SPRITES = {
  // 16 x 16. The ship you fly.
  ship: [
    '.......WW.......',
    '......WCCW......',
    '......WCCW......',
    '.....WBCCBW.....',
    '.....WBCCBW.....',
    '....WBBCCBBW....',
    '....WBBCCBBW....',
    '...WBBBCCBBBW...',
    '...WBBDDDDBBW...',
    '..WBBBDDDDBBBW..',
    '..WBDDBDDBDDBW..',
    '.WBBDD.DD.DDBBW.',
    '.WBD....F....DBW',
    '..W....FFF....W.',
    '.......FFF......',
    '........F.......',
  ],

  // 8 x 8. The thing you want.
  crystal: [
    '...YY...',
    '..YYYY..',
    '.YYWWYY.',
    'YYWWWWYY',
    'YYWWWWYY',
    '.YYOOYY.',
    '..YOOY..',
    '...OO...',
  ],

  // 12 x 12. The smallest rock. Fast and sneaky.
  rock12: [
    '...GGGG.....',
    '..GLLGGG....',
    '.GLLGGGGG...',
    'GLLGGGGGGG..',
    'GLGGGGGGGHG.',
    'GGGGGGGGHHG.',
    'GGGGGGGGHHG.',
    '.GGGGGGGHHG.',
    '.GGGGGGHHG..',
    '..GGGGHHHG..',
    '...GHHHHG...',
    '....GGGG....',
  ],

  // 20 x 20. The middle rock.
  rock20: [
    '.....GGGGGGG........',
    '...GGLLGGGGGGG......',
    '..GLLLGGGGGGGGG.....',
    '.GLLLGGGGGGGGGGG....',
    '.GLLGGGGGGGGGGGGG...',
    'GLLGGGGGGGGGGGGGGG..',
    'GLGGGGGGGGGGGGGGHG..',
    'GLGGGGGGGGGGGGGGHHG.',
    'GGGGGGGGGGGGGGGGHHG.',
    'GGGGGGGGGGGGGGGGHHG.',
    'GGGGGGGGGGGGGGGGHHG.',
    '.GGGGGGGGGGGGGGHHHG.',
    '.GGGGGGGGGGGGGGHHG..',
    '.GGGGGGGGGGGGGHHHG..',
    '..GGGGGGGGGGGHHHG...',
    '..GGGGGGGGGGHHHG....',
    '...GGGGGGGGHHHG.....',
    '....GGGGGHHHHG......',
    '.....GHHHHHG........',
    '......GGGGG.........',
  ],

  // 28 x 28. The big slow one.
  rock28: [
    '.......GGGGGGGGGG...........',
    '.....GGLLLGGGGGGGGG.........',
    '...GGLLLLGGGGGGGGGGG........',
    '..GLLLLLGGGGGGGGGGGGG.......',
    '..GLLLLGGGGGGGGGGGGGGG......',
    '.GLLLLGGGGGGGGGGGGGGGGG.....',
    '.GLLLGGGGGGGGGGGGGGGGGGG....',
    'GLLLGGGGGGGGGGGGGGGGGGGGG...',
    'GLLGGGGGGGGGGGGGGGGGGGGGG...',
    'GLLGGGGGGGGGGGGGGGGGGGGHG...',
    'GLGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GLGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GGGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GGGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GGGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GGGGGGGGGGGGGGGGGGGGGGHHHG..',
    '.GGGGGGGGGGGGGGGGGGGGGHHHG..',
    '.GGGGGGGGGGGGGGGGGGGGHHHG...',
    '.GGGGGGGGGGGGGGGGGGGHHHG....',
    '..GGGGGGGGGGGGGGGGGHHHG.....',
    '..GGGGGGGGGGGGGGGGHHHG......',
    '...GGGGGGGGGGGGGGHHHG.......',
    '....GGGGGGGGGGGGHHHG........',
    '.....GGGGGGGGGGHHHG.........',
    '......GGGGGGGHHHHG..........',
    '.......GGGGHHHHG............',
    '........GHHHHHG.............',
    '.........GGGGG..............',
  ],

  // 7 x 7. One of your lives.
  heart: [
    '.RR.RR.',
    'RRRRRRR',
    'RRRRRRR',
    'RRRRRRR',
    '.RRRRR.',
    '..RRR..',
    '...R...',
  ],
};
```

- [ ] **Step 4: Implement the sprite renderer in `game.js`**

Add to `Game.pure`:

```javascript
    // Turn rows of letters into a list of coloured pixels.
    parseSprite: function (rows, palette) {
      const pixels = [];
      for (let y = 0; y < rows.length; y++) {
        for (let x = 0; x < rows[y].length; x++) {
          const ch = rows[y][x];
          if (ch === '.') continue;
          // A letter that isn't in PALETTE becomes magenta, so a typo shows up
          // as a bright pink block instead of stopping the game.
          const color = palette[ch] || '#ff00ff';
          pixels.push({ x: x, y: y, color: color });
        }
      }
      return { w: rows[0].length, h: rows.length, pixels: pixels };
    },
```

Add to `Game` alongside `start` (not inside `pure` — these touch the DOM):

```javascript
  _cache: {},

  // Draw a sprite once into its own little canvas, then reuse it every frame.
  _spriteCanvas: function (name) {
    if (Game._cache[name]) return Game._cache[name];
    const rows = SPRITES[name];
    if (!rows) throw new Error('There is no sprite called "' + name + '" in sprites.js');
    const art = Game.pure.parseSprite(rows, PALETTE);
    const c = document.createElement('canvas');
    c.width = art.w;
    c.height = art.h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (let i = 0; i < art.pixels.length; i++) {
      const px = art.pixels[i];
      g.fillStyle = px.color;
      g.fillRect(px.x, px.y, 1, 1);
    }
    Game._cache[name] = c;
    return c;
  },

  _drawSprite: function (ctx, name, cx, cy, angle) {
    const c = Game._spriteCanvas(name);
    if (!angle) {
      // Whole pixels only, or the art blurs.
      ctx.drawImage(c, Math.round(cx - c.width / 2), Math.round(cy - c.height / 2));
      return;
    }
    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));
    ctx.rotate(angle);
    ctx.drawImage(c, -c.width / 2, -c.height / 2);
    ctx.restore();
  },
```

- [ ] **Step 5: Draw the ship in the middle of the arena**

In `draw()`, after the starfield loop:

```javascript
      Game._drawSprite(ctx, 'ship', CONFIG.ARENA / 2, CONFIG.ARENA / 2, 0);
```

- [ ] **Step 6: Run the tests to verify they pass**

Reload `tests.html`. Expected: `0 failed`.

- [ ] **Step 7: Verify the art by eye**

Open the game. Expected: a crisp pixel spaceship centred on the starfield, no blur, no magenta blocks.

- [ ] **Step 8: Verify the typo guard**

Temporarily change one `B` in the `ship` sprite to `Q`, reload.
Expected: a magenta pixel appears on the ship and the game keeps running. `tests.html` reports a failure naming `ship`. **Revert.**

- [ ] **Step 9: Commit**

```bash
git add sprites.js game.js tests.html
git commit -m "feat: render ASCII sprite maps to cached offscreen canvases"
```

---

### Task 5: Input and ship movement

**Files:**
- Modify: `game.js`, `config.js`, `tests.html`

**Interfaces:**
- Consumes: `Game.pure.clamp`, `Game.pure.stepShip`.
- Produces:
  - `Game.pure.normalizeAim(dx, dy) -> {dx, dy}` — length capped at 1, so diagonals are not faster; `(0,0)` stays `(0,0)`.
  - `Game.pure.aimForTarget(ship, tx, ty, cfg, dt) -> {dx, dy}` — the touch translator; never asks for more than one frame's worth of `SHIP_SPEED`.
  - `Game.pure.stepShip(ship, aim, dt, cfg) -> void` — mutates `ship.x`/`ship.y`, clamped so the ship stays fully inside the arena.
  - Private `Game._input = {keys: {}, touch: null}` and the listeners that fill it.

- [ ] **Step 1: Write the failing tests**

```javascript
// ── normalizeAim ──
eq(P.normalizeAim(0, 0), { dx: 0, dy: 0 }, 'no keys held means no movement');
eq(P.normalizeAim(1, 0), { dx: 1, dy: 0 }, 'one direction is full speed');
var diag = P.normalizeAim(1, 1);
near(Math.sqrt(diag.dx * diag.dx + diag.dy * diag.dy), 1, 'a diagonal is not faster than a straight line');
near(diag.dx, 0.7071067811865475, 'a diagonal splits speed evenly');
var half = P.normalizeAim(0.3, 0.4);
near(Math.sqrt(half.dx * half.dx + half.dy * half.dy), 0.5, 'a short aim keeps its length — this is how touch goes slowly');

// ── aimForTarget (touch) ──
var shipAt = { x: 200, y: 200 };
var far = P.aimForTarget(shipAt, 400, 200, CONFIG, 1 / 60);
near(Math.sqrt(far.dx * far.dx + far.dy * far.dy), 1, 'a far-away finger asks for full speed, never more');
var close = P.aimForTarget(shipAt, 201, 200, CONFIG, 1 / 60);
eq(close.dx < 1, true, 'a finger almost on the ship asks for less than full speed');
eq(P.aimForTarget(shipAt, 200, 200, CONFIG, 1 / 60), { dx: 0, dy: 0 }, 'a finger exactly on the ship asks for nothing');

// ── stepShip ──
var sh = { x: 100, y: 100 };
P.stepShip(sh, { dx: 1, dy: 0 }, 1, CONFIG);
eq(sh.x, 100 + CONFIG.SHIP_SPEED, 'one second at full speed moves SHIP_SPEED units');
var edge = { x: 399, y: 200 };
P.stepShip(edge, { dx: 1, dy: 0 }, 1, CONFIG);
eq(edge.x, CONFIG.ARENA - CONFIG.SHIP_RADIUS, 'the ship stops at the right wall');
var edge2 = { x: 1, y: 1 };
P.stepShip(edge2, { dx: -1, dy: -1 }, 1, CONFIG);
eq(edge2.x, CONFIG.SHIP_RADIUS, 'the ship stops at the left wall');
eq(edge2.y, CONFIG.SHIP_RADIUS, 'the ship stops at the top wall');
```

- [ ] **Step 2: Run the tests to verify they fail**

Reload `tests.html`. Expected: FAIL on `P.normalizeAim is not a function`.

- [ ] **Step 3: Add the ship numbers to `config.js`**

```javascript
  // ── Your ship ────────────────────────────────────────────────
  SHIP_SPEED: 220,         // Units per second. Try 500 for chaos.
  SHIP_RADIUS: 6,          // How big the ship's "hit zone" is. Smaller = easier.
```

- [ ] **Step 4: Implement the movement helpers**

```javascript
    // Stop diagonal movement being faster than straight movement. A vector
    // shorter than 1 is left alone, which is how a nearby finger moves slowly.
    normalizeAim: function (dx, dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return { dx: 0, dy: 0 };
      if (len <= 1) return { dx: dx, dy: dy };
      return { dx: dx / len, dy: dy / len };
    },

    // Touch steering. The finger names a place; we ask to move towards it, but
    // never faster than the keyboard could. Without this cap a flicked thumb
    // would teleport the ship and a phone would outscore a desktop.
    aimForTarget: function (ship, tx, ty, cfg, dt) {
      const reach = cfg.SHIP_SPEED * dt;
      if (reach === 0) return { dx: 0, dy: 0 };
      return Game.pure.normalizeAim((tx - ship.x) / reach, (ty - ship.y) / reach);
    },

    stepShip: function (ship, aim, dt, cfg) {
      const edge = cfg.SHIP_RADIUS;
      ship.x = Game.pure.clamp(ship.x + aim.dx * cfg.SHIP_SPEED * dt, edge, cfg.ARENA - edge);
      ship.y = Game.pure.clamp(ship.y + aim.dy * cfg.SHIP_SPEED * dt, edge, cfg.ARENA - edge);
    },
```

- [ ] **Step 5: Wire up the listeners in `Game.start`**

Add `ship: {x: CONFIG.ARENA / 2, y: CONFIG.ARENA / 2}` to `state`, then:

```javascript
    // ── Input. Keyboard and touch both end up in here, so there is exactly
    //    one place to look when the controls misbehave. ──
    const input = { keys: {}, touch: null };

    window.addEventListener('keydown', function (e) {
      input.keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { input.keys[e.key] = false; });
    window.addEventListener('blur', function () { input.keys = {}; });

    // Touch steering keeps the gap between finger and ship that existed when
    // you first touched down, so the ship rides beside your thumb instead of
    // hiding underneath it.
    function toArena(touch) {
      const box = canvas.getBoundingClientRect();
      const unit = box.width / CONFIG.ARENA;
      return { x: (touch.clientX - box.left) / unit, y: (touch.clientY - box.top) / unit };
    }
    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      const p = toArena(e.changedTouches[0]);
      input.touch = { id: e.changedTouches[0].identifier, gx: state.ship.x - p.x, gy: state.ship.y - p.y, x: p.x, y: p.y };
    }, { passive: false });
    canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (!input.touch) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        // Only the finger that started the drag steers. Extra fingers are ignored.
        if (e.changedTouches[i].identifier !== input.touch.id) continue;
        const p = toArena(e.changedTouches[i]);
        input.touch.x = p.x;
        input.touch.y = p.y;
      }
    }, { passive: false });
    function endTouch(e) {
      e.preventDefault();
      if (!input.touch) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === input.touch.id) input.touch = null;
      }
    }
    canvas.addEventListener('touchend', endTouch, { passive: false });
    canvas.addEventListener('touchcancel', endTouch, { passive: false });

    function currentAim(dt) {
      if (input.touch) {
        return Game.pure.aimForTarget(
          state.ship, input.touch.x + input.touch.gx, input.touch.y + input.touch.gy, CONFIG, dt);
      }
      let dx = 0, dy = 0;
      const k = input.keys;
      if (k.ArrowLeft  || k.a || k.A) dx -= 1;
      if (k.ArrowRight || k.d || k.D) dx += 1;
      if (k.ArrowUp    || k.w || k.W) dy -= 1;
      if (k.ArrowDown  || k.s || k.S) dy += 1;
      return Game.pure.normalizeAim(dx, dy);
    }
```

In `frame`, before `draw()`: `P.stepShip(state.ship, currentAim(dt), dt, CONFIG);`
In `draw()`, replace the fixed centre position with `state.ship.x, state.ship.y`.

- [ ] **Step 6: Run the tests to verify they pass**

Reload `tests.html`. Expected: `0 failed`.

- [ ] **Step 7: Verify movement by hand**

Expected: arrows and WASD both fly the ship; it cannot leave the square; a diagonal is no faster than a straight line; the page does not scroll when you drag on a phone or in Chrome's device-emulation mode; releasing a key stops the ship.

- [ ] **Step 8: Commit**

```bash
git add game.js config.js tests.html
git commit -m "feat: keyboard and speed-capped relative touch steering"
```

---

### Task 6: Crystals, collecting, and score

**Files:**
- Modify: `game.js`, `config.js`, `tests.html`

**Interfaces:**
- Consumes: `Game.pure.circlesOverlap`, `state.ship`.
- Produces:
  - `Game.pure.pickCrystalSpawn(rng, ship, existing, cfg) -> {x, y}` — respects the wall, ship and crystal-to-crystal minimums; after `cfg.SPAWN_TRIES` attempts it returns its last candidate rather than looping forever.
  - `Game.pure.refillCrystals(crystals, rng, ship, cfg) -> void` — tops the array up to `cfg.CRYSTALS_ON_SCREEN`.
  - `Game.pure.findCollected(ship, crystals, cfg) -> number` — index of the first crystal touched, or `-1`.

- [ ] **Step 1: Write the failing tests**

```javascript
// ── pickCrystalSpawn ──
var sp1 = P.pickCrystalSpawn(fakeRng([0, 0]), { x: 200, y: 200 }, [], CONFIG);
eq(sp1.x, CONFIG.CRYSTAL_WALL_MARGIN, 'rng 0 puts a crystal at the left margin, never in the wall');
eq(sp1.y, CONFIG.CRYSTAL_WALL_MARGIN, 'rng 0 puts a crystal at the top margin');
var sp2 = P.pickCrystalSpawn(fakeRng([1, 1]), { x: 200, y: 200 }, [], CONFIG);
eq(sp2.x, CONFIG.ARENA - CONFIG.CRYSTAL_WALL_MARGIN, 'rng 1 stays inside the right margin');
// rng 0.5 lands on the ship, so the first try must be rejected and the second used.
var sp3 = P.pickCrystalSpawn(fakeRng([0.5, 0.5, 0, 0]), { x: 200, y: 200 }, [], CONFIG);
eq(sp3.x === 200 && sp3.y === 200, false, 'a crystal never spawns on top of the ship');
var crowded = [{ x: CONFIG.CRYSTAL_WALL_MARGIN, y: CONFIG.CRYSTAL_WALL_MARGIN }];
var sp4 = P.pickCrystalSpawn(fakeRng([0, 0, 1, 1]), { x: 200, y: 200 }, crowded, CONFIG);
eq(sp4.x === CONFIG.CRYSTAL_WALL_MARGIN && sp4.y === CONFIG.CRYSTAL_WALL_MARGIN, false,
   'a crystal never spawns on top of another crystal');
var stubborn = P.pickCrystalSpawn(fakeRng([0.5]), { x: 200, y: 200 }, [], CONFIG);
eq(typeof stubborn.x, 'number', 'when every try is rejected it still returns a position rather than hanging');

// ── refillCrystals ──
var cry = [];
P.refillCrystals(cry, fakeRng([0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 0.15, 0.85]), { x: 200, y: 200 }, CONFIG);
eq(cry.length, CONFIG.CRYSTALS_ON_SCREEN, 'refill tops the field up to CRYSTALS_ON_SCREEN');
P.refillCrystals(cry, fakeRng([0.1]), { x: 200, y: 200 }, CONFIG);
eq(cry.length, CONFIG.CRYSTALS_ON_SCREEN, 'refill adds nothing when the field is already full');

// ── findCollected ──
var ship2 = { x: 50, y: 50 };
eq(P.findCollected(ship2, [{ x: 300, y: 300 }], CONFIG), -1, 'a distant crystal is not collected');
eq(P.findCollected(ship2, [{ x: 300, y: 300 }, { x: 52, y: 50 }], CONFIG), 1, 'a touching crystal returns its index');
```

- [ ] **Step 2: Run the tests to verify they fail**

Reload `tests.html`. Expected: FAIL on `P.pickCrystalSpawn is not a function`.

- [ ] **Step 3: Add the crystal numbers to `config.js`**

```javascript
  // ── Crystals: the things you collect ─────────────────────────
  CRYSTALS_ON_SCREEN: 5,   // How many are out there at once.
  CRYSTAL_POINTS: 10,      // Points each one is worth.
  CRYSTAL_RADIUS: 5,       // How close you must get. Bigger = easier.
  CRYSTAL_WALL_MARGIN: 30, // Keeps them away from the edges.
  CRYSTAL_MIN_FROM_SHIP: 40,    // So one never appears in your lap.
  CRYSTAL_MIN_FROM_CRYSTAL: 25, // So five never stack into one blob.
  SPAWN_TRIES: 30,         // How hard we try for a good spot before giving up.
```

- [ ] **Step 4: Implement the crystal helpers**

```javascript
    // Find somewhere fair to put a crystal: away from the walls, away from the
    // ship, and away from the other crystals. If we can't after SPAWN_TRIES
    // goes, we take the last spot we looked at — a slightly awkward crystal is
    // much better than a frozen game.
    pickCrystalSpawn: function (rng, ship, existing, cfg) {
      const m = cfg.CRYSTAL_WALL_MARGIN;
      const span = cfg.ARENA - m * 2;
      let candidate = { x: m, y: m };
      for (let tries = 0; tries < cfg.SPAWN_TRIES; tries++) {
        candidate = { x: m + rng() * span, y: m + rng() * span };
        const dxs = candidate.x - ship.x;
        const dys = candidate.y - ship.y;
        if (Math.sqrt(dxs * dxs + dys * dys) < cfg.CRYSTAL_MIN_FROM_SHIP) continue;
        let clash = false;
        for (let i = 0; i < existing.length; i++) {
          const dx = candidate.x - existing[i].x;
          const dy = candidate.y - existing[i].y;
          if (Math.sqrt(dx * dx + dy * dy) < cfg.CRYSTAL_MIN_FROM_CRYSTAL) { clash = true; break; }
        }
        if (!clash) return candidate;
      }
      return candidate;
    },

    refillCrystals: function (crystals, rng, ship, cfg) {
      while (crystals.length < cfg.CRYSTALS_ON_SCREEN) {
        crystals.push(Game.pure.pickCrystalSpawn(rng, ship, crystals, cfg));
      }
    },

    findCollected: function (ship, crystals, cfg) {
      for (let i = 0; i < crystals.length; i++) {
        if (Game.pure.circlesOverlap(ship.x, ship.y, cfg.SHIP_RADIUS,
                                     crystals[i].x, crystals[i].y, cfg.CRYSTAL_RADIUS)) return i;
      }
      return -1;
    },
```

- [ ] **Step 5: Wire crystals into the loop**

Add `crystals: []` and `score: 0` to `state`, then `P.refillCrystals(state.crystals, Math.random, state.ship, CONFIG);` after the state is built.

In `frame`, after `stepShip`:

```javascript
        const got = P.findCollected(state.ship, state.crystals, CONFIG);
        if (got >= 0) {
          state.crystals.splice(got, 1);
          state.score += CONFIG.CRYSTAL_POINTS;
          P.refillCrystals(state.crystals, Math.random, state.ship, CONFIG);
        }
```

In `draw()`, before the ship:

```javascript
      for (let i = 0; i < state.crystals.length; i++) {
        Game._drawSprite(ctx, 'crystal', state.crystals[i].x, state.crystals[i].y, 0);
      }
```

And a temporary score readout, to be replaced by the HUD in Task 9:

```javascript
      ctx.fillStyle = '#e8e8ff';
      ctx.font = '10px monospace';
      ctx.fillText('SCORE ' + state.score, 6, 12);
```

- [ ] **Step 6: Run the tests to verify they pass**

Reload `tests.html`. Expected: `0 failed`.

- [ ] **Step 7: Verify collecting by hand**

Expected: five crystals, none in a wall and none overlapping. Flying into one removes it, adds 10 to the score, and a replacement appears somewhere else — never under the ship.

- [ ] **Step 8: Commit**

```bash
git add game.js config.js tests.html
git commit -m "feat: crystals with fair spawn placement, collection and score"
```

---

### Task 7: Asteroids

**Files:**
- Modify: `game.js`, `config.js`, `tests.html`

**Interfaces:**
- Consumes: `Game.pure.difficultyAt`.
- Produces:
  - `Game.pure.pickAsteroidSpawn(rng, elapsed, cfg) -> {x, y, vx, vy, size, radius, angle, spin, age}` — spawns just outside a random edge, aimed inward with `±ASTEROID_JITTER_DEG` of jitter. `rng` is consumed in a fixed order: edge, position along the edge, size, jitter, spin.
  - `Game.pure.stepAsteroids(asteroids, dt) -> void` — mutates position, `angle` and `age`.
  - `Game.pure.isGone(a, cfg) -> boolean` — outside the arena by more than the margin, **or** older than `ASTEROID_MAX_LIFETIME`.
  - `Game.pure.pruneAsteroids(asteroids, cfg) -> array` — a new array with the gone ones removed.

- [ ] **Step 1: Write the failing tests**

```javascript
// ── pickAsteroidSpawn ──
// rng order: edge, along, size, jitter, spin. edge 0 = top.
var aTop = P.pickAsteroidSpawn(fakeRng([0, 0.5, 0, 0.5, 0.5]), 0, CONFIG);
eq(aTop.y, -CONFIG.ASTEROID_DESPAWN_MARGIN, 'edge 0 spawns above the arena, off screen');
eq(aTop.x, 200, 'and halfway across it');
eq(aTop.vy > 0, true, 'a rock from the top flies downwards, into the arena');
near(Math.sqrt(aTop.vx * aTop.vx + aTop.vy * aTop.vy), CONFIG.ASTEROID_SPEED_START,
     'at 0s a rock travels at ASTEROID_SPEED_START', 1e-6);
var aRight = P.pickAsteroidSpawn(fakeRng([0.3, 0.5, 0, 0.5, 0.5]), 0, CONFIG);
eq(aRight.x, CONFIG.ARENA + CONFIG.ASTEROID_DESPAWN_MARGIN, 'edge 1 spawns right of the arena');
eq(aRight.vx < 0, true, 'a rock from the right flies leftwards');
var aBottom = P.pickAsteroidSpawn(fakeRng([0.6, 0.5, 0, 0.5, 0.5]), 0, CONFIG);
eq(aBottom.vy < 0, true, 'a rock from the bottom flies upwards');
var aLeft = P.pickAsteroidSpawn(fakeRng([0.9, 0.5, 0, 0.5, 0.5]), 0, CONFIG);
eq(aLeft.vx > 0, true, 'a rock from the left flies rightwards');
var aEnd = P.pickAsteroidSpawn(fakeRng([0, 0.5, 0, 0.5, 0.5]), CONFIG.SURVIVE_SECONDS, CONFIG);
near(Math.sqrt(aEnd.vx * aEnd.vx + aEnd.vy * aEnd.vy), CONFIG.ASTEROID_SPEED_END,
     'by the end of the run rocks travel at ASTEROID_SPEED_END', 1e-6);
var aMax = P.pickAsteroidSpawn(fakeRng([1, 1, 1, 1, 1]), 0, CONFIG);
eq(aMax.size, CONFIG.ASTEROID_SIZES[CONFIG.ASTEROID_SIZES.length - 1],
   'an rng of exactly 1 picks the last size rather than running off the end of the list');
eq(aMax.radius, CONFIG.ASTEROID_SIZES[2] * CONFIG.ASTEROID_RADIUS_FACTOR, 'radius comes from size');
eq(aMax.age, 0, 'a new rock has no age yet');

// ── stepAsteroids ──
var rocks = [{ x: 10, y: 10, vx: 100, vy: -50, angle: 0, spin: 2, age: 0 }];
P.stepAsteroids(rocks, 0.5);
eq(rocks[0].x, 60, 'a rock moves by its velocity');
eq(rocks[0].y, -15, 'on both axes');
eq(rocks[0].angle, 1, 'and spins');
eq(rocks[0].age, 0.5, 'and remembers how long it has been alive');

// ── isGone / pruneAsteroids ──
var m = CONFIG.ASTEROID_DESPAWN_MARGIN;
eq(P.isGone({ x: 200, y: 200, age: 0 }, CONFIG), false, 'a rock inside the arena stays');
eq(P.isGone({ x: 200, y: -m - 1, age: 0 }, CONFIG), true, 'a rock past the top edge is gone');
eq(P.isGone({ x: CONFIG.ARENA + m + 1, y: 200, age: 0 }, CONFIG), true, 'a rock past the right edge is gone');
eq(P.isGone({ x: -m - 1, y: 200, age: 0 }, CONFIG), true, 'a rock past the left edge is gone — jitter means it is often not the opposite side');
eq(P.isGone({ x: 200, y: 200, age: CONFIG.ASTEROID_MAX_LIFETIME + 1 }, CONFIG), true,
   'a rock drifting almost parallel to an edge is removed by age, so it cannot loiter forever');
var kept = P.pruneAsteroids([{ x: 200, y: 200, age: 0 }, { x: 999, y: 200, age: 0 }], CONFIG);
eq(kept.length, 1, 'pruneAsteroids drops the gone ones');
eq(kept[0].x, 200, 'and keeps the live ones');
```

- [ ] **Step 2: Run the tests to verify they fail**

Reload `tests.html`. Expected: FAIL on `P.pickAsteroidSpawn is not a function`.

- [ ] **Step 3: Add the asteroid numbers to `config.js`**

```javascript
  // ── Asteroids: the things that hurt ──────────────────────────
  ASTEROID_SIZES: [12, 20, 28],    // Small, medium, big. Sprite names match.
  ASTEROID_RADIUS_FACTOR: 0.4,     // Hit zone as a share of size. Smaller = kinder.
  ASTEROID_JITTER_DEG: 30,         // How crooked their paths are. 0 = straight lines.
  ASTEROID_SPIN_DEG: 90,           // How fast they tumble. Looks only.
  ASTEROID_MAX_ALIVE: 20,          // Hard ceiling. Stops a silly spawn rate freezing
                                   // the browser. Normal play peaks near 8.
  ASTEROID_MAX_LIFETIME: 20,       // Seconds before a stray rock is removed.
  ASTEROID_DESPAWN_MARGIN: 40,     // How far off screen they appear and disappear.
```

- [ ] **Step 4: Implement the asteroid helpers**

```javascript
    // Put a new rock just off one edge, pointed roughly across the arena.
    // "Roughly" is the jitter: without it every rock flies in a straight line
    // and the game is boring.
    pickAsteroidSpawn: function (rng, elapsed, cfg) {
      const hard = Game.pure.difficultyAt(elapsed, cfg);
      const edge = Math.min(3, Math.floor(rng() * 4));   // 0 top, 1 right, 2 bottom, 3 left
      const along = rng() * cfg.ARENA;
      const sizes = cfg.ASTEROID_SIZES;
      const size = sizes[Math.min(sizes.length - 1, Math.floor(rng() * sizes.length))];
      const jitter = (rng() * 2 - 1) * cfg.ASTEROID_JITTER_DEG * Math.PI / 180;
      const spin = (rng() * 2 - 1) * cfg.ASTEROID_SPIN_DEG * Math.PI / 180;
      const m = cfg.ASTEROID_DESPAWN_MARGIN;

      let x, y, heading;
      if (edge === 0)      { x = along;          y = -m;             heading = Math.PI / 2; }
      else if (edge === 1) { x = cfg.ARENA + m;  y = along;          heading = Math.PI; }
      else if (edge === 2) { x = along;          y = cfg.ARENA + m;  heading = -Math.PI / 2; }
      else                 { x = -m;             y = along;          heading = 0; }
      heading += jitter;

      return {
        x: x, y: y,
        vx: Math.cos(heading) * hard.speed,
        vy: Math.sin(heading) * hard.speed,
        size: size,
        radius: size * cfg.ASTEROID_RADIUS_FACTOR,
        angle: 0, spin: spin, age: 0,
      };
    },

    stepAsteroids: function (asteroids, dt) {
      for (let i = 0; i < asteroids.length; i++) {
        const a = asteroids[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.angle += a.spin * dt;
        a.age += dt;
      }
    },

    isGone: function (a, cfg) {
      const m = cfg.ASTEROID_DESPAWN_MARGIN;
      if (a.age > cfg.ASTEROID_MAX_LIFETIME) return true;
      return a.x < -m || a.x > cfg.ARENA + m || a.y < -m || a.y > cfg.ARENA + m;
    },

    pruneAsteroids: function (asteroids, cfg) {
      return asteroids.filter(function (a) { return !Game.pure.isGone(a, cfg); });
    },
```

- [ ] **Step 5: Wire asteroids into the loop**

Add `asteroids: []`, `elapsed: 0`, `spawnTimer: 0` to `state`. In `frame`, after the crystal check:

```javascript
        state.elapsed += dt;
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          state.spawnTimer = P.difficultyAt(state.elapsed, CONFIG).spawnInterval;
          // The cap exists so that setting the spawn interval to 0.01 in front of
          // a class slows the game down instead of killing the tab.
          if (state.asteroids.length < CONFIG.ASTEROID_MAX_ALIVE) {
            state.asteroids.push(P.pickAsteroidSpawn(Math.random, state.elapsed, CONFIG));
          }
        }
        P.stepAsteroids(state.asteroids, dt);
        state.asteroids = P.pruneAsteroids(state.asteroids, CONFIG);
```

In `draw()`, after the crystals:

```javascript
      for (let i = 0; i < state.asteroids.length; i++) {
        const a = state.asteroids[i];
        Game._drawSprite(ctx, 'rock' + a.size, a.x, a.y, a.angle);
      }
```

- [ ] **Step 6: Run the tests to verify they pass**

Reload `tests.html`. Expected: `0 failed`.

- [ ] **Step 7: Verify asteroids by eye**

Expected: tumbling rocks of three sizes entering from all four edges on crooked paths, passing through and disappearing. They visibly arrive faster and more often as the run goes on. Nothing accumulates: leave it running a minute and the count stays around eight.

- [ ] **Step 8: Commit**

```bash
git add game.js config.js tests.html
git commit -m "feat: asteroids with a difficulty ramp, jittered paths and pruning"
```

---

### Task 8: Getting hit — collision, lives, invincibility, shake and particles

**Files:**
- Modify: `game.js`, `config.js`, `tests.html`

**Interfaces:**
- Consumes: `Game.pure.circlesOverlap`, `Game.pure.clamp`.
- Produces:
  - `Game.pure.findHit(ship, asteroids, cfg) -> number` — index of the first asteroid touching the ship, or `-1`.
  - `Game.pure.burst(rng, x, y, color, count, cfg) -> [{x, y, vx, vy, life, color}]`
  - `Game.pure.stepParticles(particles, dt) -> array` — moves them, ages them, returns the survivors.

- [ ] **Step 1: Write the failing tests**

```javascript
// ── findHit ──
var hs = { x: 100, y: 100 };
eq(P.findHit(hs, [{ x: 300, y: 300, radius: 8 }], CONFIG), -1, 'a distant rock does not hit');
eq(P.findHit(hs, [{ x: 300, y: 300, radius: 8 }, { x: 105, y: 100, radius: 8 }], CONFIG), 1,
   'a touching rock returns its index');
eq(P.findHit(hs, [{ x: 100 + CONFIG.SHIP_RADIUS + 4.8 + 1, y: 100, radius: 4.8 }], CONFIG), -1,
   'the smallest rock just out of reach does not hit');

// ── burst / stepParticles ──
var bits = P.burst(fakeRng([0.5]), 50, 60, '#fff', 8, CONFIG);
eq(bits.length, 8, 'burst makes the number of pieces asked for');
eq(bits[0].x, 50, 'pieces start where the burst happened');
eq(bits[0].color, '#fff', 'pieces take the colour they were given');
eq(bits[0].life > 0, true, 'pieces start with some life left');
var live = [{ x: 0, y: 0, vx: 10, vy: 10, life: 0.5, color: '#fff' }];
live = P.stepParticles(live, 0.25);
eq(live.length, 1, 'a piece with life left survives');
eq(live[0].x, 2.5, 'and moves');
near(live[0].life, 0.25, 'and loses life');
eq(P.stepParticles(live, 1).length, 0, 'a piece out of life is removed');
```

- [ ] **Step 2: Run the tests to verify they fail**

Reload `tests.html`. Expected: FAIL on `P.findHit is not a function`.

- [ ] **Step 3: Add the damage numbers to `config.js`**

```javascript
  // ── Getting hit ──────────────────────────────────────────────
  SHIP_LIVES: 3,           // How many hearts you start with.
  INVINCIBLE_SECONDS: 1.5, // Free hits right after being hit.
  BLINK_HZ: 10,            // How fast you flash while invincible.
  SHAKE_PIXELS: 6,         // How hard the screen kicks on a hit. 0 = calm.
  SHAKE_DECAY: 0.15,       // Seconds for the kick to settle.
  PARTICLES_PER_COLLECT: 8,
  PARTICLES_PER_HIT: 14,
  PARTICLE_SPEED: 70,
  PARTICLE_LIFE: 0.45,
```

- [ ] **Step 4: Implement the damage helpers**

```javascript
    findHit: function (ship, asteroids, cfg) {
      for (let i = 0; i < asteroids.length; i++) {
        if (Game.pure.circlesOverlap(ship.x, ship.y, cfg.SHIP_RADIUS,
                                     asteroids[i].x, asteroids[i].y, asteroids[i].radius)) return i;
      }
      return -1;
    },

    burst: function (rng, x, y, color, count, cfg) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const dir = rng() * Math.PI * 2;
        const speed = cfg.PARTICLE_SPEED * (0.4 + rng() * 0.6);
        out.push({
          x: x, y: y,
          vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed,
          life: cfg.PARTICLE_LIFE, color: color,
        });
      }
      return out;
    },

    stepParticles: function (particles, dt) {
      const out = [];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life > 0) out.push(p);
      }
      return out;
    },
```

- [ ] **Step 5: Wire damage into the loop**

Add `lives: CONFIG.SHIP_LIVES`, `invincibleFor: 0`, `shake: 0`, `particles: []` to `state`.

In `frame`, on a collect, add particles:

```javascript
          state.particles = state.particles.concat(
            P.burst(Math.random, state.ship.x, state.ship.y, '#ffe66d', CONFIG.PARTICLES_PER_COLLECT, CONFIG));
```

After the asteroid step:

```javascript
        state.invincibleFor = Math.max(0, state.invincibleFor - dt);
        state.shake = Math.max(0, state.shake - dt);
        if (state.invincibleFor === 0) {
          const hitIndex = P.findHit(state.ship, state.asteroids, CONFIG);
          if (hitIndex >= 0) {
            state.lives -= 1;
            state.invincibleFor = CONFIG.INVINCIBLE_SECONDS;
            state.shake = CONFIG.SHAKE_DECAY;
            state.particles = state.particles.concat(
              P.burst(Math.random, state.ship.x, state.ship.y, '#ff4d6d', CONFIG.PARTICLES_PER_HIT, CONFIG));
            state.asteroids.splice(hitIndex, 1);
          }
        }
        state.particles = P.stepParticles(state.particles, dt);
```

In `draw()`, apply the shake as a transform offset and blink the ship:

```javascript
      let ox = 0, oy = 0;
      if (state.shake > 0) {
        const power = (state.shake / CONFIG.SHAKE_DECAY) * CONFIG.SHAKE_PIXELS;
        ox = (Math.random() * 2 - 1) * power;
        oy = (Math.random() * 2 - 1) * power;
      }
      ctx.setTransform(state.scale, 0, 0, state.scale, ox * state.scale, oy * state.scale);
```

Replace the ship draw with a blink check, and draw the particles after it:

```javascript
      // While invincible the ship flashes, so a hit is unmistakable.
      const flashOff = state.invincibleFor > 0 &&
        Math.floor(state.invincibleFor * CONFIG.BLINK_HZ * 2) % 2 === 1;
      if (!flashOff) Game._drawSprite(ctx, 'ship', state.ship.x, state.ship.y, 0);

      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      }
```

- [ ] **Step 6: Run the tests to verify they pass**

Reload `tests.html`. Expected: `0 failed`.

- [ ] **Step 7: Verify getting hit by hand**

Expected: flying into a rock removes it, kicks the screen, throws red sparks, and the ship blinks for about a second and a half during which a second rock cannot hurt you. Collecting throws yellow sparks. The lives count goes down (visible in the console via `state.lives` until Task 9 draws hearts).

- [ ] **Step 8: Verify the ship cannot pass through a rock**

In DevTools, run the game and watch a full minute. Expected: no rock ever overlaps the ship without a hit registering. This is what the 25 ms clamp buys; if you see a pass-through, `MAX_FRAME_SECONDS` has been raised.

- [ ] **Step 9: Commit**

```bash
git add game.js config.js tests.html
git commit -m "feat: collisions, lives, invincibility, screen shake and particles"
```

---

### Task 9: Phases, the clock, the HUD and the high score

**Files:**
- Modify: `game.js`, `config.js`, `tests.html`

**Interfaces:**
- Consumes: `Game.pure.formatTime`, every helper above.
- Produces:
  - `Game.pure.finalScore(score, cfg) -> number` — `score + WIN_BONUS`.
  - `Game._loadHighScore() -> number` and `Game._saveHighScore(n) -> void` — both swallow storage errors.
  - `state.phase` becomes one of `'title'`, `'playing'`, `'won'`, `'lost'`.

- [ ] **Step 1: Write the failing tests**

```javascript
// ── finalScore ──
eq(P.finalScore(120, CONFIG), 120 + CONFIG.WIN_BONUS, 'surviving adds the win bonus');
eq(P.finalScore(0, CONFIG), CONFIG.WIN_BONUS, 'surviving with nothing collected still pays the bonus');

// ── the high score store survives a hostile browser ──
eq(typeof Game._loadHighScore(), 'number', 'the high score always reads back as a number');
eq(Game._loadHighScore() >= 0, true, 'and is never negative, even on a fresh browser');
```

- [ ] **Step 2: Run the tests to verify they fail**

Reload `tests.html`. Expected: FAIL on `P.finalScore is not a function`.

- [ ] **Step 3: Add the remaining numbers to `config.js`**

```javascript
  // ── Winning ──────────────────────────────────────────────────
  WIN_BONUS: 100,          // Extra points for surviving the whole minute.
```

- [ ] **Step 4: Implement the phase helpers**

```javascript
    finalScore: function (score, cfg) {
      return score + cfg.WIN_BONUS;
    },
```

And on `Game`:

```javascript
  _STORE_KEY: 'starScavengerHighScore',

  // localStorage can throw (private windows, blocked site data), and a personal
  // best is not worth losing the game over. Note this is per-device and
  // per-address: it is your own best, not the class leaderboard.
  _loadHighScore: function () {
    try {
      const raw = localStorage.getItem(Game._STORE_KEY);
      const n = parseInt(raw, 10);
      return isNaN(n) || n < 0 ? 0 : n;
    } catch (e) { return 0; }
  },

  _saveHighScore: function (n) {
    try { localStorage.setItem(Game._STORE_KEY, String(n)); } catch (e) { /* not important */ }
  },
```

- [ ] **Step 5: Add phases to the loop**

Add `phase: 'title'`, `timeLeft: CONFIG.SURVIVE_SECONDS`, `highScore: Game._loadHighScore()` to `state`.

Wrap the gameplay part of `frame` in a phase check and add a reset:

```javascript
    function reset() {
      state.ship.x = CONFIG.ARENA / 2;
      state.ship.y = CONFIG.ARENA / 2;
      state.crystals.length = 0;
      state.asteroids = [];
      state.particles = [];
      state.score = 0;
      state.lives = CONFIG.SHIP_LIVES;
      state.timeLeft = CONFIG.SURVIVE_SECONDS;
      state.elapsed = 0;
      state.spawnTimer = 0;
      state.invincibleFor = 0;
      state.shake = 0;
      P.refillCrystals(state.crystals, Math.random, state.ship, CONFIG);
      state.phase = 'playing';
    }

    function anyButton() {
      if (state.phase === 'playing') return;
      reset();
    }
    window.addEventListener('keydown', anyButton);
    canvas.addEventListener('touchstart', anyButton, { passive: false });
    canvas.addEventListener('mousedown', anyButton);
```

In `frame`, guard the simulation with `if (state.phase === 'playing') { ...all the update code... }` and add the clock and the endings at the end of that block:

```javascript
          // The clock runs on clamped time, so backgrounding the tab pauses the
          // run rather than failing it.
          state.timeLeft -= dt;
          if (state.lives <= 0) {
            state.phase = 'lost';
          } else if (state.timeLeft <= 0) {
            state.timeLeft = 0;
            state.score = P.finalScore(state.score, CONFIG);
            state.phase = 'won';
          }
          if (state.phase !== 'playing' && state.score > state.highScore) {
            state.highScore = state.score;
            Game._saveHighScore(state.score);
          }
```

- [ ] **Step 6: Draw the HUD and the screens**

At the end of `draw()`:

```javascript
      // ── HUD ──
      ctx.fillStyle = '#e8e8ff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SCORE ' + state.score, 6, 13);
      ctx.textAlign = 'right';
      ctx.fillText('BEST ' + state.highScore, CONFIG.ARENA - 6, 13);

      // The clock is the biggest thing on screen, and it turns red at the end.
      ctx.textAlign = 'center';
      ctx.font = '22px monospace';
      ctx.fillStyle = state.timeLeft <= 10 ? '#ff4d6d' : '#e8e8ff';
      ctx.fillText(P.formatTime(state.timeLeft), CONFIG.ARENA / 2, 26);

      for (let i = 0; i < state.lives; i++) {
        Game._drawSprite(ctx, 'heart', 12 + i * 10, CONFIG.ARENA - 12, 0);
      }

      if (state.phase !== 'playing') {
        ctx.fillStyle = 'rgba(5, 6, 10, 0.78)';
        ctx.fillRect(0, 0, CONFIG.ARENA, CONFIG.ARENA);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e8e8ff';
        ctx.font = '20px monospace';
        const headline = state.phase === 'title' ? 'STAR SCAVENGER'
                       : state.phase === 'won' ? 'YOU SURVIVED!' : 'GAME OVER';
        ctx.fillText(headline, CONFIG.ARENA / 2, 170);
        ctx.font = '10px monospace';
        if (state.phase === 'title') {
          ctx.fillText('Collect crystals. Dodge rocks.', CONFIG.ARENA / 2, 196);
          ctx.fillText('Survive ' + CONFIG.SURVIVE_SECONDS + ' seconds.', CONFIG.ARENA / 2, 210);
          ctx.fillText('Arrows or WASD  —  or drag on a phone', CONFIG.ARENA / 2, 230);
        } else {
          ctx.fillText('SCORE ' + state.score, CONFIG.ARENA / 2, 196);
        }
        ctx.fillText('Press any key or tap to play', CONFIG.ARENA / 2, 260);
      }
      ctx.textAlign = 'left';
```

Delete the temporary score readout from Task 6.

- [ ] **Step 7: Run the tests to verify they pass**

Reload `tests.html`. Expected: `0 failed`.

- [ ] **Step 8: Verify the whole game by hand**

Expected: a title screen; any key starts it; the clock counts down and turns red under ten seconds; hearts disappear as you are hit; losing all three ends it early with GAME OVER; reaching 0:00 shows YOU SURVIVED with the +100 already included; the best score survives a reload; any key restarts from either ending.

- [ ] **Step 9: Commit**

```bash
git add game.js config.js tests.html
git commit -m "feat: title, win and lose screens with clock, HUD and high score"
```

---

### Task 10: Sound

**Files:**
- Modify: `game.js`, `config.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `Game._beep(hz, ms)` — a square-wave blip. Silently does nothing if WebAudio is unavailable or blocked.

- [ ] **Step 1: Add the sound numbers to `config.js`**

```javascript
  // ── Sound (made by maths, there are no sound files) ──────────
  SOUND_ON: true,          // Set to false for a silent classroom.
  COLLECT_HZ: 880,         // Pitch of the collect blip. Higher = squeakier.
  COLLECT_MS: 60,
  HIT_HZ: 140,             // Pitch of the hit thud.
  HIT_MS: 180,
  SOUND_VOLUME: 0.06,      // Keep this low. It will be on a projector.
```

- [ ] **Step 2: Implement the beeper**

Browsers refuse to make noise before the user interacts with the page, so the audio context is built on the first input and never before.

```javascript
  _audio: null,

  _beep: function (hz, ms) {
    if (!CONFIG.SOUND_ON) return;
    try {
      if (!Game._audio) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;           // no WebAudio at all: play on in silence
        Game._audio = new Ctor();
      }
      const ac = Game._audio;
      if (ac.state === 'suspended') ac.resume();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'square';
      osc.frequency.value = hz;
      gain.gain.value = CONFIG.SOUND_VOLUME;
      // Fade out, or the blip ends in a click.
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + ms / 1000);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + ms / 1000);
    } catch (e) {
      // No sound must never mean no game.
    }
  },
```

- [ ] **Step 3: Call it**

On a collect: `Game._beep(CONFIG.COLLECT_HZ, CONFIG.COLLECT_MS);`
On a hit: `Game._beep(CONFIG.HIT_HZ, CONFIG.HIT_MS);`

- [ ] **Step 4: Verify sound by hand**

Expected: a high blip on each collect and a low thud on each hit. Set `SOUND_ON: false` and confirm silence with no console errors. Load the page and collect a crystal before clicking anything — either it plays or it is silent, but it must not throw.

- [ ] **Step 5: Run the tests to confirm nothing broke**

Reload `tests.html`. Expected: `0 failed`.

- [ ] **Step 6: Commit**

```bash
git add game.js config.js
git commit -m "feat: synthesised collect and hit blips with graceful failure"
```

---

### Task 11: The README and the teacher's cheat-sheet

This is the deliverable the class actually runs on, so it gets its own task and its own review.

**Files:**
- Create: `README.md`, `TEACHING.md`

**Interfaces:**
- Consumes: every `CONFIG` key and sprite name defined above. Every line number or key named here must exist.
- Produces: nothing code depends on.

- [ ] **Step 1: Write `README.md`**

```markdown
# Star Scavenger

A 60-second pixel-art survival game. Collect crystals, dodge asteroids, stay alive.
Built to be changed in front of a class: every number that matters is in `config.js`.

**Play it:** https://juanatjcx.github.io/star-scavenger/

## Running it on your own machine

Double-click `serve.command`. It serves the folder and opens the game.

You can also just open `index.html` directly, but then the browser hides error
messages, so if you are changing the code, use `serve.command`.

## The files

| File | What's in it |
|---|---|
| `config.js` | **Every number you can change.** Start here. |
| `sprites.js` | The pixel art, drawn with letters. |
| `game.js` | The game loop. You shouldn't need to touch it. |
| `index.html` | The page and the error message panel. |
| `tests.html` | Open it in a browser to check the maths still works. |

## Controls

Arrow keys or WASD. On a phone, drag anywhere — the ship follows your thumb.

## Teaching with it

See [TEACHING.md](TEACHING.md).
```

- [ ] **Step 2: Write `TEACHING.md`**

```markdown
# Teaching with Star Scavenger

## Before class

1. Double-click `serve.command`. Leave the Terminal window open.
2. Open `config.js` in your editor, projected, at a font size the back row can read.
3. Have `https://juanatjcx.github.io/star-scavenger/` on the board for phones.

The loop for the whole lesson: **a student suggests something → you change one
number → you save → you reload the browser → the room reacts.** Keep it to one
change at a time. The reaction is the lesson.

## Opening, about 60 seconds

> "This is a game. It's about 400 lines of instructions, and I can read one of
> them to you: `SHIP_SPEED: 220`. What do you think happens if I make that 500?"

Change it, reload, fly the ship. Then: "What else should we change?"

## Tier 1 — one number in `config.js`

These are all safe, instant, and reversible. Change the number, save, reload.

| A student says | Change | From → to | What they'll see |
|---|---|---|---|
| "Make the ship faster!" | `SHIP_SPEED` | 220 → 500 | Barely controllable. Great. |
| "Make it slower" | `SHIP_SPEED` | 220 → 80 | Suddenly very hard. |
| "Give me more lives" | `SHIP_LIVES` | 3 → 10 | Ten hearts along the bottom. |
| "Make it shorter" | `SURVIVE_SECONDS` | 60 → 15 | A whole game in fifteen seconds. |
| "More crystals!" | `CRYSTALS_ON_SCREEN` | 5 → 30 | The screen fills with treasure. |
| "Crystals worth more" | `CRYSTAL_POINTS` | 10 → 500 | Score explodes. |
| "Too many rocks" | `ASTEROID_SPAWN_INTERVAL_END` | 0.4 → 1.0 | The ending stops being frantic. |
| "Make it impossible" | `ASTEROID_SPAWN_INTERVAL_START` | 1.2 → 0.15 | Wall of rocks from second one. |
| "Rocks too fast" | `ASTEROID_SPEED_END` | 140 → 80 | Dodgeable again. |
| "GIANT rocks" | `ASTEROID_SIZES` | `[12, 20, 28]` → `[28, 28, 28]` | Only boulders. |
| "Tiny rocks" | `ASTEROID_SIZES` | `[12, 20, 28]` → `[12, 12, 12]` | Fast and sneaky. |
| "Make them fly straight" | `ASTEROID_JITTER_DEG` | 30 → 0 | Predictable lanes. Notice it gets *easier*. |
| "Stop them spinning" | `ASTEROID_SPIN_DEG` | 90 → 0 | Looks frozen. Good "looks vs. rules" moment. |
| "It's too hard" | `SHIP_RADIUS` | 6 → 3 | Squeeze through gaps. Explain the hit zone. |
| "Longer invincibility" | `INVINCIBLE_SECONDS` | 1.5 → 5 | Blinks for ages, can't be hit. |
| "Stop the shaking" | `SHAKE_PIXELS` | 6 → 0 | Calm. Then try 40. |
| "MORE EXPLOSIONS" | `PARTICLES_PER_HIT` | 14 → 80 | Fireworks. |
| "More stars" | `STAR_COUNT` | 60 → 400 | Dense starfield. |
| "Turn the sound off" | `SOUND_ON` | true → false | Silence. |

## Tier 1b — change the art (`sprites.js`)

| A student says | Change | What they'll see |
|---|---|---|
| "Make the ship green" | `PALETTE` → `B: '#2b6cff'` becomes `B: '#22ff88'` | Every blue pixel turns green at once. Explain that the letter is a *name* for a colour. |
| "Give it bigger wings" | In `SPRITES.ship`, change dots to `B` on the left and right of a middle row | The shape changes. **Every row must stay the same length** — `tests.html` checks this. |
| "Make the crystals red" | `PALETTE` → `Y` and `O` to reds | All crystals recolour. |
| "Draw our own ship" | Replace the whole 16-row `ship` block | Hand this to a student. Keep rows 16 characters wide. |

If a letter isn't in `PALETTE`, that pixel turns **magenta** instead of crashing.
That's deliberate: a bright pink block means "you used a letter I don't know."

## Tier 2 — paste-ready features (these do edit `game.js`)

Save these for when a suggestion deserves real code. Each is self-contained.

### A. Crystal magnet

In `config.js`:
```javascript
  MAGNET_RANGE: 80,        // How close before crystals come to you.
  MAGNET_PULL: 120,        // How fast they fly in.
```

In `game.js`, in `frame`, just after `P.stepShip(...)`:
```javascript
        for (let i = 0; i < state.crystals.length; i++) {
          const c = state.crystals[i];
          const mdx = state.ship.x - c.x;
          const mdy = state.ship.y - c.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist > 0 && mdist < CONFIG.MAGNET_RANGE) {
            c.x += (mdx / mdist) * CONFIG.MAGNET_PULL * dt;
            c.y += (mdy / mdist) * CONFIG.MAGNET_PULL * dt;
          }
        }
```

### B. Rare gold crystals worth 50

In `config.js`:
```javascript
  GOLD_CHANCE: 0.15,       // 15% of crystals are gold.
  GOLD_POINTS: 50,
```

In `sprites.js`, add to `SPRITES`:
```javascript
  gold: [
    '...WW...',
    '..WYYW..',
    '.WYYYYW.',
    'WYYWWYYW',
    'WYYWWYYW',
    '.WYOOYW.',
    '..WOOW..',
    '...WW...',
  ],
```

In `game.js`, right after **each** call to `P.refillCrystals(...)`:
```javascript
        for (let i = 0; i < state.crystals.length; i++) {
          if (state.crystals[i].gold === undefined) {
            state.crystals[i].gold = Math.random() < CONFIG.GOLD_CHANCE;
          }
        }
```

Replace the collect block's scoring with:
```javascript
        const got = P.findCollected(state.ship, state.crystals, CONFIG);
        if (got >= 0) {
          const wasGold = state.crystals[got].gold;
          state.crystals.splice(got, 1);
          state.score += wasGold ? CONFIG.GOLD_POINTS : CONFIG.CRYSTAL_POINTS;
```

And in `draw()`, replace the crystal loop with:
```javascript
      for (let i = 0; i < state.crystals.length; i++) {
        const c = state.crystals[i];
        Game._drawSprite(ctx, c.gold ? 'gold' : 'crystal', c.x, c.y, 0);
      }
```

### C. Shield pickups

In `config.js`:
```javascript
  SHIELD_EVERY: 15,        // Seconds between shield pickups.
  SHIELD_SECONDS: 5,       // How long a shield protects you.
```

In `game.js`, add `shields: []` and `shieldTimer: CONFIG.SHIELD_EVERY` to `state`,
and add `state.shields = []; state.shieldTimer = CONFIG.SHIELD_EVERY;` to `reset()`.

In `frame`, after the hit check:
```javascript
        state.shieldTimer -= dt;
        if (state.shieldTimer <= 0) {
          state.shieldTimer = CONFIG.SHIELD_EVERY;
          state.shields.push(P.pickCrystalSpawn(Math.random, state.ship, state.crystals, CONFIG));
        }
        for (let i = state.shields.length - 1; i >= 0; i--) {
          const sh = state.shields[i];
          if (P.circlesOverlap(state.ship.x, state.ship.y, CONFIG.SHIP_RADIUS,
                               sh.x, sh.y, CONFIG.CRYSTAL_RADIUS)) {
            state.shields.splice(i, 1);
            state.invincibleFor = CONFIG.SHIELD_SECONDS;
            Game._beep(1320, 120);
          }
        }
```

In `draw()`, after the crystals:
```javascript
      for (let i = 0; i < state.shields.length; i++) {
        Game._drawSprite(ctx, 'heart', state.shields[i].x, state.shields[i].y, 0);
      }
```

It borrows the heart sprite. **This is the best homework in the file:** ask a
student to draw a proper 8×8 shield in `sprites.js` and change `'heart'` to
`'shield'`.

## Smoke checklist

Run this after any change you're unsure about. All ten should pass.

1. Title screen appears with the instructions.
2. Any key or tap starts the game.
3. Arrows and WASD both move the ship; it can't leave the square.
4. Flying into a crystal adds points and a replacement appears elsewhere.
5. Flying into a rock costs a heart, shakes the screen, and the ship blinks.
6. While blinking, a second rock does not cost a second heart.
7. Reaching 0:00 shows YOU SURVIVED with the +100 bonus included.
8. Losing all hearts shows GAME OVER before the clock runs out.
9. Dragging on a phone (or Chrome device emulation) steers without scrolling the page.
10. The BEST score survives a reload.

Also: open `tests.html` and confirm `0 failed`.

## When it breaks in front of everyone

**A red panel with an error message.** Good — that's the design working. Read the
message aloud; it names the file. Usually a missing comma or brace in `config.js`.
Undo, reload, carry on.

**The panel says `"Script error."` with no detail.** You are not on the server.
You opened `index.html` directly. Double-click `serve.command` and use
`http://localhost:8000/`.

**`Identifier 'CONFIG' has already been declared`.** A `config.js` line got pasted
into `game.js` (or `config.js` is included twice). The three files share one
namespace, so a name can only be declared once across all of them.

**A magenta block in the art.** A letter in `sprites.js` isn't in `PALETTE`. Add it
or change it back.

**Nothing at all happens when you reload.** Hard-reload (Cmd-Shift-R) — the browser
is serving you an old `config.js`.

**The game is in slow motion.** Something is very expensive — usually a huge
`CRYSTALS_ON_SCREEN` or `STAR_COUNT`. The game deliberately slows down rather than
skipping collision checks.
```

- [ ] **Step 3: Verify every key the cheat-sheet names actually exists**

Run this and expect no output:

```bash
grep -oE '`[A-Z][A-Z0-9_]+`' TEACHING.md | tr -d '`' | sort -u | while read k; do
  grep -q "^  $k:" config.js || echo "MISSING FROM config.js: $k"
done
```

Any line printed is a cheat-sheet promise the code doesn't keep. Fix `TEACHING.md` or add the key.

- [ ] **Step 4: Verify each Tier 2 feature actually works**

Apply A, then B, then C in a scratch copy, reloading after each. Expected: crystals fly to the ship; some crystals are gold and pay 50; hearts appear periodically and grant five seconds of blinking immunity. Then revert all three — the committed game is the base game.

- [ ] **Step 5: Commit**

```bash
git add README.md TEACHING.md
git commit -m "docs: add README and the teacher's cheat-sheet"
```

---

### Task 12: Tune the difficulty, verify on real devices, deploy

The spec's difficulty claim is an intention with no evidence behind it. This task produces the evidence.

**Files:**
- Modify: `config.js` (whatever the playtests say), `README.md` (the live URL)

**Interfaces:**
- Consumes: the finished game.
- Produces: a deployed URL, and `CONFIG` numbers backed by measurement.

- [ ] **Step 1: Instrument the game temporarily**

In `game.js`, inside the hit block, add:

```javascript
            console.log('HIT at ' + state.elapsed.toFixed(1) + 's (bucket ' +
                        (Math.floor(state.elapsed / 10) * 10) + '-' +
                        (Math.floor(state.elapsed / 10) * 10 + 10) + 's)');
```

- [ ] **Step 2: Play three full runs and record the buckets**

Play properly — try to win. Write down hits per ten-second bucket across all three runs.

Targets from the spec:
- **0–10 s:** zero hits across all three runs. If anyone is hit in the first ten seconds, raise `ASTEROID_SPAWN_INTERVAL_START` or lower `ASTEROID_SPEED_START`.
- **45–60 s:** at least one hit in most runs. If you can sail through untouched, lower `ASTEROID_SPAWN_INTERVAL_END` or raise `ASTEROID_SPEED_END`.
- **Whole run:** winning should be likely but not certain — losing all three hearts perhaps one run in three.

- [ ] **Step 3: Adjust `CONFIG` and re-run until the targets are met**

Change one number at a time and replay. Record the final numbers and what they replaced.

- [ ] **Step 4: Remove the instrumentation and commit the tuning**

```bash
git add config.js game.js
git commit -m "tune: set difficulty from three instrumented playtests"
```

- [ ] **Step 5: Verify the live asteroid count really peaks near 8**

In the DevTools console during the last ten seconds, evaluate the asteroid array length a few times.
Expected: comfortably under `ASTEROID_MAX_ALIVE` (20). If it is pinned at 20, the cap is now shaping gameplay rather than protecting the browser, and either the cap or the spawn rate needs revisiting.

- [ ] **Step 6: Verify crisp pixels on a high-density display**

This is the spec's outstanding unverified risk. Open the game on a retina Mac display and in Chrome device emulation at iPhone 14 Pro (390×844, dpr 3).
Expected: every pixel of the ship is the same size as every other; no shimmer, no half-pixel seams; black letterbox around a square play area. If pixels look uneven, `computeScale` is not returning an integer.

- [ ] **Step 7: Run the full smoke checklist**

All ten items from `TEACHING.md`, plus `tests.html` reporting `0 failed`.

- [ ] **Step 8: Push and enable GitHub Pages**

```bash
git push -u origin main
gh api -X POST repos/juanatjcx/star-scavenger/pages \
  -f 'source[branch]=main' -f 'source[path]=/' 2>/dev/null \
  || gh api -X PUT repos/juanatjcx/star-scavenger/pages -f 'source[branch]=main' -f 'source[path]=/'
gh api repos/juanatjcx/star-scavenger/pages --jq '.html_url, .status'
```

- [ ] **Step 9: Verify the deployed game on a real phone**

Open `https://juanatjcx.github.io/star-scavenger/` on an actual phone, not just emulation.
Expected: it loads in a second or two; drag steers the ship and the page never scrolls or zooms; the whole arena is visible; sound works after the first tap; a full 60-second run is playable.

- [ ] **Step 10: Commit the live URL and finish**

```bash
git add README.md
git commit -m "docs: record the live play URL"
git push
```

---

## Self-review

Checked after writing, against `docs/superpowers/specs/2026-09-27-star-scavenger-design.md`.

**Spec coverage.** Every spec section maps to a task: purpose and success criteria → Tasks 1–12 collectively; engine choice → Task 1; ASCII art → Task 4; all twelve game rules → Tasks 5–10; the concrete-values table → the `config.js` additions in Tasks 2–10 (every row appears in some task); the four-file layout → Task 1; state and loop order → Tasks 3, 5–9; failing gracefully, all seven bullets → Task 1 (error net, both layers, inline placement), Task 3 (`dt` clamp, integer scale), Task 4 (magenta fallback), Task 5 (non-passive touch), Task 7 (the cap), Task 9 (`localStorage` in try/catch), Task 10 (WebAudio in try/catch); testing → Task 2 (harness) and every subsequent task; deployment and `serve.command` → Tasks 1 and 12; the cheat-sheet → Task 11; §11's unverified risks → Task 12, steps 2–3 (difficulty) and step 6 (retina).

**Gaps found and closed while reviewing.** The spec's `dt`-clamp reasoning and the asteroid-cap reasoning are load-bearing and easy for an implementer to "tidy away" as odd magic numbers, so both now carry their arithmetic in a code comment as well as in Global Constraints. The spec's `Game.pure` list omitted `computeScale`, `makeStars`, `scrollStars`, `burst` and `stepParticles`; they are specified here in Tasks 3 and 8.

**Placeholder scan.** No TBDs. Every code step carries real code. No step says "add error handling" or "write tests for the above" without the code. No task refers to another task instead of repeating what is needed.

**Type consistency.** `Game.pure` names are used identically everywhere: `clamp`, `lerp`, `circlesOverlap`, `formatTime`, `difficultyAt`, `computeScale`, `makeStars`, `scrollStars`, `parseSprite`, `normalizeAim`, `aimForTarget`, `stepShip`, `pickCrystalSpawn`, `refillCrystals`, `findCollected`, `pickAsteroidSpawn`, `stepAsteroids`, `isGone`, `pruneAsteroids`, `findHit`, `burst`, `stepParticles`, `finalScore`. `Game` members: `pure`, `start`, `_cache`, `_spriteCanvas`, `_drawSprite`, `_audio`, `_beep`, `_STORE_KEY`, `_loadHighScore`, `_saveHighScore`. Sprite names `ship`, `crystal`, `rock12`, `rock20`, `rock28`, `heart` match both `CONFIG.ASTEROID_SIZES` and the `'rock' + a.size` lookup in Task 7. `state` keys introduced in Tasks 3, 5, 6, 7, 8 and 9 are all cleared by `reset()` in Task 9.

**Known soft spot.** `game.js` is built up across eight tasks by appending to `Game.pure` and editing `frame`/`draw`. An implementer working from one task at a time cannot see the whole file, so each task names exactly where its code goes. If the file drifts, re-read it whole before Task 9, which is the task that touches the most existing lines.
