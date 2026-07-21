#!/usr/bin/env bash
set -euo pipefail
[ "${CONFIRM_DEMO_SEED:-}" = 'yes' ] || { echo 'Set CONFIRM_DEMO_SEED=yes; demo data is never loaded by start.sh.' >&2; exit 1; }
project_dir="$(cd "$(dirname "$0")/.." && pwd)"; (cd "$project_dir/backend" && node seed.js)
