# DEVOS_DECISION.md
# Phase 8 — Architecture Decision Summary + Authorization Request
# Generated: 2026-06-14

---

## What was investigated (Phases 0–7)

| Phase | Document | Finding |
|-------|----------|---------|
| 0 | DEVOS_CURRENT_STATE.md | Cohere Tier 1 built but server never runs; sandbox-ui exists but unused; FOREST circular |
| 2 | TREES_FINDINGS.md | TREES solves discovery partially; start.sh is a better fix |
| 3 | FOREST_FINDINGS.md | FOREST is circular validation; needs telemetry to be useful |
| 4 | START_WORKFLOW_ANALYSIS.md | 5-read startup every session; 3 bash fixes solve 80% of friction |
| 5 | TOOL_DECISION_MATRIX.md | A includes; B adds Cohere Tier 1 + sandbox; FOREST/TREES/Tier2-3 delay |
| 6 | WORKSPACE_RECOMMENDATIONS.md | 3-pane workspace; governance model must survive DevOS |
| 7 | ARCHITECTURE_CANDIDATES.md | A=Minimal, B=Strategic, C=Ambitious; recommend A→B→C sequentially |

---

## Single decision

**Recommended: Candidate A — Enhanced start.sh**

Implement first. Validate. Then decide on Candidate B (sandbox integration).

---

## What Candidate A involves

**Files to change (non-sacred):**
- `start.sh` — 20 additional lines of bash

**Files to create (new, non-sacred):**
- `scripts/sacred-check.sh` — 10 lines
- `scripts/sprint-status.sh` — 20 lines

**Total new code:** ~50 lines of bash

**No TypeScript changes. No new npm packages. No ADR required (Routine tier).**

**Authorization tier: Routine** — Claude Code can implement autonomously.
However, start.sh changes affect every session. Per CLAUDE.md, the human
should review and approve the change before it becomes the live launcher.

---

## What Candidate A produces

After Candidate A, a session launch will:

1. Print submodule status (existing)
2. Print manifest status (existing)
3. Run bito pre-merge check if branch touches core/dream/ (existing)
4. **NEW**: Print active sprint summary (sprint name, status, branch, ADR)
5. **NEW**: Print sacred file list (CORE SACRED files only, from .ff-core-lock)
6. **NEW**: Print current-branch bito result if found in codex_pr/
7. Launch Claude Code with enriched prompt that includes the above context

Session startup reads drop from 5 to 0-1 (one read only if sprint status needs disambiguation).

---

## What Candidate B would add (not recommended yet)

Candidate B adds sandbox server auto-start and sandbox-ui auto-open.
This is the path to "Replit preview tab" functionality.

Authorization for Candidate B: **Elevated** — requires human approval before changes
to start.sh that start background processes.

**Candidate B should not be designed or implemented until Candidate A is proven
in at least 2–3 active development sessions.**

---

## What is explicitly out of scope for v1

| Capability | Why out of scope |
|------------|-----------------|
| Cohere Tier 1 dashboard | Candidate B scope (requires server running) |
| Cohere Tier 2 (opportunity) | Prerequisite: 100+ audit records (server never ran) |
| Cohere Tier 3 (retrieval) | Prerequisite: Tier 2 + corpus build |
| TREES panel | Not justified by evidence; Candidate A solves Problem 1 better |
| FOREST dashboard | Circular output; needs telemetry |
| Multi-agent routing | No spec; no evidence of need |
| Meshy asset panel | Belongs in art-asset sprint, not DevOS |
| Candidate C architecture | Candidate B must be validated first |

---

## Authorization request

This document requests human authorization for:

**Candidate A implementation** — Enhanced start.sh

Scope:
1. `start.sh` — add dynamic sprint context, sacred list, bito result grep
2. `scripts/sacred-check.sh` — new script
3. `scripts/sprint-status.sh` — new script

None of the changes touch sacred files.
None of the changes alter game logic.
None of the changes alter the authorization model.
The `--permission-mode plan` flag and sacred-file prohibition in the launch prompt are preserved.

After human authorization:
1. Claude Code drafts the implementation
2. Human reviews the diff
3. Bito audits the change (per CLAUDE.md guidelines)
4. Claude Code fixes any bito findings
5. Human approves commit

This is the complete Candidate A gate.

---

## One-line summary

**All evidence points to: fix start.sh first (50 lines of bash), validate in 2–3 sessions,
then decide whether to wire sandbox-ui (Candidate B) — everything else is premature.**
