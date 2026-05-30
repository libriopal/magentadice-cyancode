# magentadice-cyancode — FAR_NZY + AGROS Integration Monorepo

This repository is the integration layer that ties together two independent submodule projects and their shared assets.

## What lives here

| Directory | Role | Type |
|-----------|------|------|
| `core/` | FAR_NZY (Farkle Frenzy) — physics-based Match-3D puzzle/casino game | **git submodule** |
| `dream/` | AGROS — emotional music engine that converts FAR_NZY game state into procedural audio | **git submodule** |
| `data/` | Image corpus (~1550 assets + `.info.json` metadata) | **local directory — NOT a submodule** |
| `3libras/` | Visual design law (Gothic Hacker Neon UI spec) | local directory |
| `mesh/` | Governance archive (authority model, sacred-core spec) | local directory |
| `roadmap/` | Active sprint tracking | local directory |

## Setup

```bash
git clone <repo-url>
git submodule update --init --recursive core dream
```

`data/` requires no submodule init — it is a plain local directory.

## Where to work

**Gameplay logic → `core/`**
```bash
cd core
pnpm install
pnpm dev          # web dev server
pnpm type-check   # 0 errors required before any PR
pnpm test         # all tests must pass
```

**Audio engine → `dream/`**
```bash
cd dream
npm run install:all
cd apps/frontend && npm run dev
cd apps/backend  && npm run dev
```

## Sacred boundaries

The authoritative sacred-file list is `core/.ff-core-lock`. Files listed there implement game balance, scoring, and provably-fair RNG. **Do not modify them without explicit developer approval and full test suite passing.**

Quick reference of the most critical files:
- `core/packages/farkle-engine/src/farkleScorer.ts` — scoring engine
- `core/packages/farkle-engine/src/csprng.ts` — provably-fair RNG
- `core/apps/web/src/hooks/useFarkleGame.ts` — client game loop
- `core/apps/server/src/gameRoom.ts` — server game loop

## Active task

**Branch:** `fix/dead-state-recovery`

**Current work:** Dead-board recovery audit and fix — ensuring client and server both correctly detect and recover from board states where no valid chain exists, without bypassing CSPRNG. See `roadmap/01-current-sprint.md` for full scope.
