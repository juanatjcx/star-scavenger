# Star Scavenger — Design

- **Date:** 2026-09-27
- **Repo:** https://github.com/juanatjcx/star-scavenger
- **Status:** design approved in conversation; awaiting spec review, then implementation plan

## 1. Purpose

A 2D pixel-art "dodge and collect" survival game that exists to be *taught with*. The
teacher runs it on a projector, students call out changes ("make the ship faster!", "give
me five lives!"), the teacher edits one number and reloads. Students then play the
deployed build on their own phones.

The audience has never seen code before. Every design decision below resolves in favour
of what a first-time coder can read and predict, even when that costs polish.

### Success criteria

1. Every **tier-1** cheat-sheet tweak is one number in `config.js`, visible in under a
   minute, without opening `game.js`. Tier-2 tweaks (the three paste-ready features) do
   edit `game.js`, and the cheat-sheet labels them as such.
2. The game runs by double-clicking `index.html` — no install, no server, no build step.
3. A phone can play it from a public URL, with the same arena, difficulty curve and top
   speed as desktop. Control *feel* differs by necessity; reachable score does not.
4. A student can point at a line of `config.js` and correctly say what it does.
5. A broken live edit produces a readable message on screen, never a black screen — with
   one measured exception: from `file://`, parse errors reach the page only as
   `"Script error."`, so the banner tells you to open the console. See §6 and §11.

### Non-goals

Multiplayer, levels, accounts, audio files, binary sprite assets, npm, bundlers,
TypeScript, frameworks.

## 2. Decisions

### Engine: none — vanilla HTML5 Canvas 2D

`ship.x = ship.x + speed * dt` is the most teachable line in the project, and an engine's
job is to hide exactly that line. My estimate is on the order of 400 lines of plain JavaScript in place of the engine, of
which perhaps 150 is machinery (loop, collision, input, scaling) — an estimate, not a
measurement, and worth re-checking against the finished file.

Rejected: **Kaplay** (ex-Kaboom.js, 186KB raw / 67KB gzipped) — a delightfully terse
declarative API, but `add([sprite("ship"), pos(), area()])` is opaque to a beginner and
mid-class debugging becomes library-doc reading. **Phaser 3** (v3.90.0, 1,196,122 bytes
raw / 318,115 gzipped) — the industry standard with excellent mobile scaling, but it asks
for a pile of `preload`/`create`/`physics` ceremony before a pixel appears, to solve
problems this game does not have. Note that 318KB gzipped is *not* a real barrier on a
phone, so payload is the weak half of this argument; the pedagogical half carries it.

### Art: ASCII sprite maps in the source

Each sprite is text in `sprites.js` — rows of single characters plus a colour palette —
rendered once into offscreen canvases at load and drawn with image smoothing disabled.
It looks like real pixel art on screen, but "give the ship bigger wings" is changing a
`.` to an `R`, which makes the art pipeline itself a teaching moment. No binary files, no
art tool, no asset licensing to explain to a school.

Rejected: **PNG sprite sheets** (Kenney.nl CC0 or generated) — better detail, but the art
becomes opaque to students and needs a fetch path. **Students drawing in Piskel** —
excellent engagement, but it eats class time and needs the PNG path anyway. Both remain
additive changes later.

### Structure: four files, classic script tags

No ES modules, so the game runs from `file://` with no local server — this matters on a
locked-down school laptop. Top-level `const` in classic scripts shares one global lexical
scope, so `config.js` → `sprites.js` → `game.js` load in order and see each other.

## 3. Game rules

- **Arena** — a fixed 400×400 logical square, scaled to fit whatever screen it is on.
  Identical gameplay on a projector and a phone, no rotation prompt, and nobody gets a
  wider field of view than anyone else.
- **Goal** — survive 60 seconds. A large countdown clock is the primary HUD element.
- **Controls** — arrows *and* WASD on desktop, both live at once, diagonals normalised so
  they aren't faster. On touch, a *relative* drag: on touch-down the game records the gap
  between finger and ship, then keeps that gap, so the ship stays visible beside the thumb
  instead of underneath it. Touch movement is speed-capped at the same `SHIP_SPEED` as the
  keyboard — without the cap a flicked thumb teleports the ship and a phone outscores a
  desktop. Only the first touch point steers; extra fingers and `touchcancel` are ignored.
- **Collect** — crystals, five on screen at all times, replaced the instant one is taken.
  +10 points. Spawns stay 30px from the walls, at least 40px from the ship so they never
  appear on top of you, and at least 25px from another crystal so five of them never stack
  into one ambiguous blob.
- **Avoid** — asteroids drift in from a random edge, aimed across the arena with ±30° of
  jitter, spinning as they go. They despawn on leaving the arena by *any* edge (the jitter
  means it is often not the opposite one), with a 20-second lifetime as a backstop so a
  near-parallel drifter cannot loiter forever.
- **Difficulty** — over the 60 seconds the spawn interval tightens from 1.2s to 0.4s and
  asteroid speed rises from 60 to 140 px/s. The last fifteen seconds are meant to feel
  genuinely dangerous; the first ten are meant to be nearly impossible to lose.
- **Lives** — three hearts. A hit costs one heart and grants 1.5s of invincibility, shown
  by blinking. Zero hearts ends the run early.
- **Win** — reaching 0:00 shows "YOU SURVIVED", the score, and a +100 bonus.
- **High score** — a *personal* best in `localStorage`. It is per-device and per-origin,
  so it is not a shared leaderboard, and the score saved while testing from `file://` is a
  different store from the one on GitHub Pages. Class competition is students comparing
  numbers out loud; nothing in the code aggregates them.
- **Screens** — a title screen waits for any key or tap; the win and lose screens restart
  the same way. There is no menu, no options, and nothing to read before playing.
- **Juice** — screen shake on a hit, a particle burst on a collect, a slowly scrolling
  starfield behind everything, and two WebAudio blips (no sound files). This is what makes
  a room audibly react when you change a number, so it is in scope, not decoration.

### Concrete values

| Thing | Value |
|---|---|
| Arena | 400 × 400 logical units |
| Survive time | 60 s |
| Ship sprite / collision radius | 16 px / 6 |
| Ship speed | 220 px/s |
| Lives / invincible time | 3 / 1.5 s, blink at 10 Hz |
| Crystal sprite / radius / value | 8 px / 5 (generous) / 10 pts |
| Crystals on screen | 5 |
| Asteroid sizes | 12, 20, 28 px; radius = size × 0.4 |
| Asteroid spawn interval | 1.2 s → 0.4 s across the run |
| Asteroid speed | 60 → 140 px/s across the run |
| Asteroid spin | random, ±90°/s |
| Live asteroid cap | 20 (see §6 — sized to actually trigger) |
| Frame delta clamp | 25 ms (see §6 — sized to prevent tunnelling) |
| Canvas scale factor | integer only, letterboxed (see §6) |
| Win bonus | +100 |
| Screen shake | 6 px amplitude, 0.15 s decay |
| Collect blip / hit blip | 880 Hz 60 ms / 140 Hz 180 ms, square wave |
| Starfield | 60 stars, 3 brightnesses, scrolling 12 px/s |

Deliberately **out of v1**: power-ups (shield, magnet, slow-motion), a rare high-value
crystal, bosses, levels. These are exactly what students will suggest, so they belong on
the cheat-sheet as changes you make *in front of them*, not in the base game.

## 4. Files

| File | Responsibility |
|---|---|
| `index.html` | Canvas element, HUD markup, page styles, and the one inline call that starts the game. ~80 lines. |
| `config.js` | Every tunable number, grouped and commented. The only file open during most of the class. |
| `sprites.js` | The colour palette and the ASCII art for ship, crystal, three asteroid sizes, and heart. |
| `game.js` | Loop, state, entities, collision, input, drawing. Exposes `Game.start(canvas)` plus `Game.pure`, the pure helpers that `tests.html` asserts against. |
| `tests.html` | Dependency-free assertions over the pure helpers. Open it, see green or red. |
| `README.md` | What it is, how to run it, the play URL. |
| `TEACHING.md` | The cheat-sheet, the smoke checklist, and troubleshooting. |

`config.js` is separate from `game.js` specifically so that the projector never has to
scroll past the game loop to reach the number being changed.

## 5. State and loop

One plain object holds the entire game's memory, readable in a single screenful:

```js
state = {
  phase: 'title' | 'playing' | 'won' | 'lost' | 'error',
  timeLeft, score, highScore, lives, invincibleFor, shake,
  ship: {x, y, vx, vy},
  asteroids: [{x, y, vx, vy, size, angle, spin}],
  crystals: [{x, y}],
  particles: [{x, y, vx, vy, life, colour}],
  stars: [{x, y, brightness}],
  spawnTimer, elapsed,
}
```

`requestAnimationFrame` drives `update(dt)` then `draw()`, delta-time based so it plays
the same on a 60 Hz projector and a 120 Hz phone. Update order is fixed and worth reading
aloud: input → move ship → clamp to walls → move asteroids → spawn asteroids → collect
crystals → check hits → age particles → tick clock → check win/lose.

Keyboard and touch both write into a single `input` object that `update` reads, so there
is exactly one place to look when controls misbehave. Collision is one three-line
circle-distance function used for both crystals and asteroids.

`game.js` must not start itself on load — `index.html` calls `Game.start(canvas)`. That
keeps `tests.html` able to load the file without spawning a game loop.

## 6. Failing gracefully

In a classroom, failure is public, so error handling is a feature:

- Error reporting is **two layered mechanisms**, because measurement (§11) killed the
  single-handler design:
  - *Primary:* `try/catch` around `Game.start()` and around the frame body. This yields the
    real `Error` — message and stack — even on `file://`, and it covers the realistic
    live-edit mistakes: a typo'd name, a deleted `CONFIG` key, a bad number. Verified.
  - *Backstop:* a `window` `error` + `unhandledrejection` listener for failures that happen
    before or outside the loop, chiefly a **parse** error in `config.js`. On `file://` this
    listener receives only `"Script error."` with no filename, because Chrome treats every
    `file:` URL as a unique origin; served over `http(s)` the same listener gets
    `"Uncaught SyntaxError: …"` plus the filename. So when `location.protocol === 'file:'`
    the banner adds "reload from a local server, or press Cmd-Opt-J for the real message."
- Both handlers are installed in an **inline `<script>` at the top of `index.html`**, never
  in `game.js`. A script that fails to parse never executes *any* of its own lines, so a
  handler living inside `game.js` is precisely the handler that is missing when `game.js`
  is what broke. Verified.
- An unknown sprite name draws a magenta box and warns once, rather than throwing — the
  game keeps running and the typo is unmistakable.
- `dt` is clamped to **25 ms**, not 50. At 50 ms a head-on ship and asteroid close
  220 + 140 = 360 px/s × 0.05 = 18.0 px in one frame, against a smallest combined radius of
  6 + 4.8 = 10.8 px — the collision check is a point-in-time distance test, so the ship
  passes clean through the rock and takes no damage. 25 ms closes 9.0 px and is safe.
  Consequence: below 40 fps the game runs in slow motion rather than skipping collisions,
  which is the correct failure direction here.
- The live asteroid cap is **20**, not 40. The difficulty curve peaks at ~8 alive (82
  spawned across a run), so a cap of 40 could never fire and would be dead code. Its real
  job is surviving a student setting the spawn interval to `0.01`, and at 20 it does that
  while still leaving headroom above normal play.
- The clock advances on accumulated clamped `dt`, so backgrounding the tab pauses the run
  instead of failing it.
- WebAudio is created on the first input gesture and wrapped in try/catch; no sound must
  never mean no game.
- Touch listeners are non-passive and call `preventDefault`, with `touch-action: none` and
  `user-select: none` in CSS, so dragging steers the ship instead of scrolling the page.
- Canvas sizing respects `devicePixelRatio`, **and the logical-to-physical scale is forced
  to a whole number** with the remainder letterboxed. With smoothing off, a fractional
  factor like x2.25 renders some source pixels 2 physical pixels wide and others 3, which
  is the shimmering, unevenly-chunky look that makes pixel art read as broken. Black bars
  are the better trade. This one is reasoned, not measured: the test machine reported
  `devicePixelRatio: 1`, so it needs confirming on a real retina screen and a phone.

## 7. Testing

A dependency-free repo rules out Jest, which is the right trade here. Instead the
gameplay logic that can be wrong silently is extracted into pure functions, gathered on
`Game.pure` — `circlesOverlap`, `clamp`, `lerp`, `difficultyAt(elapsed)`, `pickCrystalSpawn(rng, ship)`,
`pickAsteroidSpawn(rng, elapsed)`, `formatTime(seconds)` — each taking an injectable RNG
so results are deterministic. `tests.html` asserts them with a ~40-line inline harness and
prints pass/fail to the page. These get written test-first.

The difficulty claim in section 3 — forgiving for ten seconds, frightening for the last
fifteen — is at present an *intention with no evidence*. Before the game is called done it
gets three full playtest runs with hits logged per ten-second bucket; the numbers in the
table are a starting point to be tuned, not a result.

Everything else is verified by playing it: a 10-item smoke checklist in `TEACHING.md`
(starts, moves, collects, hit costs a heart, clock wins, hearts run out, restart, phone
drag, high score persists, window resize), plus a real Chrome run at 1280×800 and 390×844
with screenshots before the work is called done.

## 8. Deployment

`git init -b main` in this folder, remote `git@github.com:juanatjcx/star-scavenger.git`
(SSH, matching the existing `gh` configuration). GitHub Pages serves `main` at root,
giving `https://juanatjcx.github.io/star-scavenger/`, which goes in the README. No
Jekyll-escaping file is needed as no path starts with an underscore.

The local folder stays `asteroid-game` while the repo is `star-scavenger`. Git does not
care, the Pages URL follows the repo, and renaming the working directory mid-session buys
nothing; rename it whenever it becomes annoying.

## 9. The cheat-sheet

`TEACHING.md` is the artifact the class actually runs on:

- A short opening script for the first 60 seconds of the lesson.
- A table of roughly 15 tweaks in the form *student says* → *change this* → *what they
  will see*, ordered easiest first, most of them a single number in `config.js`.
- Three paste-ready larger changes with the exact code: a shield power-up, a crystal
  magnet, and a rare 50-point crystal.
- The smoke checklist, and a "when it breaks in front of everyone" section, which must
  cover the measured traps: `"Script error."` on `file://` and what to do about it, and
  `Identifier 'CONFIG' has already been declared` — what you get when a config line gets
  pasted into `game.js`, since all three files share one global lexical scope.

## 11. Evidence

Every checkable claim above, and how it was checked on 2026-09-27. Browser results come
from a real Chrome via DevTools, loading multi-file test pages over both `file://` and
`http://127.0.0.1`.

| Claim | Method | Result |
|---|---|---|
| A later classic script sees an earlier one's top-level `const` | `CONFIG_LIKE` declared in `a.js`, read in `b.js` | **Confirmed** — `crossScriptConst: true` |
| …and the three files share one lexical scope | re-declared `CONFIG_LIKE` in a fourth script | **Confirmed** — `Identifier 'CONFIG_LIKE' has already been declared` |
| A parse error does not stop later scripts | script with a syntax error, followed by another | **Confirmed** — `laterScriptStillRan: true` |
| `localStorage` works from `file://` | `setItem`/`getItem` round-trip on `file://` | **Confirmed** — read back `"1234"` |
| Canvas 2D + `imageSmoothingEnabled = false` from `file://` | context created and flag set | **Confirmed** |
| `window.onerror` shows what broke | same page on `file://` vs `http://` | **Refuted on `file://`** — `"Script error."`, no filename; full `"Uncaught SyntaxError: Unexpected token ';'"` + filename over `http://`. Chrome: "`file:` URLs are treated as unique security origins" |
| `try/catch` also loses detail on `file://` | `ReferenceError` thrown inside a called function | **Refuted** — full `"ReferenceError: MISSING_CONFIG_VALUE is not defined"` plus a stack. This is why `try/catch` is the primary mechanism |
| A handler inside `game.js` catches `game.js`'s own parse error | handler assigned *above* a syntax error in the same file | **Refuted** — the flag was never set; the line never ran |
| 50 ms `dt` clamp prevents tunnelling | closing speed x clamp vs. smallest combined radius | **Refuted** — 18.0 px vs 10.8 px. 25 ms gives 9.0 px, safe |
| A cap of 40 live asteroids is a useful safety valve | simulated the spawn/speed curves over 60 s | **Refuted** — peak ~8 alive, 82 spawned total; cap lowered to 20 |
| Phaser 3 is "~1MB" | jsDelivr headers, v3.90.0 | **Partly** — 1,196,122 raw but 318,115 gzipped; argument reframed |
| Kaplay is the renamed Kaboom.js | npm registry metadata | **Confirmed** — kaplay 3001.0.19, "formerly known as Kaboom.js" |

Unverified and carried as risk: integer canvas scaling on a retina screen and on a phone
(section 6 — the test machine reported `devicePixelRatio: 1`); the difficulty curve feeling
right (section 7 — needs playtests); WebAudio behaviour under the iOS mute switch.

## 10. Deferred

Power-ups in the base game, a PNG/Piskel art path for student-drawn sprites, an online
leaderboard, multiple levels, and gamepad support. Each is additive and none changes the
structure above.
