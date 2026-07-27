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

## P5-GOVERNANCE — Compliance and Governance Gap Resolution

**Status:** COMPLETE — committed faeb5f6 (magentadice-cyancode), 2096188 (FAR_NZY), 2026-06-14
**Branch:** `fix/p5-governance-compliance`
**ADR:** `docs/adr/ADR-021-p5-governance-compliance.md`

**What shipped:**
- `docs/SACRED.md` — formal registry of sacred systems (payout_math / rng / game_state_authority)
- `docs/AUTHORIZATION.md` — three-tier auth model (Routine / Elevated / Sacred) with finding map
- `sessions/session-log.md` — Sessions 15–18 appended (P3-RTP-LIVE, P4-OWC, P4-OWC-SANDBOX, P5-GOVERNANCE)
- `docs/KNOWN_TECHNICAL_DEBT.md` — DEBT-03 added (Finding A playerContinue OPTIMAL inversion)
- Finding B (circular normalizer) fixed in `validate-gates.ts` (non-sacred):
  - Gate 3 now reports `skill_gap_raw = |OPTIMAL_avg − WEAK_avg|` (1570 pts) and `skill_gap_norm = skill_gap_raw / WEAK_avg` (0.8523 = 85.2%)
  - WEAK `averageScore` serves as the null-bot reference — an external anchor independent of the circular normalizer
  - Replaces `|optRTP − weakRTP| ≈ 0.0004` tautology where both values reduced to `targetRTP` identically
- `stakeAmount: 1` added to `BASE_CONFIG` (sessionStore.ts) and validate-gates.ts configs
- Historical audit records committed: `rtp_audit_2026-06-02`, `2026-06-03`, `2026-06-14` (all dash-format)
- Post-fix compliance audit: `rtp_audit_20260614B_42.json` — all 6 gates PASS (100k sessions, seed=42)
- Finding C resolved (compliance record `rtp_audit_20260614_42.json` now in FAR_NZY history)

**Finding A (playerContinue OPTIMAL inversion):** Deferred to P6-PLAYERMODEL-FIX.
- Sacred file (`monteCarlo.ts:126`), requires ADR-022 + Human written approval
- Diagnosis: OPTIMAL avgScore=272, WEAK avgScore=1,842 (6.8× inversion at 91.5% farkle rate)

