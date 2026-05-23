# FAR_NZY BUILD SYSTEM
# Instructions Manual
## magentadice-cyancode / FAR_NZY
## Version: 1.0.0 — Covers all 28 files authorized through Conditional Pass

---

# PART 1 — WHAT THIS IS

This manual covers the complete governance and build system for
FAR_NZY, a React Three Fiber + Rapier3D sweepstakes game targeting
AA+ production grade.

The 28 files in this system form four layers:

    Layer 1 — Constitution      9 documents that govern everything
    Layer 2 — Contracts         3 frozen type definitions for replay
    Layer 3 — Infrastructure    8 files that run every session
    Layer 4 — Prompts           8 files that do actual work

Before any code is written, governance must exist.
Before governance is tested, nothing else runs.
The file order in this manual is the execution order.

---

# PART 2 — FILE INVENTORY

## Layer 1: Constitutional Documents (9 files)
## Destination: repo root of magentadice-cyancode/

    1.  authority-model.md
        Who can do what. 5-level authority hierarchy.
        Human > Constitution > Audit > Execution > Agent Output.

    2.  sacred-core-spec.md
        Exact list of files that cannot be touched without Human approval.
        Also lists what is NOT sacred (everything visual, audio, content).

    3.  rng-lineage-spec.md
        GENESIS → SESSION → GAME → EVENT seed derivation chain.
        Banned patterns (Math.random, Date.now in scoring paths).

    4.  threat-model.md
        17 threats across 4 categories including adversarial agent threats.
        Mitigations and severity ratings for each.

    5.  event-versioning-spec.md
        Semantic versioning for game events. Backward/forward compatibility.
        Migration strategy for breaking changes.

    6.  snapshot-strategy.md
        Three-layer replay architecture: events + snapshots + state hashes.
        Checkpoint intervals per scenario.

    7.  agent-escalation-model.md
        5-level escalation: Observation → Finding → Violation → Critical → Halt.
        Exact triggers per level. Which cells can halt.

    8.  adr-governance.md
        Architecture Decision Record system. Format, triggers, numbering.
        Every constitutional change needs an ADR.

    9.  hashing-strategy.md
        SHA-256 for all chain links. BLAKE3 only for internal non-audit paths.
        Resolves SHA-256 vs BLAKE3 inconsistency.

---

## Layer 2: Frozen Contracts (3 files)
## Destination: contracts/ directory

    10. IEventStore.v1.md
        Frozen interface — 8 methods. All method invariants.
        Storage-agnostic. Any change requires v2 + migration + ADR.

    11. ReplayEvent.v1.md
        All 10 GameEvent types with TypeScript interfaces.
        Payload shapes per event_type. Q32.32 amounts throughout.

    12. Snapshot.v1.md
        EventSnapshot, SnapshotState, SnapshotTrigger types.
        Frozen. Any change requires v2 + migration + ADR.

    Note: Files 11 and 12 were delivered as ReplayEvent-Snapshot.v1.md
    and should be split into two files when placing in the repo.

---

## Layer 3: Infrastructure (8 files)
## Destination: prompts/ and prompts/infrastructure/

    13. session-runner.md
        Destination: prompts/session-runner.md
        The master orchestrator. Runs every session.
        Defines lifecycle, scoring, pause thresholds, commit format.

    14. session-score.schema.json
        Destination: prompts/session-score.schema.json
        JSON Schema for session score records.
        Failure Taxonomist output must validate against this.

    15. audit-cell-01-systems-architect.md
        Destination: prompts/infrastructure/
        Maps downstream dependencies of every session change.

    16. audit-cell-02-replay-archivist.md
        Destination: prompts/infrastructure/
        Snapshots session state. Verifies chain head integrity.

    17. audit-cell-03-governance-auditor.md
        Destination: prompts/infrastructure/
        DELTA-VERIFY compliance. Sacred Core boundary checks.

    18. audit-cell-04-contradiction-hunter.md
        Destination: prompts/infrastructure/
        Finds conflicts between session decisions and source truth.

    19. audit-cell-05-determinism-verifier.md
        Destination: prompts/infrastructure/
        FIXED_POINT_CHECK. Float audit. RNG lineage compliance.

    20. audit-cell-06-failure-taxonomist.md
        Destination: prompts/infrastructure/
        Scores session. Produces verdict. Writes post-mortem.
        Always last. Always pauses for Human before commit.

    Note: Files 15–20 were delivered as audit-cells-all-six.md
    and should be split into 6 separate files when placing in the repo.

