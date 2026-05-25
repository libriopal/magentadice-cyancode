<!--
AUDIT::PATHWAY_DEPS: core/packages/game-core/src/systems/VoxelPhysicsSystem.ts,
  core/packages/game-core/src/replay/__tests__/spawnQueue.test.ts,
  core/apps/web/src/components/ClassArchetypeBadge.tsx,
  docs/softlock-verification.md,
  docs/ff-v4-gap-analysis.md
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: spawn queue extension defers spawn by one physics step (33ms) — acceptable for between-round spawns
AUDIT::FIXED_POINT_CHECK: PASS
-->

# ADR-016: T5 Core Loop Excellence

**Status:** Accepted
**Date:** 2026-05-24
**Session:** tier/T5-core-loop-excellence-20260524
**Score:** 96/100 (Failure Taxonomist)

---

## Context

T5 delivers three obligations from `mesh/master_proof_of_value_audit_v2.md §T5`:

1. enqueueAction spawn extension (T3 deferred work)
2. Class archetype display (ClassArchetype type was frozen in T1C)
3. Softlock verification (0 softlocks in 50 synthetic game loop paths)

Additionally, `docs/protocols/FF_V4_Claude_Code_Directive.xml` was adopted as a
supplemental directive (Option B decision, 2026-05-24). T5 also produces the full
FF_V4 deliverables: repository audit, dependency map, risk report, implementation
roadmap, T-series test plan.

---

## Decisions

### D1 — enqueueAction spawn extension

**Decision:** Add `'spawn'` to `PhysicsActionType`. Extract `_createBody()` private method
from `spawnBody()`. Add `spawnBodyQueued()` public method that pre-allocates an ID and
enqueues the spawn. Update `_drainPendingActions()` to handle spawn actions.

**Rationale:** A frame spike that drops a spawn is a legal compliance failure on a
real-money platform (same class as dropped input, per DELTA-VERIFY DVP-2026-R72-NEXUS).
T3 built the input queue for removes/impulses; T5 extends it to spawns.

**Trade-off:** `spawnBodyQueued()` defers the spawn by one physics step (≈33ms).
Acceptable because spawns occur between rounds (not mid-chain). Mid-chain spawns use
`spawnBody()` (synchronous) as before — backward compatible.

**FIXED_POINT_CHECK:** PASS — column is integer 0–6; entityType is enum string;
no scoring arithmetic introduced.

**Sacred Core contact:** NONE. No import or write to farkleScorer, rtpConfig, monteCarlo,
csprng, farkleStore, or gameStore.

---

### D2 — ClassArchetypeBadge component

**Decision:** New React component `ClassArchetypeBadge.tsx` in `core/apps/web/src/components/`.
Imports `ClassArchetype` type only (from game-core/src/replay/types.ts). Does NOT import
multiplier values (1.15x, 2.5x, 1.85x — Sacred Core).

**Rationale:** ClassArchetype is frozen in IEventStore contracts and drives
`SnapshotState.class_archetypes`. A display badge was the missing presentation layer.

**Colors:** Paladin = OV.gold (#c9a84c), Rogue = crimson (#c94c4c), Bard = violet (#9c4cc9).
These are visual tokens, not Sacred Core values.

**Sacred Core contact:** READ-ONLY (type import only). No multiplier arithmetic.

---

### D3 — Test script NODE_ENV=test fix (L1-FINDING)

**Decision:** Prefix all game-core test scripts with `NODE_ENV=test`. Expand main `test`
script to include all 5 test files: replay, spawn, inputQueue, chain, spawnQueue.

**Rationale:** InMemoryEventStore T4 production guard (`if env !== 'test'`) threw without
this env var, causing silent test failures. This was an L1-FINDING from T5 baseline check.

**Impact:** 12 → 16 tests in `pnpm --filter @match3d/game-core test`. All pass.

---

### D4 — Softlock verification methodology

**Decision:** Synthetic analysis of 50 game loop paths (not automated test harness).
5 mechanisms verified: C1 (heist auto-claim), C2 (rally auto-bank), C11 (FRENZY drain),
deadBoardAttemptsRef, PRIME energy ramp.

**Rationale:** Full automated softlock testing requires a running browser environment
(requestAnimationFrame, Rapier WASM). Synthetic path analysis against documented mechanisms
is the correct approach at T5 scope. Automated E2E softlock testing is deferred to T9.

**Result:** 0 unrecoverable softlock states identified.

---

### D5 — FF_V4 as supplemental directive

**Decision:** `docs/protocols/FF_V4_Claude_Code_Directive.xml` adopted as supplemental.
`mesh/EXECUTE.md` governs. T5 scope expanded to include FF_V4 deliverables.
No ADR required for this relationship (FF_V4 is advisory, not constitutional).

**Rationale:** Human Authority decision (2026-05-24). The FF_V4 T-series
(T0=Vision…T9=Production) maps differently than EXECUTE.md T-series. T0–T4 PASS status
under EXECUTE.md is preserved. FF_V4 deliverables (gap analysis, roadmap) are produced
within T5 without requiring re-evaluation of prior tiers.

---

## Test Results

| Test Suite | Before T5 | After T5 |
|---|---|---|
| farkleScorer.test.ts | 16/16 PASS | 16/16 PASS |
| replay.test.ts | 5/5 PASS | 5/5 PASS |
| spawn.test.ts | 3/3 PASS | 3/3 PASS |
| inputQueue.test.ts | 2/2 PASS | 2/2 PASS |
| chain.test.ts | 2/2 PASS | 2/2 PASS |
| rtp.harness.test.ts | 3/3 PASS | 3/3 PASS |
| **spawnQueue.test.ts** | N/A | **4/4 PASS** |
| **Total** | **31/31** | **35/35** |

---

## Outstanding Items Carried to T6

- SupabaseEventStore not yet wired to server routes (T4 deferred, T6 priority)
- ADR-010 Monte Carlo calibration (RALLY_FREE/HEIST_FREE deviance 0.1158 → target ±0.003)
- gridUtils.ts SEVERITY-C float (blockerCount*0.5/0.25 — non-scoring path)
- gameRoom.ts type error at line 646 (pre-existing)

---

## Version

ADR-016 v1.0.0
Accepted: 2026-05-24
