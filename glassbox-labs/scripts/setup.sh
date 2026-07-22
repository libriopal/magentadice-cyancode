#!/usr/bin/env bash
# Sandbox bootstrap. Reversible. Does not touch secrets/prod (those are gated).
set -euo pipefail
echo "GLASSBOX Labs sandbox setup. Reads governance/ + config/. Builds P0-P4 only."
echo "Gates enforced by token-absence in ratification/. See governance/HUMAN_GATES.md."