---

## Layer 4: Prompts (8 files)
## Destination: prompts/tiers/

    21. prompt-00-baseline-audit.md
        Phase 0. Research only. No code changes.
        4 BrightData tasks + grade assessment + corpus manifest.

    22. prompt-01a-governance-runtime.md
        Phase 1A. Governance infrastructure operational.
        Memory MCP init, ADR directory, constitutional version audit.

    23. prompt-01b-audit-runtime.md
        Phase 1B. All 6 audit cells tested and verified.
        Known-good + known-bad scenarios. No code ships until cells work.

    24. prompt-01c-replay-runtime.md
        Phase 1C. IEventStore implemented. One match replayable.
        Frozen contracts committed. SHA-256 chain validated.

    Note: Files 22–24 were delivered as prompt-01abc-phase1.md
    and should be split into 3 separate files when placing in the repo.

---

## Reference Documents (4 files)
## Destination: docs/reference/

    25. proof_of_value_decisions.md
        Q1/Q3/Q6/Q8 proof-of-value answers with evidence.
        The reasoning behind tier count, scoring, BrightData scope, track breakdown.

    26. master_proof_of_value_audit_v2.md
        The full build plan. All 13 sections. The document that received PASS.

    27. visual_overhaul.md
        Prompt-07 (T7). Complete visual + UI overhaul instructions.
        Targets actual stack: Three.js r162 + R3F + 18 components.
        Not yet authorized — awaits Phase 1C PASS.

    28. visual_manifest_schema.json
        JSON Schema for the data/ corpus visual manifest.
        Used by prompt-00 during corpus ingestion.

---

# PART 3 — REPO SCAFFOLD

Create this directory structure exactly before placing any files.
Run these commands from the magentadice-cyancode repo root:

```bash
# --- Constitutional documents (repo root)
# (files go directly in repo root — no directory needed)

# --- Contracts directory
mkdir -p contracts

# --- Docs and ADR directory
mkdir -p docs/adr
mkdir -p docs/reference

# --- Prompt directories
mkdir -p prompts/infrastructure
mkdir -p prompts/tiers

# --- Runtime directories
mkdir -p handoff
mkdir -p runs
mkdir -p sessions

# --- Core art directories (may already exist)
mkdir -p core/art/manifest
mkdir -p core/art/profiling

# --- Gitkeep files for empty directories
touch handoff/.gitkeep
touch runs/.gitkeep
touch sessions/.gitkeep
touch core/art/profiling/.gitkeep

# --- Session log file
printf '# Session Log\n## FAR_NZY / magentadice-cyancode\n' > sessions/session-log.md

echo "Scaffold complete."
```

After running the scaffold commands, verify:

```bash
find . -type d | grep -E "contracts|docs/adr|prompts/|handoff|runs|sessions" | sort
```

Expected output:
```
./contracts
./docs
./docs/adr
./docs/reference
./handoff
./prompts
./prompts/infrastructure
./prompts/tiers
./runs
./sessions
```

---

# PART 4 — FILE PLACEMENT

Place files in this exact order. Order matters because
later files reference earlier files by path.

## Step 1 — Constitutional Documents (repo root)

Copy these files directly to the repo root:

```
magentadice-cyancode/
├── authority-model.md           ← file 1
├── sacred-core-spec.md          ← file 2
├── rng-lineage-spec.md          ← file 3
├── threat-model.md              ← file 4 (use threat-model-v2.md content)
├── event-versioning-spec.md     ← file 5
├── snapshot-strategy.md         ← file 6
├── agent-escalation-model.md    ← file 7
├── adr-governance.md            ← file 8
└── hashing-strategy.md          ← file 9
```

## Step 2 — Contracts Directory

Split ReplayEvent-Snapshot.v1.md into two files:

```
contracts/
├── IEventStore.v1.md            ← file 10 (full file as delivered)
├── ReplayEvent.v1.md            ← file 11 (PART 1 of ReplayEvent-Snapshot.v1.md)
└── Snapshot.v1.md               ← file 12 (PART 2 of ReplayEvent-Snapshot.v1.md)
```

To split ReplayEvent-Snapshot.v1.md:
- Everything from `# PART 1 — ReplayEvent.v1` to the `---` separator → `ReplayEvent.v1.md`
- Everything from `# PART 2 — Snapshot.v1` to end → `Snapshot.v1.md`

## Step 3 — Infrastructure Files

```
prompts/
├── session-runner.md            ← file 13 (direct placement)
└── session-score.schema.json    ← file 14 (direct placement)

prompts/infrastructure/
├── audit-cell-01-systems-architect.md    ← file 15
├── audit-cell-02-replay-archivist.md     ← file 16
├── audit-cell-03-governance-auditor.md   ← file 17
├── audit-cell-04-contradiction-hunter.md ← file 18
├── audit-cell-05-determinism-verifier.md ← file 19
└── audit-cell-06-failure-taxonomist.md   ← file 20
```

To split audit-cells-all-six.md:
Each cell begins with `# FILE: audit-cell-0N-name.md`.
Copy the content under each header into its own file.
The identity, input, task, and output sections are the complete file.

## Step 4 — Tier Prompts

```
prompts/tiers/
├── prompt-00-baseline-audit.md         ← file 21 (direct placement)
├── prompt-01a-governance-runtime.md    ← file 22
├── prompt-01b-audit-runtime.md         ← file 23
└── prompt-01c-replay-runtime.md        ← file 24
```

To split prompt-01abc-phase1.md:
Each prompt begins with `# PROMPT-01X: NAME`.
The `---` triple-dash separator between prompts marks the boundary.

## Step 5 — Reference Documents

```
docs/reference/
├── proof-of-value-decisions.md         ← file 25
└── master-proof-of-value-audit-v2.md   ← file 26
```

## Step 6 — Visual Overhaul Prompt

```
prompts/tiers/
└── prompt-07-visual-overhaul.md        ← file 27 (visual_overhaul.md content)
```

Note: This prompt is not yet authorized. Place it now for reference.
Do not run it until Phase 1C passes.

## Step 7 — Visual Manifest Schema

```
core/art/manifest/
└── visual_manifest_schema.json         ← file 28
```

---

# PART 5 — FINAL DIRECTORY TREE

After all files are placed, the repo root should look like this:

```
magentadice-cyancode/
│
├── authority-model.md
├── sacred-core-spec.md
├── rng-lineage-spec.md
├── threat-model.md
├── event-versioning-spec.md
├── snapshot-strategy.md
├── agent-escalation-model.md
├── adr-governance.md
├── hashing-strategy.md
├── LEGAL.md                        (created by prompt-00)
│
├── contracts/
│   ├── IEventStore.v1.md
│   ├── ReplayEvent.v1.md
│   └── Snapshot.v1.md
│
├── docs/
│   ├── adr/
│   │   ├── ADR-000-adr-governance.md
│   │   ├── ADR-001-authority-model.md
│   │   ├── ADR-002-sacred-core-spec.md
│   │   ├── ADR-003-rng-lineage.md
│   │   ├── ADR-004-event-versioning.md
│   │   ├── ADR-005-snapshot-strategy.md
│   │   ├── ADR-006-agent-escalation.md
│   │   ├── ADR-007-threat-model.md
│   │   └── ADR-008-hashing-strategy.md
│   └── reference/
│       ├── proof-of-value-decisions.md
│       └── master-proof-of-value-audit-v2.md
│
├── prompts/
│   ├── session-runner.md
│   ├── session-score.schema.json
│   ├── infrastructure/
│   │   ├── audit-cell-01-systems-architect.md
│   │   ├── audit-cell-02-replay-archivist.md
│   │   ├── audit-cell-03-governance-auditor.md
│   │   ├── audit-cell-04-contradiction-hunter.md
│   │   ├── audit-cell-05-determinism-verifier.md
│   │   └── audit-cell-06-failure-taxonomist.md
│   └── tiers/
│       ├── prompt-00-baseline-audit.md
│       ├── prompt-01a-governance-runtime.md
│       ├── prompt-01b-audit-runtime.md
│       ├── prompt-01c-replay-runtime.md
│       └── prompt-07-visual-overhaul.md  (not yet authorized)
│
├── handoff/
│   └── .gitkeep
│
├── runs/
│   └── .gitkeep
│
├── sessions/
│   └── session-log.md
│
└── core/                            (existing submodule)
    └── art/
        └── manifest/
            └── visual_manifest_schema.json
```

