# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Security

**NEVER commit `.mcp.json`**. It is gitignored because it contains machine-local API tokens (BrightData) and absolute paths. Use `.env.example` as a template — copy to `.env.local` and fill in values on each machine.

A BrightData token was previously committed to history in commit `9323865`. **That token must be revoked at the BrightData dashboard.** Git history must be scrubbed before any public push: `git filter-repo --path .mcp.json --invert-paths` (or BFG Repo Cleaner).

---

## Repository Overview

This is the **magentadice-cyancode integration layer** (internally: dream-core-integration) — the integration layer for two independent submodule projects:

Repo: https://github.com/libriopal/magentadice-cyancode

- **`core/`** — FAR_NZY (Farkle Frenzy): a physics-based Match-3D puzzle/casino game (React + Three.js + Rapier3D, pnpm workspaces, Capacitor native)
- **`dream/`** — AGROS (Adaptive Generative Research Operating System): a browser-native emotional music engine that converts FAR_NZY game state into procedural audio via the ERK pipeline
- **`data/`** — Image corpus (~1550 assets with `.info.json` metadata) — **local directory, NOT a git submodule**
- **`3libras/`** — Visual layer design specs (non-code; authoritative design law)

Initialize required submodules: `git submodule update --init --recursive core dream`

**DevOS** is now a **standalone private repo** (`libriopal/libriopal-devos`) — it is **no longer a submodule** of this repo. Clone it separately and point it at this repo via `GAME_ROOT` in `devos/.env`:
```bash
git clone https://github.com/libriopal/libriopal-devos ~/devos
echo "GAME_ROOT=$(pwd)" >> ~/devos/.env
cd ~/devos && ./start.sh
```

Note: `data/` is **not** a submodule — it is a plain local directory of ~2245 tracked binary assets. No submodule init required for it.

---

## FAR_NZY (`core/`) Commands

Prerequisites: Node 20+, pnpm 9+, Java 17, Android SDK (for native builds), Supabase CLI.

```bash
cd core
pnpm install                          # Install all workspace dependencies
pnpm dev                              # Start web dev server (apps/web)
pnpm build                            # Build entire monorepo
pnpm build:web                        # Web only → apps/web/dist/
pnpm type-check                       # TypeScript check across all packages
pnpm lint                             # Lint across workspaces
pnpm test                             # Run all tests
pnpm --filter @match3d/farkle-engine test   # Single package tests
node --import tsx/esm --test packages/farkle-engine/src/farkleScorer.test.ts  # Single test file
pnpm android:debug                    # Android debug APK via Capacitor
pnpm cap:sync                         # Sync web assets to Capacitor
pnpm supabase:start                   # Local Supabase dev environment
```

Read `core/DEPLOY.md` for deployment prerequisites and `core/FARKLE_FRENZY_DESCRIPTION.xml` / `core/FARKLEFRENZY.md` before any gameplay or design changes.

---

## AGROS (`dream/`) Commands

```bash
cd dream
npm run install:all       # Install root + all workspace deps
npm run build             # Build frontend then backend
cd apps/frontend && npm run dev    # Vite dev server
cd apps/backend && npm run dev     # tsx watch (port 3001)
cd apps/backend && npm test        # vitest
```

---

## FAR_NZY Architecture

**Monorepo** (pnpm workspaces): `apps/` and `packages/`.

- `apps/web` — React 18 + Vite + @react-three/fiber + Rapier3D physics. Primary PWA client.
- `apps/server` — Express + ws WebSockets for multiplayer/matchmaking; tsx for dev.
- `packages/@match3d/farkle-engine` — Core scoring, chain index, grid utilities, CSPRNG.
- `packages/@match3d/game-core` — Three.js rendering + Rapier3D physics wrappers.
- `packages/@match3d/{ads,ai-quests,analytics,backend-client,blockchain,compliance,economy}` — Subsystem packages consumed via workspace references.
- Backend platform: Supabase (PostgreSQL, Auth, Edge Functions).
- Native: Capacitor 8.3 wrapping `apps/web/dist/` for Android/iOS.

**Sacred files:** The authoritative sacred-file source is `core/.ff-core-lock`. Do not maintain a duplicate list here — read the lock file directly.

---

## AGROS Architecture

