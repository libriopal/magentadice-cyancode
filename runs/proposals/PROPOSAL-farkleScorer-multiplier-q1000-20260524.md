# PROPOSAL: farkleScorer.ts — multiplier parameter → Q×1000 integer

**Status:** PROPOSED  
**Session:** tier/T1-mathematical-foundation-20260524  
**File:** `core/packages/farkle-engine/src/farkleScorer.ts` (Sacred Core — PROPOSE ONLY)  
**Severity:** SEVERITY-B (float adjacent to scoring path; output is integer via Math.round)  
**Requires:** Human approval before any edit to this file  

---

## Finding

`scoreFarkle(faces, multiplier)` — line 34, 49:

```ts
export function scoreFarkle(
  faces: DieFace[],
  multiplier: number = 1   // can receive 1.15, 2.5, 1.85 (float)
): FarkleResult {
  ...
  return {
    score,
    scaledScore: Math.round(score * multiplier),  // float multiplication
    ...
  };
}
```

`multiplier` is passed as a float by callers (Paladin facet = 1.15, Rogue = 2.5, Bard = 1.85).  
The intermediate `score * multiplier` is float arithmetic even though the output is rounded to integer.

## Severity Classification

**SEVERITY-B** — float multiplication in the Sacred Core scoring path. Output is integer (Math.round wraps), but the intermediate computation uses a float literal passed from outside.

This is NOT a legal violation in isolation — the result is integer. But it violates the T1 Mathematical Foundation invariant: **no float literals in scoring paths**. Callers pass 1.15 which is a float literal.

## Proposed Change

Change caller convention: pass `multiplierQ` (Q×1000 integer) instead of float `multiplier`.

```ts
// Proposed signature:
export function scoreFarkle(
  faces: DieFace[],
  multiplierQ: number = 1000   // Q×1000: 1000 = 1.0×, 1150 = 1.15×
): FarkleResult {
  ...
  return {
    score,
    scaledScore: Math.round(score * multiplierQ / 1000),  // no float literal
    ...
  };
}
```

Caller change (facets.ts or wherever multiplier is set):
```ts
// Before:
scoreFarkle(faces, 1.15)   // Paladin
scoreFarkle(faces, 2.5)    // Rogue

// After:
scoreFarkle(faces, 1150)   // Paladin  Q×1000
scoreFarkle(faces, 2500)   // Rogue    Q×1000
```

## Impact Assessment

- **farkleScorer.ts** — 2 lines changed (signature + scaledScore expression)
- **Callers of scoreFarkle** — all multiplier arguments converted to Q×1000 integers
- **FIXED_POINT_CHECK** — PASS after change (no float literals in scoring path)
- **Test coverage** — existing farkleScorer.test.ts covers scoreFarkle with multiplier=1 (default); tests for fractional multipliers would need to be added/updated
- **Sacred Core risk** — LOW: pure arithmetic refactor, behavior preserved (Math.round(score * 1150 / 1000) = Math.round(score * multiplierQ / 1000))

## Why PROPOSE Rather Than Fix

`farkleScorer.ts` is Sacred Core (`mesh/sacred-core-spec.md`). Any write without Human approval is an L3 violation. This proposal documents the finding and proposed fix for Human review.

## Current Risk Without Fix

SEVERITY-B. No legal violation (output is integer). The risk is float accumulation if callers ever compose multipliers (e.g., `1.15 * 1.85`). Current callers do not compose — multiplier is applied once per chain. Deferrable to T2 if Human prefers.

## Decision Required

- **Approve**: Human edits farkleScorer.ts per proposal above, OR Human authorizes Execution Runtime to make this specific edit.
- **Defer**: Document as L1 finding; address in T2 when facet system is implemented.
- **Reject**: Document rationale; mark FIXED_POINT_CHECK as SEVERITY-B-DEFERRED.