---

# PART 6 — SETUP VERIFICATION

After placing all files, run these checks before starting any session:

```bash
# Check constitutional documents are present
for f in authority-model.md sacred-core-spec.md rng-lineage-spec.md \
          threat-model.md event-versioning-spec.md snapshot-strategy.md \
          agent-escalation-model.md adr-governance.md hashing-strategy.md; do
  [ -f "$f" ] && echo "✓ $f" || echo "✗ MISSING: $f"
done

# Check contracts
for f in contracts/IEventStore.v1.md contracts/ReplayEvent.v1.md \
          contracts/Snapshot.v1.md; do
  [ -f "$f" ] && echo "✓ $f" || echo "✗ MISSING: $f"
done

# Check infrastructure
for f in prompts/session-runner.md prompts/session-score.schema.json; do
  [ -f "$f" ] && echo "✓ $f" || echo "✗ MISSING: $f"
done
for i in 01 02 03 04 05 06; do
  ls prompts/infrastructure/audit-cell-${i}-*.md 2>/dev/null \
    && echo "✓ audit-cell-${i}" || echo "✗ MISSING: audit-cell-${i}"
done

# Check tier prompts
for f in prompt-00-baseline-audit.md prompt-01a-governance-runtime.md \
          prompt-01b-audit-runtime.md prompt-01c-replay-runtime.md; do
  [ -f "prompts/tiers/$f" ] && echo "✓ $f" || echo "✗ MISSING: $f"
done

# Check manifest schema
[ -f "core/art/manifest/visual_manifest_schema.json" ] \
  && echo "✓ visual_manifest_schema.json" \
  || echo "✗ MISSING: visual_manifest_schema.json"

echo "---"
echo "Verification complete."
```

All checks should show ✓ before running any session.

---

# PART 7 — HOW TO RUN A SESSION

## The Golden Rule

Open Claude Code from the repo root.
Attach `prompts/session-runner.md` to the session.
Then specify which tier prompt to run.

Example invocation in Claude Code:

```
Use prompts/session-runner.md as the session orchestrator.
Run prompts/tiers/prompt-00-baseline-audit.md.
```

That is all you need to say. The orchestrator handles the rest.

## First Session — Phase 0

1. Open Claude Code at `~/dream-core-integration` (your Termux path)
2. Start a new session
3. Say:

```
Use prompts/session-runner.md as the session orchestrator.
Run prompts/tiers/prompt-00-baseline-audit.md.
This is the first session. Initialize memory MCP from the schema
in prompts/session-score.schema.json with all tiers set to NOT_STARTED.
```

4. Claude Code will:
   - Read authority-model.md, sacred-core-spec.md, agent-escalation-model.md
   - Initialize the memory MCP
   - Run 4 BrightData research tasks
   - Run the current codebase grade assessment
   - Build the data/ corpus manifest
   - Commit constitutional documents
   - Run all 6 audit cells
   - Score the session
   - PAUSE and present results to you

5. Review the session score and verdict.
   If ✓ propose commit → approve or reject the draft PR in GitHub.
   If ✗ scrap → review the post-mortem, note the learning, retry.

## Subsequent Sessions

Always in this order. Never skip a phase:

```
Session 1:  Phase 0  → prompt-00-baseline-audit.md
Session 2:  Phase 1A → prompt-01a-governance-runtime.md
Session 3:  Phase 1B → prompt-01b-audit-runtime.md
Session 4:  Phase 1C → prompt-01c-replay-runtime.md
(Phase 1C must PASS before T1–T9 are authorized)
```

## Invocation Template for All Sessions

