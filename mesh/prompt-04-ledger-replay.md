<!--
AUDIT::PATHWAY_DEPS: core/supabase/migrations/002_event_store_ledger.sql,
  core/apps/server/src/SupabaseEventStore.ts,
  core/packages/game-core/src/replay/__tests__/chain.test.ts,
  core/packages/farkle-engine/src/__tests__/rtp.harness.test.ts,
  docs/adr/ADR-015-t4-ledger-replay.md
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: Supabase schema changes affect all event-sourced paths;
  IEventStore contract frozen — SupabaseEventStore must not extend it
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE (prompt document)
-->

# TIER PROMPT T4 — LEDGER & REPLAY
## FAR_NZY / magentadice-cyancode
## Session: tier/T4-ledger-replay-20260524
## Reconstructed from: mesh/master_proof_of_value_audit_v2.md §T4

---

## Scope

T4 delivers the production persistence layer for FAR_NZY's provably-fair audit trail.
Three engineering obligations — each a legal compliance requirement on a real-money
sweepstakes platform:

1. **SHA-256 event chain** — every GameEvent links to its predecessor via
   `sha256(JSON.stringify(prev_event))`. A chain break is tamper evidence.
   The chain must validate across 100 synthetic events.

2. **FD/PDX ledger separation** — Frenzy Diamonds (FD, in-game currency) and
   Prize Draw Entries (PDX, real-money equivalent) must live in separate Postgres
   tables with zero pointer sharing between them.

3. **RTP harness** — `runAllModeAudit()` in `monteCarlo.ts` must execute
   successfully across all 8 game modes.

---

## Prerequisites Verified

- T0 PASS, T1 PASS, T2 PASS, T3 PASS
- Branch: `tier/T4-ledger-replay-20260524`
- `InMemoryEventStore` production guard confirmed pointing to SupabaseEventStore
- L1-Supabase-empty flag from T1B: resolved in this session

---

## FIXED_POINT_CHECK Mandate

All Postgres amount/balance columns: `bigint` (Q×1000 integer representation).
NEVER `numeric`, `float4`, `float8`, `real`, `decimal`.
Detection of a float type in any ledger column → FIXED_POINT_CHECK: FAIL → Level 3 → halt.

---

## Task Sequence

### Task 1 — Create this prompt file
Path: `mesh/prompt-04-ledger-replay.md`
Status: COMPLETE

---

### Task 2 — Supabase migration `002_event_store_ledger.sql`
Path: `core/supabase/migrations/002_event_store_ledger.sql`

Creates four tables absent from `001_initial_schema.sql`:

**`game_events`** — append-only event chain, IEventStore persistence layer
- All chain hashes: `sha256:hex` prefix format
- `replay_tick`: bigint (never float)
- No DELETE, no UPDATE — append-only by policy
- RLS: service_role only for INSERT

**`event_snapshots`** — checkpoint chain linked to game_events

**`fd_ledger`** — Frenzy Diamonds only
- `delta` and `balance_after`: bigint (Q×1000)
- `balance_after >= 0` check constraint
- NO foreign key to `pdx_ledger`

**`pdx_ledger`** — Prize Draw Entries only
- `delta` and `balance_after`: bigint (Q×1000)
- `balance_after >= 0` check constraint
- `attestation_verdict text not null` — PDX_AWARD rows require 'MEETS_DEVICE_INTEGRITY'
- NO foreign key to `fd_ledger`

---

### Task 3 — `SupabaseEventStore.ts`
Path: `core/apps/server/src/SupabaseEventStore.ts`

Production `IEventStore` implementation.
- Implements all methods: `write`, `read`, `verifyChain`, `migrate`, `snapshot`,
  `loadSnapshot`, `replay`, `healthCheck`
- `write()`: inserts into `game_events`, computes predecessor_hash from prior row,
  signs with HMAC-SHA256 using `SUPABASE_HMAC_SECRET` env var
- `verifyChain()`: reads events in range, re-derives each predecessor_hash, detects first break
- Chain algorithm: `'sha256:' + sha256(JSON.stringify(prev_event))`
- No `Math.random()`. All hashing via `node:crypto`.
- Required env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_HMAC_SECRET`

---

### Task 4 — Chain validation test
Path: `core/packages/game-core/src/replay/__tests__/chain.test.ts`

Uses `InMemoryEventStore` (NODE_ENV=test). Writes 100 synthetic `MATCH_SCORE` events.
Assertions:
- `result.valid === true`
- `result.events_verified === 100`
- No `break_at_event_id`

Tamper detection test: mutate one event's payload after writing, re-run `verifyChain`,
assert `result.valid === false`.

---

### Task 5 — RTP harness test
Path: `core/packages/farkle-engine/src/__tests__/rtp.harness.test.ts`

Calls `runAllModeAudit(1000)`. For each of 8 `AuditHarnessResult` entries:
- `result.sessionsRun === 1000`
- `result.deviance` is finite
- `result.deviance < 0.05` (T4 gate; ±0.005 is AA+ criterion for later)

`monteCarlo.ts` and `rtpConfig.ts` are Sacred Core — READ ONLY.

---

### Task 6 — ADR-015
Path: `docs/adr/ADR-015-t4-ledger-replay.md`

Records schema decisions, FD/PDX separation proof, SupabaseEventStore design,
RTP harness results, L1-Supabase-empty resolution.

---

### Task 7 — Audit cells + close
Write handoff/01-06, `runs/2026-05-24/session-8.json`, append `sessions/session-log.md`.
Commit all artifacts, push, open PR.

---

## Sacred Core Constraints (Active This Session)

READ ONLY — never write:
- `core/packages/farkle-engine/src/monteCarlo.ts`
- `core/packages/farkle-engine/src/rtpConfig.ts`
- `core/packages/farkle-engine/src/farkleScorer.ts`
- `core/packages/farkle-engine/src/csprng.ts`
- `core/packages/farkle-engine/src/farkleStore.ts`
- `core/packages/farkle-engine/src/gameStore.ts`

---

## Pass Gate

- chain.test.ts: all assertions PASS
- rtp.harness.test.ts: all 8 modes produce results, deviance < 0.05
- No new T4-introduced type errors (pre-existing errors in game-core/farkle-engine tsconfigs and gameRoom.ts are not in T4 scope)
- SQL: no float/numeric/real column types, no FK between fd_ledger and pdx_ledger
- Regression: replay.test.ts 5/5, farkleScorer.test.ts 16/16, spawn.test.ts 3/3, inputQueue.test.ts 2/2

---

## Version

prompt-04-ledger-replay.md v1.0.0
Reconstructed: 2026-05-24
Session: tier/T4-ledger-replay-20260524
