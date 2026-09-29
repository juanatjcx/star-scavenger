# Teaching with Star Scavenger

Jump to: [Before class](#before-class) · [Opening](#opening) ·
[Tier 1](#tier-1) · [Tier 1b — art](#tier-1b) ·
[Tier 2 — paste-in code](#tier-2) · [Smoke checklist](#smoke-checklist) ·
[When it breaks](#troubleshooting)

<a id="before-class"></a>
## Before class

1. Start the local server and leave its window open — closing it stops the
   server.
   - **macOS:** double-click `serve.command`.
   - **Windows:** open Git Bash or PowerShell in this folder and run
     `python serve.py`.
   - **Linux:** run `python3 serve.py`.

   Then open `http://localhost:8000`. See the README if the tools aren't
   installed yet.
2. Open `config.js` in your editor, projected, at a font size the back row can
   read.
3. Have `https://juanatjcx.github.io/star-scavenger/` on the board for phones.
4. Reload `http://localhost:8000/index.html` once yourself before anyone
   arrives, just to see a clean, error-free start. From here on, the page
   reloads itself within a second or two of you saving a file — you
   shouldn't need to touch the browser again.
5. On a 1366×768 laptop or a 1024×768 projector the game renders at a fixed
   400×400 in the middle of the screen, with black around it — that's by
   design, not a bug. If it looks small, zoom the browser to 200% (Cmd/Ctrl
   and `+`): it roughly doubles the projected size for free. At 1920×1080 or
   larger this never comes up.
6. Publish at the natural breaks in the lesson — end of a tier, end of class —
   by asking your assistant to publish it, or by hand with
   `git commit -am "what changed"` and `git push`. GitHub Pages takes roughly
   40 to 95 seconds and gives no signal when it's done, so check the live URL
   yourself before telling the room to reload their phones. If a change turns
   out to have made things worse, `git revert HEAD` and push (or ask your
   assistant) puts the previous version back the same way.

The loop for the whole lesson: **a student suggests something → you change one
number → you save → the room reacts** — the browser on the projector reloads
itself, no click required. Keep it to one change at a time. The reaction is
the lesson. Publishing is a separate, occasional step: the room is watching
`localhost`, so nothing needs to go live until you choose a moment for it to.

<a id="opening"></a>
## Opening, about 60 seconds

> "This is a game. It's about a thousand lines of instructions, and I can read
> one of them to you: `SHIP_SPEED: 220`. What do you think happens if I make
> that 500?"

Change it, reload, fly the ship. Then: "What else should we change?"

<a id="tier-1"></a>
## Tier 1 — one number in `config.js`

These are all safe, instant, and reversible. Change the number, save, reload.
Ordered roughly easiest-to-read first.

| A student says | Change | From → to | What they'll see |
|---|---|---|---|
| "Make the ship faster!" | `SHIP_SPEED` | 220 → 500 | Barely controllable. Great. |
| "Make it slower" | `SHIP_SPEED` | 220 → 80 | Suddenly very hard. |
| "Give me more lives" | `SHIP_LIVES` | 3 → 10 | Ten hearts along the bottom. |
| "Make it shorter" | `SURVIVE_SECONDS` | 60 → 15 | A whole game in fifteen seconds. |
| "Let me restart faster" | `RESTART_LOCKOUT_SECONDS` | 0.4 → 0 | Enter (or a tap or click) works the instant an ending appears, instead of after a short pause. |
| "More crystals!" | `CRYSTALS_ON_SCREEN` | 5 → 30 | The screen fills with treasure. Safe well past this — see the note below the table. |
| "Crystals worth more" | `CRYSTAL_POINTS` | 10 → 500 | Score explodes. |
| "Make crystals easier to grab" | `CRYSTAL_RADIUS` | 5 → 12 | You don't have to be exact anymore. |
| "Too many rocks" | `ASTEROID_SPAWN_INTERVAL_END` | 0.25 → 1.0 | The ending stops being frantic. |
| "Make it impossible" | `ASTEROID_SPAWN_INTERVAL_START` | 1.2 → 0.15 | A wall of rocks from second one — see the note below the table on why the tab doesn't freeze. |
| "Rocks too fast" | `ASTEROID_SPEED_END` | 140 → 80 | Dodgeable again. |
| "GIANT rocks" | `ASTEROID_SIZES` | `[12, 20, 28]` → `[28, 28, 28]` | Only boulders. |
| "Tiny rocks" | `ASTEROID_SIZES` | `[12, 20, 28]` → `[12, 12, 12]` | Fast and sneaky. |
| "Make them fly straight" | `ASTEROID_JITTER_DEG` | 30 → 0 | Predictable lanes. Notice it gets *easier* — see the note below the table on what happens at the other extreme. |
| "Stop them spinning" | `ASTEROID_SPIN_DEG` | 90 → 0 | Looks frozen. A good "looks vs. rules" moment — the rock's hitbox never depended on which way it was facing. |
| "It's too hard" | `SHIP_RADIUS` | 6 → 3 | Squeeze through gaps. Explain the hit zone. |
| "Longer invincibility" | `INVINCIBLE_SECONDS` | 1.5 → 5 | Blinks for ages, can't be hit. |
| "Stop the shaking" | `SHAKE_PIXELS` | 6 → 0 | Calm. Then try 40. |
| "MORE EXPLOSIONS" | `PARTICLES_PER_HIT` | 14 → 80 | Fireworks. |
| "Celebrate every pickup" | `PARTICLES_PER_COLLECT` | 8 → 30 | A little burst every time, not just on hits. |
| "Change the background" | `ARENA_COLOR` | `'#10131c'` → `'#1a0d2e'` | The whole arena behind everything else changes colour. |
| "More stars" | `STAR_COUNT` | 60 → 400 | Dense starfield. |
| "Make the stars race by" | `STAR_SCROLL_SPEED` | 12 → 80 | A sense of speed even though the ship isn't faster — good for separating "how it looks" from "how it plays." |
| "Turn the sound off" | `SOUND_ON` | true → false | Silence. |
| "Make the collect sound higher" | `COLLECT_HZ` | 880 → 1800 | A squeakier blip. |
| "Make the clock panic earlier" | `CLOCK_URGENT_SECONDS` | 15 → 40 | Under the default setting the clock is calm for three-quarters of the run and only gets nervous in the last 15 seconds. Raise this to 40 and most of the round feels tense. |
| "Bigger reward for surviving" | `WIN_BONUS` | 100 → 1000 | Surviving becomes worth more than collecting — a good lead-in to a strategy discussion. |

### Notes on three of the rows above

The table above is meant to be read in three seconds while thirty people
watch, so the longer reasoning behind a few rows lives here instead.

- **`CRYSTALS_ON_SCREEN`** is safe well past 30. Zero spawn-placement
  failures through 60, about 4% of placements fail at 80, about a third fail
  at 100 — and it never hangs at any value. Past roughly 80 the crystals
  just start overlapping into blobs instead.
- **`ASTEROID_SPAWN_INTERVAL_START`** (the "make it impossible" row):
  `ASTEROID_MAX_ALIVE: 20` is why the tab doesn't freeze even at an extreme
  setting like 0.15 — it's a hard ceiling on how many rocks can exist at
  once. Normal play peaks around 13, so 20 is a ceiling, not a target.
- **`ASTEROID_JITTER_DEG`** pushed the other way, toward 89, collapses a
  rock's inward speed to about 1.7% of normal. Assuming the *start-of-run*
  speed of 60 units/second (`ASTEROID_SPEED_START` — the slowest asteroids
  ever get; they're faster later in the run), a rock that jittered that hard
  would take roughly 390 seconds to cross the screen, so
  `ASTEROID_MAX_LIFETIME: 20` — which times a rock out after 20 seconds —
  becomes the only thing that ever removes it. That key looks unused in
  normal play (no rock survives past roughly 9 seconds under default
  settings) but it isn't.

<a id="tier-1b"></a>
## Tier 1b — change the art (`sprites.js`)

| A student says | Change | What they'll see |
|---|---|---|
| "Make the ship green" | `PALETTE` → `B: '#2b6cff'` becomes `B: '#22ff88'` | Every blue pixel turns green at once. Explain that the letter is a *name* for a colour. |
| "Give it bigger wings" | In `SPRITES.ship`, change dots to `B` on the left and right of a middle row | The shape changes. |
| "Make the crystals red" | `PALETTE` → `Y` and `O` to reds | All crystals recolour. |
| "Draw our own ship" | Replace the whole 16-row `ship` block | Hand this to a student. Keep rows 16 characters wide. |

Two different kinds of typo behave very differently, and it's worth naming both
before someone makes one live:

- **Substituting one letter for another is always safe.** `W` for `B` just
  changes a pixel's colour, even if the letter isn't real: any character not
  in `PALETTE` renders as bright magenta instead of crashing anything. That's
  deliberate — a pink block means "you used a letter I don't know," and it's
  a quick, harmless thing to point at and fix.
- **Inserting or deleting a character changes a row's length, and that stops
  the game.** Every row in a sprite must be exactly as long as row 0. Both
  `tests.html` and the game itself check this now — the game's own error
  panel names the exact sprite and row, e.g. *Sprite "gold" has rows of
  different lengths: row 3 is 9 characters but row 0 is 8 characters. Every
  row must be the same length. Fix it in sprites.js.* That matters more than it sounds: nobody
  opens `tests.html` mid-lesson, but everybody sees the game's own error
  panel. Read the message aloud, count characters, fix the row, reload.

<a id="tier-2"></a>
## Tier 2 — paste-ready features (these do edit `game.js`)

Save these for when a suggestion deserves real code. Each is self-contained.
None of these keys exist in `config.js` today — that's deliberate, so that
adding them is a visible, live act of writing code, not just flipping a
switch that was already there.

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

In `game.js`, right after **each** call to `P.refillCrystals(...)` (there are
two — once when the game starts, once in `reset()`):
```javascript
        for (let i = 0; i < state.crystals.length; i++) {
          if (state.crystals[i].gold === undefined) {
            state.crystals[i].gold = Math.random() < CONFIG.GOLD_CHANCE;
          }
        }
```

In `frame`, replace the **entire** `if (got >= 0) { ... }` collect block —
every line from `if (got >= 0) {` down to its closing `}` — with this. It's a
full replacement, not a patch to paste on top of what's there:
```javascript
        const got = P.findCollected(state.ship, state.crystals, CONFIG);
        if (got >= 0) {
          const wasGold = state.crystals[got].gold;
          state.crystals.splice(got, 1);
          state.score += wasGold ? CONFIG.GOLD_POINTS : CONFIG.CRYSTAL_POINTS;
          P.refillCrystals(state.crystals, Math.random, state.ship, CONFIG);
          for (let i = 0; i < state.crystals.length; i++) {
            if (state.crystals[i].gold === undefined) {
              state.crystals[i].gold = Math.random() < CONFIG.GOLD_CHANCE;
            }
          }
          state.particles = state.particles.concat(
            P.burst(Math.random, state.ship.x, state.ship.y, '#ffe66d', CONFIG.PARTICLES_PER_COLLECT, CONFIG));
          Game._beep(CONFIG.COLLECT_HZ, CONFIG.COLLECT_MS);
        }
```
This is also the third and last place crystals need tagging — it does its
own refill-and-tag inline, which is why the instruction above only names two
other call sites, not three.

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

In `game.js`, add `shields: []` and `shieldTimer: CONFIG.SHIELD_EVERY` to
`state`, and add `state.shields = []; state.shieldTimer = CONFIG.SHIELD_EVERY;`
to `reset()`.

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

<a id="smoke-checklist"></a>
## Smoke checklist

Run this after any change you're unsure about. All ten should pass.

1. Title screen appears with the instructions.
2. Any key or tap starts the game.
3. Arrows and WASD both move the ship; it can't leave the square.
4. Flying into a crystal adds points and a replacement appears elsewhere.
5. Flying into a rock costs a heart, shakes the screen, and the ship blinks.
6. While blinking, a second rock does not cost a second heart.
7. Reaching 0:00 shows YOU SURVIVED with the +100 bonus included, and Enter
   (or a tap or click) restarts it — a stray key like an arrow does nothing.
8. Losing all hearts shows GAME OVER before the clock runs out, and it takes
   the same Enter, tap, or click to restart.
9. Dragging on a phone (or Chrome device emulation) steers without scrolling the page.
10. The BEST score survives a reload.

Also: open `tests.html` and confirm `0 failed` (there are 199 checks total).

<a id="troubleshooting"></a>
## When it breaks in front of everyone

**A red panel with an error message.** Good — that's the design working. Read
the message aloud; it names the file. Usually a missing comma or brace in
`config.js`. If several things broke at once, the panel only shows the
*first* error and counts the rest — e.g. *"(2 later errors followed this one
— see the console)"* tacked on after the message — and the first one is the
one to fix; the others are usually just fallout from it. Undo, reload, carry
on.

**The panel says `"Script error."` with no detail.** You are not on the
server. You opened `index.html` directly. Start the server as in "Before
class" above and use `http://localhost:8000/`.

**`Identifier 'CONFIG' has already been declared`.** A `config.js` line got
pasted into `game.js` (or `config.js` is included twice). The three files
share one namespace, so a name can only be declared once across all of them.

**A magenta block in the art.** A letter in `sprites.js` isn't in `PALETTE`.
Add it or change it back.

**A ragged-row error** (something like *Sprite "ship" has rows of different
lengths: row 5 is 18 characters but row 0 is 17 characters. Every row must
be the same length. Fix it in sprites.js.*). Someone typed a character into a sprite row instead
of substituting one — count characters against row 0 and fix that one row.

**Nothing at all happens when you reload.** If an edit seems not to have taken
effect, hard-reload (Cmd-Shift-R, or Ctrl-Shift-R on Windows) — though the
local server now tells the browser never to cache these files, so this should
be rare.

**Port 8000 is already in use, or the server says it couldn't start.**
Either you already have it running in another window (close that one first)
or something else on the machine is using port 8000. On macOS,
`serve.command` gives up after a few seconds rather than hanging silently
and tells you which of the two happened; running `serve.py` directly will
print the error.

**The game is in slow motion.** Something is very expensive — usually a huge
`CRYSTALS_ON_SCREEN` or `STAR_COUNT`. The game deliberately slows down rather
than skipping collision checks.

**Clearing `BEST` between classes.** The high score is saved in the browser,
so the next class inherits whatever the last one reached. Open the browser
console (Cmd-Option-J) and run
`localStorage.removeItem('starScavengerHighScore')`, then reload.
