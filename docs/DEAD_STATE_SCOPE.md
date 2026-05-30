# Dead-State Recovery — Scope Definition (IA-4)

**Branch:** `fix/dead-state-recovery`
**Date:** 2026-05-30

---

## 1. Client Scope

**Entry point:** `core/apps/web/src/hooks/useFarkleGame.ts`

The client manages a 3D physics simulation (Rapier3D) via `VoxelPhysicsSystem`. Dead-board detection and recovery happens entirely in:

- **`_checkDeadBoard()`** — `useFarkleGame.ts:567–580`
  - Called after: farkle result (line 405), successful chain commit (line 421), RAINMAKER bomb (line 622)
  - Delegates detection to `VoxelPhysicsSystem.isDeadBoard()`
  - Delegates recovery to `VoxelPhysicsSystem.reshuffleBoard()` (attempts 1–3)
  - Falls back to forced face=1 injection (attempts > 3) — **this is a bug**

- **`isDeadBoard()`** — `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts:563–576`
  - Returns false if any "safe" entity (wild, bomb, mirror, catalyst, multiplier_orb) exists
  - Returns false if any die face is 1 or 5 (always-scoreable)
  - Returns false if any face appears ≥ 3 times (three-of-a-kind)
  - **Does NOT check physical adjacency** — a board with three scattered 2s but no path between them will return false (false negative)

- **`reshuffleBoard()`** — `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts:578–584`
  - Rerolls all face-bearing entity faces using `faceRng` (seeded, deterministic)
  - **Does NOT verify the resulting board has valid chains** — may produce another dead board

---

## 2. Server Scope

**Entry point:** `core/apps/server/src/gameRoom.ts`

The server manages a 2D grid (`Cell[][]`) independently of the client physics simulation. Dead-board detection is **entirely absent** from the server:

- `processChain()` — `gameRoom.ts:262–322`
  - After farkle: resets `unbanked`, calls `nextTurn()` — **no dead-board check**
  - After scoring chain: broadcasts `BOARD_UPDATE` — **no dead-board check**
  - There is no call to `hasValidChain()` anywhere in `gameRoom.ts`

- **`hasValidChain()`** — `core/packages/farkle-engine/src/gridUtils.ts:515–543`
  - Correct BFS implementation with wild resolution
  - Checks adjacency properly using `getNeighbors()`
  - **This function exists but is never called from the server**

- **`SixPoolManager.reshuffle()`** — `gridUtils.ts:157–164`
  - Reshuffles live + dead pools using seeded RNG
  - This is the correct server-side recovery primitive

---

## 3. RTP Implications

This is a **skill-based sweepstakes competition**. Every engineering decision is a legal decision.

| Issue | RTP Impact | Severity |
|-------|-----------|----------|
| Forced face=1 injection (`useFarkleGame.ts:575`) | Creates artificial all-1s board. All 1s = 100pts/die × N dice. This is a non-CSPRNG outcome injected into casino mode sessions. Bypasses provably-fair guarantee. | **CRITICAL** |
| `reshuffleBoard()` unverified | Can produce another dead board, triggering another attempt. After 3 unverified reshuffles, forced face=1 injection fires. | **HIGH** |
| `isDeadBoard()` false negatives | Board incorrectly reported as alive → player cannot score → session stalls → negative UX and possible timeout-loss, which affects payout fairness | **MEDIUM** |
| Server has no dead-board recovery | Multiplayer game can deadlock on a dead board. Next turn fires, active player cannot chain, farkle is forced, unbanked is lost. Repeated farkles on a dead board drain RTP unfairly. | **CRITICAL** |

---

## 4. Required Tests

### Client tests (run from `core/`)
```bash
pnpm type-check                             # 0 errors
pnpm test                                   # all pass
pnpm --filter @match3d/farkle-engine test   # farkleScorer + gridUtils
node --import tsx/esm --test packages/farkle-engine/src/farkleScorer.test.ts
```

### New tests to write (after approval)
- `VoxelPhysicsSystem.isDeadBoard()` — adjacency false-negative case
- `VoxelPhysicsSystem.reshuffleBoard()` — verify result has valid chain
- `_checkDeadBoard` fallback — no forced face=1 in casino mode
- `gameRoom.processChain()` — dead board after farkle → reshuffle → BOARD_UPDATE

---

## 5. Sacred-Core Restrictions

| File | Lock Status | Restriction |
|------|-------------|-------------|
| `core/apps/web/src/hooks/useFarkleGame.ts` | SACRED | Requires explicit human approval before any edit |
| `core/apps/server/src/gameRoom.ts` | SACRED | Requires explicit human approval before any edit |
| `core/packages/farkle-engine/src/gridUtils.ts` | SACRED | Requires explicit human approval before any edit |
| `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts` | NOT in lock file | Safe to modify; no approval gate |

**Consequence of violation:** Modifying a SACRED file without approval is a Level 3 violation per `mesh/authority-model.md`. In casino mode, an unapproved scoring change is a legal violation, not a code review comment.
