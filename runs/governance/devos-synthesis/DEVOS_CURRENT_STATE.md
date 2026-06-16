# DEVOS_CURRENT_STATE.md
# Phase 0 — Repository Reality Reconstruction
# Generated: 2026-06-14 | Source: direct file audit, git log, line counts

---

## Classification Legend
EXISTS = fully built, actively used
PARTIAL = built but incomplete, gated, or rarely used
PLANNED = referenced in roadmap but no implementation
CONCEPTUAL = named in conversation but no code exists

---

## start.sh

**Status: EXISTS (minimal)**

112 lines (updated 2026-06-16, DevOS Candidate B). Responsibilities:
1. Submodule guard — checks `core/.ff-core-lock` exists; prints init instruction and skips dependent steps if not
2. `git submodule status`
3. `./manifest.sh status`
4. Conditional `./scripts/bito-pre-merge-check.sh` if branch touches core/ or dream/
5. Dynamic context extraction — current branch, sprint summary, sacred file list, bito result for branch
6. Conditional sandbox server start (port 3001) — checks if already running first; registers EXIT trap to kill it
7. Live COHERE health check via `curl /api/governance/health`; prefers `jq`, falls back to `grep`
8. `claude --permission-mode plan "BRANCH: ... $SPRINT_SUMMARY SACRED CORE FILES: ..."` (dynamically injected)

NOTE (2026-06-14 analysis): The claims below that "sandbox server does not start" and "COHERE box is decorative"
described the 31-line start.sh at the time of the Phase 0 audit. Both are now corrected in the current implementation.

---

## sandbox-ui

**Status: EXISTS (functional, stale since P4)**

