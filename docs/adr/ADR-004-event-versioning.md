<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-004: Event Versioning — Semantic Schema Versioning for IEventStore

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR (major version bumps)

## Context

Game events are stored in an append-only log used for replay and audit.
Schema changes to event fields break replay of historical events if not
versioned. A float in a scoring path is a legal violation; a missing
schema_version field makes audit impossible.

## Decision

All events must carry: schema_version, event_type, replay_tick, predecessor_hash.
Minor additions (new optional fields) require ADR draft only.
Major changes (field removal, type change, required field addition) require
Human approval + ADR + migration adapter written + hashing-strategy.md updated.

## Consequences

IEventStore.write() rejects events missing required fields.
PDX_AWARD events additionally require hardware attestation verdict 'PASS'.
Event schema is Sacred Core — Execution Runtime is PROPOSE ONLY.

## Evidence

Source: mesh/event-versioning-spec.md v1.0.0
