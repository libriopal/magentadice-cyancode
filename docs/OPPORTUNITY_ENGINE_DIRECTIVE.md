# ARCHIVED — SUPERSEDED
# Superseded by: docs/MASTER_DIRECTIVE.md (v2.0, June 2026)
# This file is preserved for its authorization log history only.
# Do not treat this as an active directive for any session.
# ────────────────────────────────────────────────────────────

# OPPORTUNITY ENGINE DIRECTIVE
# magentadice-cyancode / FAR_NZY
# Version: 1.0 — June 2026

---

## 1. SYSTEM IDENTITY

This document governs the design, development, and
validation of the four-engine truth hierarchy in
FAR_NZY. It is a standing directive — all agents
(Claude Code, Codex, human contributors) must read
this before modifying any engine.

The four engines form a directed truth hierarchy:
FOREST  →  Audit + Planning Authority (offline tool)
TREES   →  Ground-Truth Simulation (offline tool)
OWC     →  Opportunity Engine (runtime, consumes TREES)
AGROS   →  Emotional/Music Engine (runtime, consumes OWC)
Information flows in one direction only:
FOREST and TREES produce artifacts.
OWC and AGROS consume artifacts.
No runtime engine writes back to FOREST or TREES.
No circular authority. No self-validation.

---

## 2. THE OPPORTUNITY ENGINE (OWC)

### 2.1 Identity and Purpose

The Opportunity Engine is the heart of FAR_NZY.
It answers the question every player faces every turn:
"Is this moment worth the risk?"

It is not a scoring engine. It is not a rules engine.
It is a context-sensitive risk evaluator that reads
game-state signals and produces a continuous
opportunity score — like a foraging animal reading
environmental pressure, not solving a formula.

Name: OWC — Opportunity Weight Calculator
(retained for code compatibility)
Design philosophy: nature-inspired, not mechanical.
A lookup table is a violation of this philosophy.
All thresholds must come from simulation evidence.

### 2.2 Inputs and Outputs

Inputs (three signal classes):

  CLASS 1 — Game State
    unbanked:        current unbanked score
    multiplierStep:  current ladder position (0–5)
    energy:          NEUTRAL | PRIME | FRENZY
    turnRemaining:   turns left in session

  CLASS 2 — Player Model
    playerModel:     OPTIMAL | AVERAGE | WEAK
    thresholds:      sourced from trees/out/latest_baseline.json
                     NEVER hardcoded in OWC source

  CLASS 3 — Session State
    farkleStreak:    consecutive farkles this session
    bonusAvailable:  orb | doubler | none
    opponentPressure: 0.0–1.0 (VS/Rally modes only)
    rallyRole:       RAINMAKER | HEADHUNTER | ARCHIVIST
                     | CONDUCTOR | null

Output (three values, always together):

  opportunity_score: float 0.0–1.0
    0.0 = bank immediately (high risk, low reward)
    1.0 = continue (low risk, high reward)

  confidence: float 0.0–1.0
    how certain the engine is about this recommendation
    low confidence = player is at a genuine crossroads

  signal: string (enum)
    SAFE_BANK | RISKY_HOLD | HIGH_VALUE_MOMENT |
    FRENZY_WINDOW | ROLE_ADVANTAGE | EXPLOIT_RISK |
    CROSSROADS | FARKLE_SPIRAL | MILESTONE_CLOSE
    This signal feeds AGROS. It is the emotional trigger.

### 2.3 The Signal-to-AGROS Contract

OWC.signal is the only input AGROS receives from
the game engine. AGROS must not read game state
directly. It reads signal only.

Signal → AGROS emotional response mapping:
  SAFE_BANK        → calm resolution
  RISKY_HOLD       → tension build
  HIGH_VALUE_MOMENT → peak energy
  FRENZY_WINDOW    → urgency spike
  ROLE_ADVANTAGE   → confidence motif
  EXPLOIT_RISK     → dissonance / warning
  CROSSROADS       → suspended tension
  FARKLE_SPIRAL    → descending motif
  MILESTONE_CLOSE  → anticipation build

