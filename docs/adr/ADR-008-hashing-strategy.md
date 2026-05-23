<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-008: Hashing Strategy — SHA-256 for Chain Hashes, BLAKE3 Internal Only

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR + major event schema version bump

## Context

Three constitutional documents referenced different hash algorithms
inconsistently: rng-lineage-spec.md referenced HMAC-SHA256; architecture
discussions referenced BLAKE3; snapshot-strategy.md referenced SHA-256.
This inconsistency degrades audit confidence and creates implementation risk.

## Decision

SHA-256 for ALL external chain links and audit-facing hashes:
- Event predecessor hash: SHA-256
- Snapshot predecessor hash: SHA-256
- PDX transaction signature: HMAC-SHA256 (per DELTA-VERIFY Article 2.3)
- RNG seed derivation: HMAC-SHA256 (per rng-lineage-spec.md)
- State hash: SHA-256

BLAKE3 permitted ONLY for internal acceleration (cache keys, dev tooling)
where output is NEVER stored in audit artifacts or chain links.

## Consequences

Any algorithm change to chain hashes requires a MAJOR event schema version bump.
This resolves the inconsistency across all prior constitutional references.

## Evidence

Source: mesh/hashing-strategy.md v1.0.0 (ADR-008 bootstrapped with that document)
