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

While `serve.command` is running, the page reloads itself within a second or
two of you saving `config.js`, `sprites.js`, `game.js`, or `index.html` — no
need to click back into the browser and reload by hand. This only happens on
`localhost`; the published game makes no network requests of any kind, and a
`location.hostname` check keeps it that way.

## Shipping changes

`./ship "what changed"` commits everything, pushes to `main`, and waits until
the new version is actually live (GitHub Pages takes about a minute) before
printing a `LIVE:` line. Run it with no message for a default one.

- `./ship --dry-run "..."` shows exactly what it would do — the commit
  message, the files, whether it would push — without touching anything.
- `./ship --undo` reverts the last deploy with a new commit (never rewrites
  history) and waits for the old version to come back. Use it the moment a
  change turns out to have made things worse.

`./ship` always runs a syntax check on `config.js`, `sprites.js`, and
`game.js` first and refuses to commit anything that doesn't parse — the one
mistake that looks exactly like "I forgot to save."

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
| `ship` | Commits, pushes, and confirms the live site caught up. See "Shipping changes" above. |

## Controls

Arrow keys or WASD. On a phone, drag anywhere — the ship follows your thumb.
The title screen starts on any key or tap. The win and lose screens restart
on Enter, a tap, or a click — not just any key — so a key still held from
playing doesn't skip past your score before you've read it.

## Teaching with it

See [TEACHING.md](TEACHING.md).
