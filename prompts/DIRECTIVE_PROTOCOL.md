# CLAUDE CODE DIRECTIVE PROTOCOL
## REPOSITORY TRUTH RESET + CLEANUP + WORKFLOW REALIGNMENT
### Project: FAR_NZY + AGROS / magentadice-cyancode
### Mode: Audit → Cleanup → Workflow Realignment → Human Approval
### Status: READ-ONLY AUDIT FIRST → CLEANUP PLAN → APPROVAL GATE → EXECUTE
### Modification Authority: AUDIT PHASE — DISABLED / CLEANUP PHASE — SCOPED
### Evidence Policy: CHEAPEST PATH FIRST — STOP AT 90% CONFIDENCE
### Sacred File Authority: core/.ff-core-lock — SINGLE SOURCE OF TRUTH
### Generated: 2026-05-30

---

# SECTION 0 — KNOWN CONTRADICTIONS (PRE-CONFIRMED)

The following contradictions are already proven before audit begins.
Do not re-derive them. Treat as resolved baseline.

## CONTRADICTION-01 — Sacred File Paths in CLAUDE.md

  DOC CLAIM:     CLAUDE.md listed sacred files as:
                   packages/farkle-engine/src/farkleStore.ts
                   packages/farkle-engine/src/gameStore.ts
  RUNTIME TRUTH: Files confirmed at:
                   core/apps/web/src/store/farkleStore.ts
                   core/apps/web/src/store/gameStore.ts
  STATUS:        CLAUDE.md updated — sacred file authority
                 delegated to core/.ff-core-lock
  SEVERITY:      HIGH (resolved)

## CONTRADICTION-02 — CLAUDE.md Sacred File List vs Lock File

  DOC CLAIM:     CLAUDE.md maintained its own sacred file list
  RUNTIME TRUTH: core/.ff-core-lock is the authoritative registry
                 containing 16 CORE SACRED + 24 SURFACE files
  STATUS:        CLAUDE.md now defers to lock file
  SEVERITY:      HIGH (resolved)

## KNOWN STALE CONTENT IN CLAUDE.md

  Line referencing old sacred paths still present as of last read.
  Cleanup phase must remove stale sacred file list from CLAUDE.md
  and replace with single pointer to core/.ff-core-lock.

---

# SECTION 1 — RUNTIME-VERIFIED BASELINE

Do not re-derive these facts. They are confirmed by direct inspection.

## Confirmed Repository Structure

  magentadice-cyancode/          ← repo root
  ├── core/                      ← FAR_NZY submodule
  │   └── @ heads/fix/dead-state-recovery
  │       remote: github.com/libriopal/FAR_NZY.git
  ├── dream/                     ← AGROS submodule
  │   └── @ heads/main
  │       remote: github.com/libriopal/adabt-core.git
  ├── data/                      ← image corpus (~1550 assets)
  ├── 3libras/                   ← visual design law (non-code)
  ├── scenes/                    ← Godot 4.3 project
  ├── prompts/                   ← prompt files (non-executable)
  ├── core/art/manifest/         ← scaffold confirmed present
  ├── core/art/profiling/        ← scaffold confirmed present
  ├── CLAUDE.md                  ← repo guidance (has stale content)
  ├── SCAFFOLD.md                ← pipeline reference
  ├── manifest.sh                ← pipeline script
  ├── visual_manifest_schema.json ← 669 lines, confirmed present
  ├── visual_manifest.json       ← NOT YET GENERATED
  └── .gitmodules                ← core + dream submodule config

