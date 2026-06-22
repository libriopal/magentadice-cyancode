# ADR-023 — GAP-1b: No Server-Side Validation of Client-Asserted Chain Faces

**Status:** PROPOSED — not authorized, not implemented
**Date:** 2026-06-22
**Author:** Execution Runtime (Claude Sonnet 4.6)
**Human Authorization:** NOT YET GRANTED — this ADR documents the problem and fix
options only. No code changes are authorized by this document.
**DEBT reference:** GAP-1b (`docs/KNOWN_TECHNICAL_DEBT.md`)
**Sacred files (if any option is pursued):** `core/apps/server/src/gameRoom.ts`
**Related:** `gap1_board_authority.md` (GAP-1 source document), FAR_NZY PR #4
(`c06e388`, merged 2026-06-22 — the narrower seed-propagation fix that shipped
instead of addressing this finding)

---

## Problem

While investigating GAP-1 ("Board State Authority" — the client ignoring the
server's authoritative grid/seed), the investigation surfaced a more severe,
distinct gap in the same code path.

`processChainFaces()` in `gameRoom.ts` (`SUBMIT_CHAIN_FACES` handler, ~lines
431–549) scores a chain via:

```typescript
const result = scoreFarkle(faces);  // faces: client-asserted DieFace[]
```

`faces` and `chainColumns` are values the **client** sends. The server never
cross-checks them against anything it controls — not the grid contents
(`this.state.grid`, populated by `createGrid()` at construction), not a
server-side RNG draw, not a replay of any deterministic process. There is no
code path between receiving `SUBMIT_CHAIN_FACES` and calling `scoreFarkle()`
that validates the asserted faces are physically possible given the current
board state.

**Concretely:** a modified or scripted client can send
`{ type: 'SUBMIT_CHAIN_FACES', faces: [1,1,1,1,1,1], chainColumns: [...] }`
every turn, and the server will score it as a legitimate six-of-1s
(3,000+ points) with no rejection, regardless of what is actually on either
board.

### Why this wasn't caught by the GAP-1 fix

GAP-1's fix (seed propagation) makes the client's *cosmetic* physics
rendering reproducible-in-spirit from the server's entropy. It does nothing
for this gap, because:

- The server's `grid`/`Cell[][]` model (`createGrid()`, row/col addressing,
  validated via `hasValidChain()`) and the client's `VoxelPhysicsSystem`
  (continuous Rapier3D physics, 7 falling columns, no static `Cell[][]`
  anywhere) are **structurally different representations**. They cannot be
  reconciled by a seed alone.
- The client never asks the server to confirm a chain — it asserts the
  result of its own local physics simulation directly into the scoring path.
- The server's grid machinery (`createGrid()`, `hasValidChain()`,
  `BOARD_UPDATE` recovery broadcasts) is consulted only for the server's own
  internal dead-board detection — never for validating what the client
  submits for scoring. Today it is effectively decorative with respect to
  live scoring.

### Severity

For a platform whose **legal posture is skill-based sweepstakes** (per
`CLAUDE.md`), the scoring path accepting unaudited client-asserted RNG
output with zero server-side check is a compliance exposure at least as
serious as a float in the scoring path — arguably worse, since a float is a
correctness bug, while this is an open trust boundary: nothing currently
prevents a player from asserting any score they want.

---

## Constraints on Any Fix

1. **No floats in the scoring path.** `scoreFarkle()` itself is sacred and
   untouched by every option below; whatever validation is added must
   produce integer inputs to it, same as today.
2. **The grid/physics representational mismatch is real and large.**
   Unifying the two board models (client Rapier3D physics vs. server static
   grid) is a different, larger redesign than "add a check" — conflating the
   two in one ADR risks an unreviewable diff. Any option that requires this
   unification should be scoped as its own follow-up ADR, not bundled here.
3. **`gameRoom.ts` is CORE SACRED.** Any code change requires: full diff
   shown to the developer, explicit `APPROVED` in the same message,
   `farkleScorer.test.ts` full suite green, `pnpm type-check` 0 errors —
   same gate as every other sacred change in this repo.
4. **Multiplayer latency budget.** Whatever validation runs per
   `SUBMIT_CHAIN_FACES` message happens on every chain submission, every
   player, every turn — it must not introduce server-side blocking work that
   measurably affects turn latency.

---

## Options (none authorized — for human decision)

### Option 1 — Server-side RNG, client renders only

