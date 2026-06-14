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

## DEBT-03

**File:** `core/packages/farkle-engine/src/monteCarlo.ts` line 126
**Issue:** `playerContinue` OPTIMAL condition `multiplierStep < 4 || unbanked < 4054` was
calibrated at `farkleRate≈0.37`. Current observed farkle rate is 0.9156 — 2.5× above the
design breakeven. OPTIMAL continues in ~99.7% of turns (step=0 in 99.3%), farkles almost
every turn. Result: OPTIMAL avgScore=272, WEAK avgScore=1,842 — a 6.8× inversion.
OPTIMAL is the worst-performing model, not the best.
**Fix:** Recalibrate `playerContinue` thresholds using empirical farkle rate (0.9156).
Break-even is approximately `unbanked > 272 / (1 - 0.9156) ≈ 3,223` at step=0.
New condition likely: `multiplierStep < 2 && unbanked < 3500`.
Requires full Monte Carlo re-validation after change.
**Priority:** HIGH — directly inverts the skill-game legal defence (OPTIMAL player loses to WEAK player)
**Sacred:** YES — requires ADR-022 + Human written approval + 10k MC pass before implementation
**Resolve before:** P6-PLAYERMODEL-FIX sprint (planned next)
**First flagged:** Production-readiness assessment, P3-RTP-LIVE audit review 2026-06-14
