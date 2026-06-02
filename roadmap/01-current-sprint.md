# Roadmap 01 — Current Sprint: Dead-State Recovery

**Date:** 2026-05-30 | **Branch:** `fix/dead-state-recovery`

---

## P0 — Dead-State Recovery Scope Definition

**Status:** COMPLETE (see `docs/DEAD_STATE_FINDINGS.md` and `docs/DEAD_STATE_IMPLEMENTATION_PLAN.md`)

**Scope Files:**
- `core/apps/web/src/hooks/useFarkleGame.ts` (SACRED)
- `core/apps/server/src/gameRoom.ts` (SACRED)
- `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts`
- `core/packages/farkle-engine/src/gridUtils.ts` (SACRED)

**Acceptance Criteria:**
- `DEAD_STATE_FINDINGS.md` documents all bugs with file:line references
- `DEAD_STATE_IMPLEMENTATION_PLAN.md` specifies every file to be changed, risk level, and rollback plan
- Human has reviewed and approved the plan before any code changes

**Verification Command:**
```bash
cat docs/DEAD_STATE_FINDINGS.md && cat docs/DEAD_STATE_IMPLEMENTATION_PLAN.md
```

---

## P1 — Client Dead Board Recovery Validation

**Status:** COMPLETE (cb293bb)

**Scope Files:**
- `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts` — fix `isDeadBoard()` adjacency check and `reshuffleBoard()` validation loop
- `core/apps/web/src/hooks/useFarkleGame.ts` (SACRED) — replace forced face=1 injection with CSPRNG-safe recovery

**Acceptance Criteria:**
- `isDeadBoard()` returns true only when no physically-adjacent scoreable chain exists
- `reshuffleBoard()` verifies the resulting board has at least one valid chain (or retries up to N times)
- Forced face=1 injection is removed or gated behind a CSPRNG-based face selection
- No `Math.random()` introduced; all randomness uses `faceRng` (seeded)
- `pnpm type-check` passes (0 errors)
- `pnpm test` passes (all tests green)

**Verification Command:**
```bash
cd core && pnpm type-check && pnpm test
```

---

## P1 — Server Dead Board Recovery Validation

**Status:** COMPLETE (cb293bb)

**Scope Files:**
- `core/apps/server/src/gameRoom.ts` (SACRED) — add dead-board detection after farkle and chain commit

**Acceptance Criteria:**
- After every `processChain()` farkle result, server calls `hasValidChain()` on the current grid
- If no valid chain exists, server reshuffles (using `SixPoolManager.reshuffle()`) and broadcasts `BOARD_UPDATE`
- Recovery is capped at 3 attempts; if still dead after 3, server broadcasts `BOARD_DEAD_RECOVERY_FAILED` and ends the game
- No floating-point scoring introduced during recovery
- Integration test covers: farkle on dead board → reshuffle → valid board

**Verification Command:**
```bash
cd core && pnpm --filter @match3d/server test
```

---

## P2 — OWC Opportunity Weighting

**Status:** COMPLETE

**Scope Files:** TBD after dead-state recovery is merged

**Acceptance Criteria:** TBD

**Verification Command:** TBD

---

## P2 — Play Store Release Readiness

**Status:** COMPLETE

**Scope Files:**
- `core/DEPLOY.md`
- `core/capacitor.config.ts`
- `core/apps/web/` build output

**Acceptance Criteria:**
- `pnpm android:debug` builds successfully
- APK passes internal test on device
- No P0/P1 open bugs

**Verification Command:**
```bash
cd core && pnpm android:debug
```

---

## P2.5 — Multiplayer Authority Consolidation

**Status:** COMPLETE (f7bfcd8)

