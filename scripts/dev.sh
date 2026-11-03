#!/usr/bin/env bash
# One command to run MongoDB + API (5001) + Vite dev server (5173).
set -u
. "$(dirname "${BASH_SOURCE[0]}")/_env.sh"
require_node

if [ ! -d "$ROOT/server/node_modules" ] || [ ! -d "$ROOT/client/node_modules" ]; then
  echo "Dependencies missing. Run: bash scripts/setup.sh"
  exit 1
fi

bash "$ROOT/scripts/mongo.sh" start || exit 1

cleanup() {
  echo ""
  echo "Stopping dev servers…"
  [ -n "" ] && kill "$SERVER_PID" 2>/dev/null
  [ -n "" ] && kill "$CLIENT_PID" 2>/dev/null
  wait 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "Starting API on http://localhost:5001"
( cd "$ROOT/server" && node --watch src/index.js ) &
SERVER_PID=$!

echo "Starting web app on http://localhost:5173"
( cd "$ROOT/client" && npx vite --port 5173 ) &
CLIENT_PID=$!

echo ""
echo "  App  → http://localhost:5173"
echo "  API  → http://localhost:5001/api/health"
echo "  Stop → Ctrl+C"
echo ""

wait
