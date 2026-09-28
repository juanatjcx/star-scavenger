// The game itself. You should not need to change this file to change how the
// game plays — all the numbers are in config.js.

const Game = {
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

    // Work out how big to draw the arena. The BITMAP is always a whole-number
    // multiple of the arena: with smoothing off, a fraction like x2.25 draws
    // some pixels 2 wide and others 3, which makes the art look broken. The
    // displayed size is then capped to the screen, so a phone narrower than the
    // arena shows the whole playfield slightly smaller instead of losing its edges.
    computeScale: function (viewW, viewH, arena, dpr) {
      const shortest = Math.min(viewW, viewH);
      const scale = Math.max(1, Math.floor(shortest / arena));
      return {
        scale: scale,
        cssSize: Math.min(arena * scale, shortest),
        pixelSize: arena * scale * (dpr || 1),
      };
    },

    // Scatter STAR_COUNT stars across the arena. Brightness is 1-3.
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

    // Drift the stars downward, wrapping anything that scrolls past the
    // bottom edge back to the top.
    scrollStars: function (stars, dt, cfg) {
      for (let i = 0; i < stars.length; i++) {
        stars[i].y += cfg.STAR_SCROLL_SPEED * dt;
        if (stars[i].y >= cfg.ARENA) stars[i].y -= cfg.ARENA;
      }
    },

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

    // Is the ship touching a rock? This is a point-in-time distance check, not
    // a sweep — it is only reliable because MAX_FRAME_SECONDS keeps every step
    // short enough that nothing can cross an asteroid between two checks.
    findHit: function (ship, asteroids, cfg) {
      for (let i = 0; i < asteroids.length; i++) {
        if (Game.pure.circlesOverlap(ship.x, ship.y, cfg.SHIP_RADIUS,
                                     asteroids[i].x, asteroids[i].y, asteroids[i].radius)) return i;
      }
      return -1;
    },

    // Scatter `count` little sparks from (x, y) in random directions.
    burst: function (rng, x, y, color, count, cfg) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const dir = rng() * Math.PI * 2;
        const speed = cfg.PARTICLE_SPEED * (cfg.PARTICLE_SPEED_MIN + rng() * (1 - cfg.PARTICLE_SPEED_MIN));
        out.push({
          x: x, y: y,
          vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed,
          life: cfg.PARTICLE_LIFE, color: color,
        });
      }
      return out;
    },

    // Move and age every particle, dropping any that have run out of life.
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

    // Surviving the whole run pays a flat bonus on top of whatever was collected.
    finalScore: function (score, cfg) {
      return score + cfg.WIN_BONUS;
    },

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

    // Blend two "#rrggbb" colours. t=0 gives the first, t=1 the second.
    mixColor: function (a, b, t) {
      const f = Game.pure.clamp(t, 0, 1);
      const pick = function (hex, i) { return parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16); };
      const part = function (i) { return Math.round(Game.pure.lerp(pick(a, i), pick(b, i), f)); };
      return 'rgb(' + part(0) + ', ' + part(1) + ', ' + part(2) + ')';
    },

    // How worried should the clock look? 0 while there is plenty of time,
    // rising smoothly to 1 as it reaches zero.
    clockUrgency: function (timeLeft, cfg) {
      if (cfg.CLOCK_URGENT_SECONDS <= 0) return 0;
      return 1 - Game.pure.clamp(timeLeft / cfg.CLOCK_URGENT_SECONDS, 0, 1);
    },

    // Everything about how the clock looks right now: its colour, how far it has
    // wandered from home, and how much it has swelled. `now` is handed in rather
    // than read from a clock in here, so the same inputs always give the same
    // answer and the tests can check it.
    clockStyle: function (timeLeft, now, cfg) {
      const P = Game.pure;
      const urgency = P.clockUrgency(timeLeft, cfg);
      const seconds = now / 1000;

      // Colour: calm to warn over the first half of the panic, warn to panic
      // over the second half.
      const color = urgency < 0.5
        ? P.mixColor(cfg.CLOCK_CALM_COLOR, cfg.CLOCK_WARN_COLOR, urgency * 2)
        : P.mixColor(cfg.CLOCK_WARN_COLOR, cfg.CLOCK_PANIC_COLOR, (urgency - 0.5) * 2);

      // Shiver: two sine waves at different speeds, so it trembles instead of
      // sliding along a line. Perfectly still while urgency is 0.
      const amp = cfg.CLOCK_TREMBLE_MAX * urgency;
      const dx = Math.sin(seconds * cfg.CLOCK_TREMBLE_HZ * Math.PI * 2) * amp;
      const dy = Math.cos(seconds * cfg.CLOCK_TREMBLE_HZ * 1.37 * Math.PI * 2) * amp;

      // Jump: a nudge at the top of each second that fades before the next one.
      const intoSecond = timeLeft - Math.floor(timeLeft);
      const kick = cfg.CLOCK_KICK_UNITS * urgency * Math.max(0, 1 - intoSecond * 5);

      // Heartbeat: only in the last few seconds, and it quickens as it goes.
      let scale = 1;
      if (cfg.CLOCK_PULSE_SECONDS > 0 && timeLeft <= cfg.CLOCK_PULSE_SECONDS) {
        const into = P.clamp(1 - timeLeft / cfg.CLOCK_PULSE_SECONDS, 0, 1);
        const hz = P.lerp(cfg.CLOCK_PULSE_HZ_START, cfg.CLOCK_PULSE_HZ_END, into);
        const beat = (Math.sin(seconds * hz * Math.PI * 2) + 1) / 2;
        scale = P.lerp(1, cfg.CLOCK_PULSE_MAX, beat);
      }

      return { color: color, dx: dx, dy: dy + kick, scale: scale };
    },
  },

  _cache: Object.create(null),

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

  // Draw a sprite once into its own little canvas, then reuse it every frame.
  _spriteCanvas: function (name) {
    if (Game._cache[name]) return Game._cache[name];
    const rows = SPRITES[name];
    if (!rows || !rows.length) {
      throw new Error('The sprite "' + name + '" is missing or empty in sprites.js');
    }
    // Every row must be the same number of characters. If one row is longer, the
    // extra pixels fall outside the sprite and vanish without any warning — the
    // edit just looks like it did nothing, which is the worst thing that can
    // happen while you are demonstrating in front of a class.
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].length !== rows[0].length) {
        throw new Error('Sprite "' + name + '" has rows of different lengths: row ' + i +
          ' is ' + rows[i].length + ' characters but row 0 is ' + rows[0].length +
          '. Every row must be the same length.');
      }
    }
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
    // An angle of 0 is falsy, so this also catches "not rotated" — take the
    // fast path that keeps the art lined up on whole pixels.
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

  _audio: null,

  // Two synthesised blips, made with maths — there are no sound files. Browsers
  // refuse to make noise before the user interacts with the page, so the audio
  // context is built lazily on the first beep, never at load. No sound must
  // never mean no game: every path here is wrapped so a failure is silent.
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
      // Anchor the starting value explicitly before the ramp: an exponential
      // ramp continues from whatever value is *scheduled* at the current
      // time, and a plain assignment to gain.gain.value doesn't schedule
      // anything — skip this and the blip can end in an audible click.
      gain.gain.setValueAtTime(CONFIG.SOUND_VOLUME, ac.currentTime);
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

  start: function (canvas) {
    const ctx = canvas.getContext('2d');
    const P = Game.pure;

    const state = {
      stars: P.makeStars(Math.random, CONFIG),
      scale: 1,
      ship: { x: CONFIG.ARENA / 2, y: CONFIG.ARENA / 2 },
      crystals: [],
      score: 0,
      asteroids: [],
      elapsed: 0,
      spawnTimer: 0,
      lives: CONFIG.SHIP_LIVES,
      invincibleFor: 0,
      shake: 0,
      particles: [],
      phase: 'title',
      timeLeft: CONFIG.SURVIVE_SECONDS,
      highScore: Game._loadHighScore(),
    };
    P.refillCrystals(state.crystals, Math.random, state.ship, CONFIG);

    // Bring every mutable key introduced since Task 3 back to its starting
    // value. `stars`, `scale` and `highScore` are deliberately left alone:
    // the background is continuous, the scale belongs to resize(), and the
    // high score is the whole point of persisting it.
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

      // Forget any drag in progress. Without this, a tap that dismisses an end
      // screen could carry a finger-to-ship gap measured against the ship's old
      // position, and the ship would leap the moment the finger moved.
      input.touch = null;
    }

    // Title, win and lose screens all restart on any key or tap — there is no
    // menu to read first. This listener is registered BEFORE the touch
    // steering listener below so that, when a tap both dismisses an end
    // screen and starts touchstart's own handler, reset() has already moved
    // the ship back to the centre before that handler records the finger's
    // offset from it — otherwise the offset would be measured against wherever
    // the ship happened to be when the previous run ended, and the new run
    // would open with a phantom fling toward that stale spot.
    function anyButton() {
      if (state.phase === 'playing') return;
      reset();
    }
    window.addEventListener('keydown', anyButton);
    canvas.addEventListener('touchstart', anyButton, { passive: false });
    canvas.addEventListener('mousedown', anyButton);

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
      // A drag is already steering — an extra thumb touching down must not
      // hijack it. Only the very first touch point ever starts a drag.
      if (input.touch) return;
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

    function drawStars(ctx, stars) {
      const shades = ['#2c3350', '#4a5580', '#8e9ccc'];
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        ctx.fillStyle = shades[s.bright - 1];
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
      }
    }

    function draw(now) {
      // A hit kicks the whole frame, not just the ship — otherwise the
      // starfield would sit still while the foreground shook, which looks
      // wrong. One setTransform call governs everything drawn below it.
      let ox = 0, oy = 0;
      if (state.shake > 0) {
        const power = (state.shake / CONFIG.SHAKE_DECAY) * CONFIG.SHAKE_PIXELS;
        ox = (Math.random() * 2 - 1) * power;
        oy = (Math.random() * 2 - 1) * power;
      }
      ctx.setTransform(state.scale, 0, 0, state.scale, ox * state.scale, oy * state.scale);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#10131c';
      ctx.fillRect(0, 0, CONFIG.ARENA, CONFIG.ARENA);
      drawStars(ctx, state.stars);
      for (let i = 0; i < state.crystals.length; i++) {
        Game._drawSprite(ctx, 'crystal', state.crystals[i].x, state.crystals[i].y, 0);
      }
      // While invincible the ship flashes, so a hit is unmistakable.
      const flashOff = state.invincibleFor > 0 &&
        Math.floor(state.invincibleFor * CONFIG.BLINK_HZ * 2) % 2 === 1;
      if (!flashOff) Game._drawSprite(ctx, 'ship', state.ship.x, state.ship.y, 0);
      for (let i = 0; i < state.asteroids.length; i++) {
        const a = state.asteroids[i];
        Game._drawSprite(ctx, 'rock' + a.size, a.x, a.y, a.angle);
      }
      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
      }
      // ── HUD ──
      ctx.fillStyle = '#e8e8ff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SCORE ' + state.score, 6, 13);
      ctx.textAlign = 'right';
      ctx.fillText('BEST ' + state.highScore, CONFIG.ARENA - 6, 13);

      // The clock. While you are playing it gets more agitated as time runs
      // out; on the title and end screens it just sits still.
      const clock = state.phase === 'playing'
        ? P.clockStyle(state.timeLeft, now, CONFIG)
        : { color: CONFIG.CLOCK_CALM_COLOR, dx: 0, dy: 0, scale: 1 };
      ctx.save();
      ctx.translate(CONFIG.ARENA / 2 + clock.dx, 26 + clock.dy);
      ctx.scale(clock.scale, clock.scale);
      ctx.textAlign = 'center';
      ctx.font = '22px monospace';
      ctx.fillStyle = clock.color;
      ctx.fillText(P.formatTime(state.timeLeft), 0, 0);
      ctx.restore();

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
    }

    let last = performance.now();
    function frame(now) {
      // Clamp the frame delta. Anything longer than MAX_FRAME_SECONDS lets fast
      // objects jump further than their own radius in one step, which means
      // collisions get skipped entirely.
      const dt = Math.min((now - last) / 1000, CONFIG.MAX_FRAME_SECONDS);
      last = now;
      try {
        if (state.phase === 'playing') {
          P.scrollStars(state.stars, dt, CONFIG);
          P.stepShip(state.ship, currentAim(dt), dt, CONFIG);
          const got = P.findCollected(state.ship, state.crystals, CONFIG);
          if (got >= 0) {
            state.crystals.splice(got, 1);
            state.score += CONFIG.CRYSTAL_POINTS;
            P.refillCrystals(state.crystals, Math.random, state.ship, CONFIG);
            state.particles = state.particles.concat(
              P.burst(Math.random, state.ship.x, state.ship.y, '#ffe66d', CONFIG.PARTICLES_PER_COLLECT, CONFIG));
            Game._beep(CONFIG.COLLECT_HZ, CONFIG.COLLECT_MS);
          }
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
              Game._beep(CONFIG.HIT_HZ, CONFIG.HIT_MS);
              state.asteroids.splice(hitIndex, 1);
            }
          }
          state.particles = P.stepParticles(state.particles, dt);

          // The clock runs on clamped time, so backgrounding the tab pauses the
          // run rather than failing it, and a slow device gets the same
          // game-time and the same difficulty curve as a fast one.
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
        }
        draw(now);
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
};
