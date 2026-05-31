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
