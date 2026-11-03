#!/usr/bin/env bash
# Resolves the toolchain used by the other scripts.
# Priority: an explicit override, then tools bundled next to this project,
# then whatever is already on PATH.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ROOT

find_tools_dir() {
  if [ -n "" ]; then
    echo "$FOCUS_TOOLS_DIR"
    return
  fi
  for base in "$ROOT/.." "$ROOT/../.." "$HOME" "$HOME/Lemon Code"; do
    if ls -d "$base/.tools"/node-v* >/dev/null 2>&1 || ls -d "$base/.tools"/mongodb-* >/dev/null 2>&1; then
      echo "$base/.tools"
      return
    fi
  done
}

TOOLS="$(find_tools_dir)"

NODE_HOME=""
if [ -z "$NODE_HOME" ] && [ -n "$TOOLS" ]; then
  NODE_HOME="$(ls -d "$TOOLS"/node-v*/bin 2>/dev/null | head -1)"
fi
if [ -n "$NODE_HOME" ] && [ -x "$NODE_HOME/node" ]; then
  export PATH="$NODE_HOME:$PATH"
fi

MONGO_BIN=""
if [ -n "$MONGO_BIN" ] && [ ! -x "$MONGO_BIN" ]; then
  MONGO_BIN=""
fi
if [ -z "$MONGO_BIN" ] && [ -n "$TOOLS" ]; then
  MONGO_BIN="$(ls "$TOOLS"/mongodb-*/bin/mongod 2>/dev/null | head -1)"
fi
if [ -z "$MONGO_BIN" ] && command -v brew >/dev/null 2>&1; then
  BREW_PREFIX="$(brew --prefix 2>/dev/null)"
  if [ -n "$BREW_PREFIX" ] && [ -x "$BREW_PREFIX/bin/mongod" ]; then
    MONGO_BIN="$BREW_PREFIX/bin/mongod"
  fi
fi
if [ -z "$MONGO_BIN" ] && command -v mongod >/dev/null 2>&1; then
  MONGO_BIN="$(command -v mongod)"
fi

export MONGO_BIN

require_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found."
    echo "Install it (brew install node) or point NODE_HOME at a Node install."
    exit 1
  fi
}

require_mongo() {
  if [ -z "$MONGO_BIN" ] || [ ! -x "$MONGO_BIN" ]; then
    echo "mongod not found."
    echo "Install MongoDB Community (brew tap mongodb/brew && brew install mongodb-community)"
    echo "or set MONGO_BIN to the path of a mongod binary."
    exit 1
  fi
}
