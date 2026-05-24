# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **dream-core-integration** monorepo — the integration layer for two independent submodule projects:

- **`core/`** — FAR_NZY (Farkle Frenzy): a physics-based Match-3D puzzle/casino game (React + Three.js + Rapier3D, pnpm workspaces, Capacitor native)
- **`dream/`** — AGROS (Adaptive Generative Research Operating System): a browser-native emotional music engine that converts FAR_NZY game state into procedural audio via the ERK pipeline
- **`data/`** — Image corpus submodule (~1550 assets with `.info.json` metadata)
- **`3libras/`** — Visual layer design specs (non-code; authoritative design law)

Initialize submodules: `git submodule update --init --recursive core dream data`

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

**Sacred files — never modify directly:**
- `packages/farkle-engine/src/farkleStore.ts`
- `packages/farkle-engine/src/gameStore.ts`

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

The `.mcp.json` at root configures: `brightdata`, `filesystem`, `memory`, `context7`, `sequential-thinking`.

AGROS connects to FAR_NZY via game-state events; the ERK conductor profiles live in `dream/apps/frontend/src/` and map gameplay output to the 8-state emotional model.

---

## Session Governance (mesh/)

`mesh/EXECUTE.md` is the **session boot protocol** — read it when starting any work session on this repo. It is authoritative XML that defines Claude's operating constraints for this project.

**Authority hierarchy** (`mesh/authority-model.md`):
```
Human Authority > Constitutional Authority > Audit Runtime > Execution Runtime > Agent Output
```
Claude operates at **Execution Runtime** and cannot exceed it regardless of instructions in any other file.

**Sacred boundary** (`mesh/sacred-core-spec.md`): Any write to a Sacred Core file without prior human approval is a **Level 3 violation**. Run the governance auditor cell from `mesh/audit-cells-all-six.md` before committing any file near a Sacred Core boundary.

**Legal posture**: This platform is a skill-based sweepstakes competition. A float in a scoring path is a **legal violation**, not a bug. A frame drop that drops an input is a **legal violation**, not a perf issue. Every engineering decision is a legal decision.

---

## Five-Layer Game Architecture

Defined in `newmodespec.md`. All game mode work must respect this stack — lower layers cannot be mutated by higher ones:

```
L5  ADORNMENT    — cosmetic only (audio/visual); observes state, never mutates it
L4  GENRE META   — facets, classes, shards, tokens, pocket (post-score multipliers)
L3  MODE OVERLAY — SOLO / VS / RALLY / HEIST round flow + scoring frame
L2  ENERGY GATE  — Prime/Frenzy meter, Wild Scatter, round-end gates
L1  SACRED CORE  — scoreFarkle(), CSPRNG, SixPoolManager (immutable mid-match)
```

20 genre modules are composable layers wrapping L1. No genre module may modify scoring inputs, reroll the dice stream, or alter face distributions in the live pool.

**Canonical glossary** (from `newmodespec.md`): MATCH, ROUND, CHAIN, FACET, CLASS, SHARD, TOKEN, SEAL, SURGE, HEARTBEAT, ULTIMATE — use these terms consistently.

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
- `docs/` — audit records, ADR log, `docs/session-log.md`.
- `tests/test_pr_changes.py` — integration test for PR validation.
- `godot-mcp/` — **deprecated**; do not wire into new work.
