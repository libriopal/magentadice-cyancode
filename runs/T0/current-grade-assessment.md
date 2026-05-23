<!--
AUDIT::PATHWAY_DEPS: runs/T0/ — no code files affected
AUDIT::CURRENT_GRADE: Grade C — T0 establishes baseline only
AUDIT::ENTROPY_VECTOR: none — read-only codebase assessment
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# T0 Current Codebase Grade Assessment
**FAR_NZY / magentadice-cyancode**
**Assessment Date:** 2026-05-22
**Branch assessed:** main @ de4dfb1
**Assessed by:** Claude Code — Baseline Auditor (T0)

---

## Summary Table

| Area | Grade | Status |
|---|---|---|
| T1 — Mathematical Purity | B | Seeded RNG culture strong; fixed-point not yet complete |
| T2 — Security & Compliance | C | No Play Integrity; KYC/AgeGate UI-only |
| T3 — Physics & Input | B | Physics world running; dt not explicitly locked |
| T4 — Ledger & Replay | C | Supabase schema is empty — no tables exist |
| T5 — Visual & Audio | B | Web Audio API confirmed; DoubleSide in 3 places; THREE allocations module-level |

**Overall Baseline Grade: C** (driven by T2 and T4 critical gaps)

---

## T1 Area: Mathematical Purity

**Grade: B**

### Math.random() Scan Results

Files where `Math.random()` appears in `core/apps/web/src/`:

```
core/apps/web/src/components/CargoOpeningSequence.tsx
core/apps/web/src/components/NFTItemCard.tsx
core/apps/web/src/game/scenes/BioGarden.tsx
core/apps/web/src/game/scenes/CrystalReserveCore.tsx
core/apps/web/src/game/scenes/CrystalForge.tsx
core/apps/web/src/game/scenes/TheAtrium.tsx
core/apps/web/src/hooks/useFarkleGame.ts
```

**Critical finding:** All occurrences are **prohibition comments**, not actual calls. Examples:
- `CargoOpeningSequence.tsx:23` — "never use Math.random() for item visuals"
- `NFTItemCard.tsx:4` — "never Math.random()"
- `useFarkleGame.ts:23` — "Module-level seeded RNG — replaces Math.random() for game events (W1 compliance)"

**packages/ scan:** CLEAN — zero Math.random() occurrences in `core/packages/`.

### Grade Rationale

- Seeded RNG culture is documented and enforced by comment convention in every file
- No actual `Math.random()` calls detected in scoring-affecting paths
- `useFarkleGame.ts` explicitly flags W1 compliance with seeded RNG
- Grade B (not A) because fixed-point arithmetic (Q32.32) has not been audited to confirm full coverage — T2 (Mathematical Foundation) tier will perform the definitive fixed-point audit

### FIXED_POINT_CHECK: NOT_APPLICABLE at T0 (T1 tier scope)

---

## T2 Area: Security & Compliance

**Grade: C**

### Play Integrity / App Attest

`core/android/app/src/main/assets/capacitor.plugins.json` contains only:
```json
[{ "pkg": "@capacitor/splash-screen", "classpath": "..." }]
```

**Finding:** Play Integrity plugin is NOT present. No hardware attestation layer exists.
Per `sacred-core-spec.md`: PDX award events require hardware attestation verdict of 'PASS'.
This means PDX payout flows are **constitutionally blocked** until Play Integrity is implemented.

### KYCGate.tsx Assessment

**Visual-only.** Grep for API/verification calls returns only:
```
// KYC gate modal — required for casino modes.
// Reality duality: verified=cyan (virtual clearance), unverified=magenta (physical block)
```
No `supabase`, `fetch`, `axios`, or backend verification calls found.
**KYC is a UI modal with no backend enforcement.**

### AgeGate.tsx Assessment

**Visual-only.** Contains a checkbox `type="checkbox"` with local state only.
No server-side age verification, no ID check, no backend call.
**Age gate is not legally compliant enforcement — it is a UI placeholder.**

### Grade Rationale

Grade C because:
1. No Play Integrity = PDX payout legally and constitutionally blocked
2. KYC is UI-only = compliance gap before any PDX operations
3. Age verification is a checkbox = not legally defensible

---

## T3 Area: Physics & Input

**Grade: B**

### Rapier dt Configuration

`WildCubeEngine.ts` line 274: `this.physicsWorld.step()` — called with no explicit timestep argument.

