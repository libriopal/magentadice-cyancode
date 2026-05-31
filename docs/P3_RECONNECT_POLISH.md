# P3 — Multiplayer Reconnect Polish
## Status: DEFERRED — not in scope for fix/dead-state-recovery PR
## Prerequisite: Fix 1 (functional reconnect) merged via P2.6 PR

---

## Context

Fix 1 implemented a functional client-side reconnect in `multiplayerStore.ts` (SURFACE only).
On unexpected disconnect during `'playing'`, the client stores credentials
(`roomCode`, `playerId`, `playerName`) and attempts `JOIN_ROOM` up to 3× with 2s backoff.
The server weakly supports rejoin because `index.ts` accepts a client-supplied `playerId`
in `JOIN_ROOM`, and `addPlayer()` re-inserts the player into the live `GameRoomState`.

This is sufficient for basic session continuity but leaves four server-side gaps that
require changes to `gameRoom.ts` (CORE SACRED). Each gap below describes the issue,
the user-visible consequence, and the minimal fix.

---

## Gap 1 — Energy reset on rejoin

**File:** `core/apps/server/src/gameRoom.ts`
**Line:** 164 — `this.players.set(playerId, { ws, profile: player, energy: 150 });`
**Sacred:** YES

**Problem:** `addPlayer()` always sets `energy: 150` regardless of the player's prior energy.
A player in PRIME (energy 180) or FRENZY (energy 220) rejoins with energy reset to 150 (PRIME boundary).

**Consequence:** Energy mode may shift on rejoin. In PRIME→reset→PRIME this is invisible.
In FRENZY→reset→PRIME, active Frenzy bonuses stop. Not exploitable (resets to a lower state).

**Fix:** Before `this.players.set(...)`, check `this.players.has(playerId)`. If returning,
preserve the prior `energy` value instead of resetting to 150. Requires no other changes.

**Authorization required:** YES (CORE SACRED)

---

## Gap 2 — Spurious `PLAYER_JOINED` broadcast on rejoin

**File:** `core/apps/server/src/gameRoom.ts`
**Line:** 172 — `this.broadcast({ type: 'PLAYER_JOINED', playerId, playerName });`
**Sacred:** YES

**Problem:** `addPlayer()` broadcasts `PLAYER_JOINED` to all players unconditionally.
On rejoin, opponents see "Player X joined" again mid-game, which looks like a second player
entering the room rather than a reconnect.

**Consequence:** Visual confusion in the opponent's UI. No gameplay impact.

**Fix:** Add a `PLAYER_RECONNECTED` broadcast type for the returning-player case, or
suppress `PLAYER_JOINED` and send only `ROOM_STATE` on rejoin. Requires detecting
returning vs new player in `addPlayer()`.

**Authorization required:** YES (CORE SACRED) — also requires client handler for
`PLAYER_RECONNECTED` in `multiplayerStore._applyMessage` (SURFACE, no auth needed).

---

## Gap 3 — No `RECONNECTED` message type

**File:** `core/apps/server/src/gameRoom.ts` + `core/apps/web/src/store/multiplayerStore.ts`
**Sacred:** YES (server) / NO (client)

**Problem:** The server sends `ROOM_JOINED` + `ROOM_STATE` on both fresh join and rejoin.
The client distinguishes these via the `_isReconnecting` flag, but there is no server-side
semantic to confirm "this is a reconnect, not a new join." If `_isReconnecting` is out of
sync (e.g., timer races), the client may misclassify the response.

**Consequence:** Low probability status regression — client sets `'lobby'` instead of
`'playing'` after reconnect, causing MultiplayerLobby to render over the game.

**Fix:** Server emits `{ type: 'PLAYER_RECONNECTED', playerId }` instead of `PLAYER_JOINED`
when it detects a returning player (by `this.players.has(playerId)` check from Gap 1).
Client `_applyMessage` handles `PLAYER_RECONNECTED` to cleanly set `_isReconnecting = false`
and restore `'playing'` without relying on the ROOM_STATE race.

**Authorization required:** YES for server emit (CORE SACRED). Client handler is SURFACE.

---

## Gap 4 — Turn position not restored after turn-timer fire

**Files:** `core/apps/server/src/gameRoom.ts`, `core/apps/web/src/store/multiplayerStore.ts`
**Sacred:** YES (server)

**Problem:** When a player disconnects mid-turn, the server's turn timer fires after
`turnTimerSeconds` (default 15s) and calls `handleBank()`, advancing `activePlayerId`
to the next player. When the disconnected player reconnects, their turn has been auto-banked
and it is now the opponent's turn. The reconnected player's HUD may show it is their turn
if `activePlayerId` is not synced from the ROOM_STATE correctly.

**Consequence:** If `ROOM_STATE` from `getPublicState()` includes `activePlayerId` (it does
per the current client handler), this resolves automatically on reconnect. Verify that
`getPublicState()` includes `activePlayerId` — if it does, this gap is already closed
by the Fix 1 ROOM_STATE sync path.

**Action:** Read `getPublicState()` in `gameRoom.ts` and confirm `activePlayerId` is included
before logging this as a required change. May be a non-issue.

**Authorization required:** UNKNOWN — depends on audit of `getPublicState()`.

---

## Implementation Order (when authorized)

1. Gap 1 (energy preserve) — single-line change in `addPlayer()`, lowest risk
2. Gap 3 + client handler — add `PLAYER_RECONNECTED` type; client handler is SURFACE
3. Gap 2 (suppress `PLAYER_JOINED`) — depends on Gap 1 detection logic
4. Gap 4 (audit `getPublicState()`) — read-only audit first; may require no code change

Each server change requires explicit human authorization per ADR-002 (CORE SACRED protocol).

---

## Known Limitations of Fix 1 (accepted for P2.6 PR)

- Energy resets to 150 on rejoin (Gap 1)
- Opponent sees spurious `PLAYER_JOINED` (Gap 2)
- `multiplierStep` preserved from client's last known value, not synced from server
  (server does not include `multiplierStep` in `ROOM_STATE` — next `CHAIN_RESULT` will correct it)
- If room expires server-side before all 3 reconnect attempts complete, client ends in
  `'disconnected'` with `error: 'Room not found'` (correct behavior — no silent failure)
