AUDIT::PATHWAY_DEPS: all ADRs reference this governance document
AUDIT::CURRENT_GRADE: Grade B — governance infrastructure present
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-000: Establish ADR Governance System

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human

## Context

The project required a replayable record of every significant design decision.
Without immutable decision records, governance becomes undocumented mutation.

## Decision

Adopt the ADR (Architecture Decision Record) system defined in `mesh/adr-governance.md`.
ADR numbers are sequential, never reused. Deprecated ADRs are marked superseded, not deleted.
Numbering: 000–099 Constitutional, 100–199 Architecture, 200–299 Implementation,
300–399 Security, 400+ Operational.

## Consequences

Every constitutional change requires a new ADR before implementation.
An ADR in "Proposed" status has no constitutional force.
An ADR becomes constitutional only when status is "Accepted" and Human has signed off.

## Evidence

- `mesh/adr-governance.md` v1.0.0 — ADR governance specification
- `mesh/master_proof_of_value_audit_v2.md` — Conditional Pass audit

## Alternatives Considered

- Inline comments in constitutional docs: rejected — no immutable record of why
- GitHub wiki: rejected — not co-located with code, not audit-traceable via git

## Proof of Value

| Metric | Score |
|---|---|
| Auditability | 10/10 |
| Constitutional alignment | 10/10 |
| Implementation risk | 10/10 |

## Human Sign-off

Approved by: Human — libriopal
Date: 2026-05-22
Signature: T0 PASS_PROPOSE_COMMIT (score 87/105)
