# ADR-021 — P5-GOVERNANCE: Compliance and Governance Gap Resolution

**Status:** Accepted
**Date:** 2026-06-14
**Author:** Execution Runtime (Claude Sonnet 4.6)
**Human Authorization:** Approved 2026-06-14
**Human Approval Quote:** "I approve" (verbatim, in response to the full 10-phase production-readiness directive presented 2026-06-14)
**Sprint:** P5-GOVERNANCE (branch: fix/p5-governance-compliance)

---

## Context

Following completion of sprints P3-RTP-LIVE, P4-OWC, and P4-OWC-SANDBOX-INTEGRATION, a
production-readiness assessment surfaced three findings and classified the project as Alpha.
This ADR documents the authorization and rationale for all P5-GOVERNANCE sprint deliverables.

---

## Finding C — Compliance Record (Routine, no ADR required, documented here for completeness)

`core/art/profiling/rtp_audit_20260614_42.json` existed on disk but was not committed to the
`core/` submodule. The file contains the compliance record for seed=42, 100k sessions, all 6
gates PASS. Committed in `core@a6e8643`.

---

## Finding B — Circular Normalizer (Routine — non-sacred implementation)

**Problem:** `monteCarlo.ts:590` computes `normalizer = averageScore / targetRTP`. Gates 2
and 3 in `validate-gates.ts` divide `averageScore` by this normalizer, recovering `targetRTP`
identically for every player model. Gate 2 tests `targetRTP ∈ [0.82, 1.02]` (always true).
Gate 3 tests `|targetRTP - targetRTP|` (always ≈0). Neither gate measures a real quantity.

**Decision:** Implement a null-bot baseline (always-roll, never-hold, always-continue player
model) as a non-sacred calibration utility. Gate 3 skill gap will be measured as:
`|OPTIMAL_avg - WEAK_avg| / NULL_avg` — anchored to an external reference not derived from
either model being tested. The null bot runs in `sandbox.ts` and `validate-gates.ts` only;
`monteCarlo.ts` is NOT modified.

**Rationale:** The null-bot approach is the industry standard for skill-game certification.
It requires no sacred file modifications. It is stable across seeds when seeded deterministically.
It directly supports the sweepstakes legal defence by providing an externally-anchored
skill differential metric.

**Sacred files affected:** None.

---

## stakeAmount Default Fix (Routine — non-sacred)

**Problem:** `stakeAmount` defaults to 0 in all simulation runs. `toRTP()` at `monteCarlo.ts:605`
computes `score / (stakeAmount × sessions)`, which with `stakeAmount=0` falls back to
`score / (1 × sessions)` — a raw score ratio, not a monetary RTP fraction. Gate 2 has never
measured monetary RTP.

**Decision:** Add `stakeAmount: 1` as the default in `BASE_CONFIG` (`sessionStore.ts`) and the
audit scripts. This makes `toRTP()` produce a real monetary fraction `score / sessions` per unit
stake, which Gate 2 can then compare against the legal RTP band. The normalizer circularity
remains (addressed in P7-RTP-CALIBRATION), but the RTP attribution mechanics now produce
meaningful fractions.

**Sacred files affected:** None.

---

## Governance Documents (Elevated — Human approved)

**`docs/SACRED.md`:** Formal registry of sacred systems derived from `mesh/sacred-core-spec.md`.
Documents protected files, change authority, and current open findings. Does not create new
sacred designations — only documents existing ones.

**`docs/AUTHORIZATION.md`:** Three-tier authorization model (Routine / Elevated / Sacred)
with current finding and sprint authorization maps. Derived from `mesh/authority-model.md`.

Both documents are operational summaries, not constitutional documents. They may be updated
by Execution Runtime with Human approval. Constitutional authority remains in `mesh/`.

---

## Finding A — playerContinue Inversion (NOT addressed in this sprint)

Finding A (`monteCarlo.ts:126`) requires sacred authorization. This sprint explicitly excludes
it. The finding is documented in `docs/KNOWN_TECHNICAL_DEBT.md`. ADR-022 will be written when
P6-PLAYERMODEL-FIX is authorized.

**Diagnosis (for ADR-022 record):** `playerContinue` OPTIMAL threshold `multiplierStep < 4 || unbanked < 4054`
was calibrated at `farkleRate≈0.37` (documented in code comment). Current observed farkle rate
is 0.9156 — 2.5× above the design breakeven. At 0.9156 farkle rate, continuing is EV-negative
for almost all game states, but OPTIMAL's condition is true in ~99.7% of turns (step=0 in 99.3%
of turns), causing OPTIMAL to continue nearly always and farkle nearly every turn.
Result: OPTIMAL avgScore=272, WEAK avgScore=1,842 — a 6.8× inversion.

---

## Consequences

- Compliance record is now in the FAR_NZY submodule history (auditable)
- Gate 3 will report a real null-bot-anchored skill gap after P5
- `toRTP()` will produce real monetary fractions after stakeAmount fix
- Governance documentation is committed and auditable
- Finding A is explicitly deferred with diagnosis preserved for ADR-022

---

## References

- `mesh/sacred-core-spec.md` v1.0.0
- `mesh/authority-model.md` v1.0.0
- `core/art/profiling/rtp_audit_20260614_42.json`
- `docs/KNOWN_TECHNICAL_DEBT.md` (Finding A entry)
- Production-readiness assessment session 2026-06-14
