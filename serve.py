#!/usr/bin/env python3
"""A tiny web server for Star Scavenger.

The only reason this exists instead of `python3 -m http.server` is the
Cache-Control header below. Without it the browser quietly hangs on to an old
copy of config.js, so you change a number, reload, and nothing happens - which
is the worst thing that can happen in the middle of a lesson.
"""
import http.server
import os

PORT = 8000

# The files that matter for a live-reload check: anything a teacher would
# edit mid-lesson. Not tests.html or serve.py itself — those aren't part of
# the loop a projected class watches.
WATCHED_FILES = ('config.js', 'sprites.js', 'game.js', 'index.html')


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Never cache. Every reload must fetch the file you just edited.
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # Auto-reload support for index.html: the page polls this once a
        # second and reloads itself when the answer changes. It exists only
        # to be polled from localhost — see the gate in index.html — so it
        # stays this small: a single number as plain text, not JSON.
        if self.path.split('?', 1)[0] == '/__changed':
            latest = max(
                (os.path.getmtime(f) for f in WATCHED_FILES if os.path.exists(f)),
                default=0,
            )
            body = str(latest).encode('ascii')
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


if __name__ == '__main__':
    # Bind to loopback only. '' binds every interface, which would let anyone
    # on the same Wi-Fi browse this folder for as long as the Terminal window
    # is open — and SimpleHTTPRequestHandler serves dotfiles and directory
    # listings, which from a worktree includes the SDD workspace. Students
    # play from the published URL, so nothing needs LAN access at all.
    with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), NoCacheHandler) as httpd:
        print('Serving Star Scavenger on http://localhost:%d/' % PORT)
        httpd.serve_forever()