**Data flow:** `FAR_NZY game state → Emotional Inference → Symbolic Runtime → Procedural Orchestration → DSP (WASM AudioWorklet) → Audio Output`

- `apps/frontend/src/` — Emotion inference, symbolic runtime, compression engine, IndexedDB persistence, STRUTHIO-SEC integrity mesh.
- `apps/backend/src/` — `evolutionEngine.ts` (genetic algo), `demandEngine.ts` (NLP), `reinforcementEngine.ts`, `batchGenerator.ts`; SQLite (WAL) via better-sqlite3; Redis/BullMQ workers (degrade gracefully without Redis).
- `constitution/operational-law.md` — Four immutable laws (Deterministic Emergence, Emotional Continuity, Deployment Survivability, Memory Continuity). Do not alter.
- `shared/project-memory.md`, `viktor.md`, `coderabbit.md` — Memory ledgers that CI enforces on every PR.

**Key invariants:**
- All randomness uses seeded `DeterministicPRNG` — never `Math.random()`.
- 8 canonical emotional states (Dread, Suspense, Escalation, Catastrophic Release, Mourning, Recovery, Silence, Ritualistic Build) — do not add states without constitutional review.
- Tier 0 DSP latency ceiling: **12ms** — enforced by `dsp-survivability.yml` CI.
- `SharedArrayBuffer` requires COOP/COEP headers — set in backend middleware; do not remove.
- Frontend → IndexedDB; backend → SQLite. Do not conflate storage layers.

---

## Visual Layer (3libras/)

The authoritative visual design law for FAR_NZY is in `3libras/the_visual_layer.md`. The aesthetic is **Gothic Hacker Neon UI** over an **Organic Vegas 3D** backend: biomechanical underground civilization, three pillars (Biological / Industrial / Crystalline). No flat UI — everything must feel physically integrated into the world. VOIDSHARD is the highest rarity visual tier.

---

## Integration Points

The `.mcp.json` at root configures MCP servers for this session (brightdata, filesystem, memory, context7, sequential-thinking). This file is **machine-local and gitignored** — it must never be committed. See `.env.example` for required variables.

**Local-only tools / Prerequisites:**
- `godot-mcp` — NOT initialized. If you need Godot MCP integration, clone and build it locally, then set `GODOT_MCP_PATH` in `.env.local`. The `godot` entry in `.mcp.json` requires `${GODOT_MCP_PATH}/build/index.js` to exist.
- `GODOT_PATH` — must point to your local Godot executable.

AGROS connects to FAR_NZY via game-state events; the ERK conductor profiles live in `dream/apps/frontend/src/` and map gameplay output to the 8-state emotional model.

---

## Session Governance (mesh/)

`mesh/EXECUTE.md` is **governance archive material** — it documents the constitutional authority model and past session protocol. It is NOT the default workflow for active development. See **Default Development Workflow** below for the full 5-step process.

**Sacred boundary**: Any write to a file listed in `core/.ff-core-lock` requires explicit human approval before committing. Read the lock file directly — it is the authoritative source.

**Legal posture**: This platform is a skill-based sweepstakes competition. A float in a scoring path is a **legal violation**, not a bug. A frame drop that drops an input is a **legal violation**, not a perf issue. Every engineering decision is a legal decision.

---

## Default Development Workflow

_Directive v2.0 — installed 2026-06-18. Supersedes the prior 5-step workflow._

You are operating inside **devOS** — the FAR_NZY development shell at
`/home/johnathanallen1998/devos`. devOS has already run the full
`magentadice-cyancode/start.sh` pre-flight on your behalf before this session
was launched. The outputs of that pre-flight are injected above this section:
submodule status, `./manifest.sh status`, working tree, last 15 commits, sacred
file lock, and sprint file. Do not re-run those checks unless the human asks.

### Step 0 — Ask before assuming

If the human's request is underspecified — missing a concrete detail needed
to plan or execute correctly — ask 1-3 specific questions before proceeding.
Getting this right upfront avoids wasted EXECUTE cycles and revision passes
later.



### Step 1 — Orient before acting

On every session start, before planning or writing anything, perform this
checklist silently and report the result in a single status block:

