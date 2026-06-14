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
  echo "ERROR: core/.ff-core-lock not found" >&2
  exit 2
fi
# Normalize: strip leading core/ or ./ prefix for matching
NORMALIZED=$(echo "$FILE" | sed 's|^core/||; s|^\./||')
# Core sacred: lines between CORE FILES and SURFACE FILES
IN_CORE=$(awk '/^# CORE FILES:/{f=1;next} /^# SURFACE FILES/{f=0} f && /^[^#]/' "$LOCK" | grep -cF "$NORMALIZED")
if [ "$IN_CORE" -gt 0 ]; then
  echo "SACRED (CORE) — requires ADR + human authorization before any edit"
  exit 0
fi
# Surface: lines after SURFACE FILES
IN_SURFACE=$(awk '/^# SURFACE FILES/{f=1;next} f && /^[^#]/' "$LOCK" | grep -cF "$NORMALIZED")
if [ "$IN_SURFACE" -gt 0 ]; then
  echo "SURFACE — human review recommended; no ADR required"
  exit 0
fi
echo "NOT IN LOCK — routine tier; no sacred restrictions"
