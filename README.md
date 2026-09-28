# Star Scavenger

A 60-second pixel-art survival game. Collect crystals, dodge asteroids, stay alive.
Built to be changed in front of a class: every number that matters is in `config.js`.

**Play it:** https://juanatjcx.github.io/star-scavenger/ (the repository's GitHub
Pages address — not live yet, so use "Running it on your own machine" below until
it is).

## Running it on your own machine

Double-click `serve.command`. It serves the folder on `http://localhost:8000/`
and opens the game in your browser. If a server is already running on that
port — say, from an earlier double-click you forgot about — it just opens the
game instead of failing; if something else entirely is squatting on port 8000,
it gives up after a few seconds and tells you so instead of hanging.

You can also just open `index.html` directly, but then the browser hides error
messages, so if you are changing the code, use `serve.command`.

## The files

| File | What's in it |
|---|---|
| `config.js` | **Every number you can change.** Start here. |
| `sprites.js` | The pixel art, drawn with letters. |
| `game.js` | The game loop. You shouldn't need to touch it. |
| `index.html` | The page and the error message panel. |
| `tests.html` | Open it in a browser to check the maths still works (156 checks). |
| `serve.command` | Double-click to run the game locally. |

## Controls

Arrow keys or WASD. On a phone, drag anywhere — the ship follows your thumb.

## Teaching with it

See [TEACHING.md](TEACHING.md).