## Confirmed FAR_NZY Package Inventory (core/packages/)

  farkle-engine/    — chainIndex, farkleScorer, csprng, gridUtils,
                      floodFill, monteCarlo, rtpConfig, skillMetrics,
                      web, avatar, index (11 files confirmed)
  farkle-shared/    — types.ts, index.ts (2 files confirmed)
  game-core/        — Three.js + Rapier3D wrappers
  ads/              — present on disk, runtime status UNKNOWN
  ai-quests/        — present on disk, runtime status UNKNOWN
  analytics/        — present on disk, runtime status UNKNOWN
  backend-client/   — present on disk, runtime status UNKNOWN
  blockchain/       — present on disk, runtime status UNKNOWN
  compliance/       — present on disk, runtime status UNKNOWN
  economy/          — present on disk, runtime status UNKNOWN

## Confirmed App Structure

  core/apps/web/    — React 18 PWA (Vite)
  core/apps/server/ — Express + WebSocket multiplayer

## Confirmed Sacred File Authority

  SINGLE SOURCE OF TRUTH: core/.ff-core-lock

  CORE SACRED (stop and get human approval before touching):
    packages/farkle-shared/src/types.ts
    packages/farkle-shared/src/index.ts
    packages/farkle-engine/src/chainIndex.ts
    packages/farkle-engine/src/farkleScorer.ts
    packages/farkle-engine/src/farkleScorer.test.ts
    packages/farkle-engine/src/csprng.ts
    packages/farkle-engine/src/gridUtils.ts
    packages/farkle-engine/src/floodFill.ts
    packages/farkle-engine/src/monteCarlo.ts
    packages/farkle-engine/src/rtpConfig.ts
    packages/farkle-engine/src/index.ts
    packages/farkle-engine/src/web.ts
    apps/web/src/store/farkleStore.ts
    apps/web/src/store/gameStore.ts
    apps/web/src/hooks/useFarkleGame.ts
    apps/server/src/gameRoom.ts

  SURFACE (safe to modify visually and structurally):
    apps/web/src/components/GameScreen.tsx
    apps/web/src/components/FarkleHUD.tsx
    apps/web/src/components/HUD.tsx
    apps/web/src/components/HomeScreen.tsx
    apps/web/src/components/MultiplayerLobby.tsx
    apps/web/src/components/WinLoseScreen.tsx
    apps/web/src/components/EstateScreen.tsx
    apps/web/src/components/ShopScreen.tsx
    apps/web/src/components/AgeGate.tsx
    apps/web/src/components/SocialScreen.tsx
    apps/web/src/components/EventBanner.tsx
    apps/web/src/components/QuestPanel.tsx
    apps/web/src/game/VoxelPileScene.tsx
    apps/web/src/styles/bio-architect.css
    apps/web/src/styles/tokens.ts
    apps/web/src/styles/variants.ts
    apps/web/src/App.tsx
    apps/web/src/main.tsx
    apps/web/src/data/levels.ts
    apps/web/src/store/multiplayerStore.ts
    apps/web/src/hooks/useMultiplayer.ts
    apps/web/src/hooks/useEconomy.ts
    apps/web/src/hooks/useLiveEvents.ts
    apps/web/src/hooks/useQuests.ts
    apps/server/src/index.ts
    apps/server/src/sandbox.ts

## Confirmed AGROS Invariants (LAW — do not audit, do not propose changing)

  - All randomness: seeded DeterministicPRNG — never Math.random()
  - 8 canonical emotional states — fixed
  - Tier 0 DSP latency ceiling: 12ms — enforced by CI
  - SharedArrayBuffer requires COOP/COEP headers
  - Frontend → IndexedDB; Backend → SQLite — do not conflate

## Confirmed Governance Files

  core/.ff-core-lock                     ← sacred file registry (AUTHORITY)
  dream/constitution/operational-law.md  ← AGROS constitutional law
  dream/shared/project-memory.md         ← CI-enforced memory ledger
  dream/viktor.md                        ← CI-enforced memory ledger
  dream/coderabbit.md                    ← CI-enforced memory ledger

## Confirmed Pipeline Status (manifest.sh status = 10/13)

  PASSING:  git root, core/, dream/, data/, art/manifest/, art/profiling/,
            schema placed, diecode.md, visual_overhaul.md, validator(python)
  FAILING:  design_tokens.json, performance_budget.md
  WARNING:  visual_manifest.json not yet generated (expected)

