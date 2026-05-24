<!--
AUDIT::PATHWAY_DEPS: core/supabase/migrations/002_event_store_ledger.sql,
  core/apps/server/src/SupabaseEventStore.ts,
  core/packages/game-core/src/replay/__tests__/chain.test.ts,
  core/packages/farkle-engine/src/__tests__/rtp.harness.test.ts
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: schema changes affect all event-sourced replay paths;
  HMAC secret rotation requires chain re-signing
AUDIT::FIXED_POINT_CHECK: PASS
-->

# ADR-015 — T4 Ledger & Replay: Schema, SupabaseEventStore, and RTP Harness

**Status:** Accepted
**Session:** tier/T4-ledger-replay-20260524
**Date:** 2026-05-24
**Author:** Execution Runtime
**Authority:** Execution Runtime (implementation) + Human (merge approval)

---

## Context

T4 scope: production persistence layer for FAR_NZY's provably-fair audit trail.

Three legal compliance obligations drive this ADR:

1. SHA-256 event chain — every `GameEvent` links to its predecessor via
   `sha256(JSON.stringify(prev_event))`. A chain break is tamper evidence.
2. FD/PDX ledger separation — Frenzy Diamonds and Prize Draw Entries must be
   in entirely separate Postgres tables with zero cross-table foreign keys.
3. RTP harness — `runAllModeAudit()` must execute and produce results for all
   8 game modes.

The `InMemoryEventStore` production guard (added in T2) throws unless
`NODE_ENV=test` or `TEST_RUNTIME=true`, pointing to `SupabaseEventStore` as
the T4 target (L1-Supabase-empty flag, raised in T1B). This ADR resolves that flag.

---

## Decisions

### D-1: Four new Supabase tables

**`game_events`** — append-only SHA-256 chain.
- `replay_tick: bigint` — Q-tick integer, never float
- `predecessor_hash: text` — `sha256:<hex64>` format or genesis sentinel
- `signature: text` — `hmac-sha256:<hex64>` for HMAC-SHA256 verification
- No DELETE or UPDATE policy. Append-only by RLS + policy design.
- INSERT restricted to service_role (no client-side writes).

**`event_snapshots`** — checkpoint chain linked to `game_events`.
- `event_id_at_snapshot: uuid` references `game_events(id) on delete restrict`
- `predecessor_snapshot_hash: text` — SHA-256 chaining of snapshots

**`fd_ledger`** — Frenzy Diamonds only.
- `delta: bigint`, `balance_after: bigint` — Q×1000 integers, no floats
- `balance_after >= 0` check constraint
- **No foreign key to `pdx_ledger`** — zero pointer sharing

**`pdx_ledger`** — Prize Draw Entries only.
- `delta: bigint`, `balance_after: bigint` — Q×1000 integers, no floats
- `balance_after >= 0` check constraint
- `attestation_verdict text not null` — application-level enforcement of
  `'MEETS_DEVICE_INTEGRITY'` for `PDX_AWARD` reason
- `pdx_ledger_award_attestation_check` constraint for belt-and-suspenders
- **No foreign key to `fd_ledger`** — zero pointer sharing

**FIXED_POINT_CHECK:** All amount columns are `bigint`. No `numeric`, `float4`,
`float8`, `real`, or `decimal` types present. Check: PASS.

---

### D-2: FD/PDX Zero-Pointer-Sharing Proof

```text
fd_ledger  references: auth.users(id), [no cross-ledger FKs]
pdx_ledger references: auth.users(id), [no cross-ledger FKs]
```

`fd_ledger` and `pdx_ledger` share only `auth.users(id)` as a common FK
target. Neither table has a foreign key referencing the other. This satisfies
the regulatory requirement that FD (in-game) and PDX (real-money equivalent)
ledgers have zero pointer sharing.

---

### D-3: SupabaseEventStore design

**Env vars required:**
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — server-side service role JWT
- `SUPABASE_HMAC_SECRET` — HMAC-SHA256 signing secret (never client-exposed)

**Chain algorithm** (per `hashing-strategy.md`):
```typescript
predecessorHash = 'sha256:' + sha256Hex(JSON.stringify(prevEvent));
```
The full serialized `prevEvent` object (including its own predecessor_hash and
signature) is hashed. This matches `InMemoryEventStore` and the DELTA-VERIFY spec.

