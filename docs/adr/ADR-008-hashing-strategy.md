AUDIT::PATHWAY_DEPS: event chain, snapshot chain, RNG seed derivation, PDX transaction signatures
AUDIT::CURRENT_GRADE: Grade B — hashing strategy resolved
AUDIT::ENTROPY_VECTOR: none — documentation only; changes would require MAJOR schema bump
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-008: Resolve Hashing Algorithm Inconsistency

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR

## Context

Three documents referenced different hashing algorithms inconsistently:
rng-lineage-spec.md → HMAC-SHA256; architecture discussions → BLAKE3;
snapshot-strategy.md → SHA-256. This ambiguity compromises audit reproducibility.

## Decision

Adopt the hashing strategy defined in `mesh/hashing-strategy.md` v1.0.0:
SHA-256 for all external chain links and audit-facing hashes.
HMAC-SHA256 for RNG seed derivation and PDX transaction signatures.
BLAKE3 permitted for internal acceleration only (never stored, never in audit artifacts).

| Use Case | Algorithm |
|---|---|
| Event predecessor hash | SHA-256 |
| Snapshot predecessor hash | SHA-256 |
| PDX transaction signature | HMAC-SHA256 |
| RNG seed derivation | HMAC-SHA256 |
| State hash (snapshot.state_hash) | SHA-256 |
| Internal replay acceleration | BLAKE3 (optional) |

## Consequences

Any change to chain hash algorithm requires MAJOR event schema version bump.
All SHA-256 uses: Node.js native `crypto` module (no external dependency).
BLAKE3 output must never be promoted to audit-facing path without SHA-256 conversion.

## Evidence

- `mesh/hashing-strategy.md` v1.0.0
- `mesh/rng-lineage-spec.md` v1.0.0
- `mesh/snapshot-strategy.md` v1.0.0
- SHA-256: FIPS 180-4, universally auditor-familiar

## Alternatives Considered

- BLAKE3 everywhere: rejected — less auditor-familiar, not suitable for legal contexts
- SHA-512: rejected — overkill, same trust level as SHA-256 for this use case

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
