<!--
AUDIT::PATHWAY_DEPS: CLAUDE.md, scenes/Main.tscn, .mcp.json, visual_manifest.json, docs/adr/ADR-009
AUDIT::CURRENT_GRADE: Grade B (overall — visual schema hints deferred to T7)
AUDIT::ENTROPY_VECTOR: none — no source code affected
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# Full Godot Removal — Final Constitutional Report
**Date:** 2026-05-22
**Branch:** feat/godot-deprecation-20260522
**Directive:** Constitutional Directive `full-godot-removal.md` — Human-authorized

---

## FINAL CONSTITUTIONAL REPORT

### Files Archived

| From | To | Reason |
|---|---|---|
| `scenes/Main.tscn` | `archive/godot/Main.tscn` | Display-only UI splash. No architectural data. Archived for historical traceability. |

### Files Removed / Emptied

| File | Change |
|---|---|
| `scenes/` | Directory removed (contained only Main.tscn) |
| `.mcp.json` | `"godot"` MCP server block removed |

### Files Modified

| File | Change |
|---|---|
| `CLAUDE.md` | Removed `scenes/` and `godot-mcp/` entries from repo overview. Removed Godot MCP reference from Integration Points. |
| `visual_manifest.json` (root) | Updated creative director note: "Godot project" → "Three.js scene" |

### Files Created

| File | Purpose |
|---|---|
| `docs/adr/ADR-009-godot-deprecation.md` | Constitutional record of deprecation decision |
| `contracts/scene-definition.schema.json` | Three.js-native scene contract (replaces conceptual role of Main.tscn) |
| `docs/audits/mcp-opportunities.md` | MCP integration landscape assessment |
| `docs/audits/post-migration-verification.md` | Post-migration contradiction scan results |
| `archive/godot/Main.tscn` | Archived original Godot scene |

### ADRs Created

- **ADR-009** — Godot Deprecation: Three.js + Rapier3D as Runtime Authorities

---

## Risks

**None identified.** Godot had no runtime integration with the production stack. The Three.js + Rapier3D runtime in `core/apps/web/` was always the actual execution environment. Removal has zero impact on:
- Build pipeline
- Test suite
- Android/iOS Capacitor build
- Supabase schema
- Replay contracts
- Sacred Core files

---

## Follow-up Actions (not this session)

| Item | Tier | Priority |
|---|---|---|
| Update `visual_manifest_schema.json` material description hints from "Godot StandardMaterial3D" to "Three.js MeshStandardMaterial" | T7 (Visual Overhaul) | Low |
| Update root `visual_manifest_schema.json` (stale copy — canonical is `core/art/manifest/`) | T7 | Low |
| Add Three.js Viewer MCP to `.mcp.json` | T5/T7 | Medium |

---

## Success Conditions Verification

| Condition | Status |
|---|---|
| Godot dependency surface = 0 | PASS |
| Three.js = rendering authority | PASS (CLAUDE.md, ADR-009, contracts/) |
| Rapier3D = simulation authority | PASS (ADR-009) |
| No documentation contradictions remain | PASS (active docs clean) |
| No replay contracts impacted | PASS |
| No audit contracts weakened | PASS |
| ADR created | PASS (ADR-009) |
| Migration report created | PASS (this document) |

**OVERALL: PASS**