```
[ ] 1a. Sprint file status      — read roadmap/01-current-sprint.md (injected above)
[ ] 1b. Sprint completion check — verify current sprint's exit criteria are met (see below)
[ ] 1c. Sacred diff check       — any CORE files in working diff? (injected above)
[ ] 1d. Gate status             — send GATE_RUN via devOS or read last cached result
[ ] 1e. Submodule health        — both core/ and dream/ show clean SHA (injected above)
[ ] 1f. Manifest pipeline       — ./manifest.sh status shows PASS (injected above)
[ ] 1g. Sandbox server          — check DEVOS_STATUS for gameServerAlive: true (port 3001)
```

Report format (paste as first response):

```
DEVOS SESSION ORIENTATION
─────────────────────────
Sprint file    : [found / MISSING — needs update before proceeding]
Sprint status  : [COMPLETE / ACTIVE / INCOMPLETE — list open items]
Current sprint : [sprint ID from file / unknown — explain if unknown]
Sacred diff    : [clean / ALERT — list files]
Gates          : [all pass / N failing — list which]
Submodules     : [clean / out of sync]
Manifest       : [PASS / FAIL / score]
Sandbox server : [alive / offline]
─────────────────────────
READY TO PROCEED / BLOCKED (reason)
```

If any check is BLOCKED, stop and surface it. Do not proceed to planning.



### Step 1b — Sprint completion check (run every session)

Before planning any work, check roadmap/01-current-sprint.md (injected above)
for the current sprint's actual status field. Do not assume any specific
sprint ID is active — read it fresh each session.

- If the sprint file shows a sprint marked complete with no new sprint yet
  defined: report this clearly and ask the human what the next sprint's
  scope should be. Do not invent placeholder tasks.
- If a sprint is marked active: verify its exit criteria against current
  repo state before treating it as still open.
- If the sprint file is ambiguous or missing a status field: stop and ask,
  per Step 10's no-assumptions rule.



### Step 2 — Full project awareness (run once per session, before any task)

Read the following files before suggesting any work. Do not plan from memory
or assumptions — always read from disk first. Note: "read completely" below
means full-content reads only for the specific files marked as such — for
docs/adr/, list filenames first and read only the most recent 2-3 ADRs in
full, or any ADR the current sprint file explicitly references. Do not read
the entire ADR history every session; it is large (20+ files) and mostly
settled historical record, not live constraints.

```bash
# Via devOS QUERY mode — these are already partially injected above,
# but read them in full to form recommendations:
roadmap/01-current-sprint.md          # current sprint tasks + exit criteria
roadmap/                              # list all files — understand the arc
docs/adr/                             # list filenames only (ls docs/adr/)
docs/adr/<most-recent-2-3-ADRs>.md    # read these in FULL — not the whole directory
                                       # "most recent" = highest ADR number, or
                                       # whichever is explicitly referenced by the
                                       # current sprint file
CLAUDE.md                             # full constraints, not just this section
core/.ff-core-lock                    # complete sacred + surface file list
core/roadmap/ (if exists)             # any in-engine roadmap artifacts
```

After reading, produce a **Project Awareness Summary**:

```
PROJECT AWARENESS SUMMARY
─────────────────────────
Active sprint  : [ID + label]
Sprint status  : [active / blocked / complete]
Open tasks     : [list from sprint file]
Exit criteria  : [list from sprint file — met / unmet]
Next sprint    : [next sprint ID, or "undefined" if roadmap/01 doesn't declare one]
ADR count      : [N ADRs — newest: ADR-NNN title]
Sacred files   : [N core, N surface]
Recommended    : [see Step 3]
─────────────────────────
```



### Step 3 — Roadmap recommendations

After completing Step 2, produce a **Roadmap Recommendation** section.
This is always advisory — the human decides what goes into the roadmap.
Base recommendations strictly on what you read in Step 2, not on prior
session memory or assumptions.

Format:

```
ROADMAP RECOMMENDATIONS
─────────────────────────
Carry forward from [current sprint ID] (if any):
  • [task] — reason it wasn't completed / should move to [next sprint ID]

Suggested [next sprint ID] tasks (from ADR trail + open issues):
  • [task] — supporting evidence (ADR-NNN / gate finding / etc.)

Suggested [next sprint ID] exit criteria:
  • [measurable criterion]

Roadmap file changes suggested:
  • roadmap/01-current-sprint.md — [specific edit: mark current sprint
    complete, add next sprint header, add tasks, add exit criteria]
  • [other files if applicable]
─────────────────────────
⚠ These are recommendations only. Human confirms before any file is written.
```

