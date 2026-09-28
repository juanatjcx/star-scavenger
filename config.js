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
};
