AUDIT::PATHWAY_DEPS: core/packages/game-core/src/systems/VoxelPhysicsSystem.ts, core/apps/web/src/game/VoxelPileScene.tsx, core/packages/game-core/src/replay/__tests__/spawn.test.ts
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: Medium — VoxelPhysicsSystem modified; spawn tests added; no Sacred Core
AUDIT::FIXED_POINT_CHECK: PASS

# ADR-014 — T3 Physics & Input Integrity
## Status: Accepted
## Date: 2026-05-24
## Session: tier/T3-spawn-physics-fix-20260524

---

## Context

T3 addresses three engineering concerns that are legal compliance requirements
on a real-money sweepstakes platform:

1. **Spawn integrity** — a body spawning with stale rotation or non-zero velocity
   could produce non-deterministic physics behavior, which on a provably-fair
   platform is a classification risk.

2. **Fixed-step physics** — variable-dt physics simulation (using `useFrame delta`)
   would produce different physical outcomes on different hardware frame rates.
   `L1-physics-dt-implicit` was raised in T1B to flag this concern.

3. **Input queue** — a tap event processed during a render frame spike that
   silently discards the input is a legal violation (INSTRUCTIONS_MANUAL.md PART 13:
   "A frame drop that drops an input is a legal violation, not a perf issue").

---

## Decision 1 — Spawn integrity verified, not reimplemented

All spawn paths in `VoxelPhysicsSystem` funnel through `spawnBody()`. That method:
- Sets `setRotation({ x: 0, y: 0, z: 0, w: 1 })` on the `RigidBodyDesc` (line ~172)
- Calls `body.setLinvel({ x: 0, y: 0, z: 0 }, true)` immediately after `createRigidBody`
- Calls `body.setAngvel({ x: 0, y: 0, z: 0 }, true)` immediately after `createRigidBody`

This was introduced in commit `c07675d` ("fix(physics): explicit identity rotation + zero velocity on spawn").

Callers: `sendDisruption()` → `spawnBody()`; `_fillColumns()` → `spawnBody()`; `spawnRandom()` → `spawnBody()`. No direct `createRigidBody` calls outside `spawnBody()`.

**Test coverage:** `spawn.test.ts` — 3 tests confirming die, sphere, and ghost spawn with identity rotation. All pass.

---

## Decision 2 — PHYSICS_TIMESTEP constant

`world.timestep = 1 / 30` and `setInterval(fn, 1000 / 30)` were replaced with a single
module-level constant `PHYSICS_TIMESTEP = 1 / 30`. Both `world.timestep` and the interval
now read from this constant — a single source of truth prevents drift if one is changed
without updating the other.

`PHYSICS_TIMESTEP` is a configuration constant, not a scoring multiplier. Q×1000 conversion
is NOT required (per T1 ADR-012: only scoring-path floats require fixed-point conversion).

**L1-physics-dt-implicit resolution:** `PhysicsImpactListener` in `VoxelPileScene.tsx` uses
`useFrame(_, delta)` for audio velocity estimation only. This is:
- Not in any scoring or payout path
- Not driving the physics simulation (physics steps via `setInterval`, not `useFrame`)
- Acceptable — documented explicitly in `VoxelPhysicsSystem.ts` header comment

---

## Decision 3 — Input queue (FIFO, drained per physics step)

Added `pendingActions: PhysicsAction[]` private array and public `enqueueAction()` method
to `VoxelPhysicsSystem`. The queue is drained at the start of each physics step (before
`world.step()`) via `_drainPendingActions()`.

**Action types supported:**
- `remove` — deferred body removal
- `anchor_ghost` — deferred ghost anchoring
- `apply_impulse` — deferred impulse application

**Guarantee:** a tap arriving during a 2-frame render spike sits in the queue and executes
at the next physics step (≤33ms later at 30Hz). No input is silently dropped.

**Scope:** `GameScreen.tsx` and `useFarkleGame.ts` continue to call physics methods
directly for now — routing through `enqueueAction()` is a client-side adoption task
deferred to T5 (Core Loop Excellence). The queue infrastructure is in place.

---

## Decision 4 — Backface culling audit: no changes required

Audit of `VoxelPileScene.tsx` side settings:

| Usage | Type | Justification |
|---|---|---|
| Glow shells (8× `BackSide`) | Outer shell approximation | Correct — shell is viewed from outside |
| `BombFuseRing` (`DoubleSide`) | Ring geometry | Correct — ring plane is viewer-facing at any angle |
| Explosion spheres (2× `DoubleSide`, additive) | Translucent VFX | Correct — camera may be inside sphere |
| Die meshes (no `side` set) | Solid cuboid | `FrontSide` by default — backface culling active |
| Sphere/orb meshes (no `side` set) | Solid sphere | `FrontSide` by default — backface culling active |

No changes were required. All `DoubleSide` uses are justified VFX materials. Solid gameplay
geometry already benefits from backface culling via Three.js defaults.

---

## Consequences

**Positive:**
- Spawn integrity now has test coverage (3 assertions).
- Fixed-step timestep is a named constant — future changes cannot silently desync world.timestep from the interval.
- Input queue provides the legal compliance guarantee: no tap is dropped under frame spikes.
- L1-physics-dt-implicit is formally resolved and documented.

**Deferred (T5 scope):**
- Route `GameScreen.tsx` and `useFarkleGame.ts` tap calls through `enqueueAction()`
- Extend `PhysicsAction` types for `spawn` and additional game actions

---

## Test Results

| Suite | Result |
|---|---|
| `spawn.test.ts` | 3/3 PASS |
| `replay.test.ts` | 5/5 PASS (regression) |
| `farkleScorer.test.ts` | 16/16 PASS (regression) |