```
Use prompts/session-runner.md as the session orchestrator.
Run prompts/tiers/[PROMPT FILE NAME].
The current tier gate status is in memory MCP.
Do not proceed if the prerequisite tier has not passed.
```

---

# PART 8 — SESSION LIFECYCLE (QUICK REFERENCE)

```
You start a session
       ↓
Claude Code reads authority-model.md, sacred-core-spec.md,
agent-escalation-model.md, hashing-strategy.md
       ↓
Claude Code reads memory MCP (tier status, flags, scores)
       ↓
Claude Code verifies constitutional doc versions match memory
       ↓
Claude Code loads and runs the tier prompt
       ↓
After each significant change:
  → audit-cell-01 (pathway deps)
  → audit-cell-02 (replay snapshot)
  → audit-cell-03 (governance)
  → audit-cell-04 (contradictions)
  → audit-cell-05 (determinism)
  → audit-cell-06 (score + verdict)
       ↓
Escalation check:
  L0 → log and continue
  L1 → flag and continue
  L2 → PAUSE → you decide
  L3 → HALT → you decide
  L4 → FULL STOP → constitutional review
       ↓
Session score computed (100 + 5 bonus pts)
       ↓
ALWAYS PAUSES — presents score + verdict
       ↓
You decide:
  Score ≥70 → approve draft PR (you merge in GitHub)
  Score 50-69 → continue or scrap
  Score <50 → review post-mortem, likely scrap
       ↓
Memory MCP updated
Session record written to runs/
Post-mortem appended to sessions/session-log.md
```

---

# PART 9 — WHAT EACH FILE DOES IN ONE LINE

| # | File | One Line |
|---|---|---|
| 1 | authority-model.md | Who can do what — 5-level hierarchy |
| 2 | sacred-core-spec.md | Exact list of untouchable files |
| 3 | rng-lineage-spec.md | Seed chain: GENESIS→SESSION→GAME→EVENT |
| 4 | threat-model.md | 17 threats, mitigations, severity |
| 5 | event-versioning-spec.md | Event schema semver and migration |
| 6 | snapshot-strategy.md | Checkpoint replay architecture |
| 7 | agent-escalation-model.md | 5-level halt path |
| 8 | adr-governance.md | Decision record system |
| 9 | hashing-strategy.md | SHA-256 for chains, BLAKE3 only internal |
| 10 | IEventStore.v1.md | Frozen 8-method replay interface |
| 11 | ReplayEvent.v1.md | All 10 event types, typed payloads |
| 12 | Snapshot.v1.md | Snapshot types, frozen |
| 13 | session-runner.md | Master session orchestrator |
| 14 | session-score.schema.json | Score record validation schema |
| 15 | audit-cell-01 | Maps downstream dependencies |
| 16 | audit-cell-02 | Snapshots session state |
| 17 | audit-cell-03 | Governance and DELTA-VERIFY check |
| 18 | audit-cell-04 | Finds source truth conflicts |
| 19 | audit-cell-05 | Float audit, FIXED_POINT_CHECK |
| 20 | audit-cell-06 | Scores session, produces verdict |
| 21 | prompt-00 | Phase 0 research, no code changes |
| 22 | prompt-01a | Phase 1A governance infrastructure |
| 23 | prompt-01b | Phase 1B audit cell verification |
| 24 | prompt-01c | Phase 1C replay runtime |
| 25 | proof-of-value-decisions.md | Q1/Q3/Q6/Q8 evidence |
| 26 | master-proof-of-value-audit-v2.md | Full build plan, received PASS |
| 27 | prompt-07-visual-overhaul.md | T7 visual prompt (not yet authorized) |
| 28 | visual_manifest_schema.json | Data corpus manifest schema |

---

# PART 10 — WHAT CLAUDE CODE CAN AND CANNOT DO

## CAN DO (Execution Runtime Authority)

    ✓ Read any file
    ✓ Create new files (non-sacred paths)
    ✓ Create git branches (tier/TN-name-YYYYMMDD format)
    ✓ Draft pull requests (Proposal Only)
    ✓ Run tests and scripts
    ✓ Install packages within approved tier scope
    ✓ Write to handoff/, runs/, sessions/, core/art/
    ✓ Run audit cells
    ✓ Compute session scores
    ✓ Propose constitutional amendments (labeled as proposals)