Do not write any roadmap file changes until the human explicitly approves
the recommendations. If approved, apply changes in QUERY mode (Read only)
first to show a diff preview, then apply with EXECUTE on explicit confirmation.



### Step 4 — Sacred file protocol

The sacred file list is injected above from `core/.ff-core-lock`.

**CORE SACRED files — absolute rules:**
- Never write to a CORE file without showing a full diff first
- Wait for explicit `APPROVED` in the same human message before writing
- devOS fires `SACRED_ALERT` if a core file enters the working diff — hard stop
- `SACRED_OVERRIDE=1` is a human-only action; never suggest it as a shortcut

**SURFACE files:**
- Can be edited but must pass Bito review before commit
- Surface edits in EXECUTE mode trigger auto-Bito automatically

**Sacred files (from .ff-core-lock CORE section — verify against injected lock above):**
```
core/packages/farkle-shared/src/types.ts
core/packages/farkle-shared/src/index.ts
core/packages/farkle-engine/src/chainIndex.ts
core/packages/farkle-engine/src/farkleScorer.ts
core/packages/farkle-engine/src/farkleScorer.test.ts
core/packages/farkle-engine/src/csprng.ts
core/packages/farkle-engine/src/gridUtils.ts
core/packages/farkle-engine/src/floodFill.ts
core/packages/farkle-engine/src/monteCarlo.ts
core/packages/farkle-engine/src/rtpConfig.ts
core/packages/farkle-engine/src/index.ts
core/packages/farkle-engine/src/web.ts
core/apps/web/src/store/farkleStore.ts
core/apps/web/src/store/gameStore.ts
core/apps/web/src/hooks/useFarkleGame.ts
core/apps/server/src/gameRoom.ts
```
*(If injected lock above differs, the injected lock is authoritative.)*



### Step 5 — QUERY vs EXECUTE contract

devOS replaces the single `claude --permission-mode plan` session from
`start.sh` with a two-mode system:

| Mode | Equivalent | What you can do |
|------|-----------|-----------------||
| **QUERY** (default) | `--permission-mode plan` | Read, plan, diff preview, recommendations |
| **EXECUTE** | `--dangerously-skip-permissions` + tools: Edit, Write, Read, Bash, Glob, LS | File writes, bash commands, full autonomous execution |

**Rules:**
- Default to QUERY. Never self-escalate to EXECUTE.
- EXECUTE only activates when the human sends `EXECUTE:` prefix or clicks
  the EXECUTE button in devOS UI at `http://localhost:5174`
- After every EXECUTE session devOS auto-runs Bito essential-mode
  (`triggerAutoBito`). Do not trigger Bito manually after EXECUTE — it is
  already running.
- Always show a task scope before EXECUTE: which files, what changes,
  estimated risk level. Wait for confirmation.
- Each EXECUTE is a fresh process. It does not carry forward tool state
  from a prior EXECUTE call in the same devOS session. Re-read files if needed.
- Default to the smallest reasonable scope: name the specific file or
  function to change rather than an entire module.
- When the task changes to something unrelated to what came before in the
  same session, recommend a context reset rather than carrying unrelated
  history forward.
- Keep EXECUTE completion summaries terse — state what changed; skip
  restating the task or narrating step-by-step process unless something
  failed.



### Step 6 — Compliance gates

Gates are defined in `config/devos.config.ts` and run via:
```bash
cd core && pnpm test                                       # Gate 1
cd core && node --import tsx/esm scripts/validate-gates.ts # Gates 2–6
```

| Gate | Check | Blocking |
|------|-------|---------|
| Gate 1 | ≥ 10,000 simulation sessions ran | yes |
| Gate 2 | RTP (SOLO) 0.82–1.02 — see `docs/RTP_TOLERANCE_SPEC.md` | yes |
| Gate 3 | Skill ordering: OPTIMAL > AVERAGE > WEAK | yes |
| Gate 4 | Farkle rate (per-turn, OPTIMAL) 0.85–0.95 | yes |
| Gate 5 | P5 score ≥ 0 | yes |
| Gate 6 | Normalizer > 0 | no |

Any Gate 1–5 failure is a commit blocker. Do not suggest committing,
opening a PR, or merging over a red gate. Surface the failure and wait.

