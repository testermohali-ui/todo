#!/usr/bin/env bash
# Start / stop a project-local MongoDB instance (data lives in .data/db).
set -u
. "$(dirname "${BASH_SOURCE[0]}")/_env.sh"

ACTION="${1:-start}"
DATA_DIR="$ROOT/.data"
PID_FILE="$DATA_DIR/mongod.pid"
LOG_FILE="$DATA_DIR/mongod.log"
PORT="27017"

is_running() {
  [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

case "$ACTION" in
  start)
    if is_running; then
      echo "MongoDB already running (pid $(cat "$PID_FILE")) on port $PORT"
      exit 0
    fi
    require_mongo
    mkdir -p "$DATA_DIR/db"
    "$MONGO_BIN" --dbpath "$DATA_DIR/db" --port "$PORT" --bind_ip 127.0.0.1 \
      --unixSocketPrefix "$DATA_DIR" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 2
    if is_running; then
      echo "MongoDB started on mongodb://127.0.0.1:$PORT (pid $(cat "$PID_FILE"))"
    else
      echo "MongoDB failed to start. Last log lines:"
      tail -5 "$LOG_FILE"
      exit 1
    fi
    ;;
  stop)
    if ! is_running; then
      echo "MongoDB is not running"
      rm -f "$PID_FILE"
      exit 0
    fi
    PID="$(cat "$PID_FILE")"
    kill "$PID"
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      kill -0 "$PID" 2>/dev/null || break
      sleep 1
    done
    rm -f "$PID_FILE"
    echo "MongoDB stopped"
    ;;
  status)
    if is_running; then
      echo "MongoDB running (pid $(cat "$PID_FILE")) on port $PORT"
    else
      echo "MongoDB not running"
      exit 1
    fi
    ;;
  *)
    echo "Usage: mongo.sh [start|stop|status]"
    exit 1
    ;;
esac
