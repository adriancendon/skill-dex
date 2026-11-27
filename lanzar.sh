#!/bin/bash
# Starts Skill Dex without a Terminal window: scans, starts the local server in the background, opens the browser.
# The server stops by itself when the browser tab is closed. Log: $SKILLDEX_LOG (default /tmp/skilldex.log).
# The server writes a new secret at each start (cache/session-token, readable only by you); the browser link carries
# it once, the server swaps it for a cookie, and requests without it are refused.
#
# Settings (environment variables, or a `skilldex.conf` file next to this script with KEY=value lines):
#   SKILLDEX_DATA  folder for your data (watchlist, reports, config). Default: a "Seguimiento" folder next to
#                  this repository's folder if it exists, otherwise ~/Library/Application Support/Skill Dex.
#   PORT           local port. Default 4173.
#   OMP_BIN        path to the omp binary (only needed for analysis jobs).
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)" || exit 1
cd "$APP_DIR" || exit 1
[ -f "$APP_DIR/skilldex.conf" ] && { set -a; . "$APP_DIR/skilldex.conf"; set +a; }
if [ -z "$SKILLDEX_DATA" ]; then
  if [ -d "$APP_DIR/../Seguimiento" ]; then SKILLDEX_DATA="$(cd "$APP_DIR/../Seguimiento" && pwd -P)"
  else SKILLDEX_DATA="$HOME/Library/Application Support/Skill Dex"; fi
fi
mkdir -p "$SKILLDEX_DATA" 2>/dev/null
export SKILLDEX_DATA
PORT="${PORT:-4173}"; export PORT
LOG="${SKILLDEX_LOG:-/tmp/skilldex.log}"
NODE=""
for c in "$(command -v node)" "$HOME/.local/bin/node" /opt/homebrew/bin/node /usr/local/bin/node; do [ -n "$c" ] && [ -x "$c" ] && NODE="$c" && break; done
if [ -z "$NODE" ]; then
  osascript -e 'display dialog "Node.js was not found. Skill Dex needs it (https://nodejs.org)." buttons {"OK"}' 2>/dev/null
  echo "Node.js not found" >&2; exit 1
fi
if ! lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  "$NODE" scan.mjs >"$LOG" 2>&1
  nohup "$NODE" server.mjs >>"$LOG" 2>&1 &
  for _ in 1 2 3 4 5 6 7 8 9 10; do lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 && break; sleep 0.5; done
fi
if ! lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  osascript -e "display dialog \"Skill Dex could not start. See the log: $LOG\" buttons {\"OK\"} with icon stop" 2>/dev/null
  echo "Skill Dex could not start; see $LOG" >&2; exit 1
fi
TOKEN="$(cat "$APP_DIR/cache/session-token" 2>/dev/null)"
[ -z "$SKILLDEX_NO_OPEN" ] && open "http://localhost:$PORT/${TOKEN:+?k=$TOKEN}"
exit 0
