#!/usr/bin/env bash
# meshy.sh — convenience wrapper for meshy-gen.ts
# Usage: ./scripts/meshy.sh <command> [args]
set -euo pipefail
cd "$(dirname "$0")/.."
exec node --env-file .env --experimental-strip-types scripts/meshy-gen.ts "$@"
