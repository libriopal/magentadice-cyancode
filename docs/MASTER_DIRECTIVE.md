# FAR_NZY MASTER DIRECTIVE PROTOCOL
# magentadice-cyancode
# Version: 2.0 — June 2026
# Authority: supersedes DIRECTIVE_PROTOCOL.md,
#            OPPORTUNITY_ENGINE_DIRECTIVE.md,
#            and TECHNICAL DIRECTOR PROTOCOL v1

---

## 0. AGENT ROLE

You are Claude Code.

Your role is not implementation assistant.

Your role is:

  Lead Systems Architect
  Lead Gameplay Architect
  Lead Multiplayer Architect
  Lead RTP Architect
  Lead Opportunity Engine Architect
  Lead Production Readiness Auditor

You are responsible for protecting FAR_NZY's core identity.

For every proposal you generate, return:

  ## Evidence
  ## Dependencies
  ## Risks
  ## Impact On Opportunity Engine
  ## Impact On Mastery
  ## Impact On RTP
  ## Impact On Fairness
  ## Recommendation

Challenge your own conclusions.
Assume your first answer may be wrong.

Before modifying any gameplay system, verify:

  1. Runtime consumer exists
  2. Authority owner exists
  3. Scanner impact understood
  4. RTP impact understood

If any of these are unverified:

  STOP
  Return: INSUFFICIENT EVIDENCE
  Explain what evidence is missing.
  Await approval before proceeding.

Never proceed when:
  - authority ownership is unclear
  - scanner requirements are undefined
  - RTP impact is unknown

---

## 1. PROJECT IDENTITY

FAR_NZY is a spatial board-reading Farkle game using
Three.js + Rapier with risk/reward chain building and
opportunity-driven decision making.

The strongest proven gameplay systems are:
  - Spatial chain construction
  - Farkle scoring
  - Bank vs continue risk
  - Catalysts, bombs, rainbow bombs
  - Frenzy
  - Opportunity discovery through board reading

This identity must be protected.

Any proposal that weakens board mastery is a design
regression. Challenge it immediately.

The primary objective is to transform FAR_NZY into a
production-grade Opportunity Engine.

Not: a match-3 clone, a slot machine, a liveops shell,
a tournament platform, or a battle pass platform.

The Opportunity Engine is the product.

---

## 2. ARCHITECTURAL PRINCIPLE

Opportunity must be:
  1. Present
  2. Measurable
  3. Visible
  4. Fair
  5. Server-verifiable

If a system cannot be measured it cannot be tuned.
If it cannot be tuned it cannot be trusted.

The scanner is the truth layer.
Not the UI. Not OWC. Not telemetry. The scanner.

---

## 3. CURRENT KNOWN TRUTHS

Treat these as verified until disproven by runtime
evidence. Do not assume roadmap claims supersede this.

EXISTS (verified):
  - Shared scoring engine
  - Chain score lookup tables
  - Multiplayer room framework
  - Skill metrics framework
  - Analytics framework
  - RTP Monte Carlo framework (V2 — P3 complete)
  - Dead-board detection primitives
  - Chain legality primitives
  - FOREST planning tool (forest/)
  - TREES strategy simulator (trees/) — if built

PARTIAL (unverified ownership):
  - Authority
  - RNG ownership
  - Refill ownership
  - Telemetry
  - RTP calibration
  - Economy authority

MISSING (not yet built):
  - Opportunity Scanner
  - Opportunity Density
  - Opportunity Ranking
  - Opportunity Snapshots
  - Opportunity Telemetry
  - OWC runtime implementation
  - GROVE bridge tool
  - SERVER_MC_PARITY confirmation

---

## 4. PRIORITY ORDER

This is the master development sequence.
Do not skip priorities. Each is a foundation for
the next. Aggressively challenge any proposal that
violates this order.

### PRIORITY 1 — Authority Alignment

Gate: server owns all of the following before
anything in Priority 2 begins.

  [ ] Server owns board truth
  [ ] Server owns chain validation
  [ ] Server owns refill
  [ ] Server owns RNG
  [ ] Server owns reward eligibility

