// ═══════════════════════════════════════════════════════════════
//  STAR SCAVENGER — every number you can change lives in here.
//  Change one, save, and reload the page. That's the whole loop.
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // ── The playfield ────────────────────────────────────────────
  ARENA: 400,              // The game is 400 x 400 units, always.

  // ── The clock ────────────────────────────────────────────────
  SURVIVE_SECONDS: 60,     // How long you have to stay alive.
  RESTART_LOCKOUT_SECONDS: 0.4,  // How long an end screen ignores you, so the
                                 // score is still there when you look up. 0 = instant.

  // ── Asteroids: how the game gets harder ──────────────────────
  ASTEROID_SPAWN_INTERVAL_START: 1.2,  // Seconds between rocks at the start.
  ASTEROID_SPAWN_INTERVAL_END: 0.25,   // ...and by the final second. Lower = harder.
  ASTEROID_SPEED_START: 60,            // How fast rocks fly at the start.
  ASTEROID_SPEED_END: 140,             // ...and at the end. Higher = harder.

  // ── Background ───────────────────────────────────────────────
  STAR_COUNT: 60,          // How many stars drift past behind the game.
  STAR_SCROLL_SPEED: 12,   // How fast they drift, in units per second.
  STAR_SHADES: ['#2c3350', '#4a5580', '#8e9ccc'],  // Dim, medium and bright stars.

  // ── Timing (don't change these without reading the comments) ─
  MAX_FRAME_SECONDS: 0.025,  // Longest step we allow. Bigger values let the
                             // ship pass straight through asteroids.

  // ── Your ship ────────────────────────────────────────────────
  SHIP_SPEED: 220,         // Units per second. Try 500 for chaos.
  SHIP_RADIUS: 6,          // How big the ship's "hit zone" is. Smaller = easier.

  // ── Crystals: the things you collect ─────────────────────────
  CRYSTALS_ON_SCREEN: 5,   // How many are out there at once.
  CRYSTAL_POINTS: 10,      // Points each one is worth.
  CRYSTAL_RADIUS: 5,       // How close you must get. Bigger = easier.
  CRYSTAL_WALL_MARGIN: 30, // Keeps them away from the edges.
  CRYSTAL_MIN_FROM_SHIP: 40,    // So one never appears in your lap.
  CRYSTAL_MIN_FROM_CRYSTAL: 25, // So five never stack into one blob.
  SPAWN_TRIES: 30,         // How hard we try for a good spot before giving up.

  // ── Asteroids: the things that hurt ──────────────────────────
  ASTEROID_SIZES: [12, 20, 28],    // Small, medium, big. Sprite names match.
  ASTEROID_RADIUS_FACTOR: 0.4,     // Hit zone as a share of size. Smaller = kinder.
  ASTEROID_JITTER_DEG: 30,         // How crooked their paths are. 0 = straight lines.
  ASTEROID_SPIN_DEG: 90,           // How fast they tumble. Looks only.
  ASTEROID_MAX_ALIVE: 20,          // Hard ceiling. Stops a silly spawn rate (like
                                   // 0.01) freezing the browser in front of a class.
                                   // Normal play peaks near 13 alive, with about 81
                                   // spawned across a run, so 40 could never fire and
                                   // would be dead code. The 13-to-20 headroom is
                                   // thinner than when this number was chosen — it
                                   // still protects rather than shapes normal play,
                                   // but with less margin than it used to.
  ASTEROID_MAX_LIFETIME: 20,       // Seconds before a stray rock is removed.
  ASTEROID_DESPAWN_MARGIN: 40,     // How far off screen they appear and disappear.

  // ── Getting hit ──────────────────────────────────────────────
  SHIP_LIVES: 3,           // How many hearts you start with.
  INVINCIBLE_SECONDS: 1.5, // Free hits right after being hit.
  BLINK_HZ: 10,            // How fast you flash while invincible.
  SHAKE_PIXELS: 6,         // How hard the screen kicks on a hit. 0 = calm.
  SHAKE_DECAY: 0.15,       // Seconds for the kick to settle.
  PARTICLES_PER_COLLECT: 8,  // Sparks thrown when you grab a crystal. More = showier.
  PARTICLES_PER_HIT: 14,     // Sparks thrown when you take a hit. More = showier.
  PARTICLE_SPEED: 70,        // How fast sparks fly outward. Higher = a bigger burst.
  PARTICLE_SPEED_MIN: 0.4,  // Slowest piece, as a share of PARTICLE_SPEED.
                            // The rest fly faster, up to full speed.
  PARTICLE_LIFE: 0.45,       // Seconds a spark lives before fading out.

  // ── Winning ──────────────────────────────────────────────────
  WIN_BONUS: 100,          // Extra points for lasting the whole run.

  // ── The clock's nerves ───────────────────────────────────────
  //  As time runs out the clock changes colour, shivers, jumps on
  //  every tick, and finally starts beating like a heart.
  CLOCK_URGENT_SECONDS: 15,     // When it starts getting nervous. Try 40. Set this to
                                 // 0 and the colour change, shiver and kick all stop —
                                 // but NOT the heartbeat below, which is timed off the
                                 // raw clock rather than off this urgency window. The
                                 // two are independent on purpose, just not obviously.
  CLOCK_CALM_COLOR: '#e8e8ff',  // Its colour with plenty of time left.
  CLOCK_WARN_COLOR: '#ffc44d',  // Its colour halfway through the panic.
  CLOCK_PANIC_COLOR: '#ff4d6d', // Its colour at zero.
  CLOCK_TREMBLE_MAX: 3,         // How far it shivers side to side at zero. 0 = no
                                 // shiver — the per-second kick is a separate layer
                                 // and still moves the clock vertically even at 0.
  CLOCK_TREMBLE_HZ: 11,         // How fast it shivers.
  CLOCK_KICK_UNITS: 4,          // How far it jumps on each tick. 0 = no jump.
  CLOCK_PULSE_SECONDS: 5,       // When the heartbeat starts.
  CLOCK_PULSE_MAX: 1.25,        // How much it swells on each beat. 1 = no beat.
  CLOCK_PULSE_HZ_START: 2,      // Beats per second when the heartbeat begins...
  CLOCK_PULSE_HZ_END: 5,        // ...and by the time it reaches zero.

  // ── Sound (made by maths, there are no sound files) ──────────
  SOUND_ON: true,          // Set to false for a silent classroom.
  COLLECT_HZ: 880,         // Pitch of the collect blip. Higher = squeakier.
  COLLECT_MS: 60,
  HIT_HZ: 140,             // Pitch of the hit thud.
  HIT_MS: 180,
  SOUND_VOLUME: 0.06,      // Keep this low. It will be on a projector.
};