---

# PRIMARY DIRECTIVE

RUNTIME CODE IS TRUTH.

You are operating from a clean state. No previous reports, scores,
roadmaps, or completion claims carry forward.

The confirmed facts in Section 1 are the only pre-authorized baseline.
Everything else requires runtime evidence collected under the
Evidence Collection Policy below.

You are prohibited from:
  - treating disk presence as runtime existence
  - assuming any of the 7 unclassified packages have active consumers
  - assuming production readiness for any system
  - assuming authority ownership beyond what call graphs confirm
  - assuming telemetry, scanner, OWC, ranked, or RTP validity
  - speculating below 70% confidence

This directive has TWO phases that require separate human approvals:

  PHASE GROUP A — AUDIT (read-only, no changes)
  PHASE GROUP B — CLEANUP + WORKFLOW REALIGNMENT (scoped changes only)

Do not begin Phase Group B until Phase Group A is approved.

---

# EVIDENCE COLLECTION POLICY

## Core Rule

Use the cheapest evidence path first.
Stop when confidence reaches 90% for the system under review.

## Priority Order

  1. core/.ff-core-lock          cheapest: confirms sacred status instantly
  2. Runtime imports             confirm module boundary exists
  3. Call graphs                 confirm active call sites
  4. Active execution paths      hot path only — not test-only
  5. Referenced functions        stub vs real implementation
  6. Runtime consumers           no consumer = Dead System candidate
  7. Documentation               lowest trust — never sole evidence

## Hard Constraints

  DO NOT recursively inspect files unrelated to the system.
  STOP at 90% confidence.
  Report UNKNOWN when evidence is ambiguous after steps 1–6.

## Confidence Scale

  ≥90%     Stop. Report classification.
  70–89%   Report + note uncertainty.
  <70%     Report UNKNOWN. Do not speculate.

---

# RUNTIME REACHABILITY RULE

A system is classified EXISTS only when ALL THREE are confirmed:

  1. Runtime implementation exists (not stub, not empty export)
  2. Runtime execution path is active (hot path, not test-only)
  3. At least one runtime consumer exists

Otherwise:
  PARTIAL        — implementation present, path or consumer missing
  UNUSED         — implementation exists, no active consumer
  DOCUMENTED ONLY — in docs only, no runtime evidence
  MISSING        — no implementation found
  UNKNOWN        — evidence exhausted below 70% confidence

Existence and production readiness are ALWAYS scored independently.

---

# UNKNOWN RULE

Below 70% confidence:
  DO NOT infer. DO NOT estimate. DO NOT extrapolate.
  Classify: UNKNOWN
  List exactly what evidence is needed to resolve.

---

# LEVERAGE SCORING FORMULA

  Leverage =
    (Dependency chains unlocked)
    + (Production risk removed if completed)
    + (Other systems enabled)
    - (Complexity: XS=1  S=2  M=3  L=4  XL=5)

  CRITICAL ≥8 / HIGH 5–7 / MEDIUM 2–4 / LOW ≤1

Always show the calculation.

---

# DEPENDENCY GATE RULE

Before any roadmap or cleanup phase, show:

  BLOCKED BY:   runtime-confirmed prerequisites
  UNLOCKS:      systems enabled after this phase
  REQUIRES:     confirmed files, contracts, interfaces

Phases for UNKNOWN systems go to DEFERRED.

---

═══════════════════════════════════════════════
# PHASE GROUP A — AUDIT
# Mode: READ-ONLY. Zero file changes.
═══════════════════════════════════════════════

---

# A1 — FARKLE-ENGINE PACKAGE TRUTH

Classify each confirmed file by Runtime Reachability Rule.
Read core/.ff-core-lock first — cheapest evidence path.

