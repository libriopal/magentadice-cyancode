# ADR-022 — P6-PLAYERMODEL-FIX: playerContinue OPTIMAL Recalibration

**Status:** PROPOSED — awaiting Human written approval before any implementation
**Date:** 2026-06-14
**Author:** Execution Runtime (Claude Sonnet 4.6)
**Human Authorization:** PENDING
**Sprint:** P6-PLAYERMODEL-FIX
**DEBT reference:** DEBT-03 (`docs/KNOWN_TECHNICAL_DEBT.md`)
**Sacred file:** `core/packages/farkle-engine/src/monteCarlo.ts` line 126

---

## Problem

`playerContinue` in `monteCarlo.ts:118–132` determines whether a player model
continues rolling (risks losing unbanked points) or banks (secures them). The
OPTIMAL model's decision condition is:

```typescript
// Breakeven at farkleRate≈0.37: continue when unbanked < ~4000 or step < 4
const optimal = multiplierStep < 4 || unbanked < 4054;
```

This was calibrated when `farkleRate ≈ 0.37`. The empirical farkle rate from
the P5 post-fix compliance audit (seed=42, 100k sessions) is **0.9156** — 2.5×
above the calibration point.

**Result of miscalibration:**
- `multiplierStep < 4` is true in ~99.7% of turns (step=0 in 99.3% of turns
  because farkles at 91.56% per turn reset step to 0 immediately)
- OPTIMAL therefore *always* continues, losing all unbanked on the next farkle
  91.56% of the time
- OPTIMAL avgScore = **272**, WEAK avgScore = **1,842** — a **6.8× inversion**
- OPTIMAL is the worst-performing player model; WEAK is the best
- This directly inverts the skill-game legal defence: a player making optimal
  decisions loses to a weak player, which undermines the sweepstakes classification

---

## EV Analysis — New Threshold Derivation

On any turn, the incremental expected value of continuing vs banking is:

```
ΔEV(continue) = P(survive) × E[rawScore × mult] − P(farkle) × unbanked
              = (1 − r) × E[S] − r × U
```

where `r = farkleRate`, `E[S] = expected scoring roll value × current multiplier`,
`U = current unbanked`.

**Breakeven** (ΔEV = 0): `U_break = ((1 − r) / r) × E[S]`

At r = 0.9156:
- `(1 − r) / r = 0.0844 / 0.9156 ≈ 0.0922`
- `U_break ≈ 0.0922 × E[S]`

| E[S] estimate | U_break |
|---------------|---------|
| 200 (conservative floor) | 18 pts |
| 350 (mid estimate) | 32 pts |
| 600 (high estimate) | 55 pts |

At the empirical farkle rate, the EV-breakeven unbanked amount is **18–55 points**
depending on assumed raw score distribution. The current threshold of 4,054 is
**74–225× above breakeven** — explaining the inversion.

**Old calibration check** (r = 0.37, E[S] ≈ 2,380):
`U_break = (0.63 / 0.37) × 2,380 = 1.703 × 2,380 ≈ 4,054` ✓ — consistent with
the original comment. The original E[S] estimate of ~2,380 suggests the simulation
ran a very different scoring distribution at the original calibration point.

---

## Proposed Change

**File:** `core/packages/farkle-engine/src/monteCarlo.ts`
**Line:** 126
**Type:** Sacred — `payout_math` category

```diff
-  // Optimal: continue when multiplier gain outweighs farkle risk
-  // Breakeven at farkleRate≈0.37: continue when unbanked < ~4000 or step < 4
-  const optimal = multiplierStep < 4 || unbanked < 4054;
+  // Recalibrated to empirical farkleRate=0.9156 (P5 audit, seed=42, 100k sessions).
+  // ΔEV(continue) = (1−r)×E[S] − r×U; breakeven U ≈ (0.0844/0.9156)×E[S] ≈ 0.092×E[S].
+  // Conservative threshold 300 ≈ 6-16× single-roll breakeven, allowing short chains
+  // while avoiding EV-negative multi-roll exposure. ADR-022, authorized YYYY-MM-DD.
+  const optimal = multiplierStep < 3 && unbanked < 300;
```

