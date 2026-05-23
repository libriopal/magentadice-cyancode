<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-006: Agent Escalation Model — Five-Level Halt Protocol

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human + ADR

## Context

An audit cell that can only flag but never halt is commentary, not governance.
Without defined escalation paths, the audit system has no real authority.

## Decision

Five escalation levels with deterministic triggers and actions:
- L0 OBSERVATION: log, continue, no Human notification
- L1 FINDING: log, reduce session score, include in summary, continue
- L2 VIOLATION: PAUSE, present to Human, WAIT — do not continue until Human decides
- L3 CRITICAL VIOLATION: HALT, roll back to last clean commit, WAIT for Human restart
- L4 EXECUTION HALT: FULL STOP, roll back all, constitutional review required

Level 2+ violations are NOT self-resolvable. No timeout. No default resolution.

## Consequences

Claude Code will pause or halt mid-session when violations are detected.
This is by design — correctness over completeness.

## Evidence

Source: mesh/agent-escalation-model.md v1.0.0
