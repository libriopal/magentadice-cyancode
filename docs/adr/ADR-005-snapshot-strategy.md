AUDIT::PATHWAY_DEPS: InMemoryEventStore (T1C), replay test harness
AUDIT::CURRENT_GRADE: Grade B — snapshot strategy defined
AUDIT::ENTROPY_VECTOR: medium — snapshot hash chain must remain consistent with event chain
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

# ADR-005: Establish Snapshot Checkpoint Strategy

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR

## Context

Full replay from genesis is expensive for long sessions. Snapshots allow partial replay
from a checkpoint. Without a defined snapshot strategy, checkpoint integrity is undefined.

## Decision

Adopt the snapshot strategy defined in `mesh/snapshot-strategy.md`.
Checkpoint frequency: every 60 frames (1 block).
State hash: SHA-256 of deterministically serialized game state (recursive key-sorted JSON).
Predecessor hash: SHA-256 of previous snapshot's hash — creating a snapshot chain.
Partial replay: SESSION seed + input log from snapshot point → must match stored hash.

## Consequences

Snapshot state hash uses deterministicSerialize() — recursive key-sorted, not shallow.
Any checkpoint frequency change requires: ADR before implementation.
Replay from snapshot must produce matchesStoredHash === true.

## Evidence

- `mesh/snapshot-strategy.md` v1.0.0
- `mesh/hashing-strategy.md` v1.0.0 — SHA-256 for state hash

## Alternatives Considered

- BLAKE3 for state hash: rejected — not audit-facing safe per hashing-strategy.md
- Variable checkpoint frequency: rejected — requires ADR per change

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