Files: chainIndex.ts / csprng.ts / farkleScorer.ts / floodFill.ts /
       gridUtils.ts / index.ts / monteCarlo.ts / rtpConfig.ts /
       skillMetrics.ts / web.ts / avatar.ts

For each:

## farkle-engine Truth Table
| File | Status | Prod Ready | Consumer | Evidence Path | Confidence | Lock Status |

---

# A2 — UNCLASSIFIED PACKAGE TRUTH

7 packages confirmed on disk. All currently UNKNOWN.
Apply Evidence Collection Policy. Stop at 90% per package.

Packages: ads / ai-quests / analytics / backend-client /
          blockchain / compliance / economy

For each:

## Unclassified Package Truth Table
| Package | Status | Prod Ready | Consumer | Evidence Path | Confidence |

---

# A3 — CORE APP TRUTH

Classify runtime systems in apps/web and apps/server.
Check lock status against core/.ff-core-lock for each file touched.

## apps/web systems to classify:
  Board rendering      (VoxelPileScene.tsx — SURFACE)
  Chain consumer       (useFarkleGame.ts — CORE SACRED)
  Scoring consumer     (farkleStore.ts — CORE SACRED)
  Multiplayer consumer (useMultiplayer.ts — SURFACE)
  Economy consumer     (useEconomy.ts — SURFACE)
  LiveEvents consumer  (useLiveEvents.ts — SURFACE)
  Quests consumer      (useQuests.ts — SURFACE)

## apps/server systems to classify:
  WebSocket authority  (gameRoom.ts — CORE SACRED)
  Server entry         (index.ts — SURFACE)
  Sandbox              (sandbox.ts — SURFACE)

## Core App Truth Table
| System | Status | Prod Ready | Evidence Path | Confidence | Lock Status |

---

# A4 — AGROS RUNTIME TRUTH

Classify each system. Confirm AGROS invariants are not violated.

Systems:
  ERK pipeline (game state → emotional inference)
  8-state emotional model (wired to output?)
  DeterministicPRNG (no Math.random() in hot path?)
  DSP AudioWorklet WASM (active or stubbed?)
  IndexedDB persistence (active consumer?)
  SQLite WAL backend (active writes?)
  Redis/BullMQ workers (present / degraded / absent?)
  evolutionEngine.ts   demandEngine.ts   reinforcementEngine.ts
  STRUTHIO-SEC integrity mesh (active or stub?)
  Memory ledger CI (enforced on every PR?)

## AGROS Runtime Truth Table
| System | Status | Prod Ready | Evidence Path | Confidence |

---

# A5 — OPPORTUNITY ENGINE TRUTH

Validate existence of:
  Opportunity Density     Opportunity Visibility
  Opportunity Chains      Opportunity Ranking
  Opportunity Telemetry   Opportunity Snapshots
  Mastery Metrics         Fairness Metrics

Report UNKNOWN if confidence <70% after steps 1–6.

---

# A6 — AUTHORITY AUDIT

Determine actual runtime ownership of:
  Board state / CSPRNG / Grid refill / Scoring /
  Economy / Multiplayer WS / Telemetry

For each:
  Actual Owner          (confirmed by call graph)
  Intended Owner        (from docs — lowest trust)
  Production-Safe Owner (runtime evidence only)
  Lock Status           (from core/.ff-core-lock)

Flag: Actual ≠ Production-Safe = AUTHORITY CONFLICT
Flag: Authority owner is CORE SACRED = SACRED AUTHORITY RISK

---

# A7 — SCANNER AUDIT

Does a true Opportunity Scanner exist with all six capabilities:
  Chain enumeration / Opportunity ranking / Opportunity density /
  Snapshot generation / Best chain selection / Telemetry hooks

Classify: EXISTS / PARTIAL / MISSING
Do not classify EXISTS unless all six confirmed by
import + call graph + active execution path.

---

# A8 — OWC AUDIT