Location: `sandbox-ui/` (standalone Vite + KendoReact v14 app, port unknown)
Commits: 3 (all in one sprint, P3-RTP-SANDBOX, merged PR #25)
Last touched: `9ed4c4e` (bito findings fix, P3)

8 components, 2667 total lines:
| Component | Lines | Purpose |
|-----------|-------|---------|
| SandboxShell.tsx | 376 | Layout shell, Splitter + TabStrip |
| SimulationProgressPanel.tsx | 553 | Live MC run progress |
| ParameterEditorPanel.tsx | 472 | Sliders for seed, sessions, OWC params |
| AIAdvisorPanel.tsx | 379 | Claude/Kendo AI chat |
| RTPBreakdownPanel.tsx | 269 | Mechanic-level RTP bar chart |
| CommandHistoryPanel.tsx | 218 | WS message log |
| CoveragePanel.tsx | 215 | monteCarlo checklist status |
| GateStatusPanel.tsx | 185 | Gate 1–6 pass/fail display |

KendoReact dependencies installed but unused: `@progress/kendo-react-treeview`,
`@progress/kendo-react-treelist`, `@progress/kendo-react-taskboard`, and 30+ others.

The sandbox-ui is NOT integrated into start.sh. It requires manual `npm run dev` to start.
No session log records it being opened during active development sessions.

---

## sandbox-cli

**Status: EXISTS (functional, actively used)**

Location: `scripts/sandbox-cli.sh`
Size: ~350 lines, 20 commands
Commits: 4 (built during P4-OWC, one bug fix)

Commands and actual usage evidence:
- `gate-check` — used in every P3/P4 sprint via validate-gates.ts (equivalent)
- `sim`, `audit` — used for compliance runs
- `skill-gap` — called during P5 finding diagnosis
- `advisor`, `watch-gate` — no recorded use in session-log
- `owc-param-set`, `owc-param-list` — P4 extension; used once

Requires: sandbox server running at port 3001. Server start is NOT in start.sh.
Without server: every command fails immediately.

---

## forest

**Status: PARTIAL (built, run once, zero ongoing usage)**

Location: `forest/`
Files: `forest_simulator.mjs`, `FOREST_PLAN.md`, `PSEUDOCODE.md`, `README.md`, `fitness_schema.json`, `out/`
Git commits touching `forest/`: **0**

The out/ directory exists with: `best_bundle.json`, `best_bundle.md`, `history.json`
Evidence of one manual run: `--epochs 5 --population 1000 --seed 42`
Result: score=100 in 5 epochs.

The best_bundle.md output matches `codex_prototypes/selection.md` exactly.
This is expected: the simulator was seeded from selection.md.
Result = the input. No new information was generated.

No session log entry references forest. No sprint references forest output.
Forest has never changed a development decision recorded in the project.

---

## meshy

**Status: PARTIAL (pipeline built, no assets generated)**

Location: `scripts/meshy-gen.ts`, `scripts/meshy.sh`
Git commits: **1** (`d563ae6 feat(meshy): wire Meshy AI 3D generation into corpus pipeline`)

The pipeline exists: text-to-3d, image-to-3d, status, download, list.
Reads `MESHY_API_KEY` from `.env`.
Outputs to `data/<id>.glb + <id>.info.json`.

No `.glb` or `.info.json` files in `data/` that reference Meshy task IDs.
Memory records note the API key exists but "ask for key when implementation begins."
No asset has ever been generated through this pipeline.

---

## governance

**Status: EXISTS (operational)**

- `docs/AUTHORIZATION.md` — Three-tier auth: Routine / Elevated / Sacred
- `docs/SACRED.md` — Registry of sacred systems (payout_math, rng, game_state_authority)
- `docs/adr/` — 23 ADRs (ADR-000 through ADR-022)
- `docs/KNOWN_TECHNICAL_DEBT.md` — 3 items (DEBT-01, DEBT-02, DEBT-03)
- `core/.ff-core-lock` — 13 sacred files listed, 17 surface files listed
- `codex_pr/` — 18 bito review files

The governance system is the most consistently used non-game artifact in the project.
Every sprint produces: ADR, session log entry, bito review file(s), profiling artifact.

---

## authorization workflow (actual)

**Status: EXISTS (operational, manual)**

Actual workflow per session-log.md (Sessions 1–18):
1. `./start.sh` → claude session starts in plan mode
2. Claude reads CLAUDE.md, .ff-core-lock, roadmap/01-current-sprint.md
3. Claude proposes change → human approves (if Elevated/Sacred)
4. Claude implements → `pnpm type-check && pnpm test`
5. `packages/farkle-engine/node_modules/.bin/tsx scripts/validate-gates.ts` (not sandbox-cli)
6. `./scripts/bito-pre-merge-check.sh` → output to `/tmp/bito_*.md` → copied to `codex_pr/`
7. Claude reads JSON, fixes findings, re-runs check
8. Commit → PR → merge

sandbox-ui is NOT used in any of Sessions 1–18 recorded in session-log.md.

---

## roadmap

**Status: EXISTS (active)**

`roadmap/01-current-sprint.md` — 312 lines covering P0 through P6 plus T9 superseded.
Updated every sprint. Single source of sprint truth.

---

## codex

**Status: EXISTS (reference, not operational)**

`codex_index.md` — 200+ lines of pipe-delimited compact notation.
`codex_prototypes/selection.md` — Ranked prototype directions, phase plan.

Neither file has been modified since creation. Used as context input, not as an operational loop.

---

## sacred systems

**Status: EXISTS (operational)**

13 sacred files tracked in `.ff-core-lock`. Authorization model enforced.
3 technical debts registered. P6 is the active sacred-file sprint.

---

## Cohere AI Governance Layer

**Status: EXISTS (Tier 1 complete 2026-06-13, Tier 2 scaffolded, Tier 3 types only)**

Location: `core/apps/server/src/ai/` — 20+ files

Tier 1 (COMPLETE):
- `ai/governance/policyEngine.ts` — 11 prohibited responsibilities, pre/post-call validation
- `ai/governance/budgetGuard.ts` — 5 isolated spend categories with hard ceilings
- `ai/governance/complianceGuard.ts` — RESTRICTED_STATES check
- `ai/governance/authorization.ts` — AuditCallType enum, API key validation
- `ai/auditors/governanceAuditor.ts` — 10-step governance chain
- `ai/auditors/monteCarloAuditor.ts` — 95% deterministic; Cohere only on anomaly escalation
- `ai/gateway/aiGateway.ts` — transport: cache → provider → return
- `ai/cache/responseCache.ts` — SHA-256 keyed TTL cache (Redis-swappable)
- `ai/spend/spendTracker.ts` + `budgetManager.ts` — spend log + category enforcement
- `ai/audit/auditExporter.ts` — writes `runs/governance/{id}.json`
- `ai/routes/governanceRouter.ts` — `POST /api/governance/audit`, `GET /api/governance/health`
- `ai/routes/questRouter.ts` — `POST /api/quests/batch` with governance chain

Tier 2 (SCAFFOLDED — no runtime Cohere calls yet):
- `ai/opportunity/opportunityAdvisor.ts` — stub; returns deterministic empty result
- Activates after Tier 3 retrieval corpus is ready

Tier 3 (TYPES ONLY — not active):
- `ai/retrieval/retrievalTypes.ts` — 7 retrieval source types
- Activates when 100+ governance audit records exist

**Start.sh status** (as of 2026-06-16): start.sh conditionally starts the sandbox server, polls
`GET /api/governance/health` with `curl`, and injects the live `cohereAvailable` value into the
COHERE governance box. The live endpoint IS called at session start when the server is running.
(Note: the 2026-06-14 analysis below described the 31-line start.sh; those claims are now stale.)

**Key constraint (from COHERE_IMPLEMENTATION_SUMMARY.md risk register)**:
- `cohere-ai` and `zod` installed as deps but server may crash on Node 24 (readable-stream issue)
- `pnpm install` must be run before server starts with Cohere active
- API key must be in `.env.local` as `COHERE_API_KEY`

---

## Summary capability table

| Capability | Status | Last Used | Evidence of Value |
|-----------|--------|-----------|-------------------|
| start.sh launcher | EXISTS | Every session | Context setup |
| sandbox-cli | EXISTS | P3, P4, P5 | Gate checks, audit |
| sandbox-ui | EXISTS | P3 (build only) | Built but never used in active dev |
| governance / ADR / bito | EXISTS | Every sprint | Sacred workflow enforcement |
| sacred file system | EXISTS | Every sprint | Legal compliance |
| Cohere governance (Tier 1) | EXISTS | Never in sessions | Built 2026-06-13; server not started |
| Cohere opportunity (Tier 2) | PARTIAL | Never | Stub only, no runtime calls |
| Cohere retrieval (Tier 3) | PARTIAL | Never | Types + README only |
| forest simulator | PARTIAL | Never (in sessions) | Zero recorded decisions changed |
| meshy pipeline | PARTIAL | Never (assets) | Zero assets generated |
| TREES (TreeView) | CONCEPTUAL | Never | Installed dep, never imported |
| multi-agent routing | PLANNED | Never | Proposed, not built |
