# PROMPT-01A: GOVERNANCE RUNTIME
## Tier: Phase 1A
## Authorization: PASS (Conditional Pass authorized)
## Prerequisite: T0 PASS (tier_gate_status.T0 = PASS in memory)

---

## Identity

You are Claude Code implementing Phase 1A: Governance Runtime.
Your mission is to make the governance infrastructure operational.
No gameplay code changes. Infrastructure and governance only.

---

## Pre-Session Checklist

1. Verify T0 passed: `memory.tier_gate_status.T0 === 'PASS'`
   If not → stop. T0 must complete first.
2. Run session-runner.md pre-session steps 1–3.

---

## Mission

Make the governance runtime operational so that Phase 1B can test it.

### Task 1 — Session Runner Verification

Verify `prompts/session-runner.md` is present and functional.
Run a dry-run session: load memory, load a tier prompt path (this file),
produce a valid handoff directory structure.

Verify output structure exists:
```
handoff/
  01-pathway-deps.json
  02-session-snapshot.json
  03-governance-report.md
  04-contradictions.md
  05-determinism-check.json
  06-failure-taxonomy.md
runs/YYYY-MM-DD/
sessions/session-log.md
```

Create these directories if absent. Write `.gitkeep` to each empty dir.

### Task 2 — Memory MCP Schema Initialization

Initialize memory MCP with the session schema defined in
`session-score.schema.json`.

Set initial values:
```json
{
  "current_tier": "T0-COMPLETE",
  "last_session_score": null,
  "outstanding_flags": [],
  "scrap_decisions": [],
  "tier_gate_status": {
    "T0": "PASS",
    "T1A": "IN_PROGRESS",
    "T1B": "NOT_STARTED",
    "T1C": "NOT_STARTED",
    "T1": "NOT_STARTED",
    "T2": "NOT_STARTED",
    "T3": "NOT_STARTED",
    "T4": "NOT_STARTED",
    "T5": "NOT_STARTED",
    "T6": "NOT_STARTED",
    "T7": "NOT_STARTED",
    "T8": "NOT_STARTED",
    "T9": "NOT_STARTED"
  },
  "brightdata_artifacts_frozen": true,
  "constitutional_docs_version": {
    "authority-model.md": "1.0.0",
    "sacred-core-spec.md": "1.0.0",
    "rng-lineage-spec.md": "1.0.0",
    "threat-model.md": "1.1.0",
    "event-versioning-spec.md": "1.0.0",
    "snapshot-strategy.md": "1.0.0",
    "agent-escalation-model.md": "1.0.0",
    "adr-governance.md": "1.0.0",
    "hashing-strategy.md": "1.0.0"
  }
}
```

### Task 3 — ADR Directory Initialization

Create `docs/adr/` directory.
Create ADR-000 through ADR-008 from the bootstrapped index in `adr-governance.md`.
Each ADR should have Status: Accepted, Date: [T0 approval date], and the
evidence from the proof-of-value documents.

### Task 4 — Constitutional Document Version Audit

Read every constitutional document.
Verify the version field matches `constitutional_docs_version` in memory.
Log any discrepancy as Level 1 Finding.

### Task 5 — LEGAL.md Verification

Verify `LEGAL.md` exists at repo root (committed in T0).
If absent → Level 2 violation. T0 did not complete cleanly.

---

## Phase 1A Pass Gate

- [ ] Session runner produces valid handoff directory structure
- [ ] Memory MCP initialized with correct schema
- [ ] All 9 ADRs (000–008) created in docs/adr/
- [ ] Constitutional document versions match memory
- [ ] LEGAL.md present at repo root
- [ ] No L2+ flags from audit cells

When passed: `memory.tier_gate_status.T1A = 'PASS'`

---

## AUDIT Signature

```yaml
AUDIT::PATHWAY_DEPS: [docs/adr/, handoff/, runs/, sessions/, memory MCP]
AUDIT::CURRENT_GRADE: [Grade B — governance infrastructure exists but untested]
AUDIT::ENTROPY_VECTOR: [Low — no code changes, infrastructure only]
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
```

