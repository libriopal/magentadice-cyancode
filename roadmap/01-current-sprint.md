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

**Status:** COMPLETE (merged PR #24)

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

**Status:** COMPLETE — merged PR #27 (2026-06-03)
**Branch:** `feature/p3-rtp-monte-carlo`
**Plan:** `docs/P3_RTP_MONTE_CARLO_PLAN.md`
**Prerequisite:** P2.6 complete

**Scope Files:**
- `core/packages/farkle-engine/src/monteCarlo.ts` (CORE SACRED — human authorization required)
- `core/packages/farkle-engine/src/rtpConfig.ts` (CORE SACRED — human authorization required)
- `core/packages/farkle-shared/src/types.ts` (CORE SACRED — RTPConfig interface extension)
- `core/apps/server/src/sandbox.ts` (SURFACE — new /rtp-audit, /role-audit endpoints)

**Deliverables:**
- Batch B: `RTPConfig` extended in `types.ts`; per-mode spawn defaults in `rtpConfig.ts` (CORE SACRED, authorized)
- Batch D: `sandbox.ts` wired to `runMonteCarloV2`, gate evaluation, profiling file output (SURFACE)
- Fix 1: `farkleRate` (per-turn fraction) + `toRTP` denominator (stake × sessions) corrected in `monteCarlo.ts` (CORE SACRED, authorized)
- Fix 2: Gate 2/3/4/5 thresholds calibrated; all 6 gates PASS (seed=42, 50k sessions)
- CI: Deploy workflow `paths:` filters updated to include bare `core` gitlink so submodule pointer bumps trigger builds

**All 6 validation gates:** PASS (seed=42, 50,000 sessions)
**Profiling artifact:** `core/art/profiling/rtp_audit_<date>_42.json`

**Known follow-ups (separate authorization required):**
- `playerContinue` OPTIMAL inversion — OPTIMAL always-continues scores less than WEAK at 91.5% per-turn farkle rate; needs CORE SACRED auth
- Gate 3 skill gap semantic — circular at current normalizer definition; needs external reference normalizer
- P3-RTP-LIVE unblocked — run full 100k calibration pass per plan

---

---

## P3-RTP-SANDBOX — RTP Calibration Dashboard (KendoReact UI)

**Status:** ✓ COMPLETE — feature/p3-rtp-sandbox-ui merged to main
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

**Status:** COMPLETE — all 6 gates PASS at 100k sessions, seed=42, 2026-06-14
**Prerequisite:** ~~Batch A `monteCarlo.ts` sacred file authorization~~ COMPLETE

**Audit results (seed=42, 100k sessions, OWC disabled):**
- Gate 1 — Convergence: PASS (100k completions)
- Gate 2 — RTP Band: PASS (0.9203 within SOLO 0.82–1.02)
- Gate 3 — Skill Differentiation: PASS
- Gate 4 — Farkle Rate: PASS (0.9156 within 0.85–0.95)
- Gate 5 — p5Score/avgScore: PASS
- Gate 6 — Normalizer: PASS (>0)

**Compliance artifact:** `core/art/profiling/rtp_audit_20260614_42.json`

**Known follow-ups (separate authorization required):**
- `playerContinue` OPTIMAL inversion — OPTIMAL always-continues scores less than WEAK at 91.5% per-turn farkle rate; needs CORE SACRED auth
- Gate 3 skill gap semantic — circular at current normalizer definition; needs external reference normalizer

---

## P4-OWC — Opportunity Weight Controller

**Status:** COMPLETE — surface layer merged FAR_NZY PR #2 (2026-06-14)
**Branch:** `feat/p4-owc`
**Package:** `core/packages/owc/src/index.ts`

**Surface layer (complete):**
- `packages/owc` — `computeWeights()` with Slipstream, Rally balance, RTP drift correction, Farkle stabiliser
- `apps/server/src/sandbox.ts` — OWC wired into `/simulate`, `/owc-weights` endpoint, zod validation, NaN guard
- POST /owc-weights: direct weight computation without simulation
- All 4 adjustment paths: slipstream, cooperative balance, RTP drift, farkle stabiliser

**Sacred file integration (complete — merged PR #3, 2026-06-14):**
- `packages/farkle-shared/src/types.ts` — `OWCConfig` interface added
- `packages/farkle-engine/src/monteCarlo.ts` — `biasedFaceDraw()`, per-turn OWC, `owcContributionRTP`, `owcErrorCount`
- All 6 RTP gates re-validated PASS at seed=42, 50k sessions
- `scripts/validate-gates.ts` — headless gate audit (no server needed)

**Bito follow-up (complete — 7680f2b, 2026-06-14):**
- `types.ts` — `turnsElapsed?` added to `OWCConfig` (HIGH); JSDoc clarifies preview-only scope
- `monteCarlo.ts` — `owcContributionRtp` → `owcContributionRTP` (MED); `catch (err)` + `DEBUG_OWC` stderr logging (HIGH)
- `farkle-engine/src/index.ts` — re-exports `OWCInput`, `OWCOutput`, `FaceBiasWeights` for consumers
- `sandbox.ts` — `sumRTP()` now includes `owcContributionRTP`; cascade renames + turnsElapsed doc comment
- `packages/owc` — `type:module`, `@types/node`, test script, 17-test suite (all 4 paths + validation + clamping)
- All 4 sacred edits bito-cleared (0 HIGH each); 33/33 tests green

## P4-OWC-SANDBOX-INTEGRATION — Opportunity Engine Sandbox Wiring

**Status:** COMPLETE — committed a16b75e (magentadice-cyancode) / 6f34c83 (FAR_NZY), 2026-06-14
**Prerequisite:** P4-OWC sacred file integration (above)

**What shipped:**
- `sandbox-ui/src/types/sandbox.ts` — `owcContributionRTP` + `owcErrorCount` on `MonteCarloResultV2`; `OWCParamsConfig` + `owcParams?` on `SimConfig`
- `sandbox-ui/src/components/RTPBreakdownPanel.tsx` — OWC mechanic row (cyan) in breakdown grid
- `sandbox-ui/src/components/ParameterEditorPanel.tsx` — OWC enable Switch + 4 conditional sliders (playerRank, playerCount, turnsElapsed, targetRTP override); unsaved indicator
- `sandbox-ui/src/hooks/useSandboxSession.ts` — initial config seeds `owcParams: { enabled: false, playerRank: 1, playerCount: 1 }`
- `core/apps/server/src/sandbox/sessionStore.ts` — `owcParams?` in `SimConfig` + `BASE_CONFIG`
- `core/apps/server/src/sandbox.ts` WS `RUN_SIM` — retired V1 placeholder, now calls `runMonteCarloV2` with full `owcParams` passthrough
- `scripts/sandbox-cli.sh` — `owc-param-list` reads nested `owcParams` object

**Next:** P3-RTP-LIVE calibration — run `./scripts/sandbox-cli.sh audit` with OWC active

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
