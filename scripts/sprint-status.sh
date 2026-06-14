#!/bin/bash
# Emits a one-line current sprint summary for start.sh context injection.
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
ROADMAP="$(dirname "$0")/../roadmap/01-current-sprint.md"
ADR_DIR="$(dirname "$0")/../docs/adr"

# Extract sprint ID from branch name (fix/p6-playermodel-fix → P6)
SPRINT_ID=$(echo "$BRANCH" | grep -oiE '/(p[0-9]+|t[0-9]+)' | tr -d '/' | tr '[:lower:]' '[:upper:]')

# Latest ADR (status from filename)
LATEST_ADR=""
if [ -d "$ADR_DIR" ]; then
  LATEST_ADR=$(ls "$ADR_DIR" 2>/dev/null | sort | tail -1 | sed 's/\.md$//')
fi

# Find sprint status from roadmap (try full branch prefix then short sprint ID)
STATUS=""
if [ -f "$ROADMAP" ] && [ -n "$SPRINT_ID" ]; then
  STATUS=$(grep -i "Status.*${SPRINT_ID}\|${SPRINT_ID}.*Status\|Next sprint.*${SPRINT_ID}" "$ROADMAP" | head -1 | sed 's/\*\*//g; s/^[[:space:]]*//')
fi

if [ -z "$STATUS" ]; then
  STATUS="IN PROGRESS (see roadmap/01-current-sprint.md)"
fi

echo "Sprint: ${SPRINT_ID:-unknown} | ${STATUS} | ADR: ${LATEST_ADR:-none}"