**Rationale for 300:**
- Minimum scoring roll in 6-die farkle = 50 pts (single 5); average ≈ 200–400 pts
- EV breakeven at r=0.9156 ≈ 18–37 pts for these scoring values
- 300 ≈ 8–16× breakeven → allows 2–3 roll chains before mandatory banking
- At step=0–2 with unbanked < 300, chaining has positive EV if next roll scores
- At step ≥ 3 (mult ≥ 2.0) or unbanked ≥ 300, risk/reward flips negative → bank

**Rationale for step < 3 (was step < 4):**
- Step 3 means current mult = 2.0 → next mult would be 3.0 (+50%)
- At 91.56% farkle rate the expected cost of one more roll is `0.9156 × unbanked`
- Even a 50% multiplier jump rarely justifies 91.56% loss probability on any
  meaningful unbanked stack
- Step < 3 allows chaining through ×1.0 → ×1.25 → ×1.5 before mandatory banking

**Effect on AVERAGE and WEAK models:**
Both models reference `optimal` with probabilistic noise layers:
- `AVERAGE`: continues `0.70 × optimal + 0.30 × 0.50` → banks more conservatively
- `WEAK`:    continues `0.40 × optimal + 0.60 × 0.30` → less affected (already noisier)

The recalibration should increase all three models' scores (all were inversely
calibrated). The ordering requirement `OPTIMAL > AVERAGE > WEAK` must hold
post-fix and is verified by the mandatory Monte Carlo pass.

---

## Acceptance Criteria (all must pass before commit)

1. **10,000-session Monte Carlo pass** at seed=42, stakeAmount=1, all modes:
   - OPTIMAL avgScore > WEAK avgScore (inversion resolved)
   - OPTIMAL avgScore > AVERAGE avgScore (correct ordering)
   - Gate 4 farkleRate remains 0.85–0.95 (farkle rate is a physics property, not a function of playerContinue — should be stable)
   - Gate 2 RTP remains 0.82–1.02
2. **100,000-session compliance audit** (mandatory, not just validation):
   - All 6 gates PASS
   - New compliance record committed to `core/art/profiling/`
3. **TypeScript type-check**: `cd core && pnpm type-check` — 0 errors
4. **Existing tests**: `cd core && pnpm test` — all pass, no regressions
5. **Bito review** of the sacred diff before commit (per `feedback_sacred_bito.md`)

---

## Threshold Adjustment Protocol

If the 10k pass shows `OPTIMAL avgScore < WEAK avgScore`, the threshold must be
adjusted before proceeding. Adjustment range to explore (each requires re-running
the MC pass, no Human re-approval needed for threshold tuning within this ADR):

| Attempt | Condition | Intent |
|---------|-----------|--------|
| 1 (proposed) | `step < 3 && unbanked < 300` | Conservative, likely correct |
| 2 (if 1 fails) | `step < 3 && unbanked < 150` | Tighter banking |
| 3 (if 2 fails) | `step < 2 && unbanked < 100` | Near-immediate banking |

If Attempt 3 still fails (OPTIMAL < WEAK), return to Human with findings — a deeper
model design issue exists beyond threshold tuning.

---

## Rollback

If the fix causes Gate 2 (RTP band) to fail or any test regression:
```bash
git -C core revert HEAD   # revert the sacred commit
cd core && pnpm type-check && pnpm test
```
The revert itself is not a sacred change (it restores a known-good state).

---

## What Is NOT Changing

- `AVERAGE` and `WEAK` model noise parameters (the `rng()` probabilities)
- `multiplierStep` advancement or reset logic
- `MULTIPLIER_LADDER` values
- `farkleScorer.ts`, `rtpConfig.ts`, `csprng.ts`, or any other sacred file
- Scoring arithmetic anywhere in the codebase

---

## References

- `docs/KNOWN_TECHNICAL_DEBT.md` DEBT-03
- `docs/adr/ADR-021-p5-governance-compliance.md` (Finding A diagnosis)
- `core/art/profiling/rtp_audit_20260614B_42.json` (baseline metrics)
- `mesh/sacred-core-spec.md` — payout_math authorization requirements
- `mesh/authority-model.md` — Sacred tier process
- `feedback_sacred_bito.md` — bito review gate for sacred diffs
