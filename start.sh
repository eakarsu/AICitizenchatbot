#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")" && pwd)"
[ -f "$project_dir/.env" ] || { echo 'Missing .env; copy .env.example and configure it.' >&2; exit 1; }
[ -d "$project_dir/backend/node_modules" ] && [ -d "$project_dir/frontend/node_modules" ] || { echo 'Dependencies missing; run scripts/bootstrap.sh.' >&2; exit 1; }
set -a; . "$project_dir/.env"; set +a
backend_port="${BACKEND_PORT:-3001}"
frontend_port="${FRONTEND_PORT:-3000}"
for port in "$backend_port" "$frontend_port"; do
  if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use; refusing to stop another process." >&2
    exit 1
  fi
done

if [ "${MIGRATE_ON_START:-false}" = true ]; then
  case "${ALLOW_SCHEMA_MIGRATION:-}" in
    1|true) ;;
    *) echo 'Explicit schema migration acknowledgement is required.' >&2; exit 1 ;;
  esac
  bash "$project_dir/scripts/migrate.sh"
  node "$project_dir/backend/scripts/create-admin.js"
fi

cd "$project_dir/backend"; npm start & backend_pid=$!
cd "$project_dir/frontend"; BROWSER=none PORT="$frontend_port" ./node_modules/.bin/react-scripts start & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }
trap cleanup INT TERM EXIT
wait "$backend_pid" "$frontend_pid"
