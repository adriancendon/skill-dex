#!/bin/bash
# Starts Skill Dex without a Terminal window: scans, starts the local server in the background, opens the browser.
# Works on macOS (tested) and, best effort, on Linux (xdg-open; messages go to the terminal instead of a dialog).
# The server stops by itself when the browser tab is closed. SKILLDEX_LOG overrides the private per-user launch log.
# The server writes a new secret at each start (cache/session-token-<port>, readable only by you); the browser link carries
# it once, the server swaps it for a cookie, and requests without it are refused.
#
# Settings (environment variables, or a `skilldex.conf` file next to this script with KEY=value lines):
#   SKILLDEX_DATA  the data folder (watchlist, reports, config). Default: ~/Library/Application Support/Skill Dex
#                  (macOS) or ${XDG_DATA_HOME:-~/.local/share}/Skill Dex (Linux). A folder named "Seguimiento" next
#                  to this repository's folder, the name earlier versions used, is still found and used when present.
#   PORT           local port. Default 4173.
#   SKILLDEX_RUNNER, OMP_BIN, CLAUDE_BIN, CODEX_BIN  which agent CLI runs analyses (see README); only needed for them.
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)" || exit 1
cd "$APP_DIR" || exit 1
[ -f "$APP_DIR/skilldex.conf" ] && { set -a; . "$APP_DIR/skilldex.conf"; set +a; }
MAC=""; [ "$(uname -s)" = "Darwin" ] && MAC=1
# A message for the user: a dialog on macOS, always also on the terminal.
say_error() {
  echo "$1" >&2
  [ -n "$MAC" ] && command -v osascript >/dev/null 2>&1 && osascript -e "display dialog \"$1\" buttons {\"OK\"} with icon stop" >/dev/null 2>&1
  return 0
}
if [ -z "$SKILLDEX_DATA" ]; then # the same rule as paths.mjs
  if [ -d "$APP_DIR/../Seguimiento" ]; then SKILLDEX_DATA="$(cd "$APP_DIR/../Seguimiento" && pwd -P)"
  elif [ -n "$MAC" ]; then SKILLDEX_DATA="$HOME/Library/Application Support/Skill Dex"
  else SKILLDEX_DATA="${XDG_DATA_HOME:-$HOME/.local/share}/Skill Dex"; fi
fi
mkdir -p "$SKILLDEX_DATA" 2>/dev/null
export SKILLDEX_DATA
PORT="${PORT:-4173}"; export PORT
if [ -n "$MAC" ]; then DEFAULT_LOG="$HOME/Library/Logs/Skill Dex/launch.log"
else DEFAULT_LOG="${XDG_STATE_HOME:-$HOME/.local/state}/skill-dex/launch.log"; fi
LOG="${SKILLDEX_LOG:-$DEFAULT_LOG}"
umask 077
LOG_DIR="$(dirname "$LOG")"
if [ -L "$LOG_DIR" ] || [ -L "$LOG" ]; then say_error "The log path must not be a symbolic link."; exit 1; fi
if [ ! -d "$LOG_DIR" ]; then mkdir -p "$LOG_DIR" && chmod 700 "$LOG_DIR" || { say_error "Cannot create the private log folder."; exit 1; }
elif [ "$LOG" = "$DEFAULT_LOG" ]; then chmod 700 "$LOG_DIR" || exit 1; fi
touch "$LOG" && chmod 600 "$LOG" || { say_error "Cannot create the private launch log."; exit 1; }
# Is something listening on the port? lsof when installed, else bash's /dev/tcp.
listening() {
  if command -v lsof >/dev/null 2>&1; then lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
  else (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; fi
}
NODE=""
for c in "$(command -v node)" "$HOME/.local/bin/node" /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do [ -n "$c" ] && [ -x "$c" ] && NODE="$c" && break; done
if [ -z "$NODE" ]; then say_error "Node.js was not found. Skill Dex needs it (https://nodejs.org)."; exit 1; fi
if ! listening; then
  "$NODE" scan.mjs >"$LOG" 2>&1
  nohup "$NODE" server.mjs >>"$LOG" 2>&1 &
  for _ in 1 2 3 4 5 6 7 8 9 10; do listening && break; sleep 0.5; done
fi
if ! listening; then say_error "Skill Dex could not start. See the log: $LOG"; exit 1; fi
TOKEN="$(cat "$APP_DIR/cache/session-token-$PORT" 2>/dev/null)"
URL="http://localhost:$PORT/${TOKEN:+?k=$TOKEN}"
if [ -z "$SKILLDEX_NO_OPEN" ]; then
  if [ -n "$MAC" ]; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 &
  else echo "Skill Dex is running. Open this address in your browser: $URL"; fi
fi
exit 0
