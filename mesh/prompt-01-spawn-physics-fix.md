# TIER PROMPT: T3 — Physics & Input Integrity
## File: mesh/prompt-01-spawn-physics-fix.md
## Prerequisite: tier_gate_status.T2 = PASS
## Session type: ONE TIER PER SESSION
## Authority ceiling: Execution Runtime (cannot exceed)

---

## Objective

Ensure the physics simulation and input pipeline are fully deterministic and
legally compliant for a real-money sweepstakes:

1. **Spawn bug verified** — identity rotation + zero velocity confirmed at every spawn path
2. **Rapier fixed-step enforced** — `world.timestep` and step interval are constants, not variable-dt
3. **Input queue** — tap events buffered and processed at physics step boundaries (no dropped inputs)
4. **Backface culling** — Three.js die meshes use `side: THREE.FrontSide` (render performance)
5. **ADR-014** — T3 decisions recorded

**Pass gate:**
- 3 clean spawns test: each spawn has identity rotation + zero linear/angular velocity at birth
- Frame time delta: physics step is independent of render frame (setInterval, not useFrame)
- FIXED_POINT_CHECK: PASS (no float literals introduced in T3 scope)
- No dropped tap events under simulated frame spike (input queue depth ≥ 1 pending tap survives a 2-frame skip)

---

## Background

A frame drop that drops an input is a legal violation, not a perf issue (PART 13, INSTRUCTIONS_MANUAL.md).

If a player taps a die during a frame spike and the tap is silently discarded, the player lost a
legal game action. On a real-money platform this is a compliance failure. The input queue is the
fix: accumulate taps in a FIFO buffer; drain at physics step start.

The spawn bug (identity rotation + zero velocity) was partially fixed in `c07675d` in the core
submodule. T3 verifies this is airtight across ALL spawn paths including `spawnRandom()`,
`_fillColumns()`, `sendDisruption()`, and the direct `spawnBody()` call from GameScreen.

Rapier `world.timestep` is set to `1/30` in `VoxelPhysicsSystem._init()` and the interval is
`setInterval(fn, 1000/30)` — these must remain constants. The `L1-physics-dt-implicit` finding
refers to `PhysicsImpactListener` using `useFrame(_, delta)` for velocity estimation — acceptable
(audio-only path) but must be documented as non-scoring.

---

## Existing Code

- `core/packages/game-core/src/systems/VoxelPhysicsSystem.ts` — physics sim, spawn, step loop
- `core/apps/web/src/game/VoxelPileScene.tsx` — `PhysicsImpactListener` uses `useFrame(_, delta)`
- `core/apps/web/src/hooks/useFarkleGame.ts` — `tapEntity()`, `tapSphere()` — direct calls, no queue
- `core/apps/web/src/components/GameScreen.tsx` — calls `spawnBody()` on debug tap

---

## Task Sequence

### Task 1 — Verify and document spawn integrity

In `VoxelPhysicsSystem.ts`, verify all spawn paths set:
- `setRotation({ x: 0, y: 0, z: 0, w: 1 })` (identity quaternion) on the `RigidBodyDesc`
- `body.setLinvel({ x: 0, y: 0, z: 0 }, true)` immediately after `createRigidBody`
- `body.setAngvel({ x: 0, y: 0, z: 0 }, true)` immediately after `createRigidBody`

Current `spawnBody()` already does this (lines 165, 172–173). Verify `sendDisruption()` uses
`spawnBody()` (it does — lines 510–511) and `_fillColumns()` uses `spawnBody()` (line 687).
No direct `createRigidBody` calls outside `spawnBody()` — confirm this audit.

Write spawn integrity test in `core/packages/game-core/src/replay/__tests__/spawn.test.ts`:

```ts
// 3 clean spawn assertions:
// 1. die spawn: rotation === identity quaternion, linvel === {0,0,0}, angvel === {0,0,0}
// 2. sphere spawn: same
// 3. ghost spawn: same (ghost has x-offset but identity rotation)
```

Each assertion reads the body state immediately after `spawnBody()` before any `world.step()`.

### Task 2 — Rapier fixed-step: extract constants + document L1 resolution

