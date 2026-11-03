#!/usr/bin/env bash
# Install dependencies for the API and the web app.
set -u
. "$(dirname "${BASH_SOURCE[0]}")/_env.sh"
require_node

echo "Using node $(node -v) ($(command -v node))"
echo ""
echo "→ Installing server dependencies"
( cd "$ROOT/server" && npm install --no-audit --no-fund ) || exit 1
echo ""
echo "→ Installing client dependencies"
( cd "$ROOT/client" && npm install --no-audit --no-fund ) || exit 1
echo ""
echo "→ Preparing environment files"
[ -f "$ROOT/server/.env" ] || cp "$ROOT/server/.env.example" "$ROOT/server/.env"
echo ""
echo "Done. Start the app with: bash scripts/dev.sh"
