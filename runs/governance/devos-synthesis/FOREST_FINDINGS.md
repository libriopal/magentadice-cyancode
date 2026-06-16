# FOREST_FINDINGS.md
# Phase 3 — FOREST Investigation
# Generated: 2026-06-14

---

## What FOREST is (evidence)

`forest/forest_simulator.mjs` — a pure-Node evolutionary fitness evaluator.
Evolves 4 engine populations (FF, MC, OWC, AG × N candidates) over K epochs.
Scores candidates on: legal(0.26) + unbroken(0.20) + rtp(0.20) + compat(0.14) +
completeness(0.12) + retention(0.08). Hard penalties for sacred-source-truth violations.

---

## Usage frequency

Git commits touching `forest/`: **0**
Session log references to forest: **0**
Sprint roadmap references to forest output: **0**

The forest output directory contains: `best_bundle.json`, `best_bundle.md`, `history.json`.
This indicates one manual run occurred. It is not recorded in any session log.

---

## What information FOREST actually generated

From `forest/out/best_bundle.md` (the actual output):

```
score=100
seed=42
epochs=5
populationPerSpecies=1000

FF=98.29, MC=100, OWC=96.10, AG=98.58

Next Human-Code Phase:
1. Audit/fix payout source in GameRoom endSession paths.
2. Wire sandbox WS RUN_SIM to runMonteCarloV2.
3. Add reproducibility proof for same seed.
```

This matches `codex_prototypes/selection.md` Phase 1 recommendation exactly:
> "Phase A: P09 → P02 — fixes truth before tuning"

**FOREST confirmed the already-selected direction.** It produced no new information.

---

## Why FOREST produced no new information

The simulator was seeded from `codex_index.md` + `codex_prototypes/selection.md`.
The fitness function encodes the same constraints as the source-truth documents.
When you run an optimizer seeded from a known-good solution with a fitness function
encoding that same solution's constraints, it converges to that solution quickly.

This is the same structural problem found in Gate 3: the metric was circular.
FOREST is circular in the same way — it validates what was already decided.

Score=100 in 5 epochs is a signal, not a result. It means the starting genome
was already at or near the fitness optimum as defined by the fitness function.

---

## What FOREST would need to generate real value

1. A fitness function derived from DIFFERENT evidence than the selection document
   (e.g., runtime telemetry, real RTP measurements, user retention data)
2. A larger mutation space that explores genuinely unexpected directions
3. Running AFTER implementation, not before — to validate that live behavior
   matches architectural fitness predictions
4. Cross-epoch tracking to see where candidates diverge and converge

None of these exist currently.

---

## Verdict

FOREST has not changed a single recorded decision in this project.
Its output is circular confirmation of the already-selected architecture.
A first-class FOREST dashboard would visualize circular information.

**Recommendation: REMOVE from v1 DevOS scope. DELAY until:**
1. Live telemetry exists to seed a non-circular fitness function
2. At least one architectural decision was changed by a FOREST run
3. The simulator is run more than once per architecture revision

**FOREST is a planning validation tool for major architectural pivots.**
It should run once per strategic review cycle, not per development session.
It does not need a dashboard. It needs a clear trigger condition.

**Evidence threshold not met for first-class FOREST panel.**
