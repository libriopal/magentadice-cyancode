<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-003: RNG Lineage — HMAC-SHA256 Seed Derivation Chain

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR + full RNG lineage re-verification

## Context

FAR_NZY is a skill-based sweepstakes competition. Any randomness that affects
scoring or payout must be provably deterministic, reproducible, and tamper-evident.
Math.random() is cryptographically weak and non-reproducible across sessions.

## Decision

All game randomness uses a four-level HMAC-SHA256 seed derivation chain:
genesis seed → session seed → game seed → event seed.

Math.random() is banned in any path that affects scoring, payout, or game state.
Detection triggers FIXED_POINT_CHECK: FAIL → Level 3 → immediate halt.

The seeded CSPRNG (csprng.ts) is Sacred Core. Changes require this ADR to be
superseded and a new RNG lineage verification to be completed.

## Consequences

Every game event's random output is reproducible from the genesis seed.
Full game sessions can be replayed deterministically from seed + event log.

## Evidence

Source: mesh/rng-lineage-spec.md v1.0.0
