#!/bin/bash
# FAR_NZY / AGROS — Claude Code session launcher
# Loads governance context before any work begins

echo "Checking submodule status..."
git submodule status

echo "Checking pipeline status..."
./manifest.sh status

if git diff --name-only main...HEAD | grep -qE "^core|^dream"; then
  echo "Branch has core/ or dream/ changes. Running pre-merge Bito check..."
  ./scripts/bito-pre-merge-check.sh
  if [ $? -ne 0 ]; then
    echo "BITO PRE-MERGE CHECK FAILED — resolve before merging"
    echo "Result saved to codex_pr/"
  fi
fi

  echo ""
  echo "  ┌─────────────────────────────────────────────────────┐"
  echo "  │  COHERE GOVERNANCE LAYER                            │"
  echo "  │  Directive: core/protocols/COHERE_INTEGRATION_      │"
  echo "  │             DIRECTIVE.md                            │"
  echo "  │  Run status: check COHERE_IMPLEMENTATION_SUMMARY.md │"
  echo "  └─────────────────────────────────────────────────────┘"
  echo ""
echo "Launching Claude Code..."
claude --permission-mode plan \
  "read CLAUDE.md, core/.ff-core-lock, and roadmap/01-current-sprint.md. Then check codex_pr/ for any pending Bito verification results. Then await instructions. Do not modify any CORE SACRED file without showing a diff and waiting for explicit human authorization."
