#!/bin/bash
# FAR_NZY / AGROS — Claude Code session launcher (DevOS Candidate B)
# Dynamic context injection + sandbox server + Cohere governance health
#
# Usage:
#   ./start.sh            launch a single Claude Code session (original behavior, unchanged)
#   ./start.sh --devos    run all the same checks below, then hand off to the
#                          standalone DevOS engine (unified orchestrator UI,
#                          EvoEngine, auto-bito) instead of a single CLI session

# ─── Parse flags ──────────────────────────────────────────────────────────────
LAUNCH_DEVOS=false
for arg in "$@"; do
  [ "$arg" = "--devos" ] && LAUNCH_DEVOS=true
done

# ─── Submodule guard ──────────────────────────────────────────────────────────
CORE_AVAILABLE=true
if [ ! -f "core/.ff-core-lock" ]; then
  echo "WARNING: core/.ff-core-lock not found."
  echo "  Run: git submodule update --init --recursive core"
  echo "  Skipping sacred-file list and server start."
  CORE_AVAILABLE=false
fi

# ─── Submodule + pipeline checks ─────────────────────────────────────────────
echo "Checking submodule status..."
git submodule status

echo "Checking pipeline status..."
./manifest.sh status

# ─── Bito pre-merge check (core/ or dream/ changes) ──────────────────────────
if git diff --name-only main...HEAD | grep -qE "^core|^dream"; then
  echo "Branch has core/ or dream/ changes. Running pre-merge Bito check..."
  ./scripts/bito-pre-merge-check.sh
  if [ $? -ne 0 ]; then
    echo "BITO PRE-MERGE CHECK FAILED — resolve before merging"
    echo "Result saved to codex_pr/"
  fi
fi

# ─── Dynamic context extraction ──────────────────────────────────────────────
CURRENT_BRANCH=$(git branch --show-current)
SPRINT_SUMMARY=$(./scripts/sprint-status.sh 2>/dev/null || echo "Sprint status unavailable")

# Sacred file list — only when core submodule is present
if $CORE_AVAILABLE; then
  SACRED_LIST=$(awk '/^# CORE FILES:/{f=1;next} /^# SURFACE FILES/{f=0} f && /^[^#]/' core/.ff-core-lock 2>/dev/null | tr '\n' ' ')
else
  SACRED_LIST="(unavailable — run: git submodule update --init --recursive core)"
fi

# Current-branch Bito result in codex_pr/
BRANCH_SLUG=$(echo "$CURRENT_BRANCH" | tr '/' '-')
BITO_RESULT=$(ls codex_pr/ 2>/dev/null | grep -iF "$BRANCH_SLUG" | tail -1)
[ -z "$BITO_RESULT" ] && BITO_RESULT=$(ls codex_pr/ 2>/dev/null | grep -iF "${BRANCH_SLUG//-/_}" | tail -1)
BITO_STATUS="${BITO_RESULT:+Pending Bito result: codex_pr/$BITO_RESULT}"
BITO_STATUS="${BITO_STATUS:-No Bito result for current branch}"

# ─── Start sandbox server ─────────────────────────────────────────────────────
SANDBOX_PID=""
COHERE_HEALTH="server not started"

if $CORE_AVAILABLE && [ -f "core/apps/server/dist/index.js" ]; then
  # Skip start if server already responding — avoids orphan processes and port conflicts
  if curl -sf --connect-timeout 2 -m 5 http://localhost:3001/api/governance/health >/dev/null 2>&1; then
    echo "Sandbox server already running at port 3001 — skipping start"
  else
    echo ""
    echo "Starting sandbox server (port 3001)..."
    # Redirect to log file so $! is the real Node PID (not a tee subshell)
    node core/apps/server/dist/index.js > /tmp/sandbox-server.log 2>&1 &
    SANDBOX_PID=$!
    # Kill server we started on any exit (clean session teardown)
    trap 'kill "$SANDBOX_PID" 2>/dev/null; wait "$SANDBOX_PID" 2>/dev/null' EXIT INT TERM
    # Poll up to 5s for server to bind
    for i in 1 2 3 4 5; do
      sleep 1
      curl -sf --connect-timeout 2 -m 5 http://localhost:3001/api/governance/health >/dev/null 2>&1 && break
    done
  fi

  # Parse health response — prefer jq for robustness, fall back to grep on correct key
  HEALTH_JSON=$(curl -sf --connect-timeout 2 -m 5 http://localhost:3001/api/governance/health 2>/dev/null)
  if [ -n "$HEALTH_JSON" ]; then
    if command -v jq >/dev/null 2>&1; then
      COHERE_HEALTH=$(echo "$HEALTH_JSON" | jq -r '.cohereAvailable // "unknown"' 2>/dev/null || echo "unknown")
    else
      COHERE_HEALTH=$(echo "$HEALTH_JSON" | grep -o '"cohereAvailable":[^,}]*' | head -1 || echo '"cohereAvailable":unknown')
    fi
  else
    COHERE_HEALTH="server not responding"
  fi

  echo "Sandbox server PID: ${SANDBOX_PID:-existing} | Cohere: $COHERE_HEALTH"
  echo "Sandbox UI: run 'cd sandbox-ui && npm run dev' to open at http://localhost:5173"
  echo "Server log: /tmp/sandbox-server.log"
else
  if $CORE_AVAILABLE; then
    COHERE_HEALTH="server not built — run: cd core && pnpm build"
    echo "Sandbox server not built. Run 'cd core && pnpm build' to enable."
  fi
fi

echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  COHERE GOVERNANCE LAYER                            │"
echo "  │  Health: $COHERE_HEALTH"
echo "  │  Directive: core/protocols/COHERE_INTEGRATION_      │"
echo "  │             DIRECTIVE.md (Tier 1 complete)          │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""

if $LAUNCH_DEVOS; then
  # ─── Hand off to DevOS ──────────────────────────────────────────────────────
  # Every check above (submodule status, manifest pipeline, bito pre-merge,
  # sandbox server) already ran identically to the default path — DevOS adds
  # the unified orchestrator UI, EvoEngine, and auto-bito-after-edit on top,
  # it does not replace any of this script's existing session protocol.
  DEVOS_DIR="${DEVOS_ROOT:-}"
  if [ -z "$DEVOS_DIR" ]; then
    for candidate in "$HOME/devOS" "../devOS" "../../devOS"; do
      [ -f "$candidate/start.sh" ] && DEVOS_DIR="$candidate" && break
    done
  fi
  if [ -z "$DEVOS_DIR" ] || [ ! -f "$DEVOS_DIR/start.sh" ]; then
    echo "ERROR: --devos requested but no DevOS install found."
    echo "  Set DEVOS_ROOT=/path/to/devOS, or clone: git clone https://github.com/libriopal/libriopal-devos ~/devOS"
    exit 1
  fi
  echo ""
  echo "Launching DevOS (${DEVOS_DIR})..."
  # GAME_ROOT must point at this repo (magentadice-cyancode), not devOS itself.
  GAME_ROOT="$(pwd)" bash "$DEVOS_DIR/start.sh"
  exit $?
fi

# ─── Launch Claude Code with enriched context ─────────────────────────────────
echo "Launching Claude Code..."
claude --permission-mode plan \
  "BRANCH: $CURRENT_BRANCH
$SPRINT_SUMMARY
SACRED CORE FILES: $SACRED_LIST
$BITO_STATUS
${SANDBOX_PID:+Sandbox server running at port 3001 (PID: $SANDBOX_PID).}

Read CLAUDE.md and core/.ff-core-lock for full context. Do not modify any CORE SACRED file without showing a diff and waiting for explicit human authorization."
