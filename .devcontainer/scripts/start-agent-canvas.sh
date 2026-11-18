#!/bin/sh
set -e

# Serve Agent Canvas on all interfaces so it can be reached from the local network.
# Public mode keeps the API key out of the served HTML; paste it into the UI once per device.
PORT="8100"
DATA_DIR="$HOME/.openhands"
KEY_FILE="$DATA_DIR/canvas-api-key"
LOG_FILE="$DATA_DIR/agent-canvas.log"
LOCK_FILE="$DATA_DIR/agent-canvas.lock"

# Lifecycle commands don't load the login profile, so uv/uvx would be missing from PATH.
export PATH="$HOME/.local/bin:$PATH"

# The supervisor inherits fd 9 and holds the lock for its lifetime, so repeated starts
# (post-start, post-attach) are no-ops.
acquire_lock() {
  exec 9> "$LOCK_FILE"
  flock -n 9
}

agent_canvas_answers() {
  curl -s -o /dev/null "http://127.0.0.1:$PORT/"
}

ensure_api_key() {
  if [ ! -s "$KEY_FILE" ]; then
    (umask 077 && node -e "console.log(require('crypto').randomBytes(24).toString('hex'))" > "$KEY_FILE")
    chmod 600 "$KEY_FILE"
  fi
}

start_supervised_agent_canvas() {
  LOCAL_BACKEND_API_KEY="$(cat "$KEY_FILE")" PORT="$PORT" nohup setsid sh -c '
    while :; do
      echo "[supervisor] $(date -Is) starting agent-canvas"
      agent-canvas --host 0.0.0.0 --port "$PORT" --public 9>&- && code=0 || code=$?
      echo "[supervisor] $(date -Is) agent-canvas exited with code $code, restarting in 5s"
      sleep 5 9>&-
    done
  ' >> "$LOG_FILE" 2>&1 < /dev/null &
}

mkdir -p "$DATA_DIR"

if ! acquire_lock || agent_canvas_answers; then
  echo "Agent Canvas is already running"
  exit 0
fi

ensure_api_key
start_supervised_agent_canvas
echo "Agent Canvas starting on port $PORT, ready in about a minute (log: $LOG_FILE, key: $KEY_FILE)"
