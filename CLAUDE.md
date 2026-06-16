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

Follow this exact order for every development session:

**STEP 1: Read `roadmap/01-current-sprint.md`**
Current sprint context — what is being built now, what is pending, what is deferred.

**STEP 2: Check `core/.ff-core-lock`**
Before touching ANY file, confirm its lock status. Files listed under CORE SACRED require explicit human approval before committing. Read the lock file directly — it is the authoritative source.

**STEP 3: Confirm source of truth for your work area**
- Gameplay changes → `core/FARKLEFRENZY.md`
- Visual changes → `3libras/the_visual_layer.md`
- Audio/AGROS changes → `dream/constitution/operational-law.md`
- Sacred file work → **STOP. Get human approval first.**

**STEP 4: Implement and test**
- FAR_NZY: `cd core && pnpm type-check && pnpm test`
- AGROS: `cd dream/apps/backend && npm test`

**STEP 5: Run `./manifest.sh status` before committing**
Verify pipeline integrity. Confirm no manifest regressions before any commit.

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
