# AUTHORITY MODEL
## FAR_NZY / magentadice-cyancode
## Document: authority-model.md
## Status: Constitutional — changes require ADR + human approval

---

## Precedence Hierarchy

    Human Authority
      >
    Constitutional Authority
      >
    Audit Runtime Authority
      >
    Execution Runtime Authority
      >
    Agent Output Authority

No lower level may override a higher level.
Conflicts resolve by position, not by judgment.

---

## Level Definitions

### Human Authority (Highest)

Holder: You (libriopal)

Exclusive actions — no other level may perform these:
- Approve or veto any plan, audit, or build
- Amend the constitutional layer (requires ADR)
- Approve Sacred Core changes (requires Monte Carlo pass)
- Authorize production deployment
- Override any audit cell halt
- Approve scrap decisions
- Modify this authority model (requires ADR)

### Constitutional Authority

Holders: These documents, in order:
1. `mesh/authority-model.md` (this file)
2. `mesh/sacred-core-spec.md`
3. `mesh/rng-lineage-spec.md`
4. `mesh/threat-model.md`
5. `mesh/hashing-strategy.md`
6. `3libras/the_visual_layer.md`
1. `authority-model.md` (this file)
2. `sacred-core-spec.md`
3. `rng-lineage-spec.md`
4. `event-versioning-spec.md`
5. `snapshot-strategy.md`
6. `threat-model.md`

Actions:
- Define what is sacred and what is not
- Set tier law and dependency order
- Define governance rules
- Set performance gates
- Define visual constitution

Limitations:
- Cannot be modified by Execution Runtime or Agent Output
- Amendments require Human approval + ADR record

### Audit Runtime Authority

Holders: The 6 Virtual Audit Cells (sequential, defined in `mesh/audit-cells-all-six.md`; escalation levels defined in `mesh/agent-escalation-model.md`)
Holders: The 6 Virtual Audit Cells (sequential; see mesh/EXECUTE.md and mesh/session-runner.md)

Actions:
- Halt a session (Levels 2–4 per escalation model; see mesh/agent-escalation-model.md and docs/adr/ADR-006-agent-escalation.md)
- Flag violations in handoff artifacts
- Propose fixes (cannot implement them)
- Score sessions against 8-dimension rubric
- Write post-mortems to `runs/` and `sessions/session-log.md`

Limitations:
- Cannot write code
- Cannot commit changes
- Cannot approve changes
- Cannot open PRs
- Proposals require Human approval before Execution Runtime acts

### Execution Runtime Authority

Holder: Claude Code (tier prompts)

Actions:
- Create files
- Create branches (`tier/TN-name-YYYYMMDD`)
- Draft PRs (Proposal Only — requires Human approval to merge)
- Run tests and scripts
- Install packages within approved tier scope
- Write to `core/art/profiling/`, `core/art/manifest/`, `runs/`, `sessions/`, `handoff/`
- Write to `core/art/profiling/`, `core/art/manifest/`, `handoff/`, `runs/`, `sessions/`

Limitations:
- PRs are proposals, not actions. Cannot self-merge.
- Cannot modify constitutional files
- Cannot modify Sacred Core files (propose only)
- Cannot deploy to production
- Cannot modify this document
- Cannot override audit cell halts

### Agent Output Authority (Lowest)

Holder: Any recommendation or strategic suggestion by Claude Code

Actions:
- Recommend approaches
- Propose constitutional amendments (flagged as proposals)
- Ask clarifying questions
- Label recommendations: implement_now / prototype_next / defer_until_gate / reject

Limitations:
- All output at this level is advisory
- No implementation authority
- Treated with the lowest trust weight in conflict resolution

---

## Conflict Resolution Rules

| Conflict | Resolution |
|---|---|
| Human instruction conflicts with Constitution | Human wins. ADR required if amending Constitution. |
| Constitution conflicts with Audit finding | Constitution wins. Audit flags for human review. |
| Audit halt conflicts with Execution progress | Audit wins. Session halted until Human decides. |
| Execution output conflicts with Agent proposal | Execution wins. Agent proposal is advisory only. |
| Two constitutional documents conflict | Higher position in precedence list wins. |

---

## Authority Over Specific Actions

| Action | Minimum Authority Required |
|---|---|
| Read any file | Execution Runtime |
| Write non-sacred file | Execution Runtime |
| Create branch | Execution Runtime |
| Draft PR | Execution Runtime |
| Merge PR | Human |
| Modify sacred-core-spec.md | Human + ADR |
| Modify authority-model.md | Human + ADR |
| Modify event schema (major) | Human + ADR |
| Halt session | Audit Runtime (Level 2+) |
| Override session halt | Human only |
| Approve scrap | Human only |
| Deploy to production | Human only |
| Run Monte Carlo harness | Execution Runtime |
| Approve Monte Carlo result | Human |

---

## Amendment Process

1. Agent Output proposes amendment with evidence
2. Contradiction Hunter (audit-cell-04) reviews for constitutional conflicts
3. Governance Auditor (audit-cell-03) endorses or flags
2. Contradiction Hunter (audit cell 04; see mesh/audit-cell-04-contradiction-hunter.md) reviews for constitutional conflicts
3. Governance Auditor (audit cell 03; see mesh/audit-cell-03-governance-auditor.md) endorses or flags
4. Human approves or vetoes
5. If approved: ADR written, document updated, version bumped
6. New version referenced in memory MCP

---

## Version

authority-model.md v1.0.0
Effective: 2026-05-22
Next review: at any constitutional amendment

---

## Session Confirmation

Confirmed as constitutional baseline during session `feat/godot-deprecation-20260522` (2026-05-22).
No amendments required — ADR-009 is compliant with authority hierarchy.
Human Constitutional Directive `full-godot-removal.md` received and acted upon per authority levels above.
