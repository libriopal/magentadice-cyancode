<!--
AUDIT::PATHWAY_DEPS: CLAUDE.md, scenes/Main.tscn, .mcp.json, contracts/scene-definition.schema.json
AUDIT::CURRENT_GRADE: Grade B — documentation alignment with actual runtime
AUDIT::ENTROPY_VECTOR: none — no source code, no replay contracts affected
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# ADR-009: Full Godot Deprecation — Three.js + Rapier3D as Runtime Authorities

**Status:** Accepted
**Date:** 2026-05-22
**Branch:** feat/godot-deprecation-20260522
**Authority:** Constitutional (Human-approved directive)

---

## Context

The `dream-core-integration` repository listed `scenes/` (Godot 4.3 project) and `godot-mcp/` (Godot MCP server) as active dependencies in `CLAUDE.md`. However:

1. The actual runtime for FAR_NZY is **Three.js + Rapier3D** running in a browser-native WebView via Capacitor. Godot is not invoked at any point in the production build pipeline.
2. `scenes/Main.tscn` (58 lines) is a display-only UI splash screen containing a title label and background color. It contains no level topology, spawn metadata, or architectural data. It was never consumed by the Three.js/Rapier3D runtime.
3. `godot-mcp/` was not tracked in git — only referenced in documentation and `.mcp.json`.
4. Godot as an active dependency creates false architectural documentation, confuses audit cells, and adds maintenance surface with zero runtime benefit.

The Human issued Constitutional Directive `full-godot-removal.md` authorizing this migration.

---

## Decision

**Godot is fully deprecated as an active dependency of this repository.**

- **Three.js** is the official rendering authority.
- **Rapier3D** is the official simulation authority.
- **Browser-native execution** (WebView via Capacitor) is the deployment target.
- `scenes/Main.tscn` is archived (not deleted) for historical traceability.
- The `godot` MCP block is removed from `.mcp.json`.
- `CLAUDE.md` is updated to reflect the actual runtime stack.

---

## Consequences

### Positive
- Documentation accurately reflects the actual runtime
- Audit cells no longer encounter Godot references that imply a dependency that doesn't exist
- Reduced confusion for new contributors
- `.mcp.json` MCP list is accurate (no dead godot MCP entry)

### Negative / Risks
- None: Godot had no runtime integration. Removal has zero impact on build, test, or production execution.

### Neutral
- `visual_manifest_schema.json` contains two hint strings referencing "Godot StandardMaterial3D" — these are optional description text and carry no runtime meaning. They will be updated in T7 (Visual Overhaul) to reference Three.js MeshStandardMaterial equivalents.

---

## Migration Strategy

1. Archive `scenes/Main.tscn` → `archive/godot/Main.tscn`
2. Remove `scenes/` directory (now empty)
3. Remove `"godot"` MCP block from `.mcp.json`
4. Update `CLAUDE.md` to remove all Godot references
5. Create `contracts/scene-definition.schema.json` as the Three.js-native replacement for the scene contract role Godot played conceptually

---

## Rollback Strategy

`git revert` the deprecation commit. `archive/godot/Main.tscn` is preserved. No data is permanently destroyed.

---

## Replaces

N/A — Godot was never formally introduced via ADR. This ADR serves as the authoritative record of its removal.
