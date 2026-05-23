<!--
AUDIT::PATHWAY_DEPS: docs/adr/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-001: Authority Model — Five-Level Precedence Hierarchy

Date: 2026-05-22
Status: Accepted
Tier Affected: Constitutional
Authority Required: Human

## Context

Without a defined authority hierarchy, conflicts between human instructions,
constitutional documents, audit findings, and agent output have no deterministic
resolution path. This ambiguity degrades governance.

## Decision

Adopt a five-level authority hierarchy in strict precedence order:
1. Human Authority (highest)
2. Constitutional Authority (mesh/ documents)
3. Audit Runtime Authority (6 virtual audit cells)
4. Execution Runtime Authority (Claude Code tier prompts)
5. Agent Output Authority (advisory only)

No lower level may override a higher level. Conflicts resolve by position,
not by judgment.

## Consequences

- Claude Code cannot self-merge PRs, approve Sacred Core changes, or deploy to production
- Audit cells can halt sessions (Level 2+) but cannot implement fixes
- Constitutional amendments require Human approval + ADR record

## Evidence

Source: mesh/authority-model.md v1.0.0
