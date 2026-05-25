<!--
AUDIT::PATHWAY_DEPS: core/packages/game-core/src/systems/VoxelPhysicsSystem.ts,
  core/apps/web/src/hooks/useFarkleGame.ts,
  core/apps/web/src/components/GameScreen.tsx,
  core/packages/game-core/src/replay/types.ts,
  docs/adr/ADR-016-t5-core-loop-excellence.md
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: enqueueAction wiring touches physics step boundary;
  ClassArchetype display reads Sacred Core multiplier table (read-only)
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE (prompt document)
-->

# TIER PROMPT T5 — CORE LOOP EXCELLENCE
## FAR_NZY / magentadice-cyancode
## Session: tier/T5-core-loop-excellence-20260524
## Source: mesh/master_proof_of_value_audit_v2.md §T5 + prompts/diecode.md Track A

---

## Scope

T5 delivers core loop integrity and production readiness gates. Three engineering
obligations, each traceable to a legal or production requirement:

1. **enqueueAction wiring** — All physics-side mutations (spawn, remove, impulse) must
   flow through `VoxelPhysicsSystem.enqueueAction()`. T3 built the queue; T5 extends
   it with `spawn` actions and routes useFarkleGame.ts spawn calls through it.
   Rationale: a frame spike that drops a spawn on a real-money platform is a compliance
   failure (same class as a dropped input, per DELTA-VERIFY DVP-2026-R72-NEXUS).

2. **Class archetype display** — The ClassArchetype type (`Paladin | Rogue | Bard`)
   is frozen in contracts/ReplayEvent.v1.ts and drives SnapshotState.class_archetypes.
   T5 builds a display badge (UI only — multipliers are Sacred Core READ ONLY).

3. **Softlock hardening** — The dead-board detection path (deadBoardAttemptsRef) and
   the energy drain auto-bank must never produce a UI state where the player cannot
   make a decision. Verify 0 softlocks across 50 synthetic game loops.

**FF_V4 supplement** (Option B decision): T5 also produces the full set of FF_V4
deliverables — repository audit, dependency map, risk report, implementation roadmap.

---

## Prerequisites Verified

- T0–T4 all PASS; PR #14 merged to main (HEAD: 48d90b4)
- Branch: `tier/T5-core-loop-excellence-20260524`
- Baseline tests: farkleScorer 16/16, replay 5/5, chain 2/2, inputQueue 2/2, spawn 3/3,
  rtp.harness 3/3 — all PASS with NODE_ENV=test
- [L1-FINDING] game-core package.json test scripts missing NODE_ENV=test — fixed T5 Task 1

---

## FIXED_POINT_CHECK Mandate

- ClassArchetype multipliers (Paladin 1.15x, Rogue 2.5x, Bard 1.85x) are Sacred Core.
  T5 may READ these from rtpConfig.ts for display; it must NEVER write them.
- PhysicsAction spawn payload: column (integer 0–6), entityType (enum string). No floats.
- Any spawn coordinate converted to physics world-space uses Q×1000 integer arithmetic
  internally where applicable — COLUMN_X constants are non-scoring physical positions.
  FIXED_POINT_CHECK: NOT_APPLICABLE for physics world-space positions (not scoring paths).

---

## Task Sequence

### Task 1 — Create this prompt file
Path: `mesh/prompt-05-core-loop-excellence.md`
Status: COMPLETE

---

### Task 2 — Fix game-core test script (L1-FINDING from baseline)
Path: `core/packages/game-core/package.json`

Resolves [L1-FINDING]: NODE_ENV=test absent from test scripts; InMemoryEventStore
production guard throws without it.

Changes:
- Add `NODE_ENV=test` prefix to all test scripts
- Expand `test` script to run all 4 test files: replay, spawn, inputQueue, chain

Pass condition: `pnpm --filter @match3d/game-core test` exits 0 with 14 tests passing.

---

### Task 3 — Extend PhysicsAction with 'spawn' type
Path: `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts`

Current PhysicsActionType: `'remove' | 'anchor_ghost' | 'apply_impulse'`
Add: `'spawn'`

Add to PhysicsAction interface:
- `entityType?: EntityType`   — body type for spawn
- `column?: number`           — logical column (integer 0–6)
- `face?: number | null`      — die face value (null for non-die entities)

Add `spawnBodyQueued(column: number, entityType: EntityType, face?: number | null): string`
method to VoxelPhysicsSystem — assigns a deterministic ID, enqueues the spawn, returns
the future body ID immediately so callers can reference it before the drain.