Does OWC exist in runtime?
Cheapest path: import → execution path → telemetry → RTP path
Sub-components below 70%: report UNKNOWN.
No import found: MISSING. Do not speculate.

---

# A9 — PRODUCTION READINESS AUDIT

FAR_NZY: Authority / Scanner / Telemetry / RTP / Economy / Multiplayer
AGROS:   ERK pipeline / DSP / Constitutional compliance / Memory ledger CI

For each:
  Readiness %       (runtime evidence only)
  Blockers          (confirmed)
  Dependencies      (confirmed by call graph)
  Sacred File Risk  (does path touch .ff-core-lock entries?)
  Evidence Path / Confidence

---

# A10 — DEVELOPMENT SCORE RESET

Scoring caps:
  Documentation-only:  ≤20
  UNKNOWN systems:     ≤10
  UNUSED systems:      ≤30
  Disk-present only:   ≤15

FAR_NZY:
  Core Loop / Authority Integrity / Production Readiness /
  Opportunity Engine / Multiplayer / Economy / RTP /
  Telemetry / Sacred File Safety

AGROS:
  ERK Pipeline / DSP Runtime / Constitutional Compliance /
  Memory Ledger / Backend Engines

Overall Monorepo Maturity: 0–100

Every score: evidence path shown / blockers listed / confidence %.

---

# A11 — COMPLETENESS MATRIX

FAR_NZY: Gameplay / Authority / Multiplayer / Economy / Telemetry /
         Opportunity Engine / RTP / Analytics / LiveOps / Ranked /
         OWC / Scanner / Infrastructure / Sacred File Isolation

AGROS: ERK Pipeline / DSP / Constitutional Compliance / Persistence /
       Backend Engines / Memory Ledger CI / STRUTHIO-SEC

For each: | Complete | Partial | Missing | Unknown |

Formula: (Complete×1.0 + Partial×0.5) / Total × 100
UNKNOWN counts as Missing.

Output: FAR_NZY % / AGROS % / Monorepo %

---

# A12 — CONTRADICTION ENGINE

Rules:
  - Confirmed contradictions only — need runtime evidence
  - Absence of evidence = UNKNOWN GAP (separate section)
  - Pre-confirmed contradictions (Section 0) already resolved —
    do not re-report them

Format:
  DOC CLAIM / RUNTIME TRUTH / EVIDENCE PATH /
  CONFIDENCE / SEVERITY / IMPACT

Separate section: ## UNKNOWN GAPS

---

# A13 — DEPENDENCY GRAPH

From runtime evidence only.

Classify:
  Foundational Systems   Leverage Systems     Dead Systems
  Assumed Systems        Sacred File Nodes    Critical Path

Apply Leverage Formula to all confirmed systems.

Output:
  Dependency Tree (ASCII)
  Dependency Chain (ordered by confirmed blocking)
  Critical Path (FAR_NZY / AGROS separate)
  Sacred File Risk Map
  Deferred Nodes (UNKNOWN — not in graph)

---

═══════════════════════════════════════════════
# PHASE GROUP A — AUDIT COMPLETE
# OUTPUT: Full audit report
# STOP HERE. AWAIT HUMAN APPROVAL BEFORE GROUP B.
═══════════════════════════════════════════════

---

## ── APPROVAL GATE A ──────────────────────────────
## AUDIT COMPLETE. HUMAN APPROVAL REQUIRED.
##
## Review the audit output above.
## Authorize Phase Group B to proceed.
## No cleanup or file changes occur until you approve.
## ────────────────────────────────────────────────

---

═══════════════════════════════════════════════
# PHASE GROUP B — CLEANUP + WORKFLOW REALIGNMENT
# Mode: SCOPED changes only.
#       Every change is planned first, shown to human,
#       then executed only on explicit approval.
# Sacred files: NEVER touched in this phase group.
═══════════════════════════════════════════════

---

# B1 — CLEANUP PLAN (PLAN ONLY — NO CHANGES YET)

Generate a complete cleanup plan before touching anything.

