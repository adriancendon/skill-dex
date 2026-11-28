#!/bin/bash
# Builds "Skill Dex.app", a double-click launcher for this copy of the repository.
# Usage: macos/build-app.sh [OUTPUT_DIR] [REPO_DIR]
#   OUTPUT_DIR  where the app is written. Default: ~/Applications
#   REPO_DIR    the Skill Dex folder to launch. Default: the repository this script is in.
# The app stores REPO_DIR in Contents/Resources/repo-path.txt (written at build time, never committed).
# To move the repository later, edit that file or rebuild the app. Env var SKILLDEX_HOME overrides it at run time.
set -e
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
OUT="${1:-$HOME/Applications}"
REPO="$(cd "${2:-$HERE/..}" && pwd -P)"
[ -x "$REPO/launch.sh" ] || { echo "launch.sh not found in $REPO" >&2; exit 1; }
mkdir -p "$OUT"
APP="$OUT/Skill Dex.app"
[ -e "$APP" ] && { echo "$APP already exists; remove it first." >&2; exit 1; }
osacompile -o "$APP" "$HERE/launcher.applescript"
printf '%s\n' "$REPO" > "$APP/Contents/Resources/repo-path.txt"
echo "Built: $APP (launches $REPO)"
