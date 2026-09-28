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
      Game._drawSprite(ctx, 'ship', CONFIG.ARENA / 2, CONFIG.ARENA / 2, 0);
      // Tasks 5-10 add ship, crystals, asteroids, particles, and HUD here.
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
        // Tasks 5-9 add ship movement, spawning, and game-phase logic here.
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
