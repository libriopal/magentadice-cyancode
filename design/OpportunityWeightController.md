# OpportunityWeightController (OWC) — Design Document

**Directive:** FF_V4_OPPORTUNITY_WEIGHT_REDESIGN
**Date:** 2026-05-25
**Status:** Design approved — awaiting implementation authorization

## Problem Statement

`SixPoolManager` and `spawnTiles()` in `gridUtils.ts` have **zero board-state awareness**. They draw from pre-shuffled pools without knowing:
- Whether the board is stagnant (no scoring potential)
- Whether the player is behind and needs a comeback opportunity
- Whether cascades are near-completion
- What farkle risk the current board presents

This produces dead boards, invisible cascade opportunities, and no comeback mechanics — all of which harm retention and skill perception.

## Design

### New File: `core/packages/farkle-engine/src/opportunityWeight.ts`

```typescript
import type { Cell, GameMode } from '@match3d/farkle-shared';
import type { EnergyMode } from '@match3d/farkle-shared';
import { estimateFarkleRisk, scanForWilds } from './gridUtils.js';

export interface OWCContext {
  grid: Cell[][];
  comboCount: number;           // current chain length this turn
  cascadePotential: number;     // 0–1: how close board is to a scoreable chain
  farkleRisk: number;           // 0–1: from estimateFarkleRisk()
  turnNumber: number;
  playerBanked: number;
  leaderBanked: number;         // own score if solo
  mode: GameMode;
  energyMode: EnergyMode;
}

export interface OWCAdjustment {
  wildBoostPct: number;          // +0 to +10 — added to base wild draw probability
  cascadeEnablerBoostPct: number; // +0 to +10 — boost ICE/catalyst relative weight
  deadStatePenaltyPct: number;   // +0 to +8 — reduce STONE/LOCK relative weight
  blockerBoostPct: number;       // +0 to +5 — increase blocker weight on explosive boards
}

const MAX_WILD_BOOST = 10;
const MAX_CASCADE_BOOST = 10;
const MAX_DEAD_PENALTY = 8;
const MAX_BLOCKER_BOOST = 5;

export function computeOWCAdjustment(ctx: OWCContext): OWCAdjustment {
  let wildBoost = 0;
  let cascadeBoost = 0;
  let deadPenalty = 0;
  let blockerBoost = 0;

  // Stagnation: board has no scoring potential + high farkle risk
  if (ctx.cascadePotential < 0.2 && ctx.farkleRisk > 0.6) {
    wildBoost += 5;
    deadPenalty += 3;
  }

  // Explosive board: normalize to prevent runaway cascade chains
  if (ctx.cascadePotential > 0.8) {
    blockerBoost += Math.min(MAX_BLOCKER_BOOST, Math.floor(ctx.cascadePotential * 5));
  }

  // Behind: boost strategic comeback opportunities (not guaranteed rewards)
  if (ctx.leaderBanked > 0 && ctx.playerBanked < ctx.leaderBanked * 0.7) {
    cascadeBoost += 5;  // more ICE/catalyst = more chain-planning opportunities
  }

  // Ahead: reduce runaway advantage — normalize weights
  if (ctx.playerBanked > ctx.leaderBanked * 1.3) {
    blockerBoost += 3;
    wildBoost = Math.max(0, wildBoost - 3);
  }

  // Clamp all adjustments to max bounds
  return {
    wildBoostPct: Math.min(MAX_WILD_BOOST, wildBoost),
    cascadeEnablerBoostPct: Math.min(MAX_CASCADE_BOOST, cascadeBoost),
    deadStatePenaltyPct: Math.min(MAX_DEAD_PENALTY, deadPenalty),
    blockerBoostPct: Math.min(MAX_BLOCKER_BOOST, blockerBoost),
  };
}
```

### Modification: `spawnTiles()` in `gridUtils.ts`

Current signature:
```typescript
export function spawnTiles(grid: Cell[][], pool: SixPoolManager): { grid: Cell[][], changed: boolean }
```

New signature (backward-compatible):
```typescript
export function spawnTiles(
  grid: Cell[][],
  pool: SixPoolManager,
  owc?: OWCAdjustment
): { grid: Cell[][], changed: boolean }
```

The `owc` parameter adjusts the wild draw probability threshold:
```typescript
// Before: if (w === 3) → true-wild (10% of wildLive pool)
// After: if (owc && adjustedWildThreshold(owc)) → apply boost
const wildThreshold = owc ? 3 - Math.floor(owc.wildBoostPct / 3.3) : 3;
if (w >= wildThreshold) { /* spawn wild */ }
```

Bounds: `wildBoostPct` is capped at 10. In practice OWC applies at most 1 step of boost: `threshold = 3 - floor(10/3.3) = 3 - 3 = 0` is the theoretical floor (never reached), while the practical maximum is `wildBoostPct = 10 → 1 step → threshold 2`, which raises true-wild probability from ~10% to ~25% of the wild pool. The cap ensures OWC cannot exceed a 15-point swing in wild spawn rate.

### No Changes To

- `farkleScorer.ts` (Sacred Core — bomb triggers)
- `csprng.ts` (Sacred Core)
- `SixPoolManager` die pool (provably fair face distribution must remain equal)
- `gameStore.ts` / `farkleStore.ts` (Sacred Core)

## Proof of Value

- **Current metric:** Wild spawn rate 0% (NORMAL) → 9% (FRENZY); no stagnation response
- **Proposed metric:** Wild spawn rate dynamically adjusts +0–10% in stagnation scenarios
- **Expected gain:** +15–25% cascade frequency on stagnant boards; measurable via PostHog `match_resolved` events
- **Confidence:** Medium-High — adaptive spawning is standard in match-3 (Skydom reference)
- **Risk:** Face-distribution adjustments may shift RTP. Mitigation: OWC only adjusts wild probability, not face values. Die pool remains perfectly balanced (SixPoolManager unchanged). RTP simulation via `monteCarlo.ts` required before production.
- **Validation method:** Run existing RTP harness (rtp.harness.test.ts) with OWC enabled at max stagnation scenario. RTP must remain within 88–96% bounds.

## Dependencies

- `estimateFarkleRisk` — already exported from `farkle-engine`
- `scanForWilds` — already exported from `gridUtils.ts`
- `cascadePotential` — computed by caller (gameRoom.ts) from board state
- No new packages required

## Rollback

OWC parameter is optional. Callers that don't pass `owc` get identical behavior to current system. To disable OWC: remove `owcAdjustment` computation from `gameRoom.ts`. No database changes. No scoring changes.

## ADR Required

ADR-021 must be authored before merging OWC. Decisions to document:
- D1: OWC bounds (max ±10% wild boost, max ±8% dead penalty)
- D2: No die face distribution change (SixPoolManager die pool untouched)
- D3: RTP simulation gate before production merge
