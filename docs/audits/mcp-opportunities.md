<!--
AUDIT::PATHWAY_DEPS: none — evaluation only
AUDIT::CURRENT_GRADE: Grade A — comprehensive MCP landscape assessment
AUDIT::ENTROPY_VECTOR: none
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# MCP Integration Opportunities — FAR_NZY / magentadice-cyancode
**Audit Date:** 2026-05-22
**Branch:** feat/godot-deprecation-20260522

---

## MCP Status (Root Config vs Environment)

| MCP | Status | Purpose |
|---|---|---|
| `brightdata` | Active (root .mcp.json) | Competitive research, web scraping |
| `filesystem` | Active (root .mcp.json) | Local file read/write access |
| `memory` | Active (root .mcp.json) | Session state knowledge graph |
| `context7` | Active (root .mcp.json) | Library documentation lookup |
| `sequential-thinking` | Active (root .mcp.json) | Structured reasoning chains |
| `supabase` | Environment-specific | Database schema/query access |
| `github` | Environment-specific | PR management, code search |
| `pixellab` | Environment-specific | Pixel art generation |
| `postgres` | Environment-specific | Direct SQL access |

> Root `.mcp.json` currently configures: `brightdata`, `filesystem`, `memory`,
> `context7`, and `sequential-thinking`.
> Environment-specific MCPs are available via developer tooling but are not
> declared in the root config.

**Removed:** `godot` — deprecated per ADR-009.

---

## Tier 1 — High Value, Low Integration Effort

### Three.js Viewer MCP
- **Purpose:** Render and inspect Three.js scenes directly from Claude Code context
- **Integration effort:** Low — schema-driven scene injection
- **Maintenance burden:** Low
- **Value score:** 9/10
- **Constitutional alignment:** Direct — Three.js is rendering authority; live scene preview accelerates T7 (Visual Overhaul) and T5 (Core Loop Excellence)
- **Recommendation:** Evaluate for T7 session

### GitHub MCP (already active)
- **Purpose:** PR creation, issue tracking, branch management
- **Integration effort:** Zero (active)
- **Value score:** 10/10
- **Constitutional alignment:** Mandatory — all session outputs are PRs

### Filesystem MCP (already active)
- **Purpose:** Read/write arbitrary repo files
- **Integration effort:** Zero (active)
- **Value score:** 10/10

### Mermaid Chart MCP
- **Purpose:** Generate architecture diagrams as SVG from Mermaid syntax
- **Integration effort:** Low — render-only
- **Maintenance burden:** Very low
- **Value score:** 7/10
- **Constitutional alignment:** Useful for audit cell dependency maps and ADR diagrams
- **Recommendation:** Add for documentation-heavy sessions (T1A governance, ADR work)

---

## Tier 2 — Moderate Value, Situational

### Courtroom5 MCP
- **Purpose:** Legal research and guidance for pro-se legal contexts
- **Integration effort:** Low
- **Maintenance burden:** Low
- **Value score:** 5/10
- **Constitutional alignment:** Tangential — sweepstakes legal compliance is a T2 concern but primary compliance research is via BrightData + Human legal review
- **Recommendation:** Evaluate for T2 (Security & Compliance) session

### Splice MCP
- **Purpose:** Audio sample discovery and download
- **Integration effort:** Low
- **Maintenance burden:** Low
- **Value score:** 4/10
- **Constitutional alignment:** Low — AGROS uses synthesized Web Audio API, not sample-based audio. Not needed until T8 (Audio Pipeline) and only if sample layers are added
- **Recommendation:** Defer to T8 evaluation

---

## Not Recommended

| MCP | Reason |
|---|---|
| Godot MCP | Deprecated per ADR-009 |
| Any LLM-in-LLM orchestration | Constitutional ceiling prohibits Execution Runtime from expanding authority via sub-agents without Human approval |
