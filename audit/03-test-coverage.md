# Audit 03 — Test Coverage

**Date:** 2026-05-25

## Current Test Suite

| Runner | File | Tests | Status |
|---|---|---|---|
| node:test via tsx | `packages/farkle-engine/src/farkleScorer.test.ts` | 16 | PASS |
| node:test via tsx | `packages/farkle-engine/src/__tests__/rtp.harness.test.ts` | 3 | PASS (run from packages/farkle-engine/) |
| node:test via tsx | `packages/game-core/src/**/*.test.ts` | 22 | PASS |
| **TOTAL** | | **41** | **PASS** |

## T9 Additions

| File | Tests | Purpose |
|---|---|---|
| `apps/server/src/__tests__/twoPlayer.determinism.test.ts` | 3 | CSPRNG determinism, scoreFarkle determinism, different-seed divergence |

## Coverage Gaps (ranked by risk)

| Gap | Risk | Recommended test |
|---|---|---|
| gameRoom.ts multi-player flow (addPlayer → handleBank → endSession) | High — core match flow untested end-to-end | Integration test with mock WebSocket |
| postHogTrack — verifies PostHog API called | Medium — fire-and-forget, hard to assert | Mock fetch + spy on postHogTrack |
| wallet transaction audit trail (insertWalletTransaction) | Medium — compliance write path | Supabase mock or real test DB |
| OpportunityWeightController (planned T10) | Low — not yet implemented | Unit tests for each adaptive scenario |

## Proof of Value

- **Current metric:** 41/41 tests (100% pass rate)
- **T9 target:** 44/44 (41 + 3 determinism tests)
- **Expected gain:** CI determinism gate closes sweepstakes compliance gap
- **Confidence:** High — CSPRNG is already proven deterministic by design
- **Risk:** New tests may fail if CSPRNG async behavior changes; would surface immediately
- **Validation method:** `cd core && pnpm test` + `node --import tsx/esm --test apps/server/src/__tests__/twoPlayer.determinism.test.ts`

```text
AUDIT::PATHWAY_DEPS: core/packages/farkle-engine/src/, core/apps/server/src/__tests__/
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: 3 new determinism tests; no production code changes
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE (test infrastructure only)
```
