# Star Scavenger

A 60-second pixel-art survival game. Collect crystals, dodge asteroids, stay alive.
Built to be changed in front of a class: every number that matters is in `config.js`.

**Play it:** https://juanatjcx.github.io/star-scavenger/

## Running it on your own machine

There is no build step. You need two free tools, and on macOS and most Linux
systems both are already installed — check before installing anything:

```
git --version
python3 --version        # on Windows: python --version
```

If either is missing:

- **Git** — https://git-scm.com/downloads
- **Python 3** — https://www.python.org/downloads/

Then get the files. Cloning is better than "Download ZIP": it lets you publish
your changes later and pull updates, and on macOS the ZIP strips the executable
bit that `serve.command` needs.

```
git clone https://github.com/juanatjcx/star-scavenger.git
cd star-scavenger
```

### Windows

When you install Python, **tick "Add python.exe to PATH" on the first screen of
the installer.** It is easy to miss and it is the most common thing that goes
wrong.

Open **Git Bash** (installed with Git) or PowerShell, and run:

```
python serve.py
```

If Windows says `python is not recognised`, or the Microsoft Store opens
instead, the PATH box was not ticked — re-run the Python installer, choose
**Modify**, and turn it on. Or use `py serve.py`.

Ignore `serve.command`; it is a macOS convenience and does nothing useful here.

### macOS

Double-click **`serve.command`**. It starts the server and opens the game for
you. If a server is already running on that port — from an earlier double-click
you forgot about — it just opens the game instead of failing; if something else
is squatting on port 8000, it gives up after a few seconds and says so rather
than hanging.

If you would rather use a terminal, or `python3` is not installed yet (macOS
will offer to install the developer tools the first time you run it):

```
python3 serve.py
```

### Linux

```
python3 serve.py
```

`serve.command` will not launch by double-clicking on Linux — run the line
above instead. On Ubuntu or Debian, if the tools are missing:
`sudo apt install git python3`. On Fedora: `sudo dnf install git python3`.

### Then, on any of the three

Open **http://localhost:8000** — you should see a starfield and a title screen.
Leave the terminal window open; closing it stops the server.

While the server is running, the page **reloads itself** within a second or two
of you saving `config.js`, `sprites.js`, `game.js`, or `index.html` — no need to
click back into the browser. This only happens on `localhost`; the published
game makes no network requests of any kind, and a `location.hostname` check
keeps it that way.

You can also open `index.html` directly with no server at all, but then the
browser hides error messages — so if you are changing the code, use the server.

## Publishing changes

None of the local workflow above touches git. Run `serve.command` once, edit
`config.js`, save, and the page reloads itself — that's the whole loop.

- To throw a change away: `git checkout config.js`.
- To publish: ask your assistant to publish it, or do it by hand with
  `git commit -am "what changed"` and `git push`, then wait — GitHub Pages
  takes roughly 40 to 95 seconds and gives no signal when it's done, so check
  the live URL yourself before telling a class to refresh.
- To take a published change back: `git revert HEAD` and push, or ask your
  assistant.

## The files

| File | What's in it |
|---|---|
| `config.js` | **Every number you can change.** Start here. |
| `sprites.js` | The pixel art, drawn with letters. |
| `game.js` | The game loop. You shouldn't need to touch it. |
| `index.html` | The page and the error message panel. |
| `tests.html` | Open it in a browser to check the maths still works (199 checks). |
| `serve.command` | macOS only: double-click to run the game locally. |
| `serve.py` | The local server. Run it directly on Windows and Linux. Binds to `127.0.0.1` only. |

## Controls

Arrow keys or WASD. On a phone, drag anywhere — the ship follows your thumb.
The title screen starts on any key or tap. The win and lose screens restart
on Enter, a tap, or a click — not just any key — so a key still held from
playing doesn't skip past your score before you've read it.

## Teaching with it

See [TEACHING.md](TEACHING.md).
