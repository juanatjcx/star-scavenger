#!/bin/bash
# Double-click this file to play. It serves the folder on port 8000 so that
# error messages show up properly, then opens the game in your browser.
cd "$(dirname "$0")" || exit 1

# Every check below has a time limit. Without one, something that holds port
# 8000 without answering properly would leave this window hanging silently.
ask() { curl -sf --connect-timeout 1 --max-time 2 -o /dev/null http://localhost:8000/index.html; }

# If the game is already being served (you ran this earlier), just open it
# rather than starting a second server that would fail.
if ask; then
  echo "Already serving on http://localhost:8000/ — opening the game."
  open http://localhost:8000/index.html
  exit 0
fi

python3 serve.py &
SERVER_PID=$!

# Keep asking until the server answers, but give up after roughly six seconds
# — the deadline is only checked between attempts, and each attempt can itself
# take up to two seconds, so the actual worst case is closer to eight or nine.
DEADLINE=$(( $(date +%s) + 6 ))
until ask; do
  if [ "$(date +%s)" -ge "$DEADLINE" ]; then
    echo ""
    echo "Could not start the server on port 8000."
    echo "Something else is probably using that port. Close any other Terminal"
    echo "window running this file, then try again."
    echo ""
    echo "Press Return to close this window."
    read -r
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    exit 1
  fi
  sleep 0.2
done

open http://localhost:8000/index.html
echo "Serving on http://localhost:8000/  — close this window to stop."
wait $SERVER_PID
