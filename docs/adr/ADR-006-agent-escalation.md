AUDIT::PATHWAY_DEPS: all audit cells, session-runner.md, EXECUTE.md
AUDIT::CURRENT_GRADE: Grade B — escalation model operational
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-006: Establish Agent Escalation Model

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR

## Context

An audit cell that can only flag but never halt is commentary, not governance.
Without defined escalation authority, audit findings are advisory and ignorable.

## Decision

Adopt the five-level escalation model in `mesh/agent-escalation-model.md`:
L0 (Observation) → L1 (Finding) → L2 (Violation) → L3 (Critical) → L4 (Halt).
L2+: session pauses, Human decides before continuation.
L3: immediate halt, rollback to last clean commit.
L4: full stop, constitutional review required.
Governance Auditor and Determinism Verifier can trigger L4 unilaterally.
Other cells require two concurrent L3 findings to trigger L4.

## Consequences

FIXED_POINT_CHECK: FAIL always triggers L3 regardless of session score.
Sacred Core write without approval triggers L3.
Session score 50–69 triggers L2 (PAUSE_ASK verdict).
Session score <50 triggers L3 (SCRAP_RECOMMENDED verdict).

## Evidence

- `mesh/agent-escalation-model.md` v1.0.0
- `mesh/master_proof_of_value_audit_v2.md`

## Alternatives Considered

- Advisory-only model: rejected — creates no enforcement authority
- Human-only escalation: rejected — too slow for real-time session governance

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
