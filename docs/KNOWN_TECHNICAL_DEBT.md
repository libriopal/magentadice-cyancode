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

---

## GAP-1b

**File:** `core/apps/server/src/gameRoom.ts` — `processChainFaces()` (`SUBMIT_CHAIN_FACES` handler)
**Issue:** The live multiplayer scoring path calls `scoreFarkle(faces)` directly on
client-asserted face values with no server-side cross-check against the server's own
authoritative grid (`this.state.grid`, populated by `createGrid()`). A modified or
malicious client can submit arbitrary `faces`/`chainColumns` (e.g. all 1s) every turn
and the server will score it as legitimate. The server's `Cell[][]` grid model and
`hasValidChain()` dead-board check exist but are not consulted by this scoring path —
discovered while investigating GAP-1 (Board State Authority); see
`gap1_board_authority.md` and `fix/gap1-board-seed-propagation` (FAR_NZY PR #4,
merged `c06e388`, 2026-06-22) for the narrower seed-propagation fix that shipped instead.
**Fix:** Not yet designed/authorized — three options proposed in
`docs/adr/ADR-023-gap1b-server-face-validation.md` (PROPOSED status): (1) server-side
RNG with client as pure renderer, (2) post-hoc statistical anomaly detection, (3)
bounded plausibility check at submission time. Options 1 and 3 require resolving the
structural mismatch between the server's static `Cell[][]` grid and the client's
continuous Rapier3D physics board (`VoxelPhysicsSystem`) — they are not the same
representation today (see GAP-1 investigation notes). No option is selected yet —
human decision required.
**ADR:** `docs/adr/ADR-023-gap1b-server-face-validation.md` (PROPOSED, not authorized)
**Priority:** HIGH — for a skill-based sweepstakes game, unaudited client-side RNG
feeding directly into the scoring path with no server validation is a compliance
exposure, arguably larger than the seed-divergence issue GAP-1 addressed.
**Sacred:** YES — `gameRoom.ts` is CORE SACRED; any fix requires its own ADR + explicit
human authorization before any code change.
**Resolve before:** Not blocking any current sprint; flagged for human prioritization.
**First flagged:** GAP-1 investigation (Plan agent finding), 2026-06-22, during
implementation of the GAP-1 board-seed-propagation fix.
