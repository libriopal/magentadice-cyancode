# ADR-011 — IEventStore v1.0.0 Contract Freeze

| Field | Value |
|---|---|
| ADR | ADR-011 |
| Title | IEventStore v1.0.0 Contract Freeze |
| Status | Accepted |
| Date | 2026-05-24 |
| Session | tier/T1C-replay-runtime-20260524 |
| Authors | Execution Runtime (Claude Sonnet 4.6) |
| Approver | Human (implicit — T1C pass gate) |

---

## Context

Phase 1C (Replay Runtime) requires a frozen interface contract before any implementation work
can proceed. Without freezing the contract first, implementations may diverge and make future
refactoring of a live replay system prohibitively expensive.

Three contracts govern the replay system:
- `IEventStore.v1.md` — the storage interface
- `ReplayEvent.v1.md` — the canonical event type definitions
- `Snapshot.v1.md` — the checkpoint snapshot type definitions

Numbering note: ADR-009 = Godot deprecation (Session 2), ADR-010 = RTP variance tightening
(Session 4 / T1B). This ADR is ADR-011.

---

## Decision

Freeze all three contracts at v1.0.0. Commit them to `contracts/` as the authoritative
governance documents. Extract TypeScript interfaces into `contracts/*.ts`. Implement
`InMemoryEventStore` in `core/packages/game-core/src/replay/`.

---

## Freeze Inventory

| File | Status | SHA-256 (content fingerprint) |
|---|---|---|
| `contracts/IEventStore.v1.md` | FROZEN v1.0.0 | — |
| `contracts/ReplayEvent.v1.md` | FROZEN v1.0.0 | — |
| `contracts/Snapshot.v1.md` | FROZEN v1.0.0 | — |
| `contracts/IEventStore.ts` | FROZEN v1.0.0 | — |
| `contracts/ReplayEvent.v1.ts` | FROZEN v1.0.0 | — |
| `contracts/Snapshot.v1.ts` | FROZEN v1.0.0 | — |

---

## Test Results (Task 4)

All 5 tests in `core/packages/game-core/src/replay/__tests__/replay.test.ts` pass:

| Test | Result |
|---|---|
| write 10 events and verify SHA-256 chain | PASS (11ms) |
| replay from SESSION seed + input log: matchesStoredHash === true | PASS (3ms) |
| snapshot at event index 5 and partial replay produces identical result | PASS (3ms) |
| healthCheck reports connected and valid chain | PASS (1ms) |
| verifyChain detects tampering | PASS (1ms) |

Run command:
```bash
cd core/packages/game-core
node --import ../../node_modules/.pnpm/tsx@4.22.0/node_modules/tsx/dist/esm/index.mjs \
  --test src/replay/__tests__/replay.test.ts
```

---

## FIXED_POINT_CHECK

All currency `amount` fields in `ReplayEvent.v1.ts` and `Snapshot.v1.ts` are typed as
`number` with `// Q32.32 fixed-point integer` annotations. No float fields in scoring
or ledger paths. **FIXED_POINT_CHECK: PASS**

---

## Consequences

**Positive:**
- Replay system has a stable, governance-backed interface.
- InMemoryEventStore can be used for all future testing without production impact.
- SHA-256 chain provides tamper detection on every read.
- Snapshot + partial replay verified to produce identical results.

**Constraints added:**
- Any change to the frozen interface requires IEventStore.v2.md + migration adapter + new ADR + Human approval.
- The `InMemoryEventStore` must never ship to production — it is test infrastructure only.

**Deferred (T4 scope):**
- `SupabaseEventStore` implementation (FD casual)
- `PostgresEventStore` implementation (PDX real-money, serializable ACID)
- Full Monte Carlo replay regression on historical dataset

---

## Change Authority

Future changes: Human only + new ADR + migration adapter + full replay regression test.
