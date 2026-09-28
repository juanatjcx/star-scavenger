// ═══════════════════════════════════════════════════════════════
//  STAR SCAVENGER — every number you can change lives in here.
//  Change one, save, and reload the page. That's the whole loop.
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // ── The playfield ────────────────────────────────────────────
  ARENA: 400,              // The game is 400 x 400 units, always.

  // ── The clock ────────────────────────────────────────────────
  SURVIVE_SECONDS: 60,     // How long you have to stay alive.

  // ── Asteroids: how the game gets harder ──────────────────────
  ASTEROID_SPAWN_INTERVAL_START: 1.2,  // Seconds between rocks at the start.
  ASTEROID_SPAWN_INTERVAL_END: 0.4,    // ...and by the final second. Lower = harder.
  ASTEROID_SPEED_START: 60,            // How fast rocks fly at the start.
  ASTEROID_SPEED_END: 140,             // ...and at the end. Higher = harder.

  // ── Background ───────────────────────────────────────────────
  STAR_COUNT: 60,          // How many stars drift past behind the game.
  STAR_SCROLL_SPEED: 12,   // How fast they drift, in units per second.

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
};
