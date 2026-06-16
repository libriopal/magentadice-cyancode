# TREES_FINDINGS.md
# Phase 2 — TREES Investigation
# Generated: 2026-06-14

---

## What TREES is (evidence)

`@progress/kendo-react-treeview` and `@progress/kendo-react-treelist` are installed
in `sandbox-ui/package.json`. Both are unused — no import of either exists in any
`.tsx` or `.ts` file in sandbox-ui/src/.

TREES is an available UI component, not a defined system.

---

## What problem a tree UI would actually solve

The real question is: what information problem exists in the current workflow?

**Problem 1: Discovery friction**
To know the status of P6, you must read `roadmap/01-current-sprint.md` (312 lines).
To know which files are sacred, you must read `core/.ff-core-lock` (54 lines, two sections).
To know ADR status, you must `ls docs/adr/` and read filenames.
There is no single at-a-glance status view.

Evidence: Sessions 1–18 all begin with "read CLAUDE.md, .ff-core-lock, roadmap/01-current-sprint.md."
This is a repeated, manual, 3-file context load. Every session.

**Problem 2: Dependency mapping gap**
`codex_index.md` documents engine wires in compact pipe notation.
It is machine-readable but not human-scannable mid-session.
There is no visual dependency map showing: "if I touch monteCarlo.ts, what does that affect?"

**Problem 3: Sacred file boundary ambiguity**
A developer (or agent) editing a file must check `.ff-core-lock` manually to know if that
file is sacred. There is no inline warning, no visual indicator, no automatic check at open time.
Evidence: The P6 calibration sweep script `calibrate-threshold.ts` was created to AVOID
touching the sacred monteCarlo.ts — but verifying that boundary required reading the lock file.

---

## Does a TREE solve these problems?

**Problem 1 (discovery):** A tree navigator over roadmap + ADR + sacred + sprint status
would reduce the 3-file manual read to a single visual scan. This is a real improvement.

**Problem 2 (dependency mapping):** A tree does NOT solve dependency mapping.
A tree shows hierarchy. Codex wires are a GRAPH (N:M relationships between FF/MC/OWC/AG).
The codex_index.md circuit diagrams show this. A TreeView cannot represent a graph.
This problem needs a different solution (e.g., the codex as a reference panel, not a tree).

**Problem 3 (sacred boundary):** A tree listing sacred files helps orientation but does
not prevent violations. The bito pre-merge check is the enforcement mechanism. A tree
is a visual aid, not a guard.

---

## Verdict

A TREES panel would solve Problem 1 (discovery) partially.
It would NOT solve Problem 2 (dependency mapping).
It is NOT the highest-ROI fix for any of the three problems.

The highest-ROI fix for Problem 1: dynamic start.sh context that auto-reads current
sprint status and surfaces sacred file list. No UI required.

**Recommendation:** DELAY TREES as a UI panel. Solve Problem 1 through start.sh
enhancement first (Candidate A). Build TREES only if the Candidate A solution proves
insufficient after use.

**Evidence threshold not met for first-class TREES panel.**