Rapier's default integration timestep when no parameter is passed: **uses `integrationParameters.dt` which defaults to 1/60** internally. However, this is NOT explicitly configured:
```typescript
// Not found in WildCubeEngine.ts:
// world.integrationParameters.dt = 1/60;
```

**Finding [L1]:** Physics dt is implicitly 1/60 (Rapier default) but not explicitly locked. Under variable frame rate environments (Capacitor WebView on mid-range Android), this can lead to physics divergence. Explicit `integrationParameters.dt = 1/60` lock is recommended in T3 (Spawn Physics Fix) tier.

### Spawn Quaternion

Quaternion handling present in `WildCubeEngine.ts`:
- Line 224: `new THREE.Quaternion(oRotRaw.x, oRotRaw.y, oRotRaw.z, oRotRaw.w)` — reads from physics body
- Lines 281/286: mesh quaternion set from physics body rotation

**Note:** The recent core submodule update (`f4dc92c` — "spawn angle fix") indicates a prior spawn quaternion bug was addressed. Submodule at `c07675db`.

### Input Event Handling

`WildBlocker.tsx` exists for input handling. Full native bridge audit is T3 scope.

### Grade Rationale

Grade B: Physics world initializes and runs. Quaternion handling present. Spawn fix applied in submodule. dt lock is implicit not explicit — finding logged.

---

## T4 Area: Ledger & Replay

**Grade: C**

### Supabase Schema Audit (read-only)

```
supabase.list_tables(schemas: ["public"]) → { "tables": [] }
```

**The Supabase public schema is completely empty.** No tables exist.

Required tables per `sacred-core-spec.md` and mesh contracts:
- [ ] FD transaction table (soft currency ledger)
- [ ] PDX transaction table (sweepstakes ledger, ACID serializable)
- [ ] FD emission records (NoSQL-style)
- [ ] SDX blockchain records (via @match3d/blockchain)
- [ ] SHA-256 hash chain column on event/transaction rows
- [ ] Replay log table (60-frame blocks with predecessor hash)

**All required ledger infrastructure is absent.**

### Grade Rationale

Grade C: No ledger schema exists at baseline. T4 (Ledger & Replay) tier will build this from scratch per `IEventStore.v1.md` and `ReplayEvent-Snapshot.v1.md` contracts.

---

## T5 Area: Visual & Audio

**Grade: B**

### Materials — VoxelPileScene.tsx

**DoubleSide usage (3 occurrences):**
- Line 1404: `<meshBasicMaterial ... side={THREE.DoubleSide} />`
- Line 1850: `side={THREE.DoubleSide}`
- Line 1863: `side={THREE.DoubleSide}`

DoubleSide doubles triangle draw calls. In a physics-heavy scene, this can contribute to GPU pressure. Acceptable if intentional for transparent/thin geometry. To be reviewed in T7 (Visual Overhaul) tier.

**THREE allocations in useFrame:** Module-level allocations observed (`const CAM_LOOK = new THREE.Vector3(...)`, geometry instances at module scope). No evidence of `new THREE.*` calls inside `useFrame` callbacks in sampled output. Grade-relevant concern not confirmed.

### Audio Implementation

`core/apps/web/src/audio/gameAudio.ts` confirms:
- `AudioContext` — Web Audio API, not HTML5 `<audio>` tags ✓
- `createOscillator()` — synthesized audio ✓
- Lookahead scheduler pattern — Web Audio best practice ✓
- ASMR edition + Adaptive Emotional Conductor confirmed ✓
- ERK conductor integration with AGROS system ✓

**Audio implementation is Grade A quality.** Full Web Audio API synthesis, no HTML5 audio fallbacks, ERK emotional state machine active.

### Grade Rationale

Grade B overall: Audio is Grade A. Visual has DoubleSide in 3 places and requires T7 audit for full assessment. No in-useFrame allocation confirmed.

---

## Key Findings Summary for Subsequent Tiers

| Finding | Level | Tier to Address |
|---|---|---|
| Play Integrity not present — PDX constitutionally blocked | L2 | T2 (Security & Compliance) |
| KYCGate is UI-only — no backend enforcement | L2 | T2 |
| AgeGate is UI-only — checkbox only | L2 | T2 |
| Supabase schema is empty — no ledger tables | L1 | T4 (Ledger & Replay) |
| Physics dt not explicitly locked (implicit 1/60) | L1 | T3 (Spawn Physics Fix) |
| DoubleSide in 3 VoxelPileScene materials | L0 | T7 (Visual Overhaul) |

---

*Generated by T0 Baseline Audit session — no code changes made.*
