<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-002: Sacred Core — Enumerated Immutable Files

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR + Monte Carlo (for payout_math changes)

## Context

Vague "protect core logic" policies are unenforceable because "core logic"
is undefined. FAR_NZY requires explicit enumeration of protected files so
that governance is deterministic, not interpretive.

## Decision

Establish an explicit Sacred Core Inventory:
- **rng**: csprng.ts — HMAC-SHA256 seed chain
- **payout_math**: farkleScorer.ts, rtpConfig.ts, monteCarlo.ts — Q32.32 fixed-point
- **ledger_state**: PDX/FD/SDX Supabase tables and blockchain records
- **replay_hash_chain**: 60-frame block format, SHA-256 predecessor links
- **event_signatures**: IEventStore interface, schema_version/replay_tick/predecessor_hash
- **game_state_authority**: farkleStore.ts, gameStore.ts — state shape and transitions

All Sacred Core changes require Human approval. Execution Runtime is PROPOSE ONLY.
Anything not on this list is NOT sacred.

## Consequences

Claude Code must read sacred-core-spec.md before any session.
Violation = Level 3 Critical Violation → immediate session halt.

## Evidence

Source: mesh/sacred-core-spec.md v1.0.0
