# SACRED CORE SPECIFICATION
## FAR_NZY / magentadice-cyancode
## Document: sacred-core-spec.md
## Status: Constitutional — changes require ADR + Human approval + Monte Carlo pass

---

## Principle

The Sacred Core is not a vague protection concept.
It is an explicit, enumerated list.
Anything not on the sacred list is NOT sacred.
Ambiguity degrades governance.

---

## Sacred Core Inventory

```yaml
sacred_core:

  rng:
    files:
      - packages/farkle-engine/src/csprng.ts
    protected_elements:
      - HMAC-SHA256 seed generation algorithm
      - seed derivation chain (genesis → session → game → event)
      - entropy source selection
      - RNG output format
    change_authority: Human only
    change_process: ADR required + full RNG lineage re-verification + Monte Carlo pass

  payout_math:
    files:
      - packages/farkle-engine/src/farkleScorer.ts
      - packages/farkle-engine/src/rtpConfig.ts
      - packages/farkle-engine/src/monteCarlo.ts
    protected_elements:
      - all scoring functions and their Q32.32 implementations
      - RTP target values and variance bounds
      - payout multiplier tables
      - cascade depth calculations
      - class archetype fixed-point multipliers (Paladin 1.15x, Rogue 2.5x, Bard 1.85x)
    change_authority: Human only
    change_process: ADR required + Monte Carlo 10,000-generation pass + RTP within ±0.005

  ledger_state:
    files:
      - PDX transaction tables (Supabase, serializable ACID)
      - FD emission records (Supabase, NoSQL)
      - SDX blockchain records (@match3d/blockchain)
    protected_elements:
      - PDX balance arithmetic
      - FD emission rate calculations
      - SDX award conditions and amounts
      - reconciliation equation: ΣDeposits + ΣWinnings - ΣFees - ΣRedemptions ≡ ΣActiveLedgers
    change_authority: Human only (ledger schema) + Execution Runtime (reads only)
    change_process: ADR required + reconciliation equation verified + Human sign-off

  replay_hash_chain:
    files:
      - Transaction log block format (60-frame blocks)
      - SHA-256 predecessor hash links
    protected_elements:
      - block packing format (60 frames per block)
      - SHA-256 algorithm choice
      - predecessor hash field position in block
      - chain validation logic
    change_authority: Human only
    change_process: ADR required + full chain migration verified on test dataset

  event_signatures:
    files:
      - IEventStore interface implementation
      - event schema (event-versioning-spec.md)
    protected_elements:
      - event signature algorithm
      - required event fields (schema_version, event_type, replay_tick, predecessor_hash)
      - signature verification logic
    change_authority: Human only
    change_process: ADR required + event-versioning-spec.md updated + migration adapter written

  game_state_authority:
    files:
      - core/apps/web/src/store/farkleStore.ts
      - core/apps/web/src/store/gameStore.ts
    protected_elements:
      - authoritative game state shape
      - state transition logic
      - any field that drives scoring or payout
    change_authority: Human only (state shape changes)
    change_process: ADR required if state shape changes + downstream audit required
```

---

## Not Sacred — Explicitly Excluded

The following are NOT sacred and may be modified by Execution Runtime
within tier scope, without Human approval for each change:

```yaml
not_sacred:
  visual:
    - Three.js materials and shaders
    - particle systems and effects
    - UI component styles and layouts
    - animation curves and easing
    - post-processing effects (Bloom, SSAO, etc.)
    - color tokens and typography
    - FAR_NZY scene geometry

  audio:
    - Web Audio API routing graph
    - sound effect assets
    - music tracks and stems
    - audio gain and filter values

  content:
    - level definitions and stage content
    - quest text and objectives
    - event descriptions
    - NPC dialogue
    - UI copy

  presentation:
    - leaderboard display format
    - avatar cosmetics
    - NFT item visual presentation
    - multiplayer lobby UI
    - score display formatting

  infrastructure:
    - build configuration
    - dev tooling
    - CI/CD scripts
    - documentation
    - test utilities (non-RTP)
    - profiling artifacts
```

---

## Change Process for Sacred Core

```text
1. Identify proposed change
2. Execution Runtime writes proposal (PROPOSE ONLY — no implementation)
3. Contradiction Hunter reviews for constitutional conflicts
4. Governance Auditor endorses or flags
5. Human reviews proposal
6. If approved:
   a. ADR written and committed
   b. Change implemented
   c. Monte Carlo harness run (for payout_math changes)
   d. RNG lineage verified (for rng changes)
   e. Chain migration tested (for replay_hash_chain changes)
   f. Human sign-off on test results
7. If rejected: proposal archived in runs/proposals/ with reason
```

---

## Sacred Core Boundary Rules

- A visual effect that READS sacred state: permitted (read-only access)
- A visual effect that GENERATES sacred state: PROHIBITED
- A particle effect that signals a payout: must read from farkleStore, never compute
- An SDX ceremony that increments SDX balance: fires ONLY on blockchain confirmation event
- A multiplier display that reads scorer output: permitted
- A multiplier animation that drives scorer input: PROHIBITED
- Math.random() in any path that affects scoring: PROHIBITED
- Math.random() in purely visual paths (idle particle jitter): permitted

---

## Version

sacred-core-spec.md v1.0.0
Effective: at plan approval
Change authority: Human only
ADR required for any amendment
