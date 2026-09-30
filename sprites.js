// ═══════════════════════════════════════════════════════════════
//  THE PIXEL ART. This is drawn with letters.
//  Each letter is a colour from PALETTE. A dot is see-through.
//  Change a letter, save, reload — the art changes. Try it.
// ═══════════════════════════════════════════════════════════════

const PALETTE = {
  '.': null,        // see-through
  W: '#ffffff',     // White
  C: '#7df9ff',     // Cyan  — the ship's glass
  B: '#2b6cff',     // Blue  — the ship's body
  D: '#14307a',     // Dark blue — the ship's shadow
  F: '#ff9b3d',     // Flame
  Y: '#ffe66d',     // Yellow — crystals
  O: '#ffa62b',     // Orange — crystal shadow
  G: '#8d8f9a',     // Grey   — rock
  H: '#5b5d68',     // Heavy grey — rock shadow
  L: '#b9bcc9',     // Light grey — rock highlight
  R: '#ff4d6d',     // Red    — hearts
  M: '#64ed85',     // Martian green
};

const SPRITES = {
  powerStar: [
    '.....W.....',
    '....WYW....',
    '....WYW....',
    'WWWWYYYWWWW',
    '.WYYYYYYYW.',
    '..WYYYYYW..',
    '..WYYYYYW..',
    '..WYYWYYW..',
    '.WYYW.WYYW.',
    '.WYW...WYW.',
    '.WW.....WW.',
  ],
  martian: [
    '......MMMM......',
    '.....MCCWWM.....',
    '....MMCCCCMM....',
    '..MMMMMMMMMMMM..',
    '.WMMMMMMMMMMMMW.',
    'WWWWWWWWWWWWWWWW',
    '..HHHHHHHHHHHH..',
    '...R..R..R..R...',
  ],
  // A cyan diamond with white facets, distinct from the yellow crystals.
  diamond: [
    '....CC....',
    '...CWWC...',
    '..CWWCCC..',
    '.CWWCCCCC.',
    'CWWCCCCCCC',
    'CCCCCCCCDC',
    '.CCCCCDDC.',
    '..CCCDDC..',
    '...CDDC...',
    '....CC....',
  ],
  // 16 x 16. The ship you fly.
  ship: [
    '.......WW.......',
    '......WCCW......',
    '......WCCW......',
    '.....WBCCBW.....',
    '.....WBCCBW.....',
    '....WBBCCBBW....',
    '....WBBCCBBW....',
    '...WBBBCCBBBW...',
    '...WBBDDDDBBW...',
    '..WBBBDDDDBBBW..',
    '..WBDDBDDBDDBW..',
    '.WBBDD.DD.DDBBW.',
    '.WBD...FF...DBW.',
    '..W...FFFF...W..',
    '......FFFF......',
    '.......FF.......',
  ],

  // 8 x 8. The thing you want.
  crystal: [
    '...YY...',
    '..YYYY..',
    '.YYWWYY.',
    'YYWWWWYY',
    'YYWWWWYY',
    '.YYOOYY.',
    '..YOOY..',
    '...OO...',
  ],

  // 12 x 12. The smallest rock. Fast and sneaky.
  rock12: [
    '...GGGG.....',
    '..GLLGGG....',
    '.GLLGGGGG...',
    'GLLGGGGGGG..',
    'GLGGGGGGGHG.',
    'GGGGGGGGHHG.',
    'GGGGGGGGHHG.',
    '.GGGGGGGHHG.',
    '.GGGGGGHHG..',
    '..GGGGHHHG..',
    '...GHHHHG...',
    '....GGGG....',
  ],

  // 20 x 20. The middle rock.
  rock20: [
    '.....GGGGGGG........',
    '...GGLLGGGGGGG......',
    '..GLLLGGGGGGGGG.....',
    '.GLLLGGGGGGGGGGG....',
    '.GLLGGGGGGGGGGGGG...',
    'GLLGGGGGGGGGGGGGGG..',
    'GLGGGGGGGGGGGGGGHG..',
    'GLGGGGGGGGGGGGGGHHG.',
    'GGGGGGGGGGGGGGGGHHG.',
    'GGGGGGGGGGGGGGGGHHG.',
    'GGGGGGGGGGGGGGGGHHG.',
    '.GGGGGGGGGGGGGGHHHG.',
    '.GGGGGGGGGGGGGGHHG..',
    '.GGGGGGGGGGGGGHHHG..',
    '..GGGGGGGGGGGHHHG...',
    '..GGGGGGGGGGHHHG....',
    '...GGGGGGGGHHHG.....',
    '....GGGGGHHHHG......',
    '.....GHHHHHG........',
    '......GGGGG.........',
  ],

  // 28 x 28. The big slow one.
  rock28: [
    '.......GGGGGGGGGG...........',
    '.....GGLLLGGGGGGGGG.........',
    '...GGLLLLGGGGGGGGGGG........',
    '..GLLLLLGGGGGGGGGGGGG.......',
    '..GLLLLGGGGGGGGGGGGGGG......',
    '.GLLLLGGGGGGGGGGGGGGGGG.....',
    '.GLLLGGGGGGGGGGGGGGGGGGG....',
    'GLLLGGGGGGGGGGGGGGGGGGGGG...',
    'GLLGGGGGGGGGGGGGGGGGGGGGG...',
    'GLLGGGGGGGGGGGGGGGGGGGGHG...',
    'GLGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GLGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GGGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GGGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GGGGGGGGGGGGGGGGGGGGGGGHHG..',
    'GGGGGGGGGGGGGGGGGGGGGGHHHG..',
    '.GGGGGGGGGGGGGGGGGGGGGHHHG..',
    '.GGGGGGGGGGGGGGGGGGGGHHHG...',
    '.GGGGGGGGGGGGGGGGGGGHHHG....',
    '..GGGGGGGGGGGGGGGGGHHHG.....',
    '..GGGGGGGGGGGGGGGGHHHG......',
    '...GGGGGGGGGGGGGGHHHG.......',
    '....GGGGGGGGGGGGHHHG........',
    '.....GGGGGGGGGGHHHG.........',
    '......GGGGGGGHHHHG..........',
    '.......GGGGHHHHG............',
    '........GHHHHHG.............',
    '.........GGGGG..............',
  ],

  // 7 x 7. One of your lives.
  heart: [
    '.RR.RR.',
    'RRRRRRR',
    'RRRRRRR',
    'RRRRRRR',
    '.RRRRR.',
    '..RRR..',
    '...R...',
  ],
};