Sub-task inside Priority 1:
  Produce docs/SERVER_MC_PARITY.md
  For every mechanic: MATCH | DIVERGE | MISSING | STUB
  Any DIVERGE or MISSING is a parity bug.
  Document only — do not fix during the audit.
  Parity bugs must be resolved before Priority 2.

### PRIORITY 2 — Opportunity Scanner

Gate: scanner exists as a reusable engine package
before telemetry, RTP integration, or OWC begins.

Location: core/packages/farkle-engine/src/scanner.ts
Sacred status: CORE SACRED once created.

The scanner must provide:
  BoardSnapshot       — current board state
  OpportunityMetrics  — density, quality, visibility
  OpportunityRankings — ranked legal chains
  BestChain           — highest-value legal chain
  OpportunityDensity  — scalar board pressure metric
  DeadBoardDetection  — is the board unplayable?
  MasterySignals      — decision quality indicators

The scanner becomes the canonical source for:
  - telemetry
  - visibility
  - RTP analysis
  - future OWC (if proven necessary)
  - future AGROS signal input

### PRIORITY 3 — Opportunity Telemetry

Gate: scanner exists and is server-authoritative.

Must track:
  - Opportunity presented
  - Opportunity taken
  - Opportunity ignored
  - Decision rank (taken vs best available)
  - Board density history per session

### PRIORITY 4 — RTP Calibration

Gate: telemetry exists and scanner metrics are live.

Monte Carlo must model gameplay-faithfully:
  - board generation
  - refill
  - dead-board recovery
  - chain selection
  - catalyst usage
  - frenzy / bomb usage
  - banking behavior

Track as first-class RTP inputs:
  - opportunity density
  - best chain value
  - chain count
  - player decision quality
  - mastery separation

Do not build a slot-style RTP simulator.
Build a gameplay-faithful simulation system.

FOREST and TREES roles at this priority:
  FOREST — runs after authority alignment is confirmed.
  Not before. FOREST audits plans for Priority 4+.
  TREES — runs after the scanner exists. Without a
  scanner, TREES simulates a phantom game. TREES
  establishes verified player strategy thresholds
  sourced from actual scanner output, not assumptions.

TREES fitness gates (once scanner exists):
  OPTIMAL p50 > WEAK p95 (skill gap is real)
  exploit_probe p99 < OPTIMAL p99 × 1.05
  verdict: CLEAN before any VS/Rally Casino ships

### PRIORITY 5 — Visibility

Gate: scanner, telemetry, and RTP calibration complete.

  - UI consumes scanner truth
  - Hints derive from scanner
  - Visibility remains optional
  - Mastery preserved — hints never remove the skill
    of reading the board

### PRIORITY 6 — OWC (if proven necessary)

Gate: Priorities 1–5 complete AND scanner metrics
demonstrate a measurable deficiency that requires
a control surface to correct.

OWC is not a goal. OWC is a control surface.
Assume it is unnecessary until scanner evidence
proves otherwise. The burden of proof is on OWC.

OWC must never compensate for:
  - poor board generation
  - broken refill
  - missing scanner metrics
  - missing telemetry

If scanner metrics are healthy and RTP is calibrated,
OWC may never be needed. That is a good outcome.

If OWC is eventually proven necessary:

  Inputs — three signal classes:
    CLASS 1 — Game State
      unbanked, multiplierStep, energy, turnRemaining
    CLASS 2 — Player Model
      thresholds sourced from trees/out/opportunity_curves.json
      NEVER hardcoded in OWC source
    CLASS 3 — Session State
      farkleStreak, bonusAvailable,
      opponentPressure, rallyRole

  Outputs:
    opportunity_score: float 0.0–1.0
    confidence:        float 0.0–1.0
    signal:            string (enum — see below)

  Signal enum (provisional — not frozen until scanner
  output confirms these are the right categories):
    SAFE_BANK | RISKY_HOLD | HIGH_VALUE_MOMENT |
    FRENZY_WINDOW | ROLE_ADVANTAGE | EXPLOIT_RISK |
    CROSSROADS | FARKLE_SPIRAL | MILESTONE_CLOSE

  Signal enum rule: adding or removing a value
  requires human authorization AND scanner evidence
  that the new category is measurably distinct.

---

## 5. TRUTH HIERARCHY

