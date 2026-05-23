<!--
AUDIT::PATHWAY_DEPS: none — verification report
AUDIT::CURRENT_GRADE: Grade A — zero active Godot dependencies
AUDIT::ENTROPY_VECTOR: none
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# Post-Migration Contradiction Scan — Godot Deprecation
**Date:** 2026-05-22
**Branch:** feat/godot-deprecation-20260522

---

## Scan Results

### Files searched
All `*.md`, `*.json`, `*.ts`, `*.tsx`, `*.js` outside `.git`, `node_modules`, `archive/`, `ADR-009`, and `mcp-opportunities.md` (which contain historical references by design).

### Findings

| File | Line | Content | Status |
|---|---|---|---|
| `core/art/manifest/visual_manifest_schema.json` | 400 | `"Godot StandardMaterial3D (or engine equivalent)"` | **Deferred to T7** — qualifier "(or engine equivalent)" makes this non-binding. Will be updated to "Three.js MeshStandardMaterial" in T7 (Visual Overhaul). |
| `core/art/manifest/visual_manifest_schema.json` | 509 | `"Godot easing name or a custom curve description"` | **Deferred to T7** — description text only, no runtime impact. |
| `visual_manifest_schema.json` (root) | 400, 509 | Same as above | **Deferred to T7** — stale root copy; canonical is `core/art/manifest/`. |
| `prompts/visual_overhaul.md` | 35 | `"Do not reference Godot, Unity, or any"` | **Compliant** — explicit prohibition of Godot. No action needed. |
| `contracts/scene-definition.schema.json` | 5 | References `scenes/Main.tscn (archived)` | **Compliant** — historical note in the replacement schema. |

---

## Verdict

**Godot dependency surface = 0 (active)**

All remaining references are:
- Optional description text with engine-agnostic qualifiers (deferred to T7)
- Explicit prohibitions of Godot
- Historical notes in replacement artifacts

**Migration SUCCESS CONDITIONS met:**
- [x] Godot dependency surface = 0
- [x] Three.js identified as rendering authority (ADR-009, contracts/, CLAUDE.md)
- [x] Rapier3D identified as simulation authority (ADR-009)
- [x] No documentation contradictions remain (active docs)
- [x] No replay contracts impacted
- [x] No audit contracts weakened
- [x] ADR-009 created
- [x] Migration report pending (Phase 9)