**Scope Files:**
- `core/apps/server/src/gameRoom.ts` (SACRED) — added `processChainFaces()`, `SUBMIT_CHAIN_FACES` handler, `COLLECT_ORB` handler, `CLAIM_VAULT` handler, `DOUBLER_SPAWNED` broadcast
- `core/apps/web/src/store/farkleStore.ts` (SACRED) — added `syncFromServer` action
- `core/apps/web/src/hooks/useFarkleGame.ts` (SACRED) — `submitChainFaces`, `collectOrb`, all bonus paths `!isMultiplayer`-gated
- `core/apps/web/src/store/multiplayerStore.ts` — wired `CHAIN_RESULT→syncFromServer`, `DOUBLER_SPAWNED`, `ORB_COLLECTED`

**Verification:** BITO_P2_5 confidence 80 — SAFE ✅

---

## Casino UI — Post-Launch Gate

**Status:** INTENTIONALLY DEFERRED — not in scope for this PR

SOLO_CASINO, VS_CASINO, RALLY_CASINO, HEIST_CASINO are handled server-side (`gameRoom.ts` `endSession()` / `checkMilestones()`) but have no UI entry points. Casino mode selection UI is a post-launch feature pending legal/compliance sign-off for each jurisdiction. Do not expose in HomeScreen or MultiplayerLobby until explicitly authorized.

---

## P2.6 — Server-Side Bonus Validation

**Status:** IN PROGRESS

**Scope Files:**
- `core/apps/server/src/gameRoom.ts` (SACRED) — surface `orbBonus`, `doublerBonus`, `archivistBonus` in `CHAIN_RESULT` broadcast
- `core/apps/web/src/store/farkleStore.ts` (SACRED) — extend `syncFromServer` signature with optional bonus params
- `core/apps/web/src/store/multiplayerStore.ts` — pass bonus fields from `CHAIN_RESULT` to `syncFromServer` ✅ DONE

**Authorization:** BITO_P2_6 confidence 95 — SAFE ✅ Authorized 2026-05-31

**Verification Command:**
```bash
cd core && pnpm type-check && pnpm test
```

---

---

## P3 — RTP Monte Carlo Simulation (Full Compliance Audit)

**Status:** PLANNED
**Branch:** `feature/p3-rtp-monte-carlo`
**Plan:** `docs/P3_RTP_MONTE_CARLO_PLAN.md`
**Prerequisite:** P2.6 complete

**Scope Files:**
- `core/packages/farkle-engine/src/monteCarlo.ts` (CORE SACRED — human authorization required)
- `core/packages/farkle-engine/src/rtpConfig.ts` (CORE SACRED — human authorization required)
- `core/packages/farkle-shared/src/types.ts` (CORE SACRED — RTPConfig interface extension)
- `core/apps/server/src/sandbox.ts` (SURFACE — new /rtp-audit, /role-audit endpoints)

**Acceptance Criteria:**
- `MonteCarloResultV2` models all return paths: base scoring, multiplier ladder, orb, doubler, ARCHIVIST, RAINMAKER, HEADHUNTER, CONDUCTOR, bombs, milestones
- All randomness traces to `seededRng()` — no `Math.random()`
- Three player models (OPTIMAL / AVERAGE / WEAK) run per mode
- 100,000 sessions per run; RTP stabilises within ±0.5% between 50k and 100k
- All six validation gates pass (convergence, RTP band, skill delta ≥5%, bonus limits, reproducibility, role balance)
- Results saved to `core/art/profiling/rtp_audit_<date>_<seed>.json`
- Bito review ≥80 confidence before any sacred file write

**Runtime evidence resolved (see §7 of plan):**
1. RAINMAKER bomb is global (not radius-limited) — destroys ALL matching-face tiles board-wide
2. Rainbow bomb target is a random draw from distinct faces present (not most common, not player choice)
3. `GameRoomState.banked` is a shared room-level pool in RALLY; milestones are team milestones; payout = `stakeAmount × tier.multiplier` per event
4. Stone HP discrepancy: server uses HP=2 (`GAME_CONSTANTS`); simulation must use HP=2