## B1.1 — CLAUDE.md Cleanup

Current issues confirmed:
  - Stale sacred file paths (old hardcoded list)
  - Sacred file authority not clearly delegated to lock file
  - Workflow section may reference old governance paths

Plan:
  Remove stale sacred file list
  Add single pointer: "Sacred files: read core/.ff-core-lock"
  Verify default workflow section matches B2 workflow standard
  Preserve all architecture documentation (do not remove)
  Preserve all command references
  Preserve all submodule documentation

Show exact diff plan before executing.
Do not execute until human approves this diff.

## B1.2 — Stale Documentation Scan

Scan these files for stale references:
  SCAFFOLD.md / CLAUDE.md / prompts/ directory

Classify each stale item:
  REMOVE    — wrong, no longer valid
  UPDATE    — correct the reference
  PRESERVE  — still accurate

Show full inventory before any change.

## B1.3 — Dead File Identification

Identify files in repo root that are:
  - No longer referenced by manifest.sh or any active pipeline
  - Superseded by newer equivalents
  - Orphaned from deleted workflows

Classify each:
  SAFE TO REMOVE / NEEDS REVIEW / KEEP

Do not remove anything. Plan only.

## B1.4 — Source of Truth Alignment Check

Verify the following sources of truth are consistent
and not contradicting each other:

  core/.ff-core-lock          ← sacred file authority
  CLAUDE.md                   ← repo guidance
  SCAFFOLD.md                 ← pipeline reference
  dream/constitution/         ← AGROS law
  3libras/the_visual_layer.md ← visual design law
  core/FARKLEFRENZY.md        ← gameplay authority
  core/FARKLE_FRENZY_DESCRIPTION.xml ← game spec

For each pair that contradicts: flag as ALIGNMENT CONFLICT.
Report UNKNOWN if a file cannot be read.

---

# B2 — DEFAULT WORKFLOW REALIGNMENT

The default workflow for active development must be:

  STEP 1: Read roadmap/01-current-sprint.md
          (current sprint context — what is being built now)

  STEP 2: Check core/.ff-core-lock
          (before touching ANY file — confirm lock status)

  STEP 3: Confirm source of truth for the work area:
          - Gameplay changes  → core/FARKLEFRENZY.md
          - Visual changes    → 3libras/the_visual_layer.md
          - Audio changes     → dream/constitution/operational-law.md
          - Sacred file work  → STOP. Get human approval first.

  STEP 4: Implement and test

  STEP 5: Run ./manifest.sh status before committing

This workflow must be reflected in CLAUDE.md after cleanup.

Generate the exact CLAUDE.md section text for human review
before writing it.

---

# B3 — CLEANUP EXECUTION (AFTER APPROVAL ONLY)

After human approves the cleanup plan from B1 and B2:

Execute in this exact order:

  1. Update CLAUDE.md
     - Remove stale sacred file list
     - Add lock file pointer
     - Add B2 default workflow section
     - Preserve all other content

  2. Fix any ALIGNMENT CONFLICTS identified in B1.4
     (plan each fix separately, show diff, await approval)

  3. Remove SAFE TO REMOVE files identified in B1.3
     (list them before deleting, await approval)

  4. Commit all changes with message:
     "chore: cleanup + workflow realignment — align to .ff-core-lock authority"

Rules during execution:
  - Touch SURFACE files only — never CORE SACRED
  - One change at a time — show result before next change
  - If any change would touch a CORE SACRED file: STOP immediately

---

# B4 — ROADMAP RECONSTRUCTION

Build a new roadmap from runtime-confirmed dependencies only.
Apply Dependency Gate Rule before creating any phase.

Prioritize:
  1. Proven dependencies (runtime-confirmed)
  2. Production truth
  3. Authority consolidation
  4. Measurability
  5. RTP validity
  6. Sacred file safety

