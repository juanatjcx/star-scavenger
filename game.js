// The game itself. You should not need to change this file to change how the
// game plays — all the numbers are in config.js.

const Game = {
  pure: {},

  start: function (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    canvas.width = CONFIG.ARENA;
    canvas.height = CONFIG.ARENA;
    ctx.fillStyle = '#10131c';
    ctx.fillRect(0, 0, CONFIG.ARENA, CONFIG.ARENA);
    ctx.fillStyle = '#e8e8ff';
    ctx.font = '16px monospace';
    ctx.fillText('STAR SCAVENGER', 120, 200);
  },
};