This mapping is defined in AGROS, not in OWC.
OWC emits signal. AGROS interprets it.
One-way contract. Never reversed.

---

## 3. TRUTH HIERARCHY RULES

### 3.1 FOREST — Audit and Planning Authority

Location: forest/
Role: Evolves engine design candidates. Scores
implementation plans. Detects design regressions.
Runtime authority: NONE.

Rules:
- Run FOREST before any non-trivial engine redesign
- A candidate scoring below current baseline = STOP
- FOREST output informs human decisions only
- FOREST never writes to sacred files directly
- Improve FOREST continuously as engines grow:
  add fitness rules when new mechanics are added

### 3.2 TREES — Ground-Truth Simulation

Location: trees/
Role: Simulates player strategies against actual
game logic. Produces verified thresholds.
Runtime authority: NONE (output artifacts only).

Rules:
- Run TREES before changing any player model threshold
- OPTIMAL fix is only valid if TREES confirms:
  OPTIMAL p50 > WEAK p95 after the change
- Run TREES before any VS Casino or Rally Casino
  feature ships (50,000 sessions, seed 42)
- Save every audit artifact to codex_pr/ with its PR
- Exploit detection: any strategy exceeding OPTIMAL
  p99 × 1.05 is a STOP condition — no feature ships

### 3.3 GROVE — Opportunity Signal Calibrator

Location: trees/ (bridge tool)
Role: Converts TREES baseline output into OWC
opportunity_score curves.
Runtime authority: NONE (generates curves file only).

Rules:
- OWC must never contain hardcoded thresholds
- All OWC thresholds sourced from
  trees/out/opportunity_curves.json
- Regenerate opportunity_curves.json after every
  TREES baseline run
- GROVE is not a sacred file — improve freely

### 3.4 OWC — Opportunity Engine

Location: core/packages/farkle-engine/src/owc.ts
Sacred status: CORE SACRED (once created)
Runtime authority: YES — produces opportunity_score,
confidence, and signal every turn.

Rules:
- Never hardcode thresholds — import from
  trees/out/opportunity_curves.json at build time
- Never read game state beyond the three input classes
- Never write to FOREST or TREES outputs
- All randomness via seededRng() — no Math.random()
- signal enum is frozen — new values require a
  separate AGROS update and human authorization
- Must pass TREES exploit_probe before any
  VS Casino or Rally Casino deployment

### 3.5 AGROS — Emotional/Music Engine

Location: dream/ submodule
Runtime authority: OUTPUT ONLY — produces music/
emotional response. Never influences scoring.
Sacred status: governed by dream submodule rules.

Rules:
- Reads OWC.signal only — no direct game state access
- Never influences score, RTP, or player model
- Signal-to-emotion mapping lives in AGROS, not OWC
- ERK pipeline reuse is preferred over new code
- Emotional state changes must not affect timing
  of any scoring event

---

## 4. DIRECTIONALITY ENFORCEMENT

The following are hard violations. Any agent that
produces these must STOP and report immediately:

VIOLATION 1 — Reverse signal flow
  AGROS writing to OWC, OWC writing to TREES,
  TREES writing to FOREST. Never happens.

VIOLATION 2 — Circular validation
  FOREST using TREES output as its own fitness input.
  TREES using FOREST plans as simulation parameters.
  Each tool is independent. They share artifacts only.

VIOLATION 3 — Hardcoded OWC thresholds
  Any numeric threshold in owc.ts not sourced from
  trees/out/opportunity_curves.json.
  This makes TREES irrelevant and ground truth fake.

VIOLATION 4 — AGROS score influence
  Any code path where AGROS emotional state can
  affect unbanked score, multiplier, or payout.
  AGROS is cosmetic. It must stay cosmetic.

