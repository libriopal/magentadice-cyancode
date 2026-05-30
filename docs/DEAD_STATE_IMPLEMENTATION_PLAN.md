# Dead-State Implementation Plan — Revised

**Branch:** `fix/dead-state-recovery`
**Revised:** 2026-05-30
**Status:** AWAITING HUMAN APPROVAL — no code changes have been made

---

## Overall Project Score at Time of Revision

| System | Status | Score |
|--------|--------|-------|
| Authority | PARTIAL | 40% |
| Scanner | MISSING | 0% |
| Telemetry | PARTIAL | 55% |
| RTP | PARTIAL | 50% |
| Economy integrity | PARTIAL | 30% |
| Multiplayer integrity | PARTIAL | 45% |
| **Composite** | | **37 / 100** |

---

## Authority Domain Map

The client and server run independent board models with no reconciliation layer.
Every fix must be scoped to exactly one domain. Cross-domain assumptions are invalid.

| Domain | Board | RNG | Reshuffle Tool | Dead-Board Detector |
|--------|-------|-----|---------------|---------------------|
| **Client** | `VoxelPhysicsSystem.bodies` (3D Rapier3D) | `seededRng` via `faceRng` | `reshuffleBoard()` — EXISTS, broken | `isDeadBoard()` — EXISTS, incomplete |
| **Server** | `GameRoomState.grid: Cell[][]` (2D row/col) | `CSPRNG` → `SixPoolManager` | **No face-reshuffle function exists** | `hasValidChain()` — EXISTS, unconnected |

---

## Scope Correction — Server Recovery

**Previous plan error:** Proposed `spawnTiles(this.state.grid, this.pool)` as server recovery.

**Runtime truth:** `spawnTiles()` (`gridUtils.ts:335`) iterates `newGrid[0][c]` and fills cells where
`state === 'EMPTY'` only. A dead board is occupied cells with faces that cannot form a valid chain.
`spawnTiles()` makes no change to a dead board of occupied cells.

**Correct tool:** None exists. Server recovery requires a new function that:
1. Iterates every cell in `Cell[][]`
2. Skips blocker types (`STONE`, `ICE`, `LOCK`, `EMPTY`)
3. Redraws die/wild faces using `pool.reshuffle()` then `pool.drawDie()` / `pool.drawWild()`
4. Returns updated `Cell[][]`

**Where this new code can live (both SACRED, both require approval):**
- Option A: New exported function `reshuffleGridFaces(grid, pool)` in `gridUtils.ts`
- Option B: Private inline method `_reshuffleGridFaces()` in `gameRoom.ts`

Option B is preferred — keeps `gridUtils.ts` changes minimal and contains the recovery logic
inside the same class that owns the grid.

---

## Files Requiring Approval (SACRED — `core/.ff-core-lock`)

### A. `core/apps/web/src/hooks/useFarkleGame.ts` — CLIENT DOMAIN

**Change 1:** Replace forced face=1 injection.

Current (`useFarkleGame.ts:573–578`):
```typescript
} else {
  const bodies = store.getState().bodies;
  for (const b of bodies) {
    if (b.entityType === 'die') physics.setDieFace(b.id, 1);
  }
  deadBoardAttemptsRef.current = 0;
}
```

Replacement:
```typescript
} else {
  physics.injectScoringDie();  // seeded face=1 or face=5 via faceRng (see VoxelPhysicsSystem)
  deadBoardAttemptsRef.current = 0;
}
```

**Change 2:** Add `_checkDeadBoard()` call inside `_doCasinoChain()`.

Location: after `physics.removeBody(id)` loop at `useFarkleGame.ts:733`.
```typescript
setTimeout(_checkDeadBoard, 150);
```

**Risk:** SACRED. Scoring path change. Full test suite required before commit.

---

### B. `core/apps/server/src/gameRoom.ts` — SERVER DOMAIN

**Change 1:** Add dead-board detection call after farkle.

Current (`gameRoom.ts:279`):
```typescript
setTimeout(() => { this.state.phase = 'IDLE'; this.nextTurn(); }, 800);
```

After the `setTimeout` block (not inside it):
```typescript
this._checkAndRecoverDeadBoard();
```

**Change 2:** Add new private method `_checkAndRecoverDeadBoard()`.

