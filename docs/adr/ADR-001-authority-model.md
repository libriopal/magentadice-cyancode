AUDIT::PATHWAY_DEPS: all session execution references this model
AUDIT::CURRENT_GRADE: Grade B — authority model operational
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-001: Establish Five-Level Authority Model

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR

## Context

Multiple agents and documents were competing for authority over implementation decisions.
Without a defined hierarchy, every conflict became a judgment call.

## Decision

Adopt the five-level authority model defined in `mesh/authority-model.md`:
Human > Constitutional > Audit Runtime > Execution Runtime > Agent Output.
Conflicts resolve by position in this hierarchy, not by judgment.
Claude Code operates at Execution Runtime level (level 4 of 5).

## Consequences

No lower authority level may override a higher level.
Constitutional documents cannot be modified by Execution Runtime.
Sacred Core files are Propose Only — Execution Runtime may never write them.
PRs are proposals — Human merges in GitHub.

## Evidence

- `mesh/authority-model.md` v1.0.0
- `mesh/master_proof_of_value_audit_v2.md` — Conditional Pass audit

## Alternatives Considered

- Flat authority model: rejected — no clear conflict resolution
- Two-level (Human / Claude): rejected — audit cells need independent authority

## Proof of Value

| Metric | Score |
|---|---|
| Auditability | 9/10 |
| Constitutional alignment | 10/10 |
| Implementation risk | 10/10 |

## Human Sign-off

Approved by: Human — libriopal
Date: 2026-05-22
Signature: T0 PASS_PROPOSE_COMMIT (score 87/105)
