AUDIT::PATHWAY_DEPS: IEventStore interface, ReplayEvent.v1 contract, all event producers
AUDIT::CURRENT_GRADE: Grade B — event versioning spec defined
AUDIT::ENTROPY_VECTOR: medium — event schema changes affect replay chain
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-004: Establish Event Versioning Specification

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR

## Context

Game events are the atomic unit of replay. Without a versioned, immutable schema,
replay reconstruction is undefined behavior. A schema change without migration is
an audit chain break.

## Decision

Adopt the event versioning specification defined in `mesh/event-versioning-spec.md`.
Required fields: schema_version, event_type, replay_tick, predecessor_hash.
All currency amounts: Q32.32 fixed-point integers (DEFAULT_SCORE_MULTIPLIER_FIXED = 4294967296).
MAJOR version bump: Human + ADR required. MINOR: ADR before implementation.
SHA-256 predecessor hash links events into an immutable chain.

## Consequences

Floats in any scoring-affecting event field are a legal violation — FIXED_POINT_CHECK: FAIL.
Schema changes without ADR trigger Level 2 violation.
All amounts typed as `number` with comment `// Q32.32 fixed-point integer`.

## Evidence

- `mesh/event-versioning-spec.md` v1.0.0
- `mesh/hashing-strategy.md` v1.0.0 — SHA-256 for chain links

## Alternatives Considered

- JSON Schema only: rejected — no enforcement at write boundary
- Float amounts: rejected — legal violation for real-money sweepstakes

## Proof of Value

| Metric | Score |
|---|---|
| Auditability | 10/10 |
| Constitutional alignment | 10/10 |
| Implementation risk | 8/10 |

## Human Sign-off

Approved by: Human — libriopal
Date: 2026-05-22
Signature: T0 PASS_PROPOSE_COMMIT (score 87/105)