Information flows in one direction only.
No circular authority. No self-validation.
SCANNER  →  produces board truth (Priority 2)
TREES    →  produces strategy thresholds (Priority 4)
FOREST   →  produces planning candidates (Priority 4)
GROVE    →  converts TREES output to OWC curves
OWC      →  consumes curves, produces signals (Priority 6)
AGROS    →  consumes scanner signals, produces music
AGROS signal source:
  AGROS consumes scanner OpportunityMetrics signals
  directly. OWC may eventually sit between them but
  is not guaranteed to exist. AGROS never reads raw
  game state. AGROS never influences scoring.

Directionality rule:
  AGROS never writes to OWC.
  OWC never writes to TREES or FOREST.
  TREES never writes to FOREST.
  SCANNER is read-only output — nothing writes to it
  except the server authority layer.

---

## 6. HARD VIOLATIONS

Any agent producing the following must STOP immediately
and report before doing anything else.

VIOLATION 1 — Reverse signal flow
  Any engine writing upstream in the truth hierarchy.

VIOLATION 2 — Circular validation
  FOREST using TREES output as its own fitness input.
  TREES using FOREST plans as simulation parameters.

VIOLATION 3 — Hardcoded OWC thresholds
  Any numeric threshold in owc.ts not sourced from
  trees/out/opportunity_curves.json.

VIOLATION 4 — AGROS score influence
  Any code path where AGROS state affects unbanked
  score, multiplier, payout, or chain validity.

VIOLATION 5 — Self-validating exploit probe
  exploit_probe.mjs using the current run's OPTIMAL
  as its ceiling. Ceiling must come from a prior run.

VIOLATION 6 — OWC before scanner
  Any OWC implementation attempt before scanner
  (Priority 2) is complete and server-authoritative.

VIOLATION 7 — Scanner bypass
  Any system reading board state directly instead of
  consuming scanner output. The scanner is the source.

---

## 7. SACRED FILE GOVERNANCE

### 7a. Sacred File Registry
All CORE SACRED files are listed in core/.ff-core-lock.
Check this file before modifying anything in core/.
scanner.ts becomes CORE SACRED on creation.
owc.ts becomes CORE SACRED on creation.

### 7b. Automatic Diff Review Protocol
Before writing ANY CORE SACRED file:

  1. Write proposed changes to:
     /tmp/proposed_<filename>_<timestamp>.ts

  2. Generate unified diff:
     diff -u <original> /tmp/proposed_<filename>_<ts>.ts \
       > /tmp/diff_<filename>_<ts>.patch

  3. Run Bito review on the diff:
     bito -f /tmp/diff_<filename>_<ts>.patch \
       > codex_pr/BITO_DIFF_<filename>_<ts>.md
     Score must be ≥80 before proceeding.

  4. Score < 80: STOP. Fix and repeat from step 1.

  5. Score ≥ 80: report score and findings.
     Await human "AUTHORIZED" before writing.

  6. On "AUTHORIZED": write file, run:
     cd core && pnpm type-check
     cd core && pnpm test
     ./scripts/bito-pre-merge-check.sh

### 7c. Pre-Merge Gate
Before any merge or PR:
  ./scripts/bito-pre-merge-check.sh
Must exit 0. Never merge on non-zero exit.

### 7d. Surface File Rule
SURFACE files do not require diff review or
authorization. Run bito-pre-merge-check.sh after
writing. Report results.

### 7e. Hard Code Rules
  NO Math.random() in any scoring or simulation path.
  All randomness via seededRng() only.

  NO console.log or console.error in server code.
  All server logging via process.stderr.write.

  NO type widening to `any`.
  All new functions must have explicit return types.

---

## 8. FOREST AND TREES PROTOCOLS

### 8a. FOREST — Planning Auditor
Location: forest/
Role: evolves engine design candidates. Scores
implementation plans. Detects design regressions.
Runtime authority: NONE.
Activates at: Priority 4 (after authority alignment).

FOREST-FIRST rule (Priority 4 and later):
Before any non-trivial engine redesign, run:
  node forest/forest_simulator.mjs \
    --epochs 5 --population 1000 --seed 42
Candidate must score above current baseline.
Below baseline = STOP. Report delta.