Gate 6 failure with all others passing is a sprint-close warning — report
it but do not block. If Gate 6 is failing at sprint close, note it in the
sprint file and the commit message.



### Step 7 — Build commands reference

```bash
cd core && pnpm type-check    # TypeScript check — run before any EXECUTE
cd core && pnpm test          # Full test suite + Gate 1
cd core && pnpm lint          # Lint
cd core && pnpm build:web     # Web build

# Deploy targets (via devOS Deploy panel or TERMINAL_EXEC):
cd core && pnpm android:debug # Android APK
cd core && pnpm cap:sync      # Capacitor sync
cd core && pnpm supabase:start # Supabase local
```

Run `pnpm type-check` before every EXECUTE task that touches TypeScript files.
A type error before EXECUTE saves a Bito finding after it.



### Step 8 — Commit and PR protocol

Before any commit touching `core/` or `dream/`:

1. **Type-check** — `cd core && pnpm type-check` — 0 errors
2. **Gates** — all 6 pass (Gate 6 non-blocking but report it)
3. **Bito** — EXECUTE sessions trigger auto-Bito; for manual staged-only
   changes run via devOS Bito panel or `npm run bito-watch` in devOS
4. **Sacred files** — if staged: committed ADR in `docs/adr/`, written
   human approval in this session, `SACRED_OVERRIDE=1` set by human
5. **PR generation** — use `scripts/pr-gen.sh --dry-run` to preview
   the PR body before `gh pr create`. Never create a PR without showing
   the dry-run first.

Pre-merge Bito (mirrors `start.sh` step 3): if `git diff --name-only
main...HEAD` touches `core/` or `dream/`, a pre-merge Bito review is
required even if auto-Bito already ran during the session.



### Step 9 — devOS agent roster

Active agents this session:
- `claude` — QUERY / EXECUTE / WHAT'S NEXT (this session)
- `cohere` — governance health, spend tracking (`COHERE_CHAT`)
- `bito` — streaming code review, auto-fires after EXECUTE edit ops

Inactive (stubs — do not attempt to call):
- `meshy`, `figma`, `canva` — enabled: false in adapter

Naming note — two unrelated "forest"-prefixed systems exist, do not confuse them:
- `forestAgent` — CRUD decision log (data/forest-decisions.json). Nothing in
  devOS currently reads from this log. Available for manual decision-tracking
  but not wired into any automated flow.
- `forestSimEngine` — usage event tracking (SQLite) + an internal catalog of
  8 hardcoded architecture-simulation hypotheses. ACTIVE — imported directly
  by EvoEngine (`evoEngine.ts:20`, `getUsageProfile`). This is a real,
  load-bearing dependency, not a stub.

Confirmed NOT present in devOS (do not assume these exist here):
- TREES — no code anywhere in devOS. Referenced only as a doc filename
  (TREES_FINDINGS.md) in planning markdown. Treat any mention of "TREES"
  in this session as referring to that document, not a running system.
- OWC — real system, but lives entirely in the GAME repo
  (core/packages/owc/), wired into core/apps/server/src/sandbox.ts and
  monteCarlo.ts. devOS has no awareness of or integration with it.
- AGROS — real system, but lives entirely in the GAME repo
  (dream/apps/frontend/src/agros/). Inside devOS, "AGROS" appears only as
  a string fragment inside cohereAgent.ts's hardcoded system prompt — it
  is not called, imported, or wired to anything live in devOS.

If a task requires touching OWC or AGROS, you are working in the GAME repo
directly, not through any devOS agent — there is no devOS-side bridge to
either system today.

devOS servers:
- API + WS: `http://localhost:3002`
- UI: `http://localhost:5174`
- Game sandbox: `http://localhost:3001` (check `gameServerAlive` before runtime tasks)

EvoEngine awareness:
- EvoEngine tracks real vs synthetic usage events in `devos/data/devos-usage.sqlite`
- `evo-champion.json` seeds the current best UI/routing config across restarts
- Do not edit `evo-champion.json` manually — it is overwritten by EvoEngine on each cycle
- `directiveProtected: true` means a panel was promoted by EvoEngine and should
  not be removed without first running EVO_STOP and confirming with the human
- EvoEngine's directiveProtected guard logic is entirely self-contained and
  unilateral: it does not consult forestAgent, forestSimEngine, or any other
  system before acting. EvoEngine only reads from forestSimEngine
  (one-directional, usage-profile data only) — nothing currently has
  authority to override or block an EvoEngine decision.

