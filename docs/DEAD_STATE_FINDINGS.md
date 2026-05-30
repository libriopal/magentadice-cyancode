# Dead-State Audit Findings

**Branch:** `fix/dead-state-recovery`
**Date:** 2026-05-30
**Audited files:** `useFarkleGame.ts`, `VoxelPhysicsSystem.ts`, `gridUtils.ts`, `gameRoom.ts`
**Status:** Investigation only — no code modified

---

## Search Results Summary

| Term | File | Lines |
|------|------|-------|
| `_checkDeadBoard` | `useFarkleGame.ts` | 405, 421, 567, 622 |
| `isDeadBoard` | `VoxelPhysicsSystem.ts` | 563 |
| `reshuffleBoard` | `VoxelPhysicsSystem.ts` | 578 |
| `setDieFace` | `VoxelPhysicsSystem.ts` | 556 |
| `hasValidChain` | `gridUtils.ts` | 515 |
| `spawnBody` | `VoxelPhysicsSystem.ts` | 148 |
| `overflowTicks` | `VoxelPhysicsSystem.ts` | 65, 531, 533 |
| `casinoIntervalRef` / casino chain | `useFarkleGame.ts` | 352–368, 675–738 |
| dead board (term) | none — not used in strings | — |
| reshuffle | `gridUtils.ts` | 157 (`SixPoolManager.reshuffle()`) |
| farkle recovery | not present as a term | — |

---

## Finding 1 — Client Recovery EXISTS but Has Critical Fallback Bug

**File:** `core/apps/web/src/hooks/useFarkleGame.ts:567–580`

**Current behavior:**

```
_checkDeadBoard() {
  if (!physics || !physics.isDeadBoard()) { deadBoardAttemptsRef = 0; return; }
  deadBoardAttemptsRef++
  if (attempts <= 3) → physics.reshuffleBoard()
  else               → force ALL die faces = 1; reset attempts
}
```

**Called from:**
- Line 405 — after `result === 'farkle'` (chain produced no score)
- Line 421 — after successful chain commit (board state changed)
- Line 622 — after RAINMAKER bomb detonation

**Bug:** The `else` branch (attempts > 3) calls `physics.setDieFace(b.id, 1)` for every die on the board. This:
1. Bypasses the seeded `faceRng` entirely — outcome is not CSPRNG-derived
2. Creates a guaranteed board of all-1s — worth 100pts × die count per chain, artificially inflating payout
3. In `SOLO_CASINO` / `VS_CASINO` mode, provably-fair guarantee is broken for this event

---

## Finding 2 — `isDeadBoard()` Does Not Check Adjacency

**File:** `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts:563–576`

**Current logic:**
```
1. If any wild/bomb/mirror/catalyst/multiplier_orb exists → return false (alive)
2. If any die face == 1 or 5 → return false (alive)
3. If any face count >= 3 → return false (alive, three-of-a-kind available)
4. Otherwise → return true (dead)
```

**Bug:** This is a face-count check, not an adjacency check. The board can have three dice showing face=2 in columns 0, 3, and 6 with no physical path between them. `isDeadBoard()` would return false (board "alive"), but the player cannot form a valid chain because the dice are not adjacent.

**Consequence:** Dead boards are under-detected on the client. The player taps and drags to no avail; the game does not recover because `_checkDeadBoard()` is only called after chain commits or farkles — not on idle timeout.

**Note:** `gridUtils.ts:hasValidChain()` performs the correct BFS with adjacency check and wild resolution. This function is the correct solution but is only used in the server's grid model, not the client's 3D physics model.

---

## Finding 3 — `reshuffleBoard()` Does Not Validate Result

**File:** `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts:578–584`

**Current behavior:**
```
reshuffleBoard() {
  for each body with a face → data.face = Math.ceil(faceRng() * 6)
}
```

**Bug:** `reshuffleBoard()` rerolls all faces but never calls `isDeadBoard()` to verify the result. The `faceRng` is seeded (`seed ^ 0x55aa55aa`) and could produce another dead configuration. After 3 unverified reshuffles, the forced face=1 injection fires.

**Also note:** `reshuffleBoard()` reassigns faces on `ice`, `lock`, `ghost`, and `catalyst` entity types in addition to `die`. This changes the face of frozen/locked tiles, which have separate gameplay rules and should arguably retain their faces unless the player unlocks them.

---

## Finding 4 — Server Has No Dead-Board Recovery (CRITICAL)

**File:** `core/apps/server/src/gameRoom.ts:262–322`

**Current behavior after farkle:**
```
processChain() {
  if (result.isFarkle) {
    state.unbanked = 0
    broadcast CHAIN_RESULT
    setTimeout 800ms → state.phase = IDLE → nextTurn()
    return
  }
}
```

There is no call to `hasValidChain()` or any equivalent dead-board check anywhere in `gameRoom.ts`.

**Bug:** In multiplayer, after a farkle, the turn passes to the next player on a potentially dead grid. That player also farkles (cannot chain). This continues until players disconnect or the game timer expires. Unbanked scores are lost on every forced farkle, creating a systematic RTP drain.

**Available tool not used:** `hasValidChain()` in `gridUtils.ts:515` performs correct BFS dead-board detection and is exported. `SixPoolManager.reshuffle()` in `gridUtils.ts:157` provides CSPRNG-seeded grid recovery. Neither is imported or called in `gameRoom.ts`.

---

## Finding 5 — `isDeadBoard()` Excludes Entity Types That May Not Be Chainable

**File:** `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts:563–566`

The function returns false (alive) if any `multiplier_orb` exists. However, `multiplier_orb` is in the `TAPPABLE` set in `useFarkleGame.ts` — it cannot be included in a chain. A board with only dice showing faces 2, 3, 4, 6 plus one `multiplier_orb` would return false (alive) even though no chain is possible.

**Same issue for `bomb` / `rainbow_bomb`:** These are tappable, not chainable. Their presence should not mark the board as "alive" from a chain-scoring perspective.

---

## Finding 6 — Casino Chain Does Not Trigger Dead-Board Check

**File:** `core/apps/web/src/hooks/useFarkleGame.ts:675–738`

The casino auto-chain (`_doCasinoChain`) runs on a 900ms interval during Six-of-a-Kind reward. It commits chains and removes bodies via `physics.removeBody()` but does NOT call `_checkDeadBoard()` after each auto-commit. If casino mode empties the board to a dead state, the check is never triggered until the player manually initiates a chain.

---

## Summary

| # | Finding | Severity | RTP Impact | Sacred File? |
|---|---------|----------|-----------|--------------|
| 1 | Forced face=1 injection bypasses CSPRNG | CRITICAL | YES — casino payout affected | YES (`useFarkleGame.ts`) |
| 2 | `isDeadBoard()` misses adjacency | HIGH | YES — dead boards unreported | NO (`VoxelPhysicsSystem.ts`) |
| 3 | `reshuffleBoard()` unverified result | HIGH | Indirect — leads to Finding 1 | NO (`VoxelPhysicsSystem.ts`) |
| 4 | Server has no dead-board recovery | CRITICAL | YES — forced farkles drain RTP | YES (`gameRoom.ts`) |
| 5 | Tappable entities (orb/bomb) falsely mark board alive | MEDIUM | Indirect | NO (`VoxelPhysicsSystem.ts`) |
| 6 | Casino auto-chain skips dead-board check | MEDIUM | Low (casino mode is brief) | YES (`useFarkleGame.ts`) |
