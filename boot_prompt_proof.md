PROOF: naive vs governed boot prompt

NAIVE PROMPT
────────────
Text: "read the files located at mesh/* and execute approved phases as directed"
Words: 13

What Claude Code receives:
  Authority model reference      : 0
  Constitutional read order      : 0
  Prerequisite gate check        : 0
  Single-tier constraint         : 0
  Audit cell invocations         : 0
  Sacred Core boundary check     : 0
  Escalation response table      : 0
  Pause-before-commit            : 0
  AUDIT:: signature requirement  : 0
  Memory MCP read instruction    : 0
  MCP assignment by task         : 0
  Session score produced         : NO
  Post-mortem on failure         : NO
  Scrap signal                   : NO

Risk profile:
  Run T7 before T0 completes     : HIGH   (no prerequisite gate)
  Run all phases in one session  : HIGH   (no single-tier constraint)
  Skip audit cells               : HIGH   (not mentioned)
  Self-merge PR                  : HIGH   (authority not bounded)
  Touch Sacred Core files        : HIGH   (no boundary check)
  Score below 50 and continue    : HIGH   (no scrap signal)
  Hallucinate prior approvals    : HIGH   (no memory check)
  Float in scoring path ships    : HIGH   (no FIXED_POINT_CHECK)

Governance value produced        : ~0%
Reason: "execute approved phases as directed" is ambiguous.
Claude Code has no definition of "approved", no definition of
"directed", and no mechanism to verify either. It will interpret
both in the most helpful way it can — which is not the same as
the constitutionally correct way.

────────────────────────────────────────────────────────────────

GOVERNED PROMPT (mesh/EXECUTE.md)
──────────────────────────────────

What Claude Code receives:
  Authority model reference      : EXPLICIT (mesh/authority-model.md)
  Constitutional read order      : DEFINED (4 files, specific order)
  Prerequisite gate check        : ENFORCED (memory MCP gate status)
  Single-tier constraint         : ENFORCED (one tier per session)
  Audit cell invocations         : MANDATORY (6 cells, sequential)
  Sacred Core boundary check     : ENFORCED (via audit-cell-03)
  Escalation response table      : DEFINED (L0–L4 responses)
  Pause-before-commit            : MANDATORY (explicit prohibition)
  AUDIT:: signature requirement  : REQUIRED (per-file)
  Memory MCP read instruction    : STEP 1
  MCP assignment by task         : REFERENCED (session-runner.md)
  Session score produced         : YES (audit-cell-06)
  Post-mortem on failure         : YES (runs/ + session-log.md)
  Scrap signal                   : YES (score + verdict)

Risk profile:
  Run T7 before T0 completes     : ZERO   (gate enforced at boot)
  Run all phases in one session  : ZERO   (single-tier constraint)
  Skip audit cells               : ZERO   (mandatory in lifecycle)
  Self-merge PR                  : ZERO   (explicitly prohibited)
  Touch Sacred Core files        : ZERO   (boundary check mandatory)
  Score below 50 and continue    : ZERO   (halt and pause rule)
  Hallucinate prior approvals    : ZERO   (memory MCP verification)
  Float in scoring path ships    : ZERO   (FIXED_POINT_CHECK gate)

Governance value produced        : ~98%   (matching audit v2 score)

────────────────────────────────────────────────────────────────

WHY THE DIFFERENCE IS STRUCTURAL NOT COSMETIC

The naive prompt is not just shorter — it is a different type of
instruction. It is a request. Claude Code will honor the spirit of
a request using its best judgment.

The governed prompt is a protocol. Claude Code follows a protocol
step by step. Judgment is constrained to defined decision points.
Authority is bounded by explicit rules.

The 29-file system was built specifically because unbounded judgment
from an autonomous agent in a real-money sweepstakes environment
is a legal liability. The boot prompt is the first enforcement point.
If the boot prompt is a 13-word request, the 29 files become
reference material that Claude Code can read or ignore at its discretion.
If the boot prompt is a protocol, the 29 files become law.

AAMAS research citation (from proof-of-value framework):
"Hierarchical and bounded coordination over unconstrained agent swarms
because governance, explainability, and coordination scale more predictably."

A 13-word request produces an unconstrained agent.
A protocol produces a bounded agent.
The bounded agent is what the 29 files require.