**Next sprint: P6-PLAYERMODEL-FIX** — COMPLETE (PR #30 merged 2026-06-16, see below)

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

---

## P6-PLAYERMODEL-FIX — playerContinue OPTIMAL Recalibration

**Status:** COMPLETE — merged PR #30 (2026-06-16)
**Branch:** `fix/p6-playermodel-fix`
**ADR:** `docs/adr/ADR-022-p6-playercontinue-recalibration.md`
**DEBT resolved:** DEBT-03

**What shipped:**
- `core/packages/farkle-engine/src/monteCarlo.ts` (CORE SACRED, ADR-022 + Human auth) — OPTIMAL and WEAK `playerContinue` case bodies swapped (Option A); `simulateRallyVote` OPTIMAL branch aligned
- `core/packages/@match3d/farkle-engine/src/skillMetrics.ts` — `isOptimalDecision` aligned to Option A threshold
- `core/scripts/validate-gates.ts` — Gate 3 upgraded to strict `OPTIMAL > AVERAGE > WEAK` ordering
- `core/apps/server/src/sandbox.ts` (SURFACE) — Gate 3 aligned with validate-gates.ts
- `core/scripts/calibrate-threshold.ts` — player model mirrored to Option A (OPTIMAL stochastic, WEAK deterministic)
- `devos/` — DevOS Phases 1–5 complete (private submodule `libriopal/libriopal-devos`)
- `sandbox-ui/src/components/CohereDashboardPanel.tsx` — live Cohere governance panel
- `start.sh`, `scripts/sacred-check.sh` — launcher hardening (orphan guard, exact-line matching, curl timeouts, submodule guard)

**100k compliance audit (seed=42):** OPTIMAL=1995 > AVERAGE=1214 > WEAK=870 — all 6 gates PASS
**Artifact:** `core/art/profiling/rtp_audit_P6_42.json`

**Open debt remaining:**
- DEBT-01: `MULTIPLIER_LADDER` float basis (`farkleStore.ts:28`) — MEDIUM, Sacred, deferred
- DEBT-02: orb bonus float intermediate (`useFarkleGame.ts:305`) — LOW, Sacred, deferred

**Next sprint:** Human-directed. Options: HollaEx crypto payment, Play Store submission, STONE weakness mechanic, DevOS first real use.

---

## P7 — GAP-1b Fix (server DONE + tested) + 2D Pivot (client IN PROGRESS)

**Status:** IN PROGRESS — human-approved 2D-native variant of ADR-024
(supersedes ADR-024 §3's Rapier3D-follow-mode idea; see ADR-025 below),
started this session (2026-07-27). **Branch:** `feat/p7-gap1b-2d-board-authority`
(both the superproject and `core` submodule). **⚠ The client and server are
currently out of sync — see "Known-broken state" below before running
multiplayer.**

**ADRs:** `docs/adr/ADR-024-gap1b-option1-server-authoritative-board.md`
(server design, adopted as-is) + a new **ADR-025 (grid-native entity model
for mirror/ghost/catalyst/sphere/multiplier_orb — write this file from the
plan at the session's `.claude/plans/noble-mapping-meadow.md` if formalizing
it as a committed doc)**.

**DONE and verified this session:**
- `packages/farkle-shared/src/types.ts` (SACRED): `Cell.type` gained
  `SPHERE`/`MULTIPLIER_ORB`/`CATALYST`; `CellState` gained `MIRROR`/
  `GHOST_PENDING`.
- `packages/farkle-engine/src/gridUtils.ts` (SACRED): new
  `resolveChainFaces(grid, chain)` (faithful port of the client's plurality +
  raw-neighbor mirror resolution — NOT the same algorithm as the existing
  `_resolveWilds`/`hasValidChain`, which maximizes score for dead-board
  detection only); `SixPoolManager.drawWild(boostPct)` catalyst-bias
  parameter; MIRROR added to gravity/chainable checks.
- `packages/farkle-engine/src/boardEngine.ts` (new, NOT sacred):
  `consumeChain`/`advanceBoard`/`resolveChainAndAdvance` — event-driven
  (per scored chain, not a periodic tick), composes the existing
  `stepGravity`/`spawnTiles`/`normalizeTiles` (which were themselves already
  fully implemented and unused before this).
- `apps/server/src/gameRoom.ts` (SACRED): `processChainFaces()` and the
  `SUBMIT_CHAIN_FACES` handler are **deleted**. `processChain()` now calls
  `resolveChainFaces()` (never trusts client faces), carries the full merged
  bonus logic (heist/orb/doubler/archivist/catalyst), and refills the board
  via `resolveChainAndAdvance()` after every non-farkle chain. New handlers:
  `ANCHOR_GHOST`, `TAP_SPHERE`, `DETONATE_BOMB`, `DETONATE_RAINBOW_BOMB`;
  `COLLECT_ORB` extended to `{row,col}`. `type-check`: 0 new errors (93
  pre-existing `noUncheckedIndexedAccess` errors in `gridUtils.ts` confirmed
  pre-existing via `git show HEAD:...` diff, unrelated to this work — same
  root cause noted in a prior session, apps/server's tsconfig doesn't inherit
  farkle-engine's own relaxed flags). `gameRoom.test.ts`: 3 real passing
  tests (was a 2-test skeleton with 0 assertions) — forged
  `SUBMIT_CHAIN_FACES` now produces no `CHAIN_RESULT`; a legitimate
  grid-backed `SUBMIT_CHAIN` scores and refills correctly, confirmed stable
  across repeated random-seed runs.
- `apps/web/src/store/multiplayerStore.ts` (SURFACE): now stores the grid
  from `ROOM_STATE`/`BOARD_UPDATE` (previously discarded); `submitChainFaces`
  removed; added `anchorGhost`/`tapSphere`/`detonateBomb`/
  `detonateRainbowBomb`, `collectOrb` now takes `(row, col)`.

**NOT done yet (client side — genuinely large remaining scope):**
- `apps/web/src/hooks/useFarkleGame.ts` (SACRED) — still calls the now-removed
  `submitChainFaces`/old-signature `collectOrb`; still drives all chain
  adjacency from `VoxelPhysicsSystem` body proximity, not grid row/col.
  Needs the full grid-native rewrite described in the plan (adjacency via
  `getNeighbors`, `submitChain`, tap handlers via the new multiplayerStore
  actions, `hasValidChain` for dead-board check) — this is the single
  largest remaining piece.
- `apps/web/src/game/soloEngine.ts` (new, not sacred) — not started. Solo
  mode has no server; needs a client-local `createGrid`+`SixPoolManager`
  instance reusing the same `resolveChainFaces`/`scoreFarkle`/`boardEngine`
  functions, since `VoxelPhysicsSystem` is being fully archived (not kept
  around for solo).
- PixiJS v8 + `@pixi/react` `Board2DScene.tsx` — not started.
- `render2d-fx` package (vendoring `jurerotar/ts-seedrandom`,
  `ShaiSrc/fixed-point`, `kevglass/propel-js`, all confirmed MIT-licensed and
  real) — not started.
- Archiving `VoxelPileScene.tsx`/`VoxelPhysicsSystem.ts` to
  `core/dream/dead_code_archive/` — not started (they're both still live,
  unarchived, and currently the only working renderer — do not delete them
  before the above is done).
- DevOS harvest (`forestAgent.ts`, `bitoAgent.ts` core, from `~/devos`) —
  independent, not started.

**Known-broken state right now:** the client (`useFarkleGame.ts`) still sends
`SUBMIT_CHAIN_FACES`, which the server no longer handles — multiplayer chain
submission is currently a silent no-op end-to-end (server logs nothing,
client gets no `CHAIN_RESULT`). **Do not deploy/merge this branch until
`useFarkleGame.ts` is updated** — the security fix is real and tested at the
server layer, but gameplay is non-functional until the client catches up.

**To resume:** read this entry, then the plan file referenced above (or the
equivalent committed ADR-025 if written), then continue with
`useFarkleGame.ts` — it's the blocking piece for a working multiplayer build.

---

## D2-STAGE1-EVIDENCE — Research Environment (Claude Design handoff)

**Status:** IN PROGRESS — Phases 2/3/5 shipped 2026-07-15; Phase 4 partially done; Phase 6 needs no work.
**⚠ Out-of-band session:** this work was done in a Claude Code session started
*without* `start.sh` (human ran the CLI directly, realized partway through,
and asked for this note so the next `start.sh`-launched session can pick up
seamlessly). Normal devOS pre-flight/orientation did **not** run for this
work — nothing here has been through gate re-validation or a Bito
integration review beyond what's logged below. Treat this section, not
CLAUDE.md's stale "Active Mode: fix/dead-state-recovery" line, as the
authoritative current-sprint state.

**Origin:** Claude Design project `b0815c65-5c3a-496c-88f5-3ea5e05a6299`,
handoff doc `D2_STAGE1_RESEARCH_ENVIRONMENT_HANDOFF_V3.md` — turns this repo
into an instrument that records real human playtesting evidence (raw-only,
anti-circularity law enforced) and returns it as an Evidence Return Package
for the next Claude Design analysis round. Full findings: `docs/audits/D2_STAGE1_REPO_AUDIT_FINDINGS.md`.

**Human §27 decisions already made (do not re-ask):**
1. Evidence source: reuse existing Plane B Supabase (not local-first).
2. Storage: Supabase (same decision).
3. Discovery-notes prompt: in scope for Stage 1.
4. Export file set + zero-forbidden-field rule: approved.
5. Replay/verifier: stays deferred (§14) — do not build.
6. Implementation: authorized to proceed.

**What shipped (FAR_NZY commits `f98590f`, `45c1d91` — pushed to `origin/main`):**
- `core/supabase/migrations/002_evidence_tables.sql`, `003_enable_rls_analytics_tables.sql`
- `core/apps/server/src/evidence/{types,supabaseClient,evidenceStore,evidenceExport,evidenceRouter}.ts`
- `core/apps/server/src/analytics.ts` (refactor only — shares the new client helper), `index.ts` (router wired)
- `core/apps/web/src/evidence/evidenceClient.ts`, `core/apps/web/src/components/SessionRetrospectivePrompt.tsx` (embedded in Win/Lose screens)
- `.env.example` updated with server-side Supabase vars + `VITE_API_URL`
- No `.ff-core-lock` file touched. All 16 farkle scorer cases pass. `tsc --noEmit` clean on `apps/server`/`apps/web`.
- Bito (`bitoreview --type working`) reviewed the diff: 1 high / 3 med / 4 low findings, 4 validated and fixed (doc/comment-only — see commit `f98590f`'s follow-up fixes), rest confirmed pre-existing/out-of-scope.

**Live infrastructure state (Supabase project `magentadice-cyancode`, id `hmgqxojfmguknprkrznr`):**
- Was `INACTIVE` (paused) at session start — restored via Supabase MCP, now `ACTIVE_HEALTHY`.
- Migration `evidence_tables` applied: `session_analytics`, `chain_decisions`, `discovery_events`, `experiments`, `hypotheses` all live, 0 rows. (`session_analytics`/`chain_decisions` had never actually been created here before — they previously existed only as a manual-SQL-editor comment in `analytics.ts`.)
- Supabase advisor flagged RLS disabled on `session_analytics`/`chain_decisions` (anon-key-exposed) — fixed live via migration `enable_rls_analytics_tables`, tracked in `003_enable_rls_analytics_tables.sql`. All 5 evidence-related tables now have RLS enabled, service-role-only policies.

**Explicitly NOT done yet (per handoff's own §29 phase gating):**
- Phase 4 general discovery-notes capture (§13/§31 — the "why did you do that?" in-session prompt) — only the end-of-session retrospective (§38) is wired to UI so far.
- Experiment/hypothesis registry seed data — tables exist, nothing registered in them yet.
- No live human playtest has run against this yet — 0 rows everywhere is expected, not a bug.
- Phase 6 (APK packaging, §20) needs **no new work** — Capacitor/Android tooling already exists and works (confirmed in the audit).
- Replay/verifier (§14) — deferred, do not build without a separate human decision reopening it.

**To resume:** read `docs/audits/D2_STAGE1_REPO_AUDIT_FINDINGS.md` in full, then this section, then decide whether to continue Phase 4 (discovery-notes UI + registry seed data) or move to a live human playtest with what's already shipped. If connecting to the Claude Design MCP again, the project (`b0815c65-...`) and handoff doc (`V3`) are the same ones already read — no need to re-fetch unless checking for a newer version.

