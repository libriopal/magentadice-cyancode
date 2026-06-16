# Known Technical Debt

Items tracked here are accepted pre-existing patterns that do not constitute new violations
in the PR where they were first flagged. Each item requires human authorization before
resolution (all are in CORE SACRED files).

---

## DEBT-01

**File:** `core/apps/web/src/store/farkleStore.ts` line 28
**Issue:** `MULTIPLIER_LADDER` uses float representation `[1.0, 1.25, 1.5, 2.0, 3.0, 4.0]`
**Fix:** Convert to integer basis `[100, 125, 150, 200, 300, 400]` with `/100` at use site
**Priority:** MEDIUM — affects RTP audit clarity and Monte Carlo simulation integrity
**Sacred:** YES — requires human authorization
**Resolve before:** P3-RTP Monte Carlo implementation
**First flagged:** Bito pre-merge check `BITO_PRE_MERGE_9ef25cf.md` (P2.6 PR, 2026-05-31)

---

## DEBT-02

**File:** `core/apps/web/src/hooks/useFarkleGame.ts` line 305
**Issue:** Float intermediate arithmetic in orb bonus calculation (`0.5` multiplier)
**Fix:** Verify `Math.round()` guarantee holds in all code paths; document as intentional
**Priority:** LOW — `Math.round()` confirmed, integer output guaranteed
**Sacred:** YES — requires human authorization
**Resolve before:** P3-RTP Monte Carlo implementation
**First flagged:** Bito pre-merge check `BITO_PRE_MERGE_9ef25cf.md` (P2.6 PR, 2026-05-31)

---

## DEBT-03 — RESOLVED (P6-PLAYERMODEL-FIX, PR #30, 2026-06-16)

**File:** `core/packages/farkle-engine/src/monteCarlo.ts` line 126
**Issue:** `playerContinue` OPTIMAL condition `multiplierStep < 4 || unbanked < 4054` was
calibrated at `farkleRate≈0.37`. Current observed farkle rate is 0.9156 — 2.5× above the
design breakeven. OPTIMAL continues in ~99.7% of turns (step=0 in 99.3%), farkles almost
every turn. Result: OPTIMAL avgScore=272, WEAK avgScore=1,842 — a 6.8× inversion.
OPTIMAL is the worst-performing model, not the best.
**Resolution (ADR-022 Option A):** Swapped OPTIMAL and WEAK `playerContinue` case bodies.
OPTIMAL now uses stochastic aggressive logic (`rng() < 0.40 ? optimal : rng() < 0.30`); WEAK
uses deterministic conservative logic (`return optimal`). Threshold unchanged: `step < 3 && unbanked < 300`.
`simulateRallyVote`, `isOptimalDecision` (skillMetrics.ts), Gate 3 (validate-gates.ts and sandbox.ts),
and `calibrate-threshold.ts` all aligned to Option A behavior.
**100k audit (seed=42):** OPTIMAL=1995 > AVERAGE=1214 > WEAK=870 — all 6 gates PASS.
**Compliance artifact:** `core/art/profiling/rtp_audit_P6_42.json`
**Sacred:** Modified under ADR-022 + Human authorization (granted 2026-06-14).
