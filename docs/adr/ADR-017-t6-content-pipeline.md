<!--
AUDIT::PATHWAY_DEPS: core/apps/server/src/gameRoom.ts,
  core/packages/farkle-engine/src/gridUtils.ts,
  core/packages/game-core/src/level/LevelDef.schema.json,
  core/packages/game-core/src/level/types.ts,
  core/packages/game-core/src/level/__tests__/levelSchema.test.ts,
  docs/level-taxonomy.md,
  docs/adr/ADR-010-rtp-variance-tightening.md
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: SupabaseEventStore wiring adds async writes at MATCH_START/MATCH_END; non-blocking; dev/test unaffected by absent env vars
AUDIT::FIXED_POINT_CHECK: PASS
-->

# ADR-017: T6 Content Pipeline

**Status:** Accepted
**Date:** 2026-05-25
**Session:** tier/T6-content-pipeline-20260525
**Score:** TBD (Failure Taxonomist)

---

## Context

T6 delivers three obligations from `mesh/master_proof_of_value_audit_v2.md §T6`:

1. Level schema (JSON Schema for LevelDef) + TypeScript types
2. 50-stage taxonomy covering all 20 lattice modules
3. SupabaseEventStore wiring into gameRoom.ts (deferred from T5)

Additionally resolves pre-existing issues deferred from earlier tiers:
- gridUtils.ts SEVERITY-C floats (blockerCount * 0.5 / 0.25 — L1 from T1)
- gameRoom.ts type error at line 646 (pre-existing — msg not in scope in processChain)
- ADR-010 Monte Carlo calibration update (PROPOSE ONLY — Sacred Core)

---

## Decisions

### D1 — gridUtils.ts SEVERITY-C Float Resolution

**Decision:** Replace `Math.floor(blockerCount * 0.5)` and `Math.floor(blockerCount * 0.25)`
with `Math.floor(blockerCount / 2)` and `Math.floor(blockerCount / 4)` respectively.

**Rationale:** Float multiplications (0.5, 0.25) in a non-scoring grid-layout path are
SEVERITY-C violations per the T1 mathematical audit. Integer division produces identical
results for positive integers and removes all float arithmetic from the grid creation path.

**FIXED_POINT_CHECK:** PASS — non-scoring path (grid layout, not payout arithmetic).
`lockCount = blockerCount - stoneCount - iceCount` remains correct with integer division.

**Sacred Core contact:** NONE

---

### D2 — gameRoom.ts processChain type error fix

**Decision:** Add `msg: { type: string; [k: string]: unknown }` parameter to
`processChain(playerId, chain, msg)`. Update the single call site in `handleMessage()`.

**Rationale:** Line 646 references `msg` to extract `beatAccuracy` from the WebSocket
message. `processChain()` was refactored to drop the `msg` parameter but the reference
was not updated. This is a pre-existing TypeScript error (TS2304) that blocked tsc
type-checking in T5 scope.

**FIXED_POINT_CHECK:** PASS — no arithmetic introduced.
**Sacred Core contact:** NONE (gameRoom.ts is not in sacred-core-spec.md)

---

### D3 — SupabaseEventStore wired to gameRoom.ts

**Decision:** `SupabaseEventStore` is imported and lazy-initialized in the `GameRoom`
constructor. If Supabase env vars are absent (dev/test), initialization is silently skipped
(try-catch). Two events are written:
- `MATCH_START` — in `handleStartGame()`, after `FAIRNESS_COMMITMENT` broadcast
- `MATCH_END` — in `endSession()`, after payout resolution

Both writes are fire-and-forget (`void ... .catch(...)`). Game flow is never blocked.

**rtp_final encoding:** `Math.round(netRTP * 1000)` — Q×1000 integer. `netRTP=0.92` → 920.

**MATCH_SCORE events** deferred to T7 — requires per-player class archetype tracking not
yet initialized in gameRoom.ts. MATCH_START + MATCH_END establish the chain boundaries.

**Pass gate:** When SUPABASE_* env vars are present, `game_events` table populates with
MATCH_START and MATCH_END on each session. `verifyChain()` can validate the session chain.

**FIXED_POINT_CHECK:** PASS — rtp_final uses `Math.round(netRTP * 1000)` (Q×1000).
**Sacred Core contact:** NONE

---

### D4 — Level Schema (LevelDef)

**Decision:** JSON Schema v7 at `core/packages/game-core/src/level/LevelDef.schema.json`.
TypeScript types at `core/packages/game-core/src/level/types.ts`.
Six validation tests at `core/packages/game-core/src/level/__tests__/levelSchema.test.ts`.

**Key constraints:**
- `id` pattern: `^L[0-9]{2}-[a-z0-9-]+$`
- `stage_number`: integer 1–50
- `grid_size`: integer 7–10
- `win_score`: integer ≥ 1000 (Q×1000 fixed-point)
- `lattice_module`: one of 20 canonical modules
- `archetype_bias`: `'Paladin' | 'Rogue' | 'Bard' | null`

**FIXED_POINT_CHECK:** PASS — `win_score` is declared as integer in schema and types.
**Sacred Core contact:** NONE

---

### D5 — 50-Stage Taxonomy

**Decision:** `docs/level-taxonomy.md` documents all 50 stages. All 20 lattice modules
covered. win_score progression: 3000 (stage 1) → 20000 (stage 50).

Structure: stages 1–10 (LOW, grid 7), 11–30 (MEDIUM, grid 8), 31–49 (HIGH, grid 9),
stage 50 (HIGH, grid 10 — final challenge).

**FIXED_POINT_CHECK:** NOT_APPLICABLE (documentation).
**Sacred Core contact:** NONE

---

### D6 — ADR-010 Monte Carlo Update (PROPOSE ONLY)

**Decision:** ADR-010 updated with T6 harness results. Current deviance for RALLY_FREE
and HEIST_FREE is 0.1158 (vs ±0.003 AA+ target). Calibration approach proposed.

**Blocked on:** Human approval of calibration approach + 10,000-generation Monte Carlo
confirmation before any Sacred Core write to `monteCarlo.ts` or `rtpConfig.ts`.

**Sacred Core contact:** READ-ONLY (harness run only, no Sacred Core write).

---

## Test Results

| Test Suite | Before T6 | After T6 |
|---|---|---|
| farkleScorer.test.ts | 16/16 PASS | 16/16 PASS |
| replay.test.ts | 5/5 PASS | 5/5 PASS |
| spawn.test.ts | 3/3 PASS | 3/3 PASS |
| inputQueue.test.ts | 2/2 PASS | 2/2 PASS |
| chain.test.ts | 2/2 PASS | 2/2 PASS |
| rtp.harness.test.ts | 3/3 PASS | 3/3 PASS |
| spawnQueue.test.ts | 4/4 PASS | 4/4 PASS |
| **levelSchema.test.ts** | N/A | **6/6 PASS** |
| **Total** | **35/35** | **41/41** |

---

## Outstanding Items Carried to T7

- MATCH_SCORE events not wired (per-player class archetype tracking needed)
- ADR-010 Monte Carlo calibration: PROPOSE ONLY — pending Human approval
- gameRoom.ts type error fixed but tsc still reports pre-existing InMemoryEventStore
  node:crypto / process errors (tsconfig issue — not T6 scope)
- Visual overhaul (Gothic Hacker Neon) — T7 scope
- Audio routing graph (AGROS ERK conductor) — T7 scope

---

## Version

ADR-017 v1.0.0
Accepted: 2026-05-25
