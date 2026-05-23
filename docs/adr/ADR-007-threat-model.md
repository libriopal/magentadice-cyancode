<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-007: Threat Model — v1.1.0

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR

## Context

FAR_NZY handles real-money PDX sweepstakes and blockchain SDX assets.
Without a documented threat model, security engineering lacks a shared
reference for what attack surfaces are in scope.

## Decision

Adopt threat-model.md v1.1.0 as the authoritative security reference.
The threat model covers: replay tampering, RNG seed exposure, PDX
ledger manipulation, hardware attestation bypass, and client-side
score manipulation.

SHA-256 chain attack is rated low severity (computationally infeasible)
per hashing-strategy.md (see ADR-008).

## Consequences

All security engineering decisions must reference the threat model.
New threat categories require Human approval + ADR amendment.

## Evidence

Source: mesh/threat-model.md v1.1.0, mesh/threat-model-v2.md
