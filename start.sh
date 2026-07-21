#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")" && pwd)"
[ -f "$project_dir/.env" ] || { echo 'Missing .env; copy .env.example and configure it.' >&2; exit 1; }
[ -d "$project_dir/backend/node_modules" ] && [ -d "$project_dir/frontend/node_modules" ] || { echo 'Dependencies missing; run scripts/bootstrap.sh.' >&2; exit 1; }
set -a; . "$project_dir/.env"; set +a
cd "$project_dir/backend"; npm start & backend_pid=$!
cd "$project_dir/frontend"; BROWSER=none PORT="${FRONTEND_PORT:-3000}" npm start & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }
trap cleanup INT TERM EXIT
wait "$backend_pid" "$frontend_pid"
