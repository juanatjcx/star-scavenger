# Teaching with Star Scavenger

## Before class

1. Double-click `serve.command`. Leave the Terminal window open — closing it
   stops the server.
2. Open `config.js` in your editor, projected, at a font size the back row can
   read.
3. Have `https://juanatjcx.github.io/star-scavenger/` on the board for phones
   (once it's live — see the README).
4. Reload `http://localhost:8000/index.html` once yourself before anyone
   arrives, just to see a clean, error-free start.

The loop for the whole lesson: **a student suggests something → you change one
number → you save → you reload the browser → the room reacts.** Keep it to one
change at a time. The reaction is the lesson.

## Opening, about 60 seconds

> "This is a game. It's about a thousand lines of instructions, and I can read
> one of them to you: `SHIP_SPEED: 220`. What do you think happens if I make
> that 500?"

Change it, reload, fly the ship. Then: "What else should we change?"

## Tier 1 — one number in `config.js`

These are all safe, instant, and reversible. Change the number, save, reload.
Ordered roughly easiest-to-read first.

| A student says | Change | From → to | What they'll see |
|---|---|---|---|
| "Make the ship faster!" | `SHIP_SPEED` | 220 → 500 | Barely controllable. Great. |
| "Make it slower" | `SHIP_SPEED` | 220 → 80 | Suddenly very hard. |
| "Give me more lives" | `SHIP_LIVES` | 3 → 10 | Ten hearts along the bottom. |
| "Make it shorter" | `SURVIVE_SECONDS` | 60 → 15 | A whole game in fifteen seconds. |
| "More crystals!" | `CRYSTALS_ON_SCREEN` | 5 → 30 | The screen fills with treasure. Safe well past this — 60 never fails to place a crystal, 80 fails about 4% of the time, 100 about a third of the time, and it never hangs at any value; past ~80 they just start overlapping into blobs. |
| "Crystals worth more" | `CRYSTAL_POINTS` | 10 → 500 | Score explodes. |
| "Make crystals easier to grab" | `CRYSTAL_RADIUS` | 5 → 12 | You don't have to be exact anymore. |
| "Too many rocks" | `ASTEROID_SPAWN_INTERVAL_END` | 0.4 → 1.0 | The ending stops being frantic. |
| "Make it impossible" | `ASTEROID_SPAWN_INTERVAL_START` | 1.2 → 0.15 | A wall of rocks from second one. `ASTEROID_MAX_ALIVE: 20` is the reason the tab doesn't freeze at extreme settings like this — normal play peaks near 9 rocks alive at once, so 20 is a ceiling, not a target. |
| "Rocks too fast" | `ASTEROID_SPEED_END` | 140 → 80 | Dodgeable again. |
| "GIANT rocks" | `ASTEROID_SIZES` | `[12, 20, 28]` → `[28, 28, 28]` | Only boulders. |
| "Tiny rocks" | `ASTEROID_SIZES` | `[12, 20, 28]` → `[12, 12, 12]` | Fast and sneaky. |
| "Make them fly straight" | `ASTEROID_JITTER_DEG` | 30 → 0 | Predictable lanes. Notice it gets *easier*. Push it the other way, toward 89, and a rock's inward speed collapses — at 89 it would take roughly 390 seconds to cross the screen, so the only thing that ever removes it is `ASTEROID_MAX_LIFETIME: 20` timing it out. That key looks unused in normal play (no rock survives past ~9 seconds) but it isn't. |
| "Stop them spinning" | `ASTEROID_SPIN_DEG` | 90 → 0 | Looks frozen. A good "looks vs. rules" moment — the rock's hitbox never depended on which way it was facing. |
| "It's too hard" | `SHIP_RADIUS` | 6 → 3 | Squeeze through gaps. Explain the hit zone. |
| "Longer invincibility" | `INVINCIBLE_SECONDS` | 1.5 → 5 | Blinks for ages, can't be hit. |
| "Stop the shaking" | `SHAKE_PIXELS` | 6 → 0 | Calm. Then try 40. |
| "MORE EXPLOSIONS" | `PARTICLES_PER_HIT` | 14 → 80 | Fireworks. |
| "Celebrate every pickup" | `PARTICLES_PER_COLLECT` | 8 → 30 | A little burst every time, not just on hits. |
| "More stars" | `STAR_COUNT` | 60 → 400 | Dense starfield. |
| "Make the stars race by" | `STAR_SCROLL_SPEED` | 12 → 80 | A sense of speed even though the ship isn't faster — good for separating "how it looks" from "how it plays." |
| "Turn the sound off" | `SOUND_ON` | true → false | Silence. |
| "Make the collect sound higher" | `COLLECT_HZ` | 880 → 1800 | A squeakier blip. |
| "Make the clock panic earlier" | `CLOCK_URGENT_SECONDS` | 15 → 40 | Under the shipped setting the clock is calm for three-quarters of the run and only gets nervous in the last 15 seconds. Raise this to 40 and most of the round feels tense. |
| "Bigger reward for surviving" | `WIN_BONUS` | 100 → 1000 | Surviving becomes worth more than collecting — a good lead-in to a strategy discussion. |

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
  panel names the exact sprite and row, e.g. *"Sprite 'gold' has rows of
  different lengths: row 3 is 9 characters but row 0 is 8 characters. Every
  row must be the same length."* That matters more than it sounds: nobody
  opens `tests.html` mid-lesson, but everybody sees the game's own error
  panel. Read the message aloud, count characters, fix the row, reload.

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

Also: open `tests.html` and confirm `0 failed` (there are 156 checks total).

## When it breaks in front of everyone

**A red panel with an error message.** Good — that's the design working. Read
the message aloud; it names the file. Usually a missing comma or brace in
`config.js`. If several things broke at once, the panel only shows the
*first* error and counts the rest ("...and 2 later errors — see the
console") — the first one is the one to fix; the others are usually just
fallout from it. Undo, reload, carry on.

**The panel says `"Script error."` with no detail.** You are not on the
server. You opened `index.html` directly. Double-click `serve.command` and
use `http://localhost:8000/`.

**`Identifier 'CONFIG' has already been declared`.** A `config.js` line got
pasted into `game.js` (or `config.js` is included twice). The three files
share one namespace, so a name can only be declared once across all of them.

**A magenta block in the art.** A letter in `sprites.js` isn't in `PALETTE`.
Add it or change it back.

**A ragged-row error** (something like *"Sprite 'ship' has rows of different
lengths: row 5 is 18 characters but row 0 is 17 characters"*). Someone typed
a character into a sprite row instead of substituting one — count characters
against row 0 and fix that one row.

**Nothing at all happens when you reload.** Hard-reload (Cmd-Shift-R, or
Ctrl-Shift-R on Windows) — the browser is caching the old `config.js` and
serving you yesterday's numbers.

**Port 8000 is already in use / `serve.command` says it couldn't start.**
Either you already have it running in another Terminal window (close that
one first) or something else on the machine is using port 8000. The script
gives up after six seconds rather than hanging silently, and it tells you
which of the two happened.

**The game is in slow motion.** Something is very expensive — usually a huge
`CRYSTALS_ON_SCREEN` or `STAR_COUNT`. The game deliberately slows down rather
than skipping collision checks.
