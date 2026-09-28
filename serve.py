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
    with http.server.ThreadingHTTPServer(('', PORT), NoCacheHandler) as httpd:
        print('Serving Star Scavenger on http://localhost:%d/' % PORT)
        httpd.serve_forever()
