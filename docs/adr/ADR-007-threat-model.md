AUDIT::PATHWAY_DEPS: PDX payout path, hardware attestation, blockchain event handling
AUDIT::CURRENT_GRADE: Grade B — threat model documented
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-007: Establish Threat Model

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR

## Context

A real-money sweepstakes platform is a high-value attack target.
Without a documented threat model, security decisions are ad-hoc and
compliance attestations are unsubstantiated.

## Decision

Adopt the threat model defined in `mesh/threat-model.md` v1.1.0.
Primary threats: replay tampering, RNG manipulation, PDX payout fraud,
SHA-256 chain attack (low severity — computationally infeasible).
Mitigations: hardware attestation for PDX, blockchain confirmation for SDX,
HMAC-SHA256 for RNG seeds, SHA-256 chain for event integrity.
PDX_AWARD events rejected at IEventStore.write() if attestation absent or invalid.
SDX balance may not update until blockchain confirmation received.

## Consequences

Play Integrity API required for PDX payout path (Android) — absent until T2 (L1 finding).
KYC and AgeGate enforcement requires backend (not UI-only) — absent until T2 (L1 finding).
Any threat model amendment requires ADR + Human sign-off.

## Evidence

- `mesh/threat-model.md` v1.1.0
- `mesh/hashing-strategy.md` v1.0.0
- T0 baseline audit: 5 L1 security findings deferred to T2/T3/T4

## Alternatives Considered

- BLAKE3 chain: rejected — SHA-256 is more auditor-familiar per hashing-strategy.md
- Optimistic PDX payout: rejected — legal violation for sweepstakes

## Proof of Value

| Metric | Score |
|---|---|
| Auditability | 9/10 |
| Constitutional alignment | 10/10 |
| Implementation risk | 8/10 |

## Human Sign-off

Approved by: Human — libriopal
Date: 2026-05-22
Signature: T0 PASS_PROPOSE_COMMIT (score 87/105)