VIOLATION 5 — Self-validating exploit probe
  exploit_probe.mjs using OPTIMAL strategy as its
  own ceiling definition. The ceiling must come from
  a prior TREES run, not the current run.

---

## 5. BUILD SEQUENCE (APPROVED)

Execute in strict order. Do not skip steps.

  [ ] STEP 1 — SERVER/MC PARITY AUDIT
      Produce docs/SERVER_MC_PARITY.md
      All DIVERGE/MISSING bugs documented
      No fixes yet — document only
      Gate: parity report committed

  [ ] STEP 2 — TREES BASELINE (before fix)
      Run 10,000 sessions, seed 42
      Confirm OPTIMAL inversion bug is visible in numbers
      Commit: trees/out/<ts>_baseline_prefx.json
      Gate: OPTIMAL mean < WEAK mean confirmed

  [ ] STEP 3 — OPTIMAL INVERSION FIX
      CORE SACRED authorization required
      Fix playerContinue in monteCarlo.ts
      Use breakeven table scaled from MULTIPLIER_LADDER
      Gate: TREES run after fix confirms
            OPTIMAL p50 > WEAK p95

  [ ] STEP 4 — TREES SECOND RUN (after fix)
      Run 10,000 sessions, seed 42
      Confirm skill gap is real
      Commit: trees/out/<ts>_baseline_postfix.json
      Gate: verdict CLEAN, exploit_probe clean

  [ ] STEP 5 — GROVE BRIDGE TOOL
      Build trees/grove.mjs
      Input: trees/out/latest_baseline.json
      Output: trees/out/opportunity_curves.json
      Gate: curves file generated, validated against
            MULTIPLIER_LADDER values

  [ ] STEP 6 — OWC DESIGN (context-sensitive evaluator)
      Build core/packages/farkle-engine/src/owc.ts
      Three input classes, three output values
      Import thresholds from opportunity_curves.json
      Signal enum frozen at initial 9 values
      Gate: FOREST run scores above MC=100 baseline
            TREES exploit_probe: clean

  [ ] STEP 7 — AGROS SIGNAL WIRING
      Wire OWC.signal → AGROS input
      Define signal-to-emotion mapping in AGROS
      ERK pipeline reuse preferred
      Gate: all 9 signal types produce distinct
            emotional responses, no score influence

  [ ] STEP 8 — COMPLIANCE BASELINE
      Run TREES 50,000 sessions, seed 42
      Save audit artifact to codex_pr/
      Verdict must be CLEAN
      This is the legal compliance snapshot

---

## 6. COMPLIANCE AND LEGAL EVIDENCE

Every TREES audit artifact is a legal evidence file.
It proves mathematically that:
  - No player strategy can exceed the OPTIMAL ceiling
  - The exploit_probe found no super-human advantage
  - Skill gap between player models is real but bounded

Before any VS Casino or Rally Casino mode ships:
  Run: node trees/trees_simulator.mjs \
         --sessions 50000 --seed 42
  Save: codex_pr/TREES_COMPLIANCE_<date>_<PR>.json
  Gate: verdict CLEAN, exploit_probe.exceedsCeiling false

If a player ever claims unfair advantage:
  Reference the compliance artifact for that release
  It shows the mathematical ceiling of any strategy
  It shows the exploit probe found nothing
  It is timestamped and seeded — fully reproducible

---

## 7. NAMING CONVENTION

The mother nature framing is a design constraint,
not just aesthetic. It enforces:

  FOREST  = the canopy — sees everything, plans growth
  TREES   = individual trees — ground truth, real roots
  GROVE   = the bridge — where trees meet opportunity
  OWC     = the soil — opportunity flows through it
  AGROS   = the weather — responds to conditions,
            never causes them

When in doubt about a design decision, ask:
"Does nature work this way?"
A lookup table is not nature.
A context-sensitive signal reading environmental
pressure is nature.
Build accordingly.