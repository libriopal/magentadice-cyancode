# ADR-024 — GAP-1b, Option 1: Server-Authoritative Deterministic Board

**Status:** PROPOSED — architecture only, not authorized, not implemented
**Date:** 2026-06-25
**Author:** Execution Runtime (Claude Sonnet 4.6)
**Human Authorization:** NOT YET GRANTED — this ADR documents the chosen
architecture and a self-audit for human review. No sacred-file code changes
are authorized by this document.
**Supersedes (for the multiplayer live-scoring path only):** Option 1 as
sketched in `docs/adr/ADR-023-gap1b-server-face-validation.md` — this ADR is
the "own follow-up ADR" that ADR-023 itself said Option 1 would require
(ADR-023 §"Constraints on Any Fix", item 2).
**Related:** `gap1_board_authority.md` (original GAP-1 "Option A" framing —
this ADR is effectively Option A, scoped concretely), ADR-023 (GAP-1b problem
statement, Options 1–3), FAR_NZY PR #4 (`c06e388`, GAP-1 seed-propagation
fix — narrower, already shipped, unaffected by this ADR).
**Sacred files touched (if approved):** `core/apps/server/src/gameRoom.ts`,
`core/apps/web/src/hooks/useFarkleGame.ts`. Possibly `core/apps/web/src/store/farkleStore.ts`
(read-only impact expected — confirm during implementation).
**Non-sacred files touched:** `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts`,
`core/apps/web/src/store/multiplayerStore.ts`, `core/packages/farkle-engine/src/gridUtils.ts`
(extending, not modifying scoring-relevant exports), possibly new files for
the board-engine tick loop.

---

## Human direction that shaped this ADR (verbatim constraints)

The developer chose Option 1 (full server authority) over Option 3 (bounded
plausibility check), and specified:

1. The server must run a **replayable, deterministic** simulation — not a
   bit-for-bit Rapier3D physics replica. A normal single-player-sized board
   (7×7) grid, tracking per-cell: emptiness, blocker type, die presence, face
   value.
2. This server board is the source of truth; the client's visual frontend
   follows the server's current state "as best as possible."
3. Under bad network conditions, **brief visual buffering is acceptable,
   visual stalling is not** — minimize lag/FPS/buffering impact as a
   priority, but never let the client front-run or fabricate state.
4. Strictly TypeScript, minimal server load, fast and reliable — explicitly
   **not** a request to run a physics engine (Rapier or otherwise)
   server-side.
5. Scope as a single combined diff across all touched files, self-audited,
   submitted for one combined approval. Bito review of the sacred diff
   happens **after** human approval, not before.

This ADR is the architecture for that — written first, per ADR-023's own
constraint, so the eventual sacred diff is reviewable instead of a single
unreviewable mega-patch.

---

## Decision

**Reject running Rapier3D (or any continuous physics engine) server-side.**
Investigated feasibility: `@dimforge/rapier3d-compat` is WASM-based and
technically *could* run in Node, and Rapier's WASM build is deterministic
under a fixed timestep with no threading. But:

- Die **face values are not derived from physics at all today** — confirmed
  by reading `VoxelPhysicsSystem.spawnBody()`: `face` is assigned at spawn
  time via `this._rollFace()` (a seeded RNG), independent of how the body
  visually tumbles. Physics in this game is cosmetic positioning, not a
  face-determination mechanism. Replicating Rapier server-side would
  therefore replicate visual jitter for zero scoring benefit.
- It would directly contradict the explicit "minimal server load, strictly
  TypeScript" requirement and reopen the "no float in the scoring path"
  spirit (`ADR-023` constraint 1; `CLAUDE.md` legal posture) by routing
  scoring-adjacent state through float-heavy collision resolution.

**Instead: extend the existing discrete `Cell[][]` grid model
(`core/packages/farkle-engine/src/gridUtils.ts`) from a one-shot static
snapshot into a continuously-advancing, tick-based, deterministic board
simulator** — pure integer/discrete logic, no physics engine, server-side.

This is a smaller, more correct interpretation of "replayable/deterministic"
than a physics replica: replayability falls out for free from (seed, tick
count) → identical grid state, exactly like `createGrid()` already is today
for the one-shot case.

### Why this is less new work than it first appears

`gameRoom.ts` already contains the **validated** half of this design and it
is currently dead code on the live path:

- `processChain()` (lines 373–434) takes client-submitted `{row, col}[]`
  positions and reads face values directly from `this.state.grid` —
  **already grid-authoritative**, already correct, just never invoked by
  any current client code (confirmed: `useFarkleGame.ts` only calls
  `mpActions.submitChainFaces(...)`, never `submitChain(...)`).
- `hasValidChain()` / `getNeighbors()` / `_isChainableTile()`
  (`gridUtils.ts`) already implement adjacency-based flood-fill validation
  against the grid — already exists, already used for dead-board detection.
- The gap is entirely that (a) `createGrid()` only runs once at room
  construction instead of continuously, (b) the live client uses the
  unvalidated `SUBMIT_CHAIN_FACES`/`processChainFaces()` path instead of the
  validated one, and (c) `processChainFaces()` has bonus logic (orb,
  doubler, archivist, heist vault) that `processChain()` does not yet have.

---

## Architecture

### 1. Server: discrete board-tick engine (new, non-sacred file)

New module, e.g. `core/packages/farkle-engine/src/boardEngine.ts` (not sacred
unless/until added to `.ff-core-lock` — flag for human decision at review
time, since it becomes scoring-adjacent).

- Maintains the existing `Cell[][]` (7×7 for solo-equivalent sizing per
  direction #1) plus a monotonic `tick: number`.
- `advanceTick(grid, pool, csprng, tick)`: pure function — given the current
  grid + the room's `CSPRNG`/`SixPoolManager` stream + a tick index, returns
  the next grid state (column gravity/settle, then deterministic refill of
  empty bottom-most cell per column from the CSPRNG/pool draw, matching the
  spawn-weight distribution `SPAWN_WEIGHTS` already defines for entity type
  selection, reused from `VoxelPhysicsSystem`'s same constants where
  possible so visual and logical spawn rates agree).
- Determinism/replayability: identical `(initial grid, seed, tick count)` →
  identical resulting grid, by construction (pure function, no wall-clock
  reads, no `Math.random()`).
- `GameRoom` drives this with a server-side tick loop (replacing the
  300ms-cadence idea from the client's `_fillColumns`, but tick-indexed
  rather than wall-clock `setInterval`-only, so the *sequence* of states is
  replayable even if wall-clock delivery jitters).

### 2. Server: `gameRoom.ts` changes (SACRED)

- Replace one-shot `createGrid()` call with the tick engine; `GameRoom`
  advances it on its existing tick/interval infrastructure.
- New/extended broadcast: `BOARD_UPDATE` (message type already exists,
  currently sent ad hoc after chain resolution — line 432) becomes the
  regular vehicle for streaming grid state at a controlled cadence. Decide
  at implementation time: full grid each tick (simplest, 7×7 is small) vs.
  delta-only (less bandwidth, more complex) — recommend **full grid**
  first; 49 cells is small enough that delta complexity isn't justified
  yet, revisit only if bandwidth becomes a measured problem.
- **Merge bonus logic into the validated path:** port orb (`×1.5`),
  doubler (`×2`), ARCHIVIST recovery, heist vault split, and multiplier-step
  logic from `processChainFaces()` (lines 436–551) into `processChain()`
  (lines 373–434), which already reads faces from the grid. After the
  merge, `processChainFaces()` and the `SUBMIT_CHAIN_FACES` handler branch
  become dead code — **remove them**, don't leave them as an unused
  parallel path (an unused-but-present unvalidated scoring function is
  itself a latent risk if anyone re-wires the client to it later).
- `SUBMIT_CHAIN`'s existing adjacency/length validation (lines 213–239,
  already present and not part of this gap) is retained as-is — this ADR
  doesn't touch it.

### 3. Client: `VoxelPhysicsSystem.ts` changes (NOT sacred)

- Add a discrete logical row concept. Today `VoxelBodyData`/`VoxelTransform`
  track `column` only (continuous `position.y`, no row index) — confirmed
  by reading the interfaces directly. Add `row: number | null` (null while
  still falling/unsettled), derived from the server's authoritative grid,
  not computed locally.
- Add a "follow mode" (multiplayer only — gated by the same `isMultiplayer`
  flag `useFarkleGame.ts` already threads through): instead of
  `_fillColumns()`'s internal `setInterval` rolling its own faces via
  `faceRng()`, the system receives server `BOARD_UPDATE` snapshots and
  reconciles its local bodies toward the server's grid — spawning,
  removing, and re-facing bodies to match, while still using Rapier for the
  **visual fall/settle motion only** (a body's target `(column, row)` comes
  from the server; how it visually tumbles into that slot stays local
  physics, since that's cosmetic and was never the source of the gap).
- **Buffering, not stalling (direction #3):** maintain a small client-side
  render delay (recommend starting at ~150–200ms, tune empirically) — the
  client renders the server's state as of "now minus render-delay," giving
  a smoothing window to absorb normal jitter without any visible freeze.
  If a `BOARD_UPDATE` is later than expected, the client continues
  animating bodies toward their *last known* target positions (physics
  doesn't stop) rather than holding everything still; it simply doesn't
  spawn a *new* body until the server confirms one exists. This satisfies
  "buffering not stalling" without ever fabricating a face or letting the
  client decide grid content.
- Solo mode: **entirely untouched.** `faceRng()`/local `_fillColumns()`
  remains the path when `isMultiplayer` is false — there is no server to
  validate against in solo, and ADR-023/this ADR are scoped to the
  multiplayer trust boundary only.

### 4. Client: `useFarkleGame.ts` changes (SACRED)

- Wire `BOARD_UPDATE` consumption into the physics ref's new follow mode
  when `isMultiplayer` is true.
- Switch the chain-submission call from `mpActions.submitChainFaces(...)`
  to `mpActions.submitChain(...)` (already exists in `multiplayerStore.ts`,
  currently unused) — the client now asserts *positions it dragged through*
  rather than face values, matching what `processChain()` expects.
- The local chain-drag UX (drag detection, `chainEntrySlotRef`, the
  `CHAINABLE`/`TAPPABLE` entity-type logic) is **unaffected** — this only
  changes what gets sent over the wire at submission time, not how the
  player interacts with the board.

### 5. `multiplayerStore.ts` changes (SURFACE, not sacred)

- Add a `BOARD_UPDATE` message handler (if not already fully wired — verify
  at implementation time) that forwards grid snapshots to the physics
  system's follow mode.

---

## File-by-file impact summary

| File | Sacred? | Change type |
|---|---|---|
| `core/apps/server/src/gameRoom.ts` | **YES** | Replace one-shot grid with tick engine; merge bonus logic into `processChain()`; remove `processChainFaces()`/`SUBMIT_CHAIN_FACES` handler |
| `core/apps/web/src/hooks/useFarkleGame.ts` | **YES** | Switch multiplayer submission to `submitChain`; wire `BOARD_UPDATE` consumption |
| `core/packages/farkle-engine/src/boardEngine.ts` (new) | Not yet classified — recommend reviewing for `.ff-core-lock` addition at implementation time, since it becomes scoring-adjacent | New file |
| `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts` | No | Add `row`, follow mode, render-delay buffering |
| `core/apps/web/src/store/multiplayerStore.ts` | No (SURFACE) | `BOARD_UPDATE` handler wiring |
| `core/apps/web/src/store/farkleStore.ts` | **YES** (read-only expected) | Confirm no required changes during implementation; flag immediately if any are found |

---

## Self-audit (requested explicitly by the developer)

**What this closes:** the core GAP-1b exploit — a client can no longer
assert arbitrary face values, because the server never trusts client-
asserted faces again; it only trusts client-asserted *positions*, and reads
the actual face from its own continuously-maintained grid.

**What this does NOT close, and should not be assumed to:**
- A modified client could still claim it dragged through positions it
  didn't actually visually traverse, *if* the server doesn't also check
  that the claimed path is consistent with what that client was actually
  shown. This ADR's grid-adjacency check (existing `hasValidChain`-style
  logic) catches *impossible* paths (non-adjacent, wrong length, off-grid)
  but does not catch a client that perfectly mimics a real player's mouse
  input while substituting a *different but still-valid* path that happens
  to score higher than what was actually presented. This residual risk is
  smaller than today's "assert anything" gap, but it is not zero — flagging
  it rather than implying full closure.
- Does not address GAP-2 (no RTP gate for VS/RALLY/HEIST) — separate item.
- Does not yet specify exact tick cadence, render-delay tuning, or
  bandwidth/CPU budget numbers — those need to be measured during
  implementation, not guessed here. Recommend instrumenting and reporting
  actual numbers before calling this "done," not just "implemented."

**Performance/server-load estimate (qualitative, not measured):** a 7×7
discrete grid tick is O(49) cell operations — trivially cheap compared to
running physics. The new server cost is bandwidth (periodic `BOARD_UPDATE`
broadcasts to all players in a room) and the tick-loop's CPU, both expected
to be small relative to existing per-message work, but this is an estimate,
not a benchmark — recommend a basic load check before sign-off.

**Legal/fairness review:** consistent with the "no floats in the scoring
path" constraint (board-engine logic is integer/discrete; `scoreFarkle()`
itself untouched) and with the skill-based-sweepstakes posture — this
directly strengthens the "skill or dexterity" classification basis discussed
in the CourtListener research (`docs/RTP_TOLERANCE_SPEC.md` §3) by making
the server, not an unaudited client assertion, the source of truth for what
the player's skill was actually applied to.

**What I might be under-scoping (explicit self-flag, not resolved here):**
- Reconciliation behavior when the client's locally-rendered board and the
  server's authoritative grid disagree *after* a `BOARD_UPDATE` arrives
  (e.g., a body the client thought was at column 3 row 2 is reported
  elsewhere) — needs a concrete "snap vs. animate-correct" policy, not
  specified in this ADR. Should be nailed down during implementation, not
  left implicit.
- Existing client cosmetic features (mirror/wild face resolution, bomb
  blast radius scoring at `VoxelPhysicsSystem.ts:311-403`, wild-scatter
  destroy-by-face at line 483) read `data.face` directly today — need to
  confirm each of these still gets correct face data once faces are
  server-assigned via follow mode rather than locally rolled. Not
  exhaustively audited in this pass; flagging as an implementation-time
  checklist item, not asserting it's already verified.
- Rollback: if this needs to be reverted, both `gameRoom.ts`'s grid-tick
  loop and `useFarkleGame.ts`'s submission-path switch must revert
  together (a half-revert — server back to one-shot grid, client still
  sending `submitChain` — would silently break multiplayer scoring). Note
  for whoever reverts: revert as one unit.

---

## Acceptance criteria (once approved)

1. `farkleScorer.test.ts` full suite green, no scoring regressions.
2. `pnpm type-check` — 0 new errors (baseline pre-existing monorepo failures,
   confirmed unrelated via `git stash` test on 2026-06-24, are excluded from
   this count).
3. A new test demonstrating the GAP-1b exploit (`faces: [1,1,1,1,1,1]`
   submitted without matching grid content) is now rejected.
4. A new test confirming a *legitimate* six-of-a-kind (grid genuinely
   contains it) still scores correctly — guard against the fix being so
   strict it breaks real rare wins.
5. Bito review of the full sacred diff — **after** human approval of this
   ADR, per explicit instruction, not before.
6. Solo-mode regression check: confirm zero behavior change when
   `isMultiplayer` is false.

---

## Rollback

Not applicable — no code has been changed under this ADR.