Every phase:
  Objective / Runtime Evidence / BLOCKED BY / UNLOCKS / REQUIRES /
  Risk / Sacred File Impact (NONE/LOW/HIGH) /
  Expected Readiness Gain / Complexity (XS/S/M/L/XL) / Leverage Score

Separate section:
  ## DEFERRED PHASES
  (UNKNOWN/ASSUMED — list evidence needed to unblock each)

---

# B5 — IMPLEMENTATION PLAN

Plan only. No code. No patches.

Before planning any phase touching CORE SACRED:
  STOP. Label: REQUIRES HUMAN AUTHORIZATION.
  Include as stub only — no implementation details.

Format:
  ## Phase N
  Goal / Dependencies / Success Criteria /
  Blocked Systems Unlocked / Sacred File Impact /
  Lock Files Affected / Risk / Evidence Basis

UNKNOWN dependency = move to DEFERRED.

---

# B6 — INDEPENDENT CRITIQUE PASS

Assume the plan is wrong. Challenge:

  1. Runtime reachability violations
  2. Missing dependencies
  3. Hidden assumptions
  4. Authority conflicts
  5. Sacred file risks not flagged
  6. AGROS constitutional violations
  7. Evidence policy violations
  8. Inflated leverage scores
  9. Priority inversions
  10. DEFERRED items that are actually blockers
  11. Cleanup changes that may break active pipelines
  12. Workflow realignment that contradicts lock file authority

Output:
  Critique Findings / Critique Confirmations /
  Evidence Policy Violations / Sacred File Risk Report /
  Cleanup Risk Report / Recommended Corrections

---

# B7 — FINAL HUMAN REVIEW PACKAGE

Output in this exact order:

  1.  Executive Summary
  2.  Repository Truth (runtime-confirmed)
  3.  Readiness Scores (evidence + confidence)
  4.  Completeness Matrix (FAR_NZY / AGROS / Monorepo %)
  5.  Contradictions (proven only)
  6.  Unknown Gaps
  7.  Sacred File Risk Map (from core/.ff-core-lock)
  8.  Cleanup Plan Summary (what changed and why)
  9.  Workflow Realignment Summary (new default workflow)
  10. Critical Dependencies
  11. Leverage Rankings (scores shown)
  12. Corrected Roadmap (confirmed phases)
  13. Deferred Items (evidence needed)
  14. Critique Results
  15. Final Recommendation

Then stop.

---

# HARD RULES — APPLY FOR ENTIRE SESSION

DO NOT:
  modify files during audit phase
  touch CORE SACRED files at any point
  create commits without human approval
  write implementation code
  speculate below 70% confidence
  treat disk presence as runtime existence
  bridge UNKNOWN nodes with assumptions
  elevate documentation to runtime truth
  execute cleanup before plan is approved

DO:
  read core/.ff-core-lock before classifying any file
  audit via cheapest evidence path
  score existence and readiness independently
  apply Dependency Gate Rule before every phase
  label Sacred File Impact on every plan phase
  report UNKNOWN when evidence is insufficient
  stop at 90% confidence
  show diffs before executing any change
  await human approval at every gate

# PRE-MERGE GATE

Before any merge to main is proposed:

  Run: ./scripts/bito-pre-merge-check.sh

  If exit code 1: DO NOT propose merge. Report failures.
  If exit code 0: Include result file path in merge summary.

This gate is mandatory. No exceptions.

---

# TERMINATION CONDITIONS

After Phase Group A: STOP. Output audit. Await approval.
After Phase Group B: STOP. Output final package. Await approval.

---

## ── FINAL APPROVAL GATE ─────────────────────────
## BOTH PHASE GROUPS COMPLETE.
## HUMAN APPROVAL REQUIRED BEFORE ANY IMPLEMENTATION.
##
## Sacred file modifications require explicit authorization.
## core/.ff-core-lock is the single authority.
## UNKNOWN systems require evidence before planning proceeds.
##
## No exceptions.
## ────────────────────────────────────────────────