The server generates the authoritative face sequence (via `CSPRNG` /
`SixPoolManager`, the same fairness-committed stream already used for
`createGrid()`) and the client's physics becomes a pure visual renderer of
server-dictated outcomes, never the source of scoring truth.

- **Strongest guarantee** — closes the gap completely; matches the spirit
  of "Option A" from the GAP-1 investigation (client renders server state).
- **Largest change.** Requires resolving the grid/physics representational
  mismatch identified above: either the client's `VoxelPhysicsSystem` is
  taught to consume a server-dictated face sequence per spawn (binding
  visual gameplay to network round-trips), or the static grid model is
  retired in favor of a face-stream model the physics system already
  produces locally today (inverting which side is authoritative for what).
- Touches real-time gameplay feel — needs design input beyond this ADR's
  scope, likely its own follow-up ADR plus playtesting.

### Option 2 — Post-hoc statistical/anomaly validation

Server doesn't validate each individual chain in real time, but tracks each
player's submitted face distribution over a session/window and flags
statistically impossible patterns (e.g., disproportionate high-value faces
vs. expected die-face distribution) for review or session termination.

- **Smallest immediate change** — no per-message blocking validation, no
  physics/grid unification required.
- **Weakest guarantee** — does not prevent any single-session exploit, only
  detects sustained abuse after the fact. A player who farms a few big
  turns and stops is not caught.
- Compliance value is real but partial — likely insufficient on its own as
  the sole defence for a regulated skill-game scoring path, but could be a
  reasonable *first* layer while Option 1 or 3 is designed.

### Option 3 — Bounded plausibility check at submission time

Server doesn't replay or own face generation, but checks each submitted
chain against cheap, deterministic plausibility constraints before scoring:
chain length vs. elapsed time since last submission (rate limit), face
value distribution within one submission (e.g. reject impossible
all-identical-face chains beyond a probability threshold), and column
adjacency claims against the server's own grid `Cell[][]` (the existing,
currently-unused `SUBMIT_CHAIN` row/col path in `gameRoom.ts` already exists
for a different message type, per the GAP-1 investigation's finding that it
is "defined server-side but never invoked by any current client code path").

- **Middle ground.** Catches the most obvious exploit (e.g. all-1s every
  turn) without requiring the client to give up local physics rendering.
- Still does not provide a true fairness guarantee — a sufficiently
  sophisticated client can craft plausible-looking but still-false chains.
  This option raises the floor, it does not close the gap to zero.
- May be implementable without touching the grid/physics unification
  problem, if scoped to "detect implausible submissions" rather than
  "prove submissions correct."

---

## Recommendation

This ADR does not select an option. Given the severity (HIGH, per
`docs/KNOWN_TECHNICAL_DEBT.md`) and the legal exposure described above, the
recommendation is to have the developer pick a direction — likely Option 3
as a near-term mitigation while Option 1 is scoped as a larger follow-up
redesign — but that choice belongs to the human, not this document.

---

## Acceptance Criteria (once an option is chosen — not yet applicable)

To be filled in for whichever option is authorized. At minimum, any
implementation must satisfy:

1. `farkleScorer.test.ts` full suite green, no scoring regressions.
2. `pnpm type-check` — 0 new errors.
3. Bito review of the full sacred diff before commit.
4. A new test demonstrating the previously-unvalidated exploit
   (e.g. submitting `faces: [1,1,1,1,1,1]` against a grid that could not
   produce it) is now rejected or flagged.
5. No measurable increase in per-turn server response latency beyond an
   agreed budget (to be set when an option is chosen).

---

## Rollback

Not applicable — no code has been changed under this ADR.

---

## What Is NOT Changing (by this ADR alone)

- `scoreFarkle()` and all other sacred scoring arithmetic.
- The GAP-1 seed-propagation fix already shipped (FAR_NZY PR #4, `c06e388`)
  — unaffected by and independent of whichever option is chosen here.
- The client's `VoxelPhysicsSystem` rendering model — unless Option 1 is
  selected and scoped in a dedicated follow-up ADR.

---

## References

- `docs/KNOWN_TECHNICAL_DEBT.md` — GAP-1b
- `gap1_board_authority.md` — original GAP-1 investigation protocol that
  surfaced this finding
- FAR_NZY PR #4 (`c06e388`) — GAP-1 seed-propagation fix, shipped instead of
  this fix
- `core/.ff-core-lock` — sacred file manifest
- `docs/adr/ADR-022-p6-playercontinue-recalibration.md` — most recent
  precedent for a sacred `gameRoom.ts`-adjacent fairness/scoring ADR
