# Tests 01 — Test Inventory

**Date:** 2026-05-25

## Current Suite (post-T8)

| Package | File | Count | Runner |
|---|---|---|---|
| farkle-engine | `farkleScorer.test.ts` | 16 | node:test + tsx |
| farkle-engine | `__tests__/rtp.harness.test.ts` | 3 | node:test + tsx (run from packages/farkle-engine/) |
| game-core | `src/**/*.test.ts` | 22 | node:test + tsx |
| **Total** | | **41** | |

## T9 Additions

| Package | File | Count | Purpose |
|---|---|---|---|
| server | `apps/server/src/__tests__/twoPlayer.determinism.test.ts` | 3 | CSPRNG determinism, scoreFarkle determinism, seed divergence |
| **New total** | | **44** | |

## Coverage Gaps (priority order)

| Gap | Priority | Recommended test |
|---|---|---|
| gameRoom.ts multi-player flow | High | Mock WebSocket; addPlayer × 2 → handleBank → endSession |
| postHogTrack called on MATCH events | Medium | Mock fetch; spy on postHogTrack in gameRoom tests |
| insertWalletTransaction compliance | Medium | Supabase test project or mock client |
| OpportunityWeightController (planned) | Medium | Unit: stagnation → wildBoost > 0; ahead → blockerBoost > 0 |
| HollaEx webhook verification | High | Mock webhook payload; verify signature check |

## Test Run Commands

```bash
# Full suite (from core/)
cd core && pnpm test

# RTP harness only
cd core/packages/farkle-engine && node --import tsx/esm --test src/__tests__/rtp.harness.test.ts

# T9 determinism test
cd core && node --import tsx/esm --test apps/server/src/__tests__/twoPlayer.determinism.test.ts

# OWC unit tests (when implemented)
cd core && node --import tsx/esm --test packages/farkle-engine/src/__tests__/opportunityWeight.test.ts
```
