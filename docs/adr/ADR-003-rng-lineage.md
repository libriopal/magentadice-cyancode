AUDIT::PATHWAY_DEPS: csprng.ts (Sacred Core — read only), farkleScorer.ts (Sacred Core — read only)
AUDIT::CURRENT_GRADE: Grade B — RNG lineage documented
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-003: Establish RNG Lineage Doctrine

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR + Monte Carlo

## Context

A skill-based sweepstakes platform requires deterministic, auditable randomness.
Math.random() is non-deterministic and non-auditable — a legal violation in this context.
The RNG seed derivation chain must be reproducible from a known genesis point.

## Decision

Adopt the HMAC-SHA256 seed derivation chain defined in `mesh/rng-lineage-spec.md`:
- Seed_Genesis: HMAC-SHA256(ServerSecret, RoomID ∥ TimestampMs)
- Seed_Session: HMAC-SHA256(Seed_Genesis, SessionID)
- Seed_Game: HMAC-SHA256(Seed_Session, GameID)
- Seed_Event: HMAC-SHA256(Seed_Game, EventIndex)

Math.random() is banned in any scoring-affecting code path.
Detection triggers FIXED_POINT_CHECK: FAIL → Level 3 halt.

## Consequences

All randomness must use the seeded DeterministicPRNG in csprng.ts.
Any RNG lineage path modification requires: ADR + full re-verification + Monte Carlo pass.
Replay is possible from SESSION seed + input log.

## Evidence

- `mesh/rng-lineage-spec.md` v1.0.0
- `mesh/master_proof_of_value_audit_v2.md`
- HMAC-SHA256: FIPS 198-1 compliant

## Alternatives Considered

- ChaCha20: rejected — HMAC-SHA256 is simpler, auditor-familiar, no new dependency
- UUID v4 seeds: rejected — not deterministically derivable

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