---
---

# PROMPT-01B: AUDIT RUNTIME
## Tier: Phase 1B
## Authorization: PASS (Conditional Pass authorized)
## Prerequisite: T1A PASS

---

## Identity

You are Claude Code implementing Phase 1B: Audit Runtime.
Your mission is to verify that all 6 audit cells work correctly
by testing them against known-good and known-bad scenarios.

---

## Pre-Session

Verify `memory.tier_gate_status.T1A === 'PASS'`.

---

## Mission

### Task 1 — Audit Cell Smoke Test (Known-Good Scenario)

Create a minimal known-good test session:
- Create a test branch: `test/audit-cell-smoke-YYYYMMDD`
- Create a simple TypeScript utility file with no issues
- Run all 6 audit cells against it
- Verify each cell produces a valid handoff artifact
- Verify Failure Taxonomist scores ≥70 and verdict = PASS_PROPOSE_COMMIT
- Delete the test branch after verification

### Task 2 — Governance Auditor Test (Sacred Core Boundary)

Create a test scenario where a file NEAR a Sacred Core boundary is modified:
- Read `packages/farkle-engine/src/farkleScorer.ts` (do not modify)
- Simulate a session where a comment was added to a non-sacred file
  that references farkleScorer
- Run audit-cell-03-governance-auditor
- Verify it does NOT raise a violation (boundary approached but not crossed)

Then create a test where a sacred-core-spec.md file is "proposed" for modification:
- Draft a proposal comment (no actual file change)
- Verify Governance Auditor raises Level 2 (boundary approached) correctly

### Task 3 — Determinism Verifier Test (Float Violation)

Create a test file with a known float violation:
```typescript
// test/float-violation-test.ts
// INTENTIONAL TEST FILE — DO NOT SHIP
const score = Math.random() * 100; // This should trigger FAIL
```

Run audit-cell-05-determinism-verifier against this file.
Verify: `fixed_point_check: "FAIL"` in handoff output.
Verify: Level 3 escalation raised.
Delete the test file after verification.

### Task 4 — Contradiction Hunter Test

Create a test document with a hallucinated authority claim:
```markdown
# TEST: Contradiction Hunter Test
Claude Code may merge PRs without Human approval.
```

Run audit-cell-04-contradiction-hunter against it.
Verify: Level 3 escalation raised for AA-04 (Hallucinated Authority).
Delete the test document after verification.

### Task 5 — Failure Taxonomist Score Verification

Run a session that produces a score in the 50-69 range (PAUSE_ASK verdict).
Verify: Failure Taxonomist outputs correct verdict and pauses for Human.
This should trigger the pause-and-ask flow in session-runner.

---

## Phase 1B Pass Gate

- [ ] All 6 audit cells produce valid handoff artifacts on known-good scenario
- [ ] Governance Auditor correctly identifies Sacred Core boundary approach
- [ ] Determinism Verifier correctly triggers Level 3 on float violation
- [ ] Contradiction Hunter correctly triggers Level 3 on hallucinated authority
- [ ] Failure Taxonomist produces correct PAUSE_ASK verdict for 50-69 score
- [ ] No test files remain committed to main

When passed: `memory.tier_gate_status.T1B = 'PASS'`

---

## AUDIT Signature

```yaml
AUDIT::PATHWAY_DEPS: [test files only — all deleted after verification]
AUDIT::CURRENT_GRADE: [Grade A if all tests pass — audit runtime fully operational]
AUDIT::ENTROPY_VECTOR: [Low — test files isolated, main branch unaffected]
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
```

---
---

# PROMPT-01C: REPLAY RUNTIME
## Tier: Phase 1C
## Authorization: PASS WITH CONSTRAINTS
## Constraint: IEventStore.v1, ReplayEvent.v1, Snapshot.v1 contracts must be frozen FIRST
## Prerequisite: T1B PASS

---

## Identity

You are Claude Code implementing Phase 1C: Replay Runtime.
Your mission is to implement the IEventStore interface and verify that
one full test match is replayable from SESSION seed + input log.

