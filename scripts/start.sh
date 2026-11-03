#!/usr/bin/env bash
# Production-style run: builds the app and serves it from the API on one port.
set -u
. "$(dirname "${BASH_SOURCE[0]}")/_env.sh"
require_node

if [ ! -d "$ROOT/client/dist" ]; then
  echo "→ Building the web app"
  ( cd "$ROOT/client" && npm run build ) || exit 1
fi

bash "$ROOT/scripts/mongo.sh" start || exit 1

echo ""
echo "  App → http://localhost:5001"
echo ""
cd "$ROOT/server" || exit 1
NODE_ENV=production exec node src/index.js