```typescript
private _checkAndRecoverDeadBoard(attempt = 0): void {
  if (hasValidChain(this.state.grid)) return;
  if (attempt >= 3) {
    this.broadcast({ type: 'BOARD_DEAD_RECOVERY_FAILED' });
    void this.endSession(this.activePlayerId ?? '');
    return;
  }
  this.pool.reshuffle();
  this.state.grid = this._reshuffleGridFaces(this.state.grid);
  this.broadcast({ type: 'BOARD_UPDATE', grid: this.state.grid, recoveryAttempt: attempt + 1 });
  this._checkAndRecoverDeadBoard(attempt + 1);
}
```

**Change 3:** Add new private method `_reshuffleGridFaces()`.

```typescript
private _reshuffleGridFaces(grid: Cell[][]): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  for (let r = 0; r < newGrid.length; r++) {
    for (let c = 0; c < newGrid[0].length; c++) {
      const cell = newGrid[r][c];
      // Preserve blockers and empty cells unchanged
      if (cell.type === 'STONE' || cell.state === 'EMPTY') continue;
      if (cell.state === 'FROZEN' || cell.state === 'LOCKED') continue;
      // Redraw face from pool for normal die/wild cells
      const d = this.pool.drawDie();
      const face = (d >= 1 && d <= 6 ? d : 1) as import('@match3d/farkle-shared').DieFace;
      newGrid[r][c] = { ...cell, face };
    }
  }
  return newGrid;
}
```

**Change 4:** Extend existing import line (`gameRoom.ts:15`):
```typescript
// Before:
import { CSPRNG, createGrid, SixPoolManager, scoreFarkle, hashServerSeed, estimateFarkleRisk, isOptimalDecision } from '@match3d/farkle-engine';
// After:
import { CSPRNG, createGrid, SixPoolManager, scoreFarkle, hashServerSeed, estimateFarkleRisk, isOptimalDecision, hasValidChain } from '@match3d/farkle-engine';
```

Note: `spawnTiles` is **NOT** imported. It was incorrectly proposed in the previous plan — it
fills empty top-row cells only and makes no change to a dead board of occupied cells.

**Risk:** SACRED. New broadcast message type. Multiplayer session flow change. Integration test required.

---

## Files Safe to Modify (not in `core/.ff-core-lock`)

### C. `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts` — CLIENT DOMAIN

**Change 1:** Fix `isDeadBoard()` — remove tappable entities from the "always alive" list.

`multiplier_orb`, `bomb`, `rainbow_bomb` are in `TAPPABLE` (`useFarkleGame.ts:31`), not `CHAINABLE`
(`useFarkleGame.ts:30`). Their presence does not mean a chain is available.

```typescript
isDeadBoard(): boolean {
  // Only truly chainable entity types count as "alive"
  for (const [, data] of this.bodies) {
    if (['wild', 'mirror', 'catalyst'].includes(data.entityType)) return false;
  }
  // Face-count check on chainable dice only
  const faceCounts: Record<number, number> = {};
  for (const [, data] of this.bodies) {
    if (data.entityType !== 'die' || data.face === null) continue;
    if (data.face === 1 || data.face === 5) return false;
    faceCounts[data.face] = (faceCounts[data.face] ?? 0) + 1;
    if ((faceCounts[data.face] ?? 0) >= 3) return false;
  }
  return true;
}
```

Note: Full adjacency check is deferred — the face-count fix removes the confirmed false-positives
(tappable entities) without introducing new complexity. Adjacency enhancement is a separate scope item.

**Change 2:** Fix `reshuffleBoard()` — scope to `die`/`mirror`/`ghost`/`catalyst` only; add
validation loop.

```typescript
reshuffleBoard(): void {
  for (let attempt = 0; attempt < 5; attempt++) {
    for (const [, data] of this.bodies) {
      // ice and lock retain their faces — separate game mechanic
      if (['die', 'mirror', 'ghost', 'catalyst'].includes(data.entityType)) {
        data.face = Math.ceil(this.faceRng() * 6);
      }
    }
    if (!this.isDeadBoard()) return;
  }
  // Exhausted: caller handles via injectScoringDie()
}
```

**Change 3:** Add `injectScoringDie()` — seeded final fallback.

```typescript
injectScoringDie(): void {
  const heights = this._columnHeights();
  let lowestCol = 0; let lowestH = Infinity;
  for (let i = 0; i < 7; i++) {
    if ((heights[i] ?? 0) < lowestH) { lowestH = heights[i] ?? 0; lowestCol = i; }
  }
  const face = this.faceRng() < 0.5 ? 1 : 5;  // seeded — not hardcoded
  this.spawnBody(lowestCol, 'die', face);
}
```

**Risk:** None — file not in lock. Changes isolated to three methods.

---

## Authority Domain Separation Summary

