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

1. Any suggestion on the cheat-sheet becomes a visible change in under a minute of
   editing, without opening `game.js`.
2. The game runs by double-clicking `index.html` — no install, no server, no build step.
3. A phone can play it from a public URL, with the same gameplay as desktop.
4. A student can point at a line of `config.js` and correctly say what it does.
5. A broken live edit produces a readable message on screen, never a black screen.

### Non-goals

Multiplayer, levels, accounts, audio files, binary sprite assets, npm, bundlers,
TypeScript, frameworks.

## 2. Decisions

### Engine: none — vanilla HTML5 Canvas 2D

`ship.x = ship.x + speed * dt` is the most teachable line in the project, and an engine's
job is to hide exactly that line. Roughly 400 lines of plain JavaScript replaces the
engine, of which only ~150 is machinery (loop, collision, input, scaling).

Rejected: **Kaplay** (ex-Kaboom.js) — a delightfully terse declarative API, but
`add([sprite("ship"), pos(), area()])` is opaque to a beginner and mid-class debugging
becomes library-doc reading. **Phaser 3** — the industry standard with excellent mobile
scaling, but ~1MB and a pile of `preload`/`create`/`physics` ceremony before a pixel
appears, to solve problems this game does not have.

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
  instead of underneath it.
- **Collect** — crystals, five on screen at all times, replaced the instant one is taken.
  +10 points. Spawns stay 30px from the walls and at least 40px from the ship so they
  never appear on top of you.
- **Avoid** — asteroids drift in from a random edge, aimed across the arena with ±30° of
  jitter, spinning as they go, despawning off the far side.
- **Difficulty** — over the 60 seconds the spawn interval tightens from 1.2s to 0.4s and
  asteroid speed rises from 60 to 140 px/s. The last fifteen seconds are meant to feel
  genuinely dangerous; the first ten are meant to be nearly impossible to lose.
- **Lives** — three hearts. A hit costs one heart and grants 1.5s of invincibility, shown
  by blinking. Zero hearts ends the run early.
- **Win** — reaching 0:00 shows "YOU SURVIVED", the score, and a +100 bonus.
- **High score** — kept in `localStorage`, so a class can compete on their phones.
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
| Live asteroid cap | 40 (safety valve) |
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

- `window.onerror` and `unhandledrejection` set `phase: 'error'` and paint the message on
  the canvas, so a bad live edit shows *what* broke instead of going black.
- An unknown sprite name draws a magenta box and warns once, rather than throwing — the
  game keeps running and the typo is unmistakable.
- `dt` is clamped to 50 ms so alt-tabbing cannot teleport an asteroid through the ship.
- WebAudio is created on the first input gesture and wrapped in try/catch; no sound must
  never mean no game.
- Touch listeners are non-passive and call `preventDefault`, with `touch-action: none` and
  `user-select: none` in CSS, so dragging steers the ship instead of scrolling the page.
- Canvas sizing respects `devicePixelRatio` so pixel art stays crisp on a phone.

## 7. Testing

A dependency-free repo rules out Jest, which is the right trade here. Instead the
gameplay logic that can be wrong silently is extracted into pure functions, gathered on
`Game.pure` — `circlesOverlap`, `clamp`, `lerp`, `difficultyAt(elapsed)`, `pickCrystalSpawn(rng, ship)`,
`pickAsteroidSpawn(rng, elapsed)`, `formatTime(seconds)` — each taking an injectable RNG
so results are deterministic. `tests.html` asserts them with a ~40-line inline harness and
prints pass/fail to the page. These get written test-first.

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
- The smoke checklist, and a short "when it breaks in front of everyone" section.

## 10. Deferred

Power-ups in the base game, a PNG/Piskel art path for student-drawn sprites, an online
leaderboard, multiple levels, and gamepad support. Each is additive and none changes the
structure above.