Update `_drainPendingActions()` to handle `type === 'spawn'`.

FIXED_POINT_CHECK: PASS — no scoring arithmetic; column is integer; entityType is enum.
Sacred Core: NOT_APPROACHED — no contact with farkleScorer, farkleStore, gameStore.

---

### Task 4 — enqueueAction spawn test
Path: `core/packages/game-core/src/replay/__tests__/spawnQueue.test.ts`

Tests:
1. `spawnBodyQueued()` returns an ID before the drain
2. Body does not appear in transforms before `_drainPendingActions()` is called
3. Body appears in transforms after drain with correct entityType
4. 2-frame spike: two `spawnBodyQueued()` calls, single drain — both bodies appear

FIXED_POINT_CHECK: NOT_APPLICABLE (no scoring paths).

---

### Task 5 — ClassArchetypeBadge component
Path: `core/apps/web/src/components/ClassArchetypeBadge.tsx`

READ-ONLY source: `ClassArchetype` type from contracts/ReplayEvent.v1.ts.
DO NOT import or reference multiplier values from rtpConfig.ts or farkleScorer.ts.

The badge shows: archetype name + color-coded visual indicator.
- Paladin: gold (#c9a84c)
- Rogue: crimson (#c94c4c)
- Bard: violet (#9c4cc9)

No scoring logic. Purely presentational. Grade A (no floats, no Sacred Core boundary).

---

### Task 6 — Softlock hardening documentation + verification
Path: `docs/softlock-verification.md`

Document the existing softlock prevention mechanisms in useFarkleGame.ts:
- `deadBoardAttemptsRef` — detects and recovers dead boards
- Energy drain auto-bank (C11) — prevents game stuck in FRENZY indefinitely
- Rally decision timeout auto-bank (C2)
- Heist window expiry auto-claim (C1)

Verify each mechanism is reachable and produces a valid state transition.
Record: 0 softlock conditions identified in synthetic analysis of 50 loop paths.

---

### Task 7 — FF_V4 deliverables document
Path: `docs/ff-v4-gap-analysis.md`

Produce all deliverables required by docs/protocols/FF_V4_Claude_Code_Directive.xml:
- Repository audit (current state post-T4)
- Dependency map (internal packages + external)
- Gap analysis (what remains for T5–T9)
- Risk report (top 10 risks, severity, mitigation)
- Implementation roadmap (T5–T9 sequencing)
- T-series test plan (what each tier must verify)

---

### Task 8 — ADR-016
Path: `docs/adr/ADR-016-t5-core-loop-excellence.md`

Documents: enqueueAction spawn extension rationale, ClassArchetypeBadge design decisions,
softlock verification methodology, L1-FINDING resolution (test script NODE_ENV fix),
FF_V4 supplement scope.

---

### Task 9 — Audit cells + close
Write handoff/01-06, `runs/2026-05-24/session-9.json`, append `sessions/session-log.md`.
Commit all artifacts, push, open draft PR.

---

## Sacred Core Constraints (Active This Session)

READ ONLY — never write:
- `core/packages/farkle-engine/src/farkleScorer.ts`
- `core/packages/farkle-engine/src/rtpConfig.ts`
- `core/packages/farkle-engine/src/monteCarlo.ts`
- `core/packages/farkle-engine/src/csprng.ts`
- `core/packages/farkle-engine/src/farkleStore.ts`
- `core/packages/farkle-engine/src/gameStore.ts`

ClassArchetype multipliers (1.15x, 2.5x, 1.85x) are Sacred Core values — read for
display, never compute with.

---

## Pass Gate

- game-core test: `pnpm --filter @match3d/game-core test` → 14/14 PASS (NODE_ENV=test)
- farkle-engine test: 16/16 PASS (no regression)
- spawnQueue.test.ts: 4/4 PASS
- rtp.harness: 3/3 PASS (deviance < 0.20 — T4 gate maintained)
- ClassArchetypeBadge: renders without errors, no floats, no Sacred Core import
- Softlock verification: 0 unrecoverable states documented
- FF_V4 gap-analysis document: all 6 sections present
- FIXED_POINT_CHECK: PASS on all new production code
- No new TypeScript errors beyond pre-existing pre-T5 baseline

---

## Version

prompt-05-core-loop-excellence.md v1.0.0
Created: 2026-05-24
Session: tier/T5-core-loop-excellence-20260524
