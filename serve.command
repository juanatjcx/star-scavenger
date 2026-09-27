#!/bin/bash
# Double-click this file to play. It serves the folder on port 8000 so that
# error messages show up properly, then opens the game in your browser.
cd "$(dirname "$0")" || exit 1
python3 -m http.server 8000 &
SERVER_PID=$!
until curl -sf -o /dev/null http://localhost:8000/index.html; do sleep 0.2; done
open http://localhost:8000/index.html
echo "Serving on http://localhost:8000/  — close this window to stop."
wait $SERVER_PID