## CANNOT DO (Requires Human Action)

    ✗ Merge pull requests (you merge in GitHub)
    ✗ Modify sacred-core-spec.md files directly
    ✗ Deploy to production
    ✗ Approve its own session scores
    ✗ Self-resolve Level 2+ escalations
    ✗ Override audit cell halts
    ✗ Skip audit cells
    ✗ Run T1–T9 before Phase 1C passes

---

# PART 11 — WHEN THINGS GO WRONG

## Session Halted at L3

```
1. Read the post-mortem in runs/YYYY-MM-DD/session-N.json
2. Read the learning field
3. Decide: retry with modified approach, or change the plan
4. To retry: start a new session with the learning in context
5. Say: "Start new session. Prior session was scrapped because [reason].
         Apply this learning: [learning from post-mortem]."
```

## Score Below 50 — Scrap Recommended

```
1. Review the session-log.md entry
2. Identify which dimension failed most
3. If Mathematical Purity failed: read rng-lineage-spec.md
4. If Sacred Core failed: review sacred-core-spec.md
5. If Performance failed: the change was too expensive — narrow scope
6. Start a new session with narrower scope
```

## Constitutional Document Missing

```
1. Check which document is missing
2. Find it in docs/reference/ or regenerate from the source conversation
3. Commit it to the correct location
4. Run Phase 1A again to re-verify constitutional doc versions
```

## Memory MCP Lost

```
1. Read sessions/session-log.md to reconstruct tier_gate_status
2. Re-initialize memory MCP from the last known good state in the log
3. All tier gate statuses must be verifiable from session-log.md
4. If session-log.md is also missing: start from T0 again
   (T0 is a read-only session — re-running it is safe)
```

## BrightData Task Failed

```
1. BrightData artifacts are frozen after T0
2. If a task failed during T0: re-run that specific task only
3. After re-run: verify runs/T0/brightdata/ has all 4 artifacts
4. Set brightdata_artifacts_frozen: true in memory MCP
5. Do not re-run BrightData tasks after T0 is marked PASS
```

---

# PART 12 — NOT YET AUTHORIZED

These prompts exist in the system but are not yet authorized
by the Conditional Pass verdict:

    prompt-02-mathematical-foundation.md    (T1 — awaits Phase 1C PASS)
    prompt-03-security-compliance.md        (T2 — awaits Phase 1C PASS)
    prompt-01-spawn-physics-fix.md          (T3 — awaits Phase 1C PASS)
    prompt-04-ledger-replay.md              (T4 — awaits Phase 1C PASS)
    prompt-05-core-loop-excellence.md       (T5 — awaits Phase 1C PASS)
    prompt-06-content-pipeline.md           (T6 — awaits Phase 1C PASS)
    prompt-07-visual-overhaul.md            (T7 — awaits Phase 1C PASS)
    prompt-08-audio-pipeline.md             (T7 — awaits Phase 1C PASS)
    prompt-09-economy-farnzy.md             (T8 — awaits Phase 1C PASS)
    prompt-10-social-platform-liveops.md    (T9 — awaits Phase 1C PASS)

After Phase 1C PASS, run the session orchestrator with:
```
T1–T9 are now authorized. Begin T1.
Run prompts/tiers/prompt-02-mathematical-foundation.md.
```

---

# PART 13 — THE ONLY THING THAT MATTERS

The entire build system exists for one reason:

    The game must be a 100% skill-based competition.
    A frame drop is a legal violation.
    A float in a scoring path is a legal violation.
    An unverified PDX payout is a legal violation.

Everything in these 28 files — the SHA-256 chains, the audit cells,
the escalation model, the sacred core protections — exists to prevent
those three violations from ever reaching production.

When in doubt about any decision, ask:
"Does this change make it more or less likely that
a player could get a different outcome on different hardware?"

If more likely → it is a constitutional violation.
If less likely → it is progress toward AA+ production grade.

---

## End of Manual

Version 1.0.0
Covers 28 files through Conditional Pass authorization
Next update: after Phase 1C PASS, when T1–T9 prompts are built