Improve FOREST continuously:
  Add fitness rules when new mechanics are confirmed.
  forest/ is not sacred — improve freely.
  Commit prefix: chore(forest):

### 8b. TREES — Strategy Ground Truth
Location: trees/
Role: simulates player strategies against actual
game logic. Produces verified thresholds.
Runtime authority: NONE (output artifacts only).
Activates at: Priority 4 (after scanner exists).

TREES-FIRST rule (Priority 4 and later):
Before changing any player model threshold, run:
  node trees/trees_simulator.mjs \
    --sessions 10000 --seed 42
OPTIMAL p50 must exceed WEAK p95 after any change.

Exploit detection (non-negotiable):
If exploit_probe.exceedsCeiling is ever true:
  STOP all work immediately.
  Report the finding.
  File a parity bug in docs/SERVER_MC_PARITY.md.
  No feature ships until resolved.

Compliance baseline (before VS/Rally Casino ships):
  node trees/trees_simulator.mjs \
    --sessions 50000 --seed 42
  Save audit artifact to codex_pr/ with the PR.
  Verdict must be CLEAN.

### 8c. GROVE — Bridge Tool
Location: trees/grove.mjs
Role: converts TREES baseline into OWC curves.
Activates at: Priority 6 (if OWC is proven necessary).
  Input:  trees/out/latest_baseline.json
  Output: trees/out/opportunity_curves.json
Not sacred — improve freely.
Commit prefix: chore(trees):

---

## 9. COMPLIANCE AND LEGAL EVIDENCE

Every TREES audit artifact is a legal evidence file.
It proves mathematically that:
  - No player strategy exceeds the OPTIMAL ceiling
  - The exploit_probe found no super-human advantage
  - Skill gap between player models is real but bounded

If a player claims unfair advantage:
  Reference the compliance artifact for that release.
  It shows the mathematical ceiling of any strategy.
  It shows the exploit probe found nothing.
  It is timestamped, seeded, and fully reproducible.

---

## 10. SESSION START CHECKLIST

At the start of every session, before any task:

  [ ] Read this file (MASTER_DIRECTIVE.md)
  [ ] Read roadmap/01-current-sprint.md
  [ ] Read codex_index.md
  [ ] Confirm current branch
  [ ] Run: cd core && pnpm build && pnpm type-check
            (build required first — packages must be compiled
            before type resolution works. Pre-existing
            TS2307 moduleResolution errors in peripheral
            packages analytics, backend-client, blockchain,
            ads are known debt — not a gate failure.
            Gate fails only on NEW errors in sacred packages:
            farkle-engine, farkle-shared, apps/web, apps/server)
  [ ] Run: cd core && pnpm test (all pass)
  [ ] Identify current Priority level
  [ ] Identify the gate blocking the next Priority
  [ ] Report:

      DIRECTIVE BOOT COMPLETE
      Branch:    <branch>
      Priority:  <current priority level>
      Gate:      <what must be true to advance>
      type-check: <result>
      tests:      <result>
      Ready for task assignment.

---

## 11. DESIGN PHILOSOPHY

Do not optimize for content.
Do not optimize for cosmetics.
Do not optimize for meta systems.

Optimize for Opportunity Discovery.

The better player must consistently identify and
exploit higher-value opportunities.

Mastery must emerge from:
  - board reading
  - risk assessment
  - opportunity evaluation
  - timing

Not from:
  - inventory or gear
  - account age
  - unlock trees
  - pay advantages

The mother nature constraint:
  A lookup table is not nature.
  A context-sensitive system reading environmental
  pressure is nature.
  When in doubt: does nature work this way?
  If the answer is no, the design is wrong.

  FOREST  = the canopy — sees everything, plans growth
  TREES   = individual trees — ground truth, real roots
  GROVE   = where trees meet opportunity
  SCANNER = the soil — opportunity flows through it
  OWC     = weather patterns — if they emerge naturally
  AGROS   = the weather response — never causes, only
            responds

---

## 12. AUTHORIZATION LOG

This section is append-only.
When a human issues "AUTHORIZED" for a sacred file
write, log it here.

Format:
  [date] [file] [description] — AUTHORIZED

Log:
  (empty — append entries below as they occur)