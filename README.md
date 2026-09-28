# Star Scavenger

A 60-second pixel-art survival game. Collect crystals, dodge asteroids, stay alive.
Built to be changed in front of a class: every number that matters is in `config.js`.

**Play it:** https://juanatjcx.github.io/star-scavenger/ (the repository's GitHub
Pages address — not live yet, so use "Running it on your own machine" below until
it is).

## Running it on your own machine

Clone the repository, don't download the ZIP — GitHub's "Download ZIP" strips
the executable bit and adds a macOS quarantine flag, so `serve.command` won't
double-click-run from it.

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
| `tests.html` | Open it in a browser to check the maths still works (199 checks). |
| `serve.command` | Double-click to run the game locally. |
| `serve.py` | The local server `serve.command` runs. Binds to `127.0.0.1` only. |

## Controls

Arrow keys or WASD. On a phone, drag anywhere — the ship follows your thumb.
The title screen starts on any key or tap. The win and lose screens restart
on Enter, a tap, or a click — not just any key — so a key still held from
playing doesn't skip past your score before you've read it.

## Teaching with it

See [TEACHING.md](TEACHING.md).
