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
  },

  _cache: Object.create(null),

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
    };
    P.refillCrystals(state.crystals, Math.random, state.ship, CONFIG);

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

    function draw() {
      ctx.setTransform(state.scale, 0, 0, state.scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#10131c';
      ctx.fillRect(0, 0, CONFIG.ARENA, CONFIG.ARENA);
      drawStars(ctx, state.stars);
      for (let i = 0; i < state.crystals.length; i++) {
        Game._drawSprite(ctx, 'crystal', state.crystals[i].x, state.crystals[i].y, 0);
      }
      Game._drawSprite(ctx, 'ship', state.ship.x, state.ship.y, 0);
      for (let i = 0; i < state.asteroids.length; i++) {
        const a = state.asteroids[i];
        Game._drawSprite(ctx, 'rock' + a.size, a.x, a.y, a.angle);
      }
      // Tasks 8-10 add particles and HUD here.

      ctx.fillStyle = '#e8e8ff';
      ctx.font = '10px monospace';
      ctx.fillText('SCORE ' + state.score, 6, 12);
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
        P.stepShip(state.ship, currentAim(dt), dt, CONFIG);
        const got = P.findCollected(state.ship, state.crystals, CONFIG);
        if (got >= 0) {
          state.crystals.splice(got, 1);
          state.score += CONFIG.CRYSTAL_POINTS;
          P.refillCrystals(state.crystals, Math.random, state.ship, CONFIG);
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
        // Tasks 8-9 add hit detection and game-phase logic here.
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
};
