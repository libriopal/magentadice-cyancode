# AGENT ESCALATION MODEL
## FAR_NZY / magentadice-cyancode
## Document: agent-escalation-model.md
## Status: Constitutional — changes require ADR + Human approval

---

## Principle

Without a defined escalation path, governance becomes advisory.
An audit cell that can only flag but never halt
is not governance — it is commentary.

The escalation model gives audit cells real authority
while keeping Human authority supreme.

---

## The Five Escalation Levels

```text
Level 0: OBSERVATION
  ↓
Level 1: FINDING
  ↓
Level 2: VIOLATION
  ↓
Level 3: CRITICAL VIOLATION
  ↓
Level 4: EXECUTION HALT
```

Each level has defined triggers, actions, and human notification requirements.

---

## Level 0 — OBSERVATION

**Definition:** Something worth noting but not worth interrupting.

**Triggers:**
- Style inconsistency with design_tokens.json
- Suboptimal but valid approach (e.g., useFrame when useRef would be faster)
- Minor documentation gap
- Unused import or variable
- MCP used in a tier where it is not assigned but not harmful

**Actions:**
- Log to handoff artifact with tag `[L0-OBSERVATION]`
- Continue session without interruption
- Include in session score (may reduce Regression Count dimension by 1pt)

**Human notification:** None required

**Session continues:** YES

---

## Level 1 — FINDING

**Definition:** Something that will cause problems if not addressed,
but does not require immediate halt.

**Triggers:**
- Performance regression below 10% (e.g., frame time increased by <1.6ms)
- New code introduced that is not covered by existing tests
- Missing AUDIT:: signature block on a modified file
- Optional field added to event schema without documentation
- Branch naming does not follow `tier/TN-name-YYYYMMDD` convention
- MCP used outside assigned tier assignment (non-harmful)

**Actions:**
- Log to handoff artifact with tag `[L1-FINDING]`
- Add to session score as negative Regression Count point
- Contradiction Hunter receives finding for cross-check
- Continue session

**Human notification:** Included in end-of-session summary (not immediate)

**Session continues:** YES

---

## Level 2 — VIOLATION

**Definition:** A condition that requires human input before proceeding.
Session pauses. Claude Code presents findings. Human decides.

**Triggers:**
- Propose-only file approached for direct edit (Sacred Core boundary reached)
- AUDIT::FIXED_POINT_CHECK concern (float detected near scoring path, not confirmed in it)
- Performance regression above 10% (frame time increased by >1.6ms)
- Event schema change without corresponding ADR draft
- RNG lineage path modified without Human pre-approval
- PR opened without Proposal Only flag
- Session score in range 50–69

**Actions:**
- Immediately pause Execution Runtime
- Write `[L2-VIOLATION]` to handoff artifact
- Governance Auditor produces violation report
- Claude Code presents: what was found, what it means, proposed resolution options
- WAIT for Human decision

**Human notification:** IMMEDIATE — pause and present

**Session continues:** ONLY after Human decision

**Human options:**
- Approve proposed resolution → continue
- Provide alternative resolution → continue with that
- Scrap session → Failure Taxonomist writes post-mortem

---

## Level 3 — CRITICAL VIOLATION

**Definition:** A confirmed violation of Sacred Core, authority model,
or legal compliance. Session halts immediately. Human must decide.

**Triggers:**
- Sacred Core file directly edited without Human pre-approval
- `Math.random()` detected in a scoring-affecting code path
- PDX ledger accessed without valid hardware attestation verdict
- SDX balance incremented without confirmed blockchain event
- SHA-256 chain break detected in event or snapshot chain
- Session score below 50
- Any AUDIT::FIXED_POINT_CHECK: FAIL
- Event signature verification failure
- Replay reconstruction produces non-matching output

