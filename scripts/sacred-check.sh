#!/bin/bash
# Usage: ./scripts/sacred-check.sh <file-path>
# Returns: SACRED (CORE), SURFACE, or NOT IN LOCK with authorization tier.
FILE="${1:-}"
if [ -z "$FILE" ]; then
  echo "Usage: sacred-check.sh <file-path>" >&2
  exit 1
fi
LOCK="$(dirname "$0")/../core/.ff-core-lock"
if [ ! -f "$LOCK" ]; then
  echo "ERROR: core/.ff-core-lock not found — run: git submodule update --init --recursive core" >&2
  exit 2
fi
# Normalize: strip leading core/, ./, or / and collapse repeated slashes
NORMALIZED=$(echo "$FILE" | sed 's|^core/||; s|^\./||; s|^/||; s|//|/|g')
# Core sacred: exact-line match (grep -Fxq prevents substring false positives)
if awk '/^# CORE FILES:/{f=1;next} /^# SURFACE FILES/{f=0} f && /^[^#]/' "$LOCK" | grep -Fxq "$NORMALIZED"; then
  echo "SACRED (CORE) — requires ADR + human authorization before any edit"
  exit 0
fi
# Surface: exact-line match
if awk '/^# SURFACE FILES/{f=1;next} f && /^[^#]/' "$LOCK" | grep -Fxq "$NORMALIZED"; then
  echo "SURFACE — human review recommended; no ADR required"
  exit 0
fi
echo "NOT IN LOCK — routine tier; no sacred restrictions"