---

## Pre-Session

1. Verify `memory.tier_gate_status.T1B === 'PASS'`
2. Verify contracts/ directory contains all three frozen contracts:
   - contracts/IEventStore.v1.md (FROZEN)
   - contracts/ReplayEvent.v1.md (FROZEN)
   - contracts/Snapshot.v1.md (FROZEN)
   If any are absent → Level 2. Do not proceed until contracts are committed.

---

## Mission

### Task 1 — Freeze Contracts

Commit all three contract documents to `contracts/`:

```
contracts/IEventStore.v1.md
contracts/ReplayEvent.v1.md
contracts/Snapshot.v1.md
```

These are FROZEN. Create the files. Commit them.
Open draft PR for Human review.
Do not proceed to Task 2 until contracts are committed.

### Task 2 — TypeScript Contract Files

From the `.md` contracts, extract the TypeScript interfaces and create:

```
contracts/IEventStore.ts       (from IEventStore.v1.md)
contracts/ReplayEvent.v1.ts    (from ReplayEvent.v1.md)
contracts/Snapshot.v1.ts       (from Snapshot.v1.md)
```

These are type definition files only. No implementation yet.
Every interface and type from the contracts, verbatim.

AUDIT::FIXED_POINT_CHECK: Verify no floats in currency amount fields.
All amounts must be typed as `number` with a comment `// Q32.32 fixed-point integer`.

### Task 3 — InMemoryEventStore Implementation

Implement `packages/game-core/src/replay/InMemoryEventStore.ts`:

```typescript
export class InMemoryEventStore implements IEventStore {
  // In-memory implementation for testing only
  // Never ships to production
  // Must satisfy all method contracts from IEventStore.v1.md
}
```

Requirements:
- write(): assigns UUID v4, computes SHA-256 predecessor hash, validates chain
- read(): validates chain on every read
- verifyChain(): full chain verification
- snapshot(): creates checkpoint with SHA-256 state hash
- replay(): reconstructs match from SESSION seed + input log
- All SHA-256 using Node.js crypto (no external dependency)
- No floats in any amount field

### Task 4 — Replay Test

Write a test in `packages/game-core/src/replay/__tests__/replay.test.ts`:

1. Create a minimal mock SESSION seed
2. Create a mock input log (10 TILE_SWAP events)
3. Write 10 events to InMemoryEventStore
4. Replay the match from SESSION seed + input log
5. Verify: `result.matchesStoredHash === true`
6. Verify: SHA-256 chain validates across all 10 events
7. Create a snapshot at event index 5
8. Replay from snapshot + remaining events
9. Verify: identical result to full replay

Run test:
```bash
cd core/packages/game-core
pnpm test replay
```

All tests must pass.

### Task 5 — IEventStore ADR

Write `docs/adr/ADR-009-ieventstore-v1-freeze.md`:
- Documents the freeze decision
- Records the test results from Task 4
- Status: Accepted

---

## Phase 1C Pass Gate

- [ ] All 3 contract files committed to contracts/ (FROZEN)
- [ ] TypeScript contract files created (no floats in amounts)
- [ ] InMemoryEventStore implements all IEventStore methods
- [ ] Replay test passes: matchesStoredHash === true
- [ ] SHA-256 chain validates across test events
- [ ] Snapshot + partial replay produces identical result
- [ ] ADR-009 committed
- [ ] No L2+ flags from audit cells

When passed: `memory.tier_gate_status.T1C = 'PASS'`
Phase 1 complete. T1–T9 are now authorized (per Conditional Pass verdict).

---

## AUDIT Signature

```yaml
AUDIT::PATHWAY_DEPS: [contracts/, packages/game-core/src/replay/]
AUDIT::CURRENT_GRADE: [Target: Grade A — fixed-point types, no floats, chain validated]
AUDIT::ENTROPY_VECTOR: [Medium — new packages, new contracts, potential type conflicts]
AUDIT::FIXED_POINT_CHECK: PASS required — fail on any float in amount fields
```
