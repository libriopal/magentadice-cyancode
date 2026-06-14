#!/bin/bash
# FAR_NZY / AGROS — Claude Code session launcher (DevOS Candidate B)
# Dynamic context injection + sandbox server + Cohere governance health

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

# Sacred file list (CORE section of .ff-core-lock, one per line)
SACRED_LIST=$(awk '/^# CORE FILES:/{f=1;next} /^# SURFACE FILES/{f=0} f && /^[^#]/' core/.ff-core-lock 2>/dev/null | tr '\n' ' ')

# Current-branch Bito result in codex_pr/
BRANCH_SLUG=$(echo "$CURRENT_BRANCH" | tr '/' '-')
BITO_RESULT=$(ls codex_pr/ 2>/dev/null | grep -i "$BRANCH_SLUG\|${BRANCH_SLUG//-/_}" | tail -1)
BITO_STATUS="${BITO_RESULT:+Pending Bito result: codex_pr/$BITO_RESULT}"
BITO_STATUS="${BITO_STATUS:-No Bito result for current branch}"

# ─── Start sandbox server ─────────────────────────────────────────────────────
if [ -f "core/apps/server/dist/index.js" ]; then
  echo ""
  echo "Starting sandbox server (port 3001)..."
  (node core/apps/server/dist/index.js 2>&1 | tee /tmp/sandbox-server.log) &
  SANDBOX_PID=$!
  # Brief wait for server bind — not a poll loop, server either starts or doesn't
  sleep 1
  COHERE_HEALTH=$(curl -sf http://localhost:3001/api/governance/health 2>/dev/null \
    | grep -o '"cohereConfigured":[^,}]*' | head -1 || echo '"cohereConfigured":false')
  echo "Sandbox server PID: $SANDBOX_PID | Cohere: $COHERE_HEALTH"
  echo "Sandbox UI: run 'cd sandbox-ui && npm run dev' to open at http://localhost:5173"
else
  SANDBOX_PID=""
  COHERE_HEALTH="server not built — run: cd core && pnpm build"
  echo "Sandbox server not built. Run 'cd core && pnpm build' to enable."
fi

echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  COHERE GOVERNANCE LAYER                            │"
echo "  │  Health: $COHERE_HEALTH"
echo "  │  Directive: core/protocols/COHERE_INTEGRATION_      │"
echo "  │             DIRECTIVE.md (Tier 1 complete)          │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""

# ─── Launch Claude Code with enriched context ─────────────────────────────────
echo "Launching Claude Code..."
claude --permission-mode plan \
  "BRANCH: $CURRENT_BRANCH
$SPRINT_SUMMARY
SACRED CORE FILES: $SACRED_LIST
$BITO_STATUS
${SANDBOX_PID:+Sandbox server running at port 3001 (PID: $SANDBOX_PID).}

Read CLAUDE.md and core/.ff-core-lock for full context. Do not modify any CORE SACRED file without showing a diff and waiting for explicit human authorization."
