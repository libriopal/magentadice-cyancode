# ADR GOVERNANCE
## FAR_NZY / magentadice-cyancode
## Document: adr-governance.md
## Status: Constitutional — this document is itself an ADR governance record

---

## Principle

Constitutional changes without a recorded rationale
are not constitutional changes — they are undocumented mutations.

The ADR system creates replayable design history:
every significant decision has an immutable record of
what was decided, why, and what the evidence was.
This is the design equivalent of the SHA-256 event chain.

---

## ADR Storage

```
docs/
└── adr/
    ├── ADR-000-adr-governance.md       (this document, bootstrapped)
    ├── ADR-001-authority-model.md
    ├── ADR-002-sacred-core-spec.md
    ├── ADR-003-rng-lineage.md
    ├── ADR-004-event-versioning.md
    ├── ADR-005-snapshot-strategy.md
    ├── ADR-006-agent-escalation.md
    ├── ADR-007-threat-model.md
    └── ADR-NNN-[kebab-title].md
```

ADR numbers are sequential and never reused.
A deprecated ADR is marked superseded, not deleted.

---

## ADR Format

```markdown
# ADR-NNN: [Short Imperative Title]

Date: YYYY-MM-DD
Status: Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-MMM
Tier Affected: T0–T9 (or "Constitutional")
Authority Required: Human | Human + ADR | Human + ADR + Monte Carlo

## Context

What problem or decision does this address?
What is the current state that makes this decision necessary?

## Decision

What was decided?
State this as a clear, implementable directive.

## Consequences

What becomes true after this decision?
What is made easier? What becomes harder?
What future decisions does this constrain?

## Evidence

Cited sources:
- Document name and version
- Measured data (frame times, RTP results, etc.)
- Industry benchmark source

## Alternatives Considered

What other options were evaluated and why were they rejected?

## Proof of Value

| Metric | Score |
|---|---|
| Auditability | N/10 |
| Constitutional alignment | N/10 |
| Implementation risk | N/10 |

## Human Sign-off

Approved by: [Human — libriopal]
Date: YYYY-MM-DD
Signature (optional): [git commit hash of approval commit]
```

---

## Required ADR Triggers

The following changes REQUIRE an ADR before implementation:

| Change Type | ADR Trigger |
|---|---|
| Any change to `sacred-core-spec.md` | Immediate |
| Any change to `authority-model.md` | Immediate |
| Any MAJOR event schema version bump | Immediate |
| Any MINOR event schema version bump | Before implementation |
| New tier added or removed | Immediate |
| MCP assignment changed | Before implementation |
| RNG lineage formula changed | Immediate + Monte Carlo |
| Snapshot checkpoint frequency changed | Before implementation |
| Escalation level trigger added or removed | Immediate |
| Claude authority model changed | Immediate |
| Phase 1A/1B/1C scope changed | Before implementation |
| New Sacred Core file added | Immediate |
| Existing Sacred Core file removed | Immediate + Human sign-off |
| New ADR trigger added to this list | Immediate (meta-ADR) |

---

## ADR Lifecycle

```
1. Agent Output proposes ADR (draft in docs/adr/ADR-NNN-title.md)
2. Contradiction Hunter reviews for conflicts with existing ADRs
3. Governance Auditor reviews for constitutional alignment
4. Human reviews and approves or vetoes
5. If approved: status → "Accepted", git commit records approval
6. If rejected: status → "Rejected", reason documented, ADR archived
7. If superseded: old ADR status → "Superseded by ADR-MMM"
```

An ADR in "Proposed" status has no constitutional force.
An ADR becomes constitutional only when status is "Accepted" and Human has signed off.

---

## ADR Index (Bootstrap)

| ADR | Title | Status | Tier |
|---|---|---|---|
| ADR-000 | ADR Governance | Accepted (bootstrapped) | Constitutional |
| ADR-001 | Authority Model v1.0.0 | Pending Human Review | Constitutional |
| ADR-002 | Sacred Core Specification v1.0.0 | Pending Human Review | Constitutional |
| ADR-003 | RNG Lineage Doctrine v1.0.0 | Pending Human Review | Constitutional |
| ADR-004 | Event Versioning v1.0.0 | Pending Human Review | Constitutional |
| ADR-005 | Snapshot Strategy v1.0.0 | Pending Human Review | Constitutional |
| ADR-006 | Agent Escalation Model v1.0.0 | Pending Human Review | Constitutional |
| ADR-007 | Threat Model v1.0.0 | Pending Human Review | Constitutional |

All ADR-001 through ADR-007 are pending the PASS decision on the master audit.
Upon PASS, all are marked Accepted with the date of approval.

---

## ADR Numbering Convention

- 000–099: Constitutional ADRs (authority, sacred core, governance)
- 100–199: Architecture ADRs (tier structure, MCP assignment, file architecture)
- 200–299: Implementation ADRs (specific technical decisions per tier)
- 300–399: Security ADRs (threat model updates, security posture changes)
- 400+: Operational ADRs (LiveOps, economy, content decisions)

---

## Version

adr-governance.md v1.0.0
ADR-000 (bootstrapped — no prior ADR required for the governance system itself)
Effective: at plan approval
Change authority: Human only
Any change to this document generates a new meta-ADR