**Verification Command:**
```bash
cd core && pnpm type-check && pnpm test
# Then run: ./scripts/sandbox-cli.sh audit 42
```

---

---

## P3-RTP-SANDBOX — RTP Calibration Dashboard (KendoReact UI)

**Status:** ✓ COMPLETE — feature/p3-rtp-sandbox-ui pushed, PR pending
**Branch:** `feature/p3-rtp-sandbox-ui`
**Note:** Deferred from live use until Batch A (monteCarlo V2) + OWC complete

**What is complete:**
- Full 7-panel KendoReact UI (`sandbox-ui/` — standalone Vite app, separate from `core/`)
- WebSocket server with `sessionStore` (undo/redo/checkpoint, 50-entry cap)
- AI advisor: Kendo AI primary, Claude sonnet-4 fallback, keys server-side only
- Legal compliance panel: RTP band gauge per mode, skill gap indicator, gate strip
- Coverage panel: live checklist from `monteCarlo.COVERAGE_CHECKLIST.md`
- `sandbox-cli.sh`: headless CLI for Claude Code calibration work
- HTTP endpoints: `POST /simulate-v2`, `POST /rtp-audit`, `POST /role-audit`, `GET /coverage-status`

**Sacred files touched:** NONE

---

## P3-RTP-LIVE — Live RTP Calibration (Post Batch A)

**Status:** DEFERRED — awaiting Batch A (monteCarlo V2)
**Prerequisite:** Batch A `monteCarlo.ts` sacred file authorization

**Action when ready:**
```bash
./scripts/sandbox-cli.sh audit
# Verify all 6 gates pass in sandbox UI
# Adjust rtpConfig.ts per AI advisor recommendations
# Re-run until Gate 2 (RTP band) and Gate 3 (skill gap) PASS
# Generate rtp_audit_<date>_<seed>.json for compliance record
```

---

## P4-OWC-SANDBOX-INTEGRATION — Opportunity Engine Sandbox Wiring

**Status:** DEFERRED — awaiting P4 Opportunity Engine implementation
**Prerequisite:** OWC (OpportunityWeightController) implemented

**Action when ready:**
- Add OWC weight parameters to `SimConfig` in `sandbox.ts` types
- Add OWC sliders to `ParameterEditorPanel` (new generator prompt)
- Add OWC contribution row to `RTPBreakdownPanel` mechanic list
- Add OWC return paths to `monteCarlo.COVERAGE_CHECKLIST.md`
- Wire OWC simulation into monteCarlo V2 Batch A
- Run: `./scripts/sandbox-cli.sh owc-param-list` to verify
- Re-run full Gate A–D validation with OWC active

**Note:** Sandbox designed with OWC in mind. No rework required — additive changes only.
AI advisor and legal gauges apply to OWC-adjusted RTP automatically.

---

<!-- SUPERSEDED -->
<!-- The following was the T9 sprint (branch: tier/T9-social-platform-liveops-20260525). -->
<!-- T9 is complete and merged via PR #19. Preserved here for historical reference. -->

## [SUPERSEDED] T9 Completion Sequence

1. `pnpm type-check` in core/ — verify 0 new errors from classArchetype import
2. `pnpm test` + `node --import tsx/esm --test twoPlayer.determinism.test.ts` — must pass (44/44)
3. Commit core submodule: `tier(T9): social-platform-liveops — postHogTrack, classArchetype, MATCH_SCORE fix, determinism test`
4. Write `docs/adr/ADR-020-t9-social-platform-liveops.md`
5. Run 6 audit cells → `runs/2026-05-25/session-13.json`
6. Append Session 13 to `sessions/session-log.md`
7. Update `handoff/01–05` for T9
8. Commit integration repo artifacts (audit/, design/, roadmap/, tests/ included)
9. Push → `gh pr create` → PR #19

**Success Criteria:** All T9 pass gates green. PR #19 opened. EXECUTE.md decision tree reaches HALT state.