**HMAC signature:**
```typescript
signature = 'hmac-sha256:' + hmacSha256Hex(JSON.stringify(partial), HMAC_SECRET);
```
Signing happens over the partial event (before signature field is set),
consistent with `InMemoryEventStore`.

**Ordering:** All chain and read/replay operations use `replay_tick ASC, id ASC`
as the canonical ordering. `replay_tick ASC` aligns with the IEventStore
`replay()` contract (events applied in tick order). `id ASC` is the
deterministic tiebreaker when two events share the same tick (e.g., concurrent
cascade events). `created_at` is stored as metadata only and must not be used
for ordering — wall-clock skew between inserts would produce non-deterministic
replay if used as the sort key.

**Type declarations:** Types from `contracts/IEventStore.v1.md` and
`contracts/ReplayEvent.v1.md` are declared inline in `SupabaseEventStore.ts`
because `contracts/` is outside the server's TypeScript `rootDir`. These
declarations must not diverge from the frozen contracts without an ADR and
schema version bump.

---

### D-4: Chain validation test — 100 events + tamper detection

Test file: `core/packages/game-core/src/replay/__tests__/chain.test.ts`

Uses `InMemoryEventStore` (NODE_ENV=test) for the chain validation pass gate.

**Test 1:** Write 100 synthetic `MATCH_SCORE` events, call `verifyChain()`:
- `result.valid === true` ✓
- `result.events_verified === 100` ✓
- No `break_at_event_id` ✓

**Test 2:** Tamper detection — mutate `events[4].payload` after writing,
call `verifyChain()`:
- `result.valid === false` ✓
- `result.break_at_event_id` set ✓
- `result.break_reason === 'predecessor_hash mismatch'` ✓

Results: **2/2 PASS**

---

### D-5: RTP harness results

Test file: `core/packages/farkle-engine/src/__tests__/rtp.harness.test.ts`

Calls `runAllModeAudit(1000)` (Sacred Core — read-only). Results at 1000 sessions:

| Mode         | Target RTP | Realized RTP | Deviance | Status |
|---|---|---|---|---|
| SOLO_FREE    | 0.9200 | 0.9558 | 0.0358 | Within T4 gate |
| SOLO_CASINO  | 0.9200 | 0.9558 | 0.0358 | Within T4 gate |
| VS_FREE      | 1.0000 | 1.0358 | 0.0358 | Within T4 gate |
| VS_CASINO    | 0.9200 | 0.9558 | 0.0358 | Within T4 gate |
| RALLY_FREE   | 0.9200 | 1.0358 | 0.1158 | Within T4 gate |
| RALLY_CASINO | 0.9200 | 0.9558 | 0.0358 | Within T4 gate |
| HEIST_FREE   | 0.9200 | 1.0358 | 0.1158 | Within T4 gate |
| HEIST_CASINO | 0.9200 | 0.9558 | 0.0358 | Within T4 gate |

**T4 gate:** deviance < 0.20 (harness runs and produces finite results).
**All 8 modes: PASS.**

**Note on RALLY_FREE / HEIST_FREE deviance (0.1158):** `monteCarlo.ts` is
Sacred Core and read-only. The higher deviance in FREE variants of multi-player
modes is a characteristic of the current Monte Carlo implementation's
cooperative/vault payout formulas at 1000-session sample size. The AA+ criterion
of ±0.005 requires larger sample sizes and potential Sacred Core calibration —
deferred to a later tier under ADR gate authority.

---

## Resolution of L1-Supabase-empty Flag

The L1 flag raised in session T1B ("SupabaseEventStore referenced but not
implemented") is resolved:
- Migration `002_event_store_ledger.sql` creates the required tables
- `SupabaseEventStore.ts` implements all `IEventStore` v1.0.0 methods
- Production guard in `InMemoryEventStore` now has a concrete target

---

## Test Results Summary

| Test | Result |
|---|---|
| chain.test.ts (2 tests) | 2/2 PASS |
| rtp.harness.test.ts (3 tests) | 3/3 PASS |
| replay.test.ts | 5/5 PASS (regression) |
| farkleScorer.test.ts | 16/16 PASS (regression) |
| spawn.test.ts | 3/3 PASS (regression) |
| inputQueue.test.ts | 2/2 PASS (regression) |

**Total new tests:** 5 | **Total regressions verified:** 26

---

## Version

ADR-015 v1.0.0
Session: tier/T4-ledger-replay-20260524
Change authority: Human (merge approval)
