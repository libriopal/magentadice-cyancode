<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-000: ADR Governance System

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human

## Context

Constitutional changes without recorded rationale are undocumented mutations.
FAR_NZY requires a replayable design history equivalent to the SHA-256 event
chain for engineering decisions. Every significant architectural or legal
decision must have an immutable record.

## Decision

Adopt an Architecture Decision Record (ADR) system stored in `docs/adr/`.
ADR numbers are sequential and never reused. Deprecated ADRs are marked
superseded, not deleted. This document (ADR-000) is the bootstrapping record
and governs all subsequent ADRs.

## Consequences

All constitutional amendments require a corresponding ADR before taking effect.
Execution Runtime (Claude Code) may draft ADRs but cannot self-accept them.
Human Authority is required to accept any ADR.

## Evidence

Established at T0 baseline audit session 2026-05-22.
Source: mesh/adr-governance.md
