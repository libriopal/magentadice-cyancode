<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-005: Snapshot Strategy — 60-Frame Block SHA-256 Chain

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR + chain migration test

## Context

Replaying an entire event log from genesis to reconstruct current state is
O(n) and impractical for long sessions. A snapshot strategy allows replay
to begin from any verified checkpoint.

## Decision

Snapshots are taken every 60 frames. Each snapshot includes:
- All active game state fields
- state_hash (SHA-256 of canonical state representation)
- predecessor_hash (SHA-256 of previous snapshot or genesis block)
- replay_tick at snapshot time

SHA-256 is used for all snapshot hashes (not BLAKE3) for external audit
compatibility. See ADR-008.

## Consequences

Replay can begin from any verified snapshot rather than genesis.
Chain integrity is verifiable by any third party with standard SHA-256 tools.
Snapshot format is Sacred Core — changes require chain migration test on full dataset.

## Evidence

Source: mesh/snapshot-strategy.md v1.0.0
