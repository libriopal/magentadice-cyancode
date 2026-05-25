<!--
AUDIT::PATHWAY_DEPS: core/apps/server/src/gameRoom.ts,
  core/packages/farkle-engine/src/gridUtils.ts,
  core/packages/game-core/src/level/LevelDef.schema.json,
  core/packages/game-core/src/level/types.ts,
  docs/level-taxonomy.md,
  docs/adr/ADR-017-t6-content-pipeline.md
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: SupabaseEventStore wiring adds async DB writes to server game flow; all non-scoring paths
AUDIT::FIXED_POINT_CHECK: PASS
-->

# Tier Prompt 06 — Content Pipeline (T6)
## FAR_NZY / magentadice-cyancode
## Session: tier/T6-content-pipeline-YYYYMMDD
## Authority: mesh/EXECUTE.md (constitutional); docs/protocols/FF_V4_Claude_Code_Directive.xml (supplemental)

---

## Objective

T6 delivers three obligations from `mesh/master_proof_of_value_audit_v2.md §T6`:

1. Level schema (JSON Schema for LevelDef) + TypeScript types
2. 50-stage taxonomy covering all 20 lattice modules
3. Authoring tools — scaffold + validation

Deferred items from T5 also resolved in T6:

- Wire SupabaseEventStore into gameRoom.ts (MATCH_START + MATCH_END events)
- Fix gridUtils.ts SEVERITY-C float (blockerCount*0.5/0.25 → integer division)
- Fix gameRoom.ts type error at line 646 (msg not in scope in processChain)
- Level schema validation tests (3 test stages pass gate)

---

## Sacred Core Constraints

**Sacred Core files (PROPOSE ONLY — no write without Human approval):**
- `core/packages/farkle-engine/src/csprng.ts`
- `core/packages/farkle-engine/src/farkleScorer.ts`
- `core/packages/farkle-engine/src/rtpConfig.ts`
- `core/packages/farkle-engine/src/monteCarlo.ts`
- `core/packages/farkle-engine/src/farkleStore.ts`
- `core/packages/game-core/src/replay/farkleStore.ts` (if present)

**Note:** `gameRoom.ts` has a "CORE SACRED FILE" developer comment but is NOT in
`mesh/sacred-core-spec.md`. Modifications are permitted with FIXED_POINT_CHECK and
full audit cell sequence. Treat it as a high-caution file.

**FIXED_POINT_CHECK mandate:**
- Any new arithmetic on FD/PDX/SDX amounts MUST use Q×1000 integers (never float)
- Game scores (raw Farkle points) are integers — acceptable as-is in event payloads
- rtp_final in MATCH_END payload: write as `Math.round(netRTP * 1000)` (Q×1000)
- No new float arithmetic in any scoring or payout path

---

## Tasks

### Task 1 — Fix gridUtils.ts SEVERITY-C floats (L1 deferred from T1)

**File:** `core/packages/farkle-engine/src/gridUtils.ts`

**Change:** Replace float multiplications in `createGrid()`:
```typescript
// Before (float)
const stoneCount = Math.floor(blockerCount * 0.5);
const iceCount   = Math.floor(blockerCount * 0.25);
// After (integer)
const stoneCount = Math.floor(blockerCount / 2);
const iceCount   = Math.floor(blockerCount / 4);
```

**FIXED_POINT_CHECK:** PASS — non-scoring path (grid layout, not payout arithmetic)
**Sacred Core contact:** NONE

---

### Task 2 — Fix gameRoom.ts type error at line 646 (pre-existing)

**File:** `core/apps/server/src/gameRoom.ts`

**Change:** Add `msg` parameter to `processChain()` signature so line 646
(`msg as { beatAccuracy?: BeatAccuracy }`) is in scope. Update the single call
site in `handleMessage()` at line 350 to pass `msg`.

```typescript
// Before
private processChain(playerId: string, chain: { row: number; col: number }[])
this.processChain(playerId, chain);

// After
private processChain(playerId: string, chain: { row: number; col: number }[], msg: { type: string; [k: string]: unknown })
this.processChain(playerId, chain, msg);
```

**FIXED_POINT_CHECK:** PASS — no arithmetic introduced
**Sacred Core contact:** NONE

---

### Task 3 — Wire SupabaseEventStore into gameRoom.ts

**File:** `core/apps/server/src/gameRoom.ts`

**Change:** Lazy-initialize `SupabaseEventStore` in the constructor (guard with
try-catch — throws if env vars are missing). Write events at two key lifecycle
points only:

1. `handleStartGame()` → write `MATCH_START` event (fire-and-forget, void)
2. `endSession()` → write `MATCH_END` event (fire-and-forget, after winnerId resolved)

**Implementation rules:**
- Do NOT block game flow — all writes are `void this._eventStore.write(...).catch(e => console.error(...))` pattern
- Do NOT introduce float arithmetic in event payloads:
  - `rtp_final`: `Math.round(netRTP * 1000)` — Q×1000
  - `final_scores`: per-player `profile.banked` (raw integers — acceptable)
  - `score_delta`: skip MATCH_SCORE events in T6 (per-player class archetype not tracked yet; defer to T7)
- Add private `_eventStoreTick = 0` for monotonic replay_tick increment

**Pass gate:** When SUPABASE_* env vars are present, starting a game session writes
`MATCH_START` to `game_events` table and ending a session writes `MATCH_END`.

**FIXED_POINT_CHECK:** PASS — rtp_final uses Math.round(netRTP * 1000)
**Sacred Core contact:** NONE (gameRoom.ts is not in sacred-core-spec.md)

---

### Task 4 — Implement Level Schema

**Files to create:**
- `core/packages/game-core/src/level/LevelDef.schema.json` — JSON Schema v7
- `core/packages/game-core/src/level/types.ts` — TypeScript types derived from schema
- `core/packages/game-core/src/level/__tests__/levelSchema.test.ts` — 3 test stages

**LevelDef schema fields:**
```
id: string (pattern: "^L[0-9]{2}-[a-z-]+$")
name: string
stage_number: integer (1-50)
grid_size: integer (7-10)
blocker_density: "LOW" | "MEDIUM" | "HIGH"
win_score: integer (Q×1000 — level pass threshold)
time_limit_sec: integer (60-300)
lattice_module: one of 20 lattice module IDs
archetype_bias: null | "Paladin" | "Rogue" | "Bard"
```

**3 test stages:** L01 (Neural Foyer, stage 1), L25 (mid-game), L50 (endgame).
Tests verify: schema validates valid stages, rejects invalid grid_size (<7), rejects
invalid stage_number (>50).

**FIXED_POINT_CHECK:** PASS — win_score is integer (Q×1000)
**Sacred Core contact:** NONE

---

### Task 5 — 50-Stage Taxonomy

**File:** `docs/level-taxonomy.md`

Document 50 stages across 20 lattice modules. Each stage has: id, name,
stage_number, lattice_module, blocker_density, win_score, archetype_bias.
Stages 1-10 = introductory (LOW density), 11-30 = mid-game (MEDIUM), 31-50 = expert (HIGH).

**FIXED_POINT_CHECK:** NOT_APPLICABLE (documentation)
**Sacred Core contact:** NONE

---

### Task 6 — ADR-010 Monte Carlo Calibration (PROPOSE ONLY)

**Context:** ADR-010 is Proposed — pending Monte Carlo 10,000-generation pass.
`monteCarlo.ts` is Sacred Core. This task PROPOSES the calibration without implementing it.

**Action:**
1. Run `rtp.harness.test.ts` — record current deviance for all 8 modes
2. Identify which modes exceed ±0.003 (RALLY_FREE, HEIST_FREE at 0.1158)
3. Update ADR-010 with current harness results and proposed calibration approach
4. Mark as: "Proposed — pending Human approval of Monte Carlo results"
5. Do NOT modify `monteCarlo.ts` or `rtpConfig.ts`

**Sacred Core contact:** READ-ONLY (run harness, read results). No Sacred Core write.

---

### Task 7 — ADR-017

Create `docs/adr/ADR-017-t6-content-pipeline.md` with decisions for all T6 work.

---

### Task 8 — Audit cells + session artifacts

Run all 6 audit cells sequentially. Write session-10.json.

---

## Pass Gate

- `pnpm --filter @match3d/game-core test` → 16/16 PASS (no regressions) + levelSchema tests
- `pnpm --filter @match3d/farkle-engine test` → 16/16 PASS (no regressions)
- gridUtils.ts: 0 float multiplications in blockerCount path
- gameRoom.ts: `npx tsc --noEmit` → 0 new errors (pre-existing errors baseline first)
- SupabaseEventStore wired: MATCH_START + MATCH_END write paths present in code
- Level schema: JSON Schema validates 3 test stages
- Level taxonomy: 50 stages documented
- FIXED_POINT_CHECK: PASS on all new production code
- Sacred Core: 0 writes

---

## Version

Prompt-06 v1.0.0 — Authored 2026-05-25
