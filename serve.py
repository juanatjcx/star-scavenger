#!/usr/bin/env python3
"""A tiny web server for Star Scavenger.

The only reason this exists instead of `python3 -m http.server` is the
Cache-Control header below. Without it the browser quietly hangs on to an old
copy of config.js, so you change a number, reload, and nothing happens - which
is the worst thing that can happen in the middle of a lesson.
"""
import http.server

PORT = 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Never cache. Every reload must fetch the file you just edited.
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


if __name__ == '__main__':
    # Bind to loopback only. '' binds every interface, which would let anyone
    # on the same Wi-Fi browse this folder for as long as the Terminal window
    # is open — and SimpleHTTPRequestHandler serves dotfiles and directory
    # listings, which from a worktree includes the SDD workspace. Students
    # play from the published URL, so nothing needs LAN access at all.
    with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), NoCacheHandler) as httpd:
        print('Serving Star Scavenger on http://localhost:%d/' % PORT)
        httpd.serve_forever()
