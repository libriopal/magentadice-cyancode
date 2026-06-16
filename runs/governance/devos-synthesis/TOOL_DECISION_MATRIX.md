# TOOL_DECISION_MATRIX.md
# Phase 5 — Evidence-Based Tool Inclusion/Exclusion Matrix
# Generated: 2026-06-14

---

## Decision criteria

For each proposed DevOS tool/capability:
- **Used**: Has the capability been invoked in a development session?
- **Changed decision**: Did its output ever change a development or architecture decision?
- **Discoverable alone**: Could the problem it solves be solved without a new tool?
- **Integration cost**: How many lines / files must change to include it?

Scale: H=High, M=Medium, L=Low

---

## Matrix

| Tool / Capability | Used? | Changed decision? | Discoverable alone? | Integration cost | DevOS v1 verdict |
|---|---|---|---|---|---|
| start.sh enhancement | Yes (every session) | N/A (baseline) | N/A | L (20 lines bash) | **INCLUDE** |
| sandbox-ui (existing) | No | Never | Yes | M (server startup) | **CONDITIONAL** |
| sandbox-cli gate-check | Partially | Yes (P3/P4/P5) | Yes (via tsx directly) | L (server startup) | **INCLUDE if server starts** |
| bito pre-merge gate | Yes (every sprint) | Yes (fixed real bugs) | No (critical gate) | L (already in start.sh) | **INCLUDE (already in)** |
| FOREST simulator | No | Never | Yes | M (trigger protocol) | **DELAY** |
| TREES TreeView panel | No | Never | Yes | H (new UI panel) | **DELAY** |
| Cohere Tier 1 (governance health) | No | Never (server not running) | No (endpoint built) | L (start server + health call in start.sh) | **INCLUDE in Candidate B** |
| Cohere Tier 2 (opportunity engine) | No | Never | No | M (requires Tier 3 corpus) | **DELAY — prerequisite unmet** |
| Cohere Tier 3 (retrieval/embeddings) | No | Never | — (100+ audit records needed) | H (corpus build required) | **DELAY — prerequisite unmet** |
| Meshy AI pipeline | No | Never | Yes | L (key required) | **CONDITIONAL** |
| Multi-agent routing | No | Never | — (not built) | H (architecture change) | **DELAY until P6 complete** |
| Claude Code session | Yes (every session) | N/A (baseline) | N/A | L (already in start.sh) | **INCLUDE (already in)** |
| sacred-check script | Informal | Yes (prevents violations) | Partial | L (10 lines bash) | **INCLUDE** |
| ADR index at session start | Informal | Yes (P5 bito gate) | Via ls + read | L (start.sh injection) | **INCLUDE** |

---

## Tool-by-tool rationale

### INCLUDE: start.sh enhancement
Evidence: Every session has the same 5-read startup sequence.
Diminishing this to a 1-read or 0-read startup is the highest-ROI change.
Requires: dynamic prompt injection, sacred list injection, active bito grep.
Risk: None (additive bash only).

### CONDITIONAL: sandbox-ui
Evidence: Built in P3, never opened in a development session.
Root cause of non-use: sandbox server is not started.
Decision: Include in DevOS v1 ONLY if the sandbox server is integrated into start.sh.
Without that integration, the UI remains unused regardless of DevOS.
If sandbox server is integrated: the existing 8 components (GateStatusPanel, SimulationProgressPanel, etc.)
become immediately useful as a real-time view during validate-gates runs.

### INCLUDE if server starts: sandbox-cli gate-check
sandbox-cli is partially used. The gate-check command mirrors what sessions do manually with tsx.
If sandbox server is included in start.sh, sandbox-cli gate-check becomes available automatically.
Worth including in that case.

### DELAY: FOREST
Evidence: Run once, produced circular output (confirmed selection.md), zero sessions reference it.
Inclusion criterion: one architectural decision must have been changed by a FOREST run.
Trigger condition for v2: FOREST should run after a major implementation milestone
(e.g., post-P7 when telemetry exists), not before.

### DELAY: TREES panel
Evidence: Installed dep, never imported, no usage in sessions 1–18.
TREES solves Problem 1 (discovery) partially. start.sh enhancement solves it better.
Inclusion criterion: start.sh enhancement must prove insufficient in active use first.
Route to v2: if 3+ sessions require file browsing that start.sh injection doesn't answer.

### INCLUDE in Candidate B: Cohere Tier 1
Evidence: Tier 1 is complete (20+ files, built 2026-06-13). The governance health endpoint
(`GET /api/governance/health`) is live — but the server is never started in start.sh.
The static COHERE box in start.sh implies governance is live; it is not.

DevOS Candidate B starts the sandbox server. When the server starts, Cohere Tier 1 is active.
Candidate B should surface `/api/governance/health` in the sandbox-ui and replace the
static COHERE box in start.sh with a live health check call.

### DELAY: Cohere Tier 2 (Opportunity Engine)
Evidence: Stub only. Tier 2 requires a Tier 3 retrieval corpus (100+ audit records).
Zero audit records exist in `runs/governance/` (the server has never run in a session).
Prerequisite: Candidate B must run for enough sessions to produce 100+ audit records.

### DELAY: Cohere Tier 3 (Retrieval/Embeddings)
Evidence: Types and README only. Activates after Tier 2 prerequisite met.
Route to activation: 100+ governance records → configure Cohere Embed → activate retrieval.

### CONDITIONAL: Meshy AI
Evidence: Pipeline built (meshy-gen.ts), API key exists, zero assets generated.
This is not a workflow tool — it is an asset generation pipeline.
It belongs in a separate art-asset sprint, not in DevOS.
Include only if the DevOS dashboard needs a "generate asset" trigger button.
Prerequisite: API key input and generated-asset preview panel must be defined.

### INCLUDE: sacred-check script
Evidence: Every session that might touch a sacred file does a manual lock file read.
A 10-line `sacred-check <file>` script answers "is this file sacred?" in O(1).
Zero risk. Direct workflow improvement. Should have existed from P1.

### INCLUDE: ADR index at session start
Evidence: Every sprint produces an ADR. Knowing which ADR is active and its status
(ACCEPTED/PENDING/PROPOSED) requires reading filenames + content.
start.sh can emit: "Latest ADR: ADR-022 (ACCEPTED)" in 3 lines of bash.
Removes 1 file read per session.

---

## Summary table

| Category | DevOS v1 | DevOS v2 | Not in scope |
|----------|----------|----------|--------------|
| start.sh dynamic context | ✅ | — | — |
| sacred-check script | ✅ | — | — |
| bito pre-merge gate | ✅ (existing) | — | — |
| ADR status injection | ✅ | — | — |
| sandbox-ui (if server) | ✅ conditional | — | — |
| sandbox-cli (if server) | ✅ conditional | — | — |
| TREES panel | — | ✅ if needed | — |
| FOREST trigger | — | ✅ with telemetry | — |
| Cohere Tier 1 (governance health) | — | ✅ Candidate B | — |
| Cohere Tier 2 (opportunity) | — | — | ✅ (Tier 3 prerequisite unmet) |
| Cohere Tier 3 (retrieval) | — | — | ✅ (corpus prerequisite unmet) |
| Meshy asset UI | — | ✅ if art sprint | — |
| Multi-agent routing | — | — | ✅ (no spec) |
