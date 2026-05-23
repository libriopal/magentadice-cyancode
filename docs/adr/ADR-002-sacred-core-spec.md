AUDIT::PATHWAY_DEPS: all tier sessions check this before any file modification
AUDIT::CURRENT_GRADE: Grade B — sacred core boundary enforced
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-002: Define Sacred Core Inventory

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR + Monte Carlo

## Context

"Sacred" was a vague concept applied inconsistently across discussions.
Ambiguous protection degrades governance — auditors cannot enforce what they cannot enumerate.

## Decision

Adopt the explicit enumerated Sacred Core inventory defined in `mesh/sacred-core-spec.md`.
Sacred files: csprng.ts, farkleScorer.ts, rtpConfig.ts, monteCarlo.ts, farkleStore.ts, gameStore.ts.
Protected elements: RNG algorithm, payout math, ledger state, replay hash chain, event signatures, game state authority.
Any modification requires: ADR + Human approval + (Monte Carlo pass for payout_math changes).
Anything not on the sacred list is NOT sacred.

## Consequences

Execution Runtime may NEVER write sacred files — propose only.
Visual, audio, content, presentation, and infrastructure files are explicitly NOT sacred.
A particle effect may read farkleStore but must never compute game state.

## Evidence

- `mesh/sacred-core-spec.md` v1.0.0
- `mesh/master_proof_of_value_audit_v2.md`

## Alternatives Considered

- Directory-based protection: rejected — too coarse, legitimate files in same dir
- Tag-based in code: rejected — modifiable by Execution Runtime, defeats purpose

## Proof of Value

| Metric | Score |
|---|---|
| Auditability | 10/10 |
| Constitutional alignment | 10/10 |
| Implementation risk | 9/10 |

## Human Sign-off

Approved by: Human — libriopal
Date: 2026-05-22
Signature: T0 PASS_PROPOSE_COMMIT (score 87/105)