**Actions:**
- IMMEDIATELY halt all code generation and file writes
- Roll back to last clean commit (do not leave partial changes)
- Write detailed `[L3-CRITICAL-VIOLATION]` record to `runs/violations/YYYYMMDD-N.json`
- Append to `sessions/session-log.md`
- Failure Taxonomist writes full post-mortem
- Claude Code presents: exact violation, files affected, rollback performed, learning

**Human notification:** IMMEDIATE — halt and present

**Session continues:** NO — requires explicit Human restart instruction

**Human options:**
- Authorize retry with different approach (new session, learning applied)
- Authorize proposal-only pass (propose fix without implementing)
- Escalate to Level 4 if situation is irrecoverable

---

## Level 4 — EXECUTION HALT

**Definition:** The situation cannot be safely resolved within the current
session architecture. Full stop. Constitutional review required.

**Triggers:**
- Level 3 violation cannot be cleanly rolled back (filesystem corruption)
- Multiple Level 3 violations in the same tier across multiple sessions
- Constitutional conflict discovered that the authority model does not resolve
- Threat model threat is actively exploited (replay tampering detected in production)
- Human instruction contradicts constitutional authority without an ADR

**Actions:**
- Full session termination
- ALL changes rolled back to last verified clean state on main branch
- Write `[L4-EXECUTION-HALT]` record to `runs/violations/HALT-YYYYMMDD.json`
- Constitutional review document written proposing resolution
- No new sessions begin until Human approves constitutional resolution

**Human notification:** IMMEDIATE — maximum urgency

**Session continues:** NO — requires constitutional amendment or explicit Human override
**New sessions begin:** NO — until Level 4 is resolved

**Human options:**
- Approve constitutional amendment via ADR → resume
- Override and authorize new session with documented rationale
- Escalate to external review (legal, security)

---

## Escalation by Audit Cell

| Cell | L0 | L1 | L2 | L3 | L4 |
|---|---|---|---|---|---|
| Systems Architect | ✓ | ✓ | ✓ (unresolved deps) | ✓ (constitutional conflict) | ✓ |
| Replay Archivist | ✓ | ✓ | ✗ | ✓ (chain break) | ✓ |
| Governance Auditor | ✓ | ✓ | ✓ (Sacred Core boundary) | ✓ (Sacred Core violation) | ✓ |
| Contradiction Hunter | ✓ | ✓ | ✓ (source truth conflict) | ✓ (constitutional conflict) | ✓ |
| Determinism Verifier | ✓ | ✓ | ✓ (FIXED_POINT concern) | ✓ (FIXED_POINT FAIL) | ✓ |
| Failure Taxonomist | ✓ | ✓ | ✓ (post-mortem) | ✓ (post-mortem) | ✓ |

**raise** = report or nominate an escalation level (any cell may do this for any level).
**trigger** = unilaterally enact the consequences of that level (authority-restricted).

Any cell may raise (nominate) an L4 candidate.
Only Governance Auditor and Determinism Verifier can trigger L4 unilaterally.
Other cells require two concurrent L3 findings to trigger L4.

---

## Escalation Record Format

```json
{
  "escalation_level": 3,
  "tag": "L3-CRITICAL-VIOLATION",
  "cell": "Determinism Verifier",
  "session": "tier/T1-mathematical-foundation-20260522",
  "trigger": "AUDIT::FIXED_POINT_CHECK FAIL — float detected in farkleScorer cascade path",
  "files_affected": ["packages/farkle-engine/src/farkleScorer.ts"],
  "rollback_performed": true,
  "rollback_target": "commit:abc123",
  "learning": "farkleScorer cascade depth calculation uses JS division — requires Q32.32 refactor",
  "proposed_resolution": "Propose fixed-point cascade calculation as separate PR for Human approval",
  "timestamp": "2026-05-22T12:00:00.000Z"
}
```

---

## Version

agent-escalation-model.md v1.0.0
Effective: at plan approval
Change authority: Human only
ADR required for any change to escalation triggers or level definitions