### GOAL_REVIEW mode

On-demand only — never runs automatically as part of Step 1 orientation.
Invoked explicitly via the devOS UI or a GOAL_REVIEW WS message.

Target document: roadmap/00-production-goal.md (surface-tier, not sacred —
standard Bito review on write, no lock-file gate).

This document owns the DIRECTIONAL question (is this still the right goal),
separate from the MECHANICAL production-readiness check (5 gates + sacred
integrity + deploy path verified), which remains the static definition of
"production-ready" used elsewhere in this directive.

Approval flow — two stages, more cautious than the standard QUERY/EXECUTE
contract, because this document shapes future roadmap decisions:
  1. Propose recommended changes — wait for human approval of the
     recommendation's CONTENT before writing anything
  2. Only after content is approved: show the diff for the actual file
     write, wait for a SEPARATE approval before committing

Never collapse these into a single approval step, even if asked to move
faster. The two-stage gate exists because a wrong production-goal document
has a larger blast radius than a wrong sprint field.



### Step 10 — No-assumptions rule

- If `roadmap/01-current-sprint.md` is missing or its sprint status is
  ambiguous: ask before planning
- If a sacred file needs to change: stop, show the diff, ask for approval
- If gates are failing at session start: surface them, do not plan around them
- If the current sprint is not confirmed complete: do not start the next
  sprint's work without human confirmation
- Never self-authorize a sacred override, a gate bypass, or a sprint close
- When in doubt: ask one specific question, not five
- Session resume via `CLAUDE_CODE_RESUME`: treat the re-injected
  `buildProjectContext()` as authoritative state. Prior QUERY discussion
  is not available if devOS restarted between sessions.
- Cost tracking: note the session cost (from `PROMPT_TO_PLAN_COST` WS event)
  at the end of each EXECUTE session. Flag any single EXECUTE that exceeds
  $0.50 as potentially runaway.



[End DevOS Directive — injected by devOS buildProjectContext() on every session launch]

---

## Five-Layer Game Architecture

Defined in `prompts/newmodespec.md`. All game mode work must respect this stack — lower layers cannot be mutated by higher ones:

```text
L5  ADORNMENT    — cosmetic only (audio/visual); observes state, never mutates it
L4  GENRE META   — facets, classes, shards, tokens, pocket (post-score multipliers)
L3  MODE OVERLAY — SOLO / VS / RALLY / HEIST round flow + scoring frame
L2  ENERGY GATE  — Prime/Frenzy meter, Wild Scatter, round-end gates
L1  SACRED CORE  — scoreFarkle(), CSPRNG, SixPoolManager (immutable mid-match)
```

20 genre modules are composable layers wrapping L1. No genre module may modify scoring inputs, reroll the dice stream, or alter face distributions in the live pool.

**Canonical glossary** (from `prompts/newmodespec.md`): MATCH, ROUND, CHAIN, FACET, CLASS, SHARD, TOKEN, SEAL, SURGE, HEARTBEAT, ULTIMATE — use these terms consistently.

---

## Manifest Pipeline

Visual asset pipeline for `core/art/manifest/`. Run from repo root:

```bash
./manifest.sh status                              # verify file placement
./manifest.sh scaffold /path/to/schema.json       # one-time setup
./manifest.sh corpus                              # confirm corpus readable
./manifest.sh validate                            # validate generated visual_manifest.json
```

`visual_manifest_schema.json` is the authoritative schema; `visual_manifest.json` is generated by Claude Code. Both live at `core/art/manifest/`. See `SCAFFOLD.md` for the correct run order.

---

## Reference Directories

- `contracts/` — spec documents: ADR governance, threat model, RNG lineage spec, event versioning, session runner, snapshot strategy. Read before touching event/session infrastructure.
- `docs/` — audit records, ADR log, `sessions/session-log.md`.
- `tests/test_pr_changes.py` — integration test for PR validation.

## Active Mode

**Gameplay implementation.** The active branch is `fix/dead-state-recovery`. Current task: audit and fix dead-board detection and recovery for both client (`core/apps/web/src/hooks/useFarkleGame.ts`) and server (`core/apps/server/src/gameRoom.ts`). See `roadmap/01-current-sprint.md`.