| Change | Domain | File Status | Dependency |
|--------|--------|------------|------------|
| Fix `isDeadBoard()` entity list | Client | Safe | None |
| Fix `reshuffleBoard()` scope + retry | Client | Safe | Requires fixed `isDeadBoard()` |
| Add `injectScoringDie()` | Client | Safe | Requires fixed `reshuffleBoard()` |
| Remove `setDieFace(id,1)` → `injectScoringDie()` | Client | SACRED | Requires `injectScoringDie()` |
| Add `_checkDeadBoard()` in casino chain | Client | SACRED | None |
| Add `hasValidChain` import | Server | SACRED | None |
| Add `_reshuffleGridFaces()` inline | Server | SACRED | Requires `pool.reshuffle()` (exists) |
| Add `_checkAndRecoverDeadBoard()` | Server | SACRED | Requires both above |

Client fixes and server fixes are **fully independent**. Either can be merged without the other.

---

## RTP Impact

| Change | Domain | RTP Effect |
|--------|--------|-----------|
| Remove `setDieFace(id,1)` | Client | Eliminates artificial all-1s board. Restores CSPRNG guarantee for casino sessions. **CRITICAL.** |
| `injectScoringDie()` via `faceRng` | Client | Single seeded die. Auditable. Derivable from committed seed. |
| `reshuffleBoard()` retry loop | Client | Reduces probability of forced fallback. RTP-neutral. |
| `_checkAndRecoverDeadBoard()` | Server | Eliminates forced-farkle `unbanked=0` drain on dead boards. **CRITICAL.** |
| `_reshuffleGridFaces()` | Server | Pool-seeded face redistribution. No score awarded during recovery. RTP-neutral. |

---

## Test Plan

```bash
# Gate 1 — regression
cd core
pnpm type-check          # 0 errors
pnpm test                # all pass
pnpm --filter @match3d/farkle-engine test   # 16/16 farkleScorer cases

# Gate 2 — VoxelPhysicsSystem (safe file, run without approval)
# isDeadBoard(): board with multiplier_orb only → true
# isDeadBoard(): board with bomb only, no die bodies → true
# reshuffleBoard(): ice entity face unchanged after reshuffle
# reshuffleBoard(): lock entity face unchanged after reshuffle
# reshuffleBoard(): result passes !isDeadBoard() within 5 attempts
# injectScoringDie(): adds exactly one body with face 1 or 5
# injectScoringDie(): face derived from faceRng, not hardcoded

# Gate 3 — useFarkleGame (sacred, run after approval)
# _checkDeadBoard() attempt >3: must NOT call setDieFace with literal 1
# _checkDeadBoard() attempt >3: must call physics.injectScoringDie()

# Gate 4 — gameRoom (sacred, run after approval)
# processChain() farkle on grid where hasValidChain() returns false
#   → _checkAndRecoverDeadBoard() fires
#   → state.banked and state.unbanked unchanged
#   → BOARD_UPDATE broadcast with updated grid
# 3 consecutive failed recoveries → BOARD_DEAD_RECOVERY_FAILED → endSession()
```

---

## Rollback Plan

Branch: `fix/dead-state-recovery`. No database migrations. No schema changes.

```bash
# Full rollback
git checkout main && git submodule update --init --recursive core dream

# Post-merge rollback
git revert <merge-commit-sha>
```

Changed files: `VoxelPhysicsSystem.ts` (3 methods), `useFarkleGame.ts` (1 branch + 1 call site),
`gameRoom.ts` (1 import extension + 2 new private methods + 2 call sites).

---

## Implementation Order

```
Step 1 — No approval needed:
  Edit VoxelPhysicsSystem.ts (Changes C1, C2, C3)
  Run: cd core && pnpm type-check && pnpm test

Step 2 — Approval required (client domain):
  Edit useFarkleGame.ts (Changes A1, A2)
  Run: cd core && pnpm type-check && pnpm test

Step 3 — Approval required (server domain):
  Edit gameRoom.ts (Changes B1, B2, B3, B4)
  Run: cd core && pnpm type-check && pnpm test

Step 4 — Commit:
  git -C core add apps/web/src/hooks/useFarkleGame.ts \
                  apps/server/src/gameRoom.ts \
                  packages/game-core/src/systems/VoxelPhysicsSystem.ts
  git -C core commit -m "fix(dead-state): seeded recovery client+server, authority-domain-scoped"
  git add core
  git commit -m "fix(dead-state): sync core submodule"
```

Steps 2 and 3 are independent — either can be executed first once approval is granted.
