# WORKSPACE_RECOMMENDATIONS.md
# Phase 6 — Workspace Structural Recommendations
# Generated: 2026-06-14

---

## What the evidence says about workspace structure

From Phase 4 (START_WORKFLOW_ANALYSIS.md), the current workspace's biggest friction sources
are all in the startup sequence, not in the tools themselves. From Phase 5 (TOOL_DECISION_MATRIX.md),
the highest-ROI tools are already built — they just need to be wired into the startup.

This phase answers: if a DevOS workspace is built, what should its structure be?

---

## Workspace definition (what DevOS is and is not)

DevOS is NOT a new application. It is a development environment configuration layer:
- A smarter start.sh that surfaces real-time project state
- Optionally: a browser-based dashboard that visualizes sandbox-ui components
- Optionally: a terminal multiplexer setup that runs server + UI + Claude in panes

DevOS is NOT:
- A new game engine
- A separate backend service
- A replacement for Claude Code
- An LLM-powered UI builder

The user's vision (RPG Maker + Replit) translates to: **prompt → preview → iterate**,
which maps to: **Claude Code (prompt) + sandbox-ui (preview) + start.sh (iterate)**.
All three exist. They are not connected.

---

## Structural recommendation: three-pane workspace

If a terminal session is the interface (which it is — this is a Termux/Linux environment):

```
Pane 1: Claude Code session (plan mode, governance-aware)
Pane 2: sandbox server (port 3001, auto-started)
Pane 3: sandbox-ui (browser, auto-opened or TUI mirror)
```

The start.sh evolution path:

```
v1 (today):   static prompt, 5 reads per session
v2 (Phase A): dynamic prompt injection, 1 read per session
v3 (Phase B): dynamic prompt + server auto-start + sandbox-ui auto-open
v4 (Phase C): dynamic prompt + server + UI + FOREST trigger + Cohere Tier 2/3 (when defined)
```

Only build the next version when the current one proves insufficient.
This is anti-speculative development — same principle as the EV model that caused Gate 3 failure.

---

## File structure for DevOS artifacts

Current unresolved artifacts:
```
scripts/sandbox-cli.sh          — operational (20 commands)
sandbox-ui/                     — operational (8 components, 2667 lines), unused
forest/                         — partial (run once, circular output)
scripts/meshy-gen.ts            — partial (pipeline exists, 0 assets)
scripts/meshy.sh                — partial (wrapper exists, untested)
```

Recommended structure:
```
devos/
  start.sh        → symlink or wrapper (keeps root start.sh as entry point)
  sacred-check.sh → new, 10 lines
  sprint-status.sh → new, ~20 lines (extracts current sprint summary)
  bito-summary.sh  → new, ~15 lines (surfaces current-branch bito result)
```

Do NOT move sandbox-ui or scripts/ — they are referenced by existing sessions.
Add; don't reorganize.

---

## What the Replit analogy means concretely

Replit's "prompt to app" loop requires:
1. A prompt interface (exists: Claude Code)
2. A live preview (exists: sandbox-ui GateStatusPanel + SimulationProgressPanel)
3. A working server (missing in start.sh: sandbox server not auto-started)

The RPG Maker analogy means:
1. Visual state display (exists: GateStatusPanel, RTPBreakdownPanel)
2. Parameter sliders (exists: ParameterEditorPanel)
3. Asset library (missing: Meshy integration, no assets yet)
4. One-click deploy (missing: no deploy command in start.sh)

Three of five Replit requirements exist. Two of four RPG Maker requirements exist.
The gap is: start.sh does not wire them together.

---

## Critical constraint: authorization model must survive DevOS

The three-tier authorization model (Routine/Elevated/Sacred) is operational.
It has prevented every unauthorized sacred-file write in 18+ sessions.
DevOS must not bypass or obscure it.

In particular:
- The `--permission-mode plan` flag in the Claude Code launch must survive
- The bito pre-merge gate must remain a blocking step before any merge
- Sacred file warnings must be surfaced by `sacred-check.sh`, not hidden

Any DevOS UI that makes it easier to "click to apply" a sacred-file change
without explicit human authorization would violate the governance model.

---

## Workspace summary

| Component | Exists? | Wired? | Needed for v1? |
|-----------|---------|--------|----------------|
| Claude Code (plan mode) | Yes | Yes | Yes |
| start.sh dynamic context | No | — | Yes |
| sacred-check.sh | No | — | Yes |
| sprint-status.sh | No | — | Yes |
| sandbox server auto-start | No | No | Conditional |
| sandbox-ui auto-open | No | No | Conditional |
| FOREST trigger | Partial | No | No |
| Meshy asset panel | Partial | No | No |
| TREES panel | No | — | No |
| Cohere Tier 2/3 | No | — | No |

Phase A (start.sh enhancement alone): resolves the 5-read startup friction.
Phase B (Phase A + sandbox server): enables sandbox-ui for the first time.
Phase C (Phase B + TREES/FOREST/Cohere Tier 2/3): only after Phase B proves insufficient.