In `VoxelPhysicsSystem.ts`:
- Extract `PHYSICS_TIMESTEP = 1 / 30` as a module-level constant
- Replace `this.world.timestep = 1 / 30` with `this.world.timestep = PHYSICS_TIMESTEP`
- Replace `setInterval(fn, 1000 / 30)` with `setInterval(fn, PHYSICS_TIMESTEP * 1000)`

This ensures the timestep and interval are always in sync (a single constant drives both).

Document in `VoxelPhysicsSystem.ts` header comment:
```typescript
// Physics runs at a FIXED timestep (PHYSICS_TIMESTEP seconds per step).
// The step interval matches exactly — world.timestep === interval/1000.
// Rendering reads physics state each frame but does not drive the physics clock.
// L1-physics-dt-implicit: resolved — useFrame delta is used only for audio
// velocity estimation in PhysicsImpactListener (non-scoring path).
```

FIXED_POINT_CHECK: `PHYSICS_TIMESTEP = 1 / 30` is a configuration constant, not a scoring
multiplier. Acceptable. No Q×1000 conversion required.

### Task 3 — Input queue

In `VoxelPhysicsSystem.ts`, add a pending-action queue:

```ts
interface PhysicsAction {
  type: 'tap_entity' | 'tap_sphere' | 'spawn' | 'remove';
  payload: unknown;
}

private pendingActions: PhysicsAction[] = [];

enqueueAction(action: PhysicsAction): void {
  this.pendingActions.push(action);
}
```

Drain the queue at the start of each physics step (inside `startSimulation`'s `setInterval` callback,
before `this.world.step()`).

Expose `enqueueAction()` as a public method. Update `GameScreen.tsx` and `useFarkleGame.ts` to route
all tap events through `enqueueAction()` instead of calling physics methods directly.

The queue is a FIFO; on each step, all pending actions are processed in order, then `world.step()` runs.

This guarantees: a tap that arrives during a 2-frame render spike is not lost — it sits in the queue
and executes at the next physics step.

### Task 4 — Backface culling audit

In `VoxelPileScene.tsx`, audit all Three.js mesh materials:
- Die face materials: verify `side` is not `THREE.DoubleSide` unless the geometry requires it
- Ground / wall materials: `side: THREE.FrontSide` (default — confirm it is set or explicit)
- Any `meshStandardMaterial` / `meshBasicMaterial` / `shaderMaterial` that uses `DoubleSide`: justify or remove

For each die/sphere mesh, add `side: THREE.FrontSide` explicitly to the material (documents intent,
triggers backface culling by default). Do not change materials where `DoubleSide` is justified
(e.g., a translucent cage or ring that is viewed from inside).

### Task 5 — Run audit cells + write ADR-014

After Tasks 1–4, run all 6 audit cells (per EXECUTE.md EX-2).
Write `docs/adr/ADR-014-t3-physics-input-integrity.md` documenting:
- Spawn integrity verification approach and test coverage
- Fixed-step architecture (PHYSICS_TIMESTEP constant)
- Input queue design rationale (legal basis: dropped input = legal violation)
- Backface culling decisions per material
- L1-physics-dt-implicit resolution

---

## FIXED_POINT_CHECK Scope

- `VoxelPhysicsSystem.ts` changes — `PHYSICS_TIMESTEP = 1/30` is configuration only (not scoring arithmetic). FIXED_POINT_CHECK: PASS
- Input queue — no arithmetic. FIXED_POINT_CHECK: NOT_APPLICABLE
- Material changes — no arithmetic. FIXED_POINT_CHECK: NOT_APPLICABLE
- Spawn tests — assertions only. FIXED_POINT_CHECK: NOT_APPLICABLE

---

## AUDIT Signature

```yaml
AUDIT::PATHWAY_DEPS: [core/packages/game-core/src/systems/VoxelPhysicsSystem.ts, core/apps/web/src/game/VoxelPileScene.tsx, core/apps/web/src/hooks/useFarkleGame.ts]
AUDIT::CURRENT_GRADE: [Target: Grade A — spawn integrity + fixed-step + input queue + backface culling]
AUDIT::ENTROPY_VECTOR: [Medium — VoxelPhysicsSystem modified; VoxelPileScene materials audited; no Sacred Core]
AUDIT::FIXED_POINT_CHECK: PASS (PHYSICS_TIMESTEP is configuration; no scoring arithmetic in T3 scope)
```
