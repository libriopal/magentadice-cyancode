# P3 — RTP Monte Carlo Simulation: Complete Implementation Plan

**Branch:** `feature/p3-rtp-monte-carlo`
**Status:** PLANNED — awaiting human authorization
**Date:** 2026-06-01
**Author:** Claude Code (Monte Carlo Systems / Legal Skill-Based Games)
**Prerequisite:** P2.6 complete (bonus authority validated)
**Sacred files affected:** `monteCarlo.ts`, `rtpConfig.ts` (both CORE SACRED)

---

## Context

P2.6 established full server-side authority over bonus mechanics (orb, doubler, ARCHIVIST, heist vault). All scoring paths are now server-authoritative. The next legal compliance gap is that the existing `monteCarlo.ts` calibration does not model the majority of the return paths that actually affect expected player outcome. It simulates raw `lookupScore()` chains with no multiplier ladder, no bonuses, no board tile effects, no player decision variance, and no role mechanics. This means the `normalizer` it produces is not calibrated to the true game experience — it is calibrated to a stripped-down abstract chain sequence.

For casino-mode certification in any jurisdiction, regulators require a simulation that models the actual game mechanics end-to-end, reports per-mechanic RTP contributions, and produces reproducible audit trails. This plan designs that simulation in full.

---

## Runtime Evidence Summary (Required Before Modelling)

All role and mechanic behaviour below was read from source — no assumptions from names.

### ARCHIVIST (confirmed — `gameRoom.ts:467-474`, `farkleStore.ts:328-334`)
- Drains **15% of the player's own accumulated farkle pool** (not opponent unbanked) per successful chain
- `farklePool` accumulates unbanked points lost to farkles within the session
- `archivistBonus = Math.round(this.state.farklePool * GAME_CONSTANTS.ARCHIVIST_PCT)` → added to player's `unbanked`
- **Correction from plan brief**: The brief described this as "15% drain of opponent unbanked chains". Runtime evidence shows it is self-recovery from the player's own farkle pool. This is **not zero-sum redistribution** — it reduces the net cost of farkles for the ARCHIVIST player only.

### HEADHUNTER (confirmed — `gridUtils.ts:382-418`, `farkleStore.ts:306-316`)
- Double damage to stone tiles (both in bomb radius: `isHeadhunter ? 2 : 1` at line 401, and adjacent damage at line 472)
- Disruption charge accumulates at 2× rate (40/s vs 20/s base) in FRENZY
- **No direct score modifier** — mechanical efficiency booster: kills stones faster → more open board → more chain options; more disruption → more opponent interference
- **RTP impact**: Indirect — improved bomb yield from more frequent stone destruction; shorter path to ×3 disruption charges

### RAINMAKER (confirmed — `useFarkleGame.ts:491-495`, `useFarkleGame.ts:622-644`)
- Intercepts every bomb tap (standard bomb only) to present a face picker
- Player selects any die face (1–6) to target; the bomb then activates as `physics.activateBomb(bombId, face)`
- **Effect**: Allows targeting RED (face 1 = 100 pts/die) or BLUE (face 5 = 50 pts/die) to maximise bomb yield instead of hitting the random face composition
- **RTP impact**: Positive — expected bomb score increases when player can target the highest-value face colour present on the board; magnitude depends on board composition at detonation

### CONDUCTOR (confirmed — `useFarkleGame.ts:563-570`, `useFarkleGame.ts:673-682`)
- Gets +1 `multiplierStep` on both `passScore()` (line 569) and `rallyPass()` (line 677)
- Does NOT advance multiplier on CONTINUE or chain commit
- **Effect**: Can reach ×4.0 multiplier faster by passing — trades chain income for ladder position
- **RTP impact**: Increases team's expected multiplier step average; provides path to ×3.0/×4.0 without requiring 6-chain sequences

### Rally Vote Flow (confirmed — `gameRoom.ts:294-318`)
- 3-second window after active player sends `NOTIFY_RALLY_DECISION`
- All connected players vote `bank`, `pass`, or `continue`
- Tie-break priority: **continue > pass > bank** (line 311 — biases toward keeping play going)
- `continue` restarts the turn timer for the same player; `bank` calls `handleBank`; `pass` calls `nextTurn`
- Votes resolved early if all players have voted

### Doubler Cell Spawn (confirmed — `gameRoom.ts:550-556`)
- Every 3rd explicit bank (`explicitBanksTaken % 3 === 0`)
- Column: `(this.pool.drawDie() + this.explicitBanksTaken * 2) % 7` — CSPRNG-pool-derived
- Duration: 30 seconds
- Effect: doubles the `scaled` score contribution (+ `orbBonus`) for any chain touching that column

### Multiplier Orb (confirmed — `gameRoom.ts:441-448`)
- Applied in `processChainFaces` after banking for chain < 6
- `orbBonus = Math.round(this.state.unbanked * 0.5)` → added to banked; `orbActive` cleared
- Note: `orbBonus` is only non-zero when `chainLength === 6` (unbanked > 0 after chain-6 continues); for chain < 6, `unbanked` is already 0 when orb is checked → orbBonus = 0 for banking chains

### Multiplier Ladder (confirmed — `types.ts:198`, `gameRoom.ts:344-411`)
- `[1.0, 1.25, 1.5, 2.0, 3.0, 4.0]`, 6 steps (indices 0–5)
- Advance: **chain of exactly 6** dice → `multiplierStep + 1` (capped at 5)
- Reset: **chain < 6 (bank)** → `multiplierStep = 0`
- Reset on farkle → `multiplierStep = 0`
- Ladder state persists across chains within a turn only if player continues (chain-6)

### Heist Vault (confirmed — `gameRoom.ts:414-426`, `types.ts:211-216`)
- `VAULT_SPLIT = 0.70` → 70% of every chain's scaled score goes to `vaultPts`, 30% to `unbanked`
- Vault threshold to trigger heist: 5000 pts; energy cost: 50
- Vault claim: `vaultPts` added to `banked` (only on explicit claim or heist window expiry)
- **RTP neutral at session level** — redistributes within same player's buckets; no net score change

### Dead Board Recovery (confirmed — `gameRoom.ts:659-688`)
- Up to 3 reshuffle attempts using `pool.reshuffle()` + `_reshuffleGridFaces()`
- After 3 failures: broadcasts `BOARD_DEAD_RECOVERY_FAILED`, ends session
- Face selection during reshuffle: `pool.drawDie()` (CSPRNG pool), not hardcoded
- Client path: `injectScoringDie()` after 3+5 exhausted — seeded via `faceRng`
- **RTP impact**: Recovery injects scoreable faces, increasing expected score on recovered boards

### Energy System (confirmed — `farkleStore.ts:71-111`, `gameRoom.ts:137-152`)
- Energy ∈ [0, 300]; FRENZY_THRESHOLD = 150
- PRIME (energy < 150): +5/s passive gain; FRENZY (energy ≥ 150): −5/s drain
- Energy reaches 0 → auto-bank of unbanked → round ends
- Energy affects spawn weights (NORMAL / PRIME / FRENZY tiers) — `SPAWN_WEIGHTS` in `types.ts:46-50`
- **FRENZY spawn weights**: bomb weight = 7, rainbow_bomb = 1 → much higher bomb density

---

## SECTION 1 — COMPLETE RETURN PATH AUDIT

### Return Path Classification Table

| Return Path | Currently Modelled | Affects RTP | Direction | Magnitude | Mode Scope |
|---|---|---|---|---|---|
| **BASE SCORING** | | | | | |
| Ones (100/each, or 1000 for three 1s) | YES (lookupScore) | YES | + | HIGH | All |
| Fives (50/each, or 500 for three 5s) | YES (lookupScore) | YES | + | HIGH | All |
| Three of a Kind (face×100) | YES (lookupScore) | YES | + | MEDIUM | All |
| Four of a Kind (face×200) | YES (lookupScore) | YES | + | MEDIUM | All |
| Five of a Kind (face×300) | YES (lookupScore) | YES | + | HIGH | All |
| Six of a Kind (face×400) | YES (lookupScore) | YES | + | HIGH | All |
| Straight [1,2,3,4,5,6] | YES (lookupScore) | YES | + | HIGH | All |
| Two Triplets | YES (lookupScore) | YES | + | HIGH | All |
| Three Pairs | YES (lookupScore) | YES | + | MEDIUM | All |
| 4+Pair | YES (lookupScore) | YES | + | MEDIUM | All |
| Farkle (zero score) | YES (partial) | YES | − | HIGH | All |
| **MULTIPLIER LADDER** | | | | | |
| ×1.0 (step 0, base) | NO | YES | neutral | — | All |
| ×1.25 (step 1) | NO | YES | + | LOW | All |
| ×1.5 (step 2) | NO | YES | + | MEDIUM | All |
| ×2.0 (step 3) | NO | YES | + | HIGH | All |
| ×3.0 (step 4) | NO | YES | + | HIGH | All |
| ×4.0 (step 5, max) | NO | YES | + | VERY HIGH | All |
| Ladder reset on bank (chain < 6) | NO | YES | − | HIGH | All |
| Ladder reset on farkle | NO | YES | − | HIGH | All |
| **BOARD TILE EFFECTS** | | | | | |
| Blocker tiles — no score impact | NO | NO | neutral | 0 | All |
| Stone tiles — reduce board space | NO | YES | − | LOW | All |
| Ice tiles — unchainable | NO | YES | − | MEDIUM | All |
| Lock tiles — reduce chain options | NO | YES | − | LOW | All |
| Dead board recovery — seeded face injection | NO | YES | + | LOW | All |
| **BOMB MECHANICS** | | | | | |
| Standard bomb (Six-of-a-Kind trigger) | NO | YES | + | MEDIUM | All |
| — Self-score: +25 pts | NO | YES | + | LOW | All |
| — Die face=1: +100 pts/die in radius | NO | YES | + | MEDIUM | All |
| — Die face=5: +50 pts/die in radius | NO | YES | + | LOW | All |
| — Die other face: 0 pts | NO | YES | neutral | 0 | All |
| — Stone hit: +50 pts/stone destroyed | NO | YES | + | LOW | All |
| — Ice hit: 0 pts (tile clears) | NO | YES | neutral | 0 | All |
| Rainbow bomb (Straight trigger) | NO | YES | + | MEDIUM | All |
| — RED target (face=1): +100×multiplier per tile | NO | YES | + | MEDIUM | All |
| — BLUE target (face=5): +50×multiplier per tile | NO | YES | + | LOW | All |
| — Other colour: 0 pts | NO | YES | neutral | 0 | All |
| Five-of-a-Kind chain → spawns standard bomb | NO | YES | + | LOW | All |
| Six-of-a-Kind → casino auto-chain mode (5s) | NO | YES | + | HIGH | Solo only |
| **BONUS MECHANICS** | | | | | |
| Multiplier orb (×1.5 bonus on chain-6 continues) | NO | YES | + | MEDIUM | All |
| Doubler cell (×2 score for active column) | NO | YES | + | MEDIUM | All |
| Doubler spawn rate (every 3rd bank) | NO | YES | + | LOW | All |
| Heist vault 70/30 split | NO | NO (redistribution) | neutral | 0 | HEIST |
| Heist vault claim mechanics | NO | NO (redistribution) | neutral | 0 | HEIST |
| **RALLY MODE ROLES** | | | | | |
| RAINMAKER — targeted bomb colour selection | NO | YES | + | MEDIUM | RALLY |
| HEADHUNTER — double stone damage / 2× disrupt rate | NO | YES | + | LOW-MED | RALLY |
| ARCHIVIST — 15% own-farkle-pool recovery | NO | YES | + | MEDIUM | RALLY |
| CONDUCTOR — +1 multiplierStep on pass | NO | YES | + | MEDIUM | RALLY |
| **RALLY FLOW** | | | | | |
| Continue/Bank/Pass vote window (3s) | NO | YES | VARIES | MEDIUM | RALLY |
| Tie-break bias: continue > pass > bank | NO | YES | + | LOW | RALLY |
| Milestone tier 1 (10k pts → 0.5× pot) | NO | YES | + | MEDIUM | RALLY_CASINO |
| Milestone tier 2 (25k pts → 1.0× pot) | NO | YES | + | HIGH | RALLY_CASINO |
| Milestone tier 3 (50k pts → 2.0× pot) | NO | YES | + | HIGH | RALLY_CASINO |
| Milestone tier 4 (100k pts → 5.0× pot) | NO | YES | + | VERY HIGH | RALLY_CASINO |
| **ENERGY SYSTEM** | | | | | |
| Energy→spawn weight progression | NO | YES | VARIES | MEDIUM | All |
| FRENZY bomb/rainbow_bomb spawn surge | NO | YES | + | MEDIUM | All |
| Energy = 0 auto-bank | NO | YES | − | LOW | All |
| Wild energy bonus (PRIME: +5/wild, FRENZY: +3/wild) | NO | NO (energy only) | neutral | 0 | All |
| **ECONOMY** | | | | | |
| HEIST vault split (70/30) | NO | NO | neutral | 0 | HEIST |
| Energy affect on mode/spawn weights | NO | YES | VARIES | MEDIUM | All |
| Battle pass tier effects on scoring | NOT FOUND in source | — | — | — | TBD |

**Summary:** Of the ~40 distinct return-path mechanisms, the current `monteCarlo.ts` models only the base scoring partition (lookupScore). The multiplier ladder, all bonuses, board tile composition, bomb mechanics, rally roles, vote flow, and milestone payouts are entirely unmodelled.

---

## SECTION 2 — SIMULATION ARCHITECTURE

### 2.1 CSPRNG Lineage Trace (Every Random Event)

All simulation randomness MUST trace to `seededRng()` from `csprng.ts`. This is the synchronous XOR-shift PRNG used in the live game for simulation and grid utilities. The async `CSPRNG` class (HMAC-SHA256) is for live session provable-fairness only and is not appropriate for synchronous Monte Carlo loops.

**Derivation scheme:**

```
masterSeed (integer) → seededRng(masterSeed)
  └─ sessionSeed[i] = Math.floor(sessionRng() * 2^31)
       ├─ diceRng    = seededRng(sessionSeed ^ 0xAA_BB_CC)   → all 6-die rolls
       ├─ boardRng   = seededRng(sessionSeed ^ 0x11_22_33)   → board tile composition
       ├─ bonusRng   = seededRng(sessionSeed ^ 0x44_55_66)   → orb/doubler spawn events
       └─ decisionRng = seededRng(sessionSeed ^ 0x77_88_99)  → player decision model draws
```

Every session `i` gets four independent streams, all deterministically derived from `masterSeed` + `i`. Given the same `masterSeed`, the same sessions, and the same config, the output is byte-for-byte identical.

**Per-event CSPRNG trace:**

| Random Event | Stream | Method |
|---|---|---|
| Die face draw (6d6 roll) | `diceRng` | `Math.floor(diceRng() * 6) + 1` → 1-6 |
| Board tile type draw | `boardRng` | weighted draw against `SPAWN_WEIGHTS[mode]` |
| Orb presence on board | `boardRng` | weight `multiplier_orb` from spawn table |
| Doubler column selection | `bonusRng` | `Math.floor(bonusRng() * 7)` |
| Player decision (non-optimal draw) | `decisionRng` | `decisionRng() < optimalRate` |
| RAINMAKER face selection | `decisionRng` | optimal: face 1 (RED); average/weak: random 1-6 |
| Bomb face composition | `boardRng` | derive face counts from pool model |
| Rally vote | `decisionRng` | probability-weighted: continue/bank/pass per model |

### 2.2 Simulation State Machine (Per Session)

A session models one game from start to win (banked ≥ 100,000) or exhaustion (30 turns max).

```
SimSession {
  banked: int          // immutable until bank event
  unbanked: int        // accumulates during chain-6 sequences
  farklePool: int      // accumulated unbanked lost to farkles
  multiplierStep: int  // 0–5
  orbActive: bool
  doublerColumns: { col: int; expiresAt: int }[]
  bankCount: int       // to trigger doubler spawn every 3rd
  explicitBanksTaken: int
  milestoneHit: Set<int>
  energy: float        // [0, 300]
  mode: 'PRIME' | 'FRENZY'
  turnNumber: int
  chainNumber: int
  vaultPts: int        // HEIST modes only
  rallyVaultRole: RallyRole | null
}
```

**Turn flow:**

```
for each turn (max 30 turns or WIN_SCORE reached):
  roll 6 dice via diceRng
  score = lookupScore(roll)
  if score == 0:           // Farkle
    farklePool += unbanked
    unbanked = 0
    multiplierStep = 0
    record farkle
    continue (next turn)
  
  scaledScore = score × MULTIPLIER_LADDER[multiplierStep]
  chainLen = simulated chain length (see §2.3)
  
  if chainLen == 6:
    unbanked += scaledScore
    multiplierStep = min(multiplierStep + 1, 5)
    apply orb if orbActive (orbBonus = round(unbanked × 0.5))
    apply doubler if column active
    apply ARCHIVIST (archivistBonus = round(farklePool × 0.15))
    if RALLY mode: run vote simulation
  else:  // bank
    unbanked += scaledScore  
    banked += unbanked
    unbanked = 0
    multiplierStep = 0
    bankCount++
    if bankCount % 3 == 0: spawn doubler cell
    checkMilestones(banked)
    if banked >= WIN_SCORE: session ends
  
  simulate bomb trigger if applicable (see §2.4)
  simulate energy progression (see §2.5)
```

### 2.3 Player Decision Models

All three models use `decisionRng` for non-optimal draws.

**OPTIMAL player:**
- Always selects the highest-EV chain (chain-6 whenever possible)
- Banks when `isOptimalDecision('CONTINUE', unbanked, multiplierStep, 0.37)` returns false (uses `skillMetrics.ts:isOptimalDecision`)
- Uses orb: always activates multiplier orb immediately when collected
- Uses doubler: always chains through active doubler columns when available
- In RALLY: always votes `continue` on chain-6; votes `bank` only at multiplierStep ≥ 3 with unbanked > 10,000

**AVERAGE player (70% optimal rate):**
- `decisionRng() < 0.70` → makes optimal decision; else random draw from `{continue, bank}` 50/50
- Banks when optimal OR when multiplierStep < 3 (suboptimal ladder usage)
- Activates orb 80% of the time
- Chains through doubler 65% of the time
- In RALLY: votes `continue` 55% of the time, `bank` 35%, `pass` 10%

**WEAK player (40% optimal rate):**
- `decisionRng() < 0.40` → optimal; else biased toward early bank (70% bank, 30% continue)
- Never reaches multiplierStep ≥ 3 (banks before ×2.0 60% of the time)
- Misses orb activation 50% of the time
- Chains through doubler 30% of the time
- In RALLY: votes `bank` 60% of the time

### 2.4 Bomb Mechanics Simulation

**Standard bomb (triggered by Six-of-a-Kind chain):**
- Bomb radius = 1 (3×3 area around bomb position)
- Expected tiles in radius: 9 − corners partially outside = ~9 tiles (simulated from board composition)
- Board composition: derived from `SPAWN_WEIGHTS[mode]` at energy level
- Per-tile expected yield:
  - Die face=1 (RED): 100 pts; probability = 1/6 of die-type tiles
  - Die face=5 (BLUE): 50 pts; probability = 1/6 of die-type tiles
  - Other face: 0 pts
  - Stone hit: 50 pts (if HP → 0); probability depends on blockerDensity
  - Ice hit: 0 pts
  - Self: 25 pts always

**RAINMAKER bomb selection (confirmed global blast — §7.1):**
- Destroys ALL die/ice/mirror tiles with `face === targetFace` across the entire board (not radius-limited)
- OPTIMAL RAINMAKER: face=1 (RED) if any RED tiles exist; else face=5; else random face
- AVERAGE RAINMAKER: `decisionRng() < 0.70` → face=1; else random from {1..6}
- WEAK RAINMAKER: `decisionRng() < 0.40` → face=1; else random
- Board RED tile count: `die_tile_count × (1/6)` from `SPAWN_WEIGHTS[mode].die` fraction
- Self-score +25 pts applies regardless of face selection

**Rainbow bomb (triggered by Straight chain — §7.2):**
- Target face: **random draw** from the set of distinct face values currently on the board — uses `boardRng`
- Not player-chosen and not most-common — pure random uniform across present distinct faces
- Destroys ALL die/ice/mirror tiles globally matching that face
- **Server scoring** (authoritative): `count × rainbowRedReward × multiplierStep_mult` for face=1; `count × rainbowBlueReward × multiplierStep_mult` for face=5; 0 for other faces
- At ×1.0: E ≈ 150 pts; at ×4.0: E ≈ 600 pts (see §7.2 for full derivation)
- Note: client (VoxelPhysicsSystem) uses fixed 100/50 without multiplier — simulation uses server model

### 2.5 Energy System Simulation

Energy is modelled as a continuous variable progressing at 5 units/s per simulated turn.

```
estimatedTurnDurationS = 10  // average turn time assumption
PRIME gain: +5/s → +50 energy/turn
FRENZY drain: -5/s → -50 energy/turn

mode = energy < 150 ? 'PRIME' : 'FRENZY'
```

When `mode == 'FRENZY'`, apply `SPAWN_WEIGHTS.FRENZY` (bomb=7, rainbow_bomb=1) for the turn's bomb trigger probability. When energy reaches 0: auto-bank remaining unbanked.

**Spawn weights for bomb trigger probability per turn:**
```
bombTriggerProb[mode] = SPAWN_WEIGHTS[mode].bomb / 100
rainbowBombTriggerProb[mode] = SPAWN_WEIGHTS[mode].rainbow_bomb / 100
```

### 2.6 Rally Vote Simulation

After every chain-6 in RALLY mode:
1. Each player (1-4) casts a simulated vote per their player model
2. Tally `{continue, bank, pass}`
3. Apply tie-break: continue > pass > bank
4. Record decision outcome
5. Apply outcome to state (bank → bank all; pass → next player, preserve multiplierStep; continue → same player continues)

**CONDUCTOR role interaction:** On simulated `pass` vote, if active player is CONDUCTOR: `multiplierStep = min(multiplierStep + 1, 5)` before multiplierStep would normally reset.

### 2.7 Output Fields (Extended MonteCarloResult)

All fields stored as fixed-precision decimals (2 decimal places for ratios, integers for point values):

```typescript
interface MonteCarloResultV2 {
  // Base fields (existing)
  averageScore: number;       // integer pts
  farkleRate: number;         // fixed-4 decimal (0.XXXX)
  normalizer: number;         // fixed-4 decimal
  sessionsRun: number;        // integer

  // Variance metrics
  p95Score: number;           // integer: 95th percentile session score
  p5Score: number;            // integer: 5th percentile session score
  variance: number;           // integer: variance of session scores
  stdDev: number;             // integer: std deviation

  // RTP attribution
  baseChainRTP: number;       // fixed-4: % of total score from base scoring
  multiplierContributionRTP: number; // fixed-4: % from ladder advancement
  orbContributionRTP: number;        // fixed-4: % from multiplier orb
  doublerContributionRTP: number;    // fixed-4: % from doubler cell
  archivistContributionRTP: number;  // fixed-4: % from ARCHIVIST recovery (Rally only)
  bombStandardRTP: number;           // fixed-4: % from standard bomb yield
  bombRainbowRTP: number;            // fixed-4: % from rainbow bomb yield
  milestonePayout: number;           // integer: expected milestone payout pts (RALLY_CASINO)

  // Trigger rates
  bombStandardRate: number;    // fixed-4: triggers per session
  bombRainbowRate: number;     // fixed-4: triggers per session
  orbActivationRate: number;   // fixed-4: activations per session
  doublerTriggerRate: number;  // fixed-4: triggers per session
  deadBoardRecoveryRate: number; // fixed-4: recoveries per session

  // Ladder distribution
  multiplierStepDistribution: Record<0|1|2|3|4|5, number>; // % of turns at each step

  // Rally-specific
  roleContribution: Partial<Record<RallyRole, number>>; // fixed-4 RTP % per role
  milestoneHitRate: Partial<Record<1|2|3|4, number>>;   // % of sessions hitting each tier
  voteOutcomeDistribution: { continue: number; bank: number; pass: number }; // fixed-4

  // Player model label
  playerModel: 'OPTIMAL' | 'AVERAGE' | 'WEAK';

  // Audit
  seed: number;       // master seed used
  config: string;     // JSON hash of simulation config
}
```

### 2.8 Simulation Modes Config

```typescript
interface SimConfig {
  mode: GameMode;
  sessions: number;            // default 100,000
  maxTurns: number;            // default 30
  playerModel: 'OPTIMAL' | 'AVERAGE' | 'WEAK';
  blockerDensity: 'LOW' | 'MEDIUM' | 'HIGH';  // default MEDIUM
  playerCount: 1 | 2 | 3 | 4;
  rolesActive: boolean;         // RALLY modes only
  roles: RallyRole[];           // subset to simulate
  seed: number;                 // master seed for reproducibility
  outputPath: string;           // core/art/profiling/
}
```

**Per-mode defaults:**

| Mode | Grid | Sessions | playerCount | rolesActive |
|---|---|---|---|---|
| SOLO_FREE | 7×7 | 100,000 | 1 | false |
| SOLO_CASINO | 7×7 | 100,000 | 1 | false |
| VS_FREE | 8×8 | 100,000 | 2 | false |
| VS_CASINO | 8×8 | 100,000 | 2 | false |
| RALLY_FREE | 8×8/9×9/10×10 | 100,000 | 2-4 | true |
| RALLY_CASINO | 8×8/9×9/10×10 | 100,000 | 2-4 | true |

---

## SECTION 3 — ROLE RTP MODELLING (RALLY MODES ONLY)

### 3.1 ARCHIVIST RTP Model

**Mechanic (confirmed):** 15% of player's own `farklePool` added to `unbanked` per successful chain.

**Baseline:** Team RTP without ARCHIVIST — pure base scoring + multiplier ladder.

**With ARCHIVIST:**
- Let `F̄` = average farkle pool at time of each chain commit across session
- Let `C_ok` = number of successful chains per session
- ARCHIVIST bonus per session = `0.15 × F̄ × C_ok`
- This partially recycles lost unbanked back into play

**Distribution:** ARCHIVIST benefit is **individual, not team-wide**. Only the ARCHIVIST player recovers from their own farkles. Other team members are unaffected.

**Zero-sum check:** NOT zero-sum within the team. Value is recovered from points that were already lost to farkles (house edge). This is a **net value creation mechanic** — it reduces the effective farkle penalty for the ARCHIVIST player. In casino context, ARCHIVIST reduces the house edge on the ARCHIVIST player's farkle events.

**Casino compliance note:** This mechanic must be disclosed in RTP docs as it is not zero-sum. The ARCHIVIST player has a structurally higher RTP than non-ARCHIVIST players within the same session.

### 3.2 HEADHUNTER RTP Model

**Mechanic (confirmed):** Double stone damage + 2× disruption charge rate.

**Own RTP impact:**
- Stones die twice as fast → board opens up sooner → more chain opportunities per session
- More disruption charges → more opponent interference events (modelled as opponent losing 1-3 turns of effective play)
- Bomb over HEADHUNTER stones: 2 HP stone killed in 1 bomb hit (vs 2 hits normally) → additional `BOMB_STONE_PTS = 50` pts sooner

**Opponent RTP impact:**
- Disruption events (ice_send, lock_send, scramble) reduce opponent's chaining efficiency
- Modelled as: each disruption event reduces opponent's next N chains by ~20% expected score

**Net zero-sum check:** HEADHUNTER's disruption transfers score opportunity from opponents to HEADHUNTER's team via board interference. Not purely zero-sum — disruption charges require FRENZY mode (energy ≥ 150), which is itself earned through gameplay. Net effect: slight positive for HEADHUNTER team at expense of opponents.

**House edge interaction:** HEADHUNTER disruption affects VS_CASINO and RALLY_CASINO scoring distributions. Must be modelled as a per-player delta, not a flat team adjustment.

### 3.3 RAINMAKER RTP Model

**Mechanic (confirmed):** Intercepts bomb tap → face picker → targeted colour detonation.

**Corrected expected value calculation (post §7.1 resolution):**

RAINMAKER bomb is **global** — not radius-limited. It destroys every die/ice/mirror tile with the chosen face across the entire board.

Let `D` = total die-type tiles on board at time of detonation (≈ 25-35 at PRIME on 7×7)
Let `r1` = fraction with face=1 (≈ 1/6 in balanced pool)

**Without RAINMAKER (standard bomb, radius=1):**
```
B = tiles in 3×3 radius ≈ 9
E[bomb_score] = 25 + B × (r1 × 100 + r5 × 50) ≈ 25 + 9 × 25 = 250 pts
```

**With OPTIMAL RAINMAKER (global blast targeting face=1):**
```
RED_count ≈ D × (1/6) ≈ 30 × 0.167 ≈ 5 tiles
E[bomb_score_rainmaker] = 25 + RED_count × 100 ≈ 25 + 500 = 525 pts
```

**RAINMAKER RTP delta (corrected):** ~+275 pts per bomb event vs baseline. At bomb trigger rate ~0.2-0.4/session, RAINMAKER contribution is ~+55-110 pts/session. The earlier estimate of +35-80 pts was derived from radius assumptions and is superseded by this figure.

**Distribution:** RAINMAKER benefit accrues to the RAINMAKER player's score only. The global blast clears matching tiles from the shared board (benefits team indirectly via more open board state) but score goes to RAINMAKER.

### 3.4 CONDUCTOR RTP Model

**Mechanic (confirmed):** +1 `multiplierStep` on pass action (both explicit pass and rally-pass).

**Baseline:** Without CONDUCTOR, reaching ×3.0 (step 4) requires 4 consecutive six-chains.

**With CONDUCTOR:** Can advance multiplier via pass, bypassing the chain-6 requirement.

**Coordination effect:**
- Each CONDUCTOR pass = +1 step on the ladder for free (at cost of unbanked pts held)
- If CONDUCTOR passes with 0 unbanked (immediately after a bank), the pass costs nothing but advances the ladder
- This allows reaching ×4.0 faster, increasing expected score of subsequent chains

**Team RTP lift calculation:**
```
E[multiplier_with_conductor] = weighted avg step reached
Without CONDUCTOR: avg step ≈ 1.2 (step 1 = ×1.25 is common max)
With OPTIMAL CONDUCTOR: avg step ≈ 2.8 (step 2-3 = ×1.5–×2.0)
Expected score lift = chains × chainScore × (mult_with - mult_without)
                    ≈ chains × chainScore × 0.5
```

**Team vs individual:** CONDUCTOR's higher multiplier benefits the CONDUCTOR player's own chains only. However, in RALLY mode where the team shares a `banked` pool (TBD — verify if RALLY_CASINO pools banked across players), the lift may be team-wide.

**Vote influence:** CONDUCTOR is modelled to vote `continue` more often (prefers to keep multiplier accumulating). This interacts with the tie-break bias favouring `continue`.

---

## SECTION 4 — LEGAL COMPLIANCE REQUIREMENTS

### 4.1 RTP Floor and Ceiling Per Mode

| Mode | targetRTP | platformFee | Effective RTP to Player | Required Band |
|---|---|---|---|---|
| SOLO_FREE | 0.92 | 0.00 | 0.92 | No legal minimum (FTP) |
| SOLO_CASINO | 0.92 | 0.00 | 0.92 | Min 82%, max 102% |
| VS_FREE | 1.00 | 0.00 | 1.00 | No legal minimum (FTP) |
| VS_CASINO | 1.00 | 0.08 | 0.92 | 92% ± 8% (all player models) |
| RALLY_FREE | 0.92 | 0.00 | 0.92 | No legal minimum (FTP) |
| RALLY_CASINO | 0.92 | 0.08 | 0.84 | Must be re-validated — see note |
| HEIST_FREE | 0.92 | 0.00 | 0.92 | No legal minimum (FTP) |
| HEIST_CASINO | 0.92 | 0.08 | 0.84 | Must be re-validated — see note |

**RALLY_CASINO / HEIST_CASINO note:** Current `targetRTP = 0.92` with `platformFee = 0.08` gives an effective 84% to the player before milestone payouts. Once milestone expected value is included, effective RTP likely rises. The simulation must compute this end-to-end.

**Required action:** After simulation, if Rally Casino effective RTP (inclusive of milestones) < 85%, raise `targetRTP` in `rtpConfig.ts` (CORE SACRED — requires authorization).

### 4.2 Bonus Contribution Disclosure

Regulators require per-mechanic RTP breakdown. The simulation must produce:

```
Total RTP = base_chain_rtp
          + multiplier_contribution_rtp
          + orb_contribution_rtp
          + doubler_contribution_rtp
          + bomb_standard_rtp
          + bomb_rainbow_rtp
          + archivist_rtp          (RALLY only)
          + rainmaker_rtp          (RALLY only)
          + headhunter_rtp         (RALLY only)
          + conductor_rtp          (RALLY only)
          + milestone_payout_rtp   (RALLY_CASINO only)
```

Each must sum to total and be reported as both absolute points and % of total.

### 4.3 Variance Classification

| Mode | Expected Classification | Basis |
|---|---|---|
| SOLO_FREE | MEDIUM | 95th pct score likely 2-4× mean |
| SOLO_CASINO | MEDIUM | same board; player can hit Six-of-a-Kind jackpot chains |
| VS_CASINO | MEDIUM | 8×8 board slightly higher variance |
| RALLY_CASINO | HIGH | milestone tier 4 (×5 pot) creates extreme high-tail |

Regulators in some jurisdictions require HIGH variance disclosure (e.g., "HIGH VOLATILITY — can result in extended periods with no wins").

### 4.4 Skill Influence Attestation

**Target:** `RTP_OPTIMAL − RTP_WEAK ≥ 5%` per mode.

Existing `computeSkillScore()` in `skillMetrics.ts` (SURFACE) computes a per-session skill score. The simulation will report the RTP delta between OPTIMAL and WEAK player models per mode. This delta is the legal attestation that this is a skill-predominant game.

**If delta < 5%:** Flag as potential reclassification risk. May require increasing the decision complexity (more multiplier ladder interaction, more orb/doubler opportunities) to widen the skill gap.

### 4.5 Role Balance Attestation (Rally Casino)

- No single role may contribute > 25% of team RTP
- Role contributions must be within 10% of each other
- ARCHIVIST advantage (structural higher self-RTP) must be documented as individual, not team-wide
- CONDUCTOR's multiplier manipulation must not create dominant-meta (CONDUCTOR + OPTIMAL play must not produce > 2× the RTP of other roles)

### 4.6 Milestone Payout Verification (Rally Casino)

Milestone payouts at tier 4 (100k pts → ×5 pot) are the highest-variance event. The expected value calculation:

```
E[milestone_payout] = Σ(P(tier_hit) × stakeAmount × tier_multiplier)

Where:
  P(tier1 hit at 10k) ≈ estimated from session score distribution
  P(tier2 hit at 25k) ≈ P(session_score ≥ 25k)
  P(tier3 hit at 50k) ≈ P(session_score ≥ 50k)
  P(tier4 hit at 100k) ≈ P(session_score ≥ 100k, WIN condition)
```

Milestone payouts must be included in the total RTP calculation. If milestone payouts push effective RTP above regulatory ceiling, `stakeAmount` or tier multipliers must be adjusted.

**Pot contribution mechanics:** In RALLY_CASINO, `stakeAmount` is per-player; total pot = `stakeAmount × playerCount`. Milestone payout = `stakeAmount × tier.multiplier` (not `pot × tier.multiplier` based on code at `gameRoom.ts:583`). This means milestone payouts are independent of player count — each player pays per-player stake but receives per-player-stake-based payout. Document this clearly.

### 4.7 Audit Trail

Each simulation run must output to `core/art/profiling/rtp_audit_<date>_<seed>.json`:
```json
{
  "runDate": "2026-06-01",
  "seed": 42,
  "config": { ... },
  "results": {
    "SOLO_CASINO": { "OPTIMAL": {...}, "AVERAGE": {...}, "WEAK": {...} },
    "VS_CASINO": { ... },
    "RALLY_CASINO": { ... }
  },
  "gates": {
    "Gate1_convergence": "PASS",
    "Gate2_rtpBand": "PASS",
    "Gate3_skillInfluence": "PASS",
    "Gate4_bonusLimits": "PASS",
    "Gate5_reproducibility": "PASS",
    "Gate6_roleBalance": "PASS"
  }
}
```

---

## SECTION 5 — IMPLEMENTATION PLAN

### Sacred File Impact Classification

| File | Sacred Level | Changes Required | Auth Required |
|---|---|---|---|
| `monteCarlo.ts` | CORE SACRED | Extend result type; full simulation rewrite | YES — Bito ≥80 before any edit |
| `rtpConfig.ts` | CORE SACRED | Add per-mode bonus spawn configs; role toggles; milestone config | YES — Bito ≥80 before any edit |
| `farkleScorer.ts` | CORE SACRED | VERIFY ONLY — pure functions, no changes expected | Verify, no edit |
| `sandbox.ts` | SURFACE | New endpoints: /calibrate extended, /rtp-audit, /role-audit | No auth needed |

### Batch A — `monteCarlo.ts` (CORE SACRED)

**Show diff before writing. Run 16 farkleScorer tests + type-check before commit.**

Changes:
1. Extend `MonteCarloResult` → `MonteCarloResultV2` with all fields from §2.7
2. Add `PlayerModel` enum: `'OPTIMAL' | 'AVERAGE' | 'WEAK'`
3. Add `SimConfig` interface (§2.8)
4. Rewrite `calibrateNormalizer()` to:
   - Accept `SimConfig` parameter
   - Maintain stateful `multiplierStep` across chains within a turn
   - Simulate bomb triggers using `SPAWN_WEIGHTS[mode]`
   - Apply orb bonus (when orb is "active" per spawn probability)
   - Apply doubler (when doubler column is "active" per spawn schedule)
   - Apply ARCHIVIST drain per successful chain (Rally modes only, when role enabled)
   - Apply milestone check per bank (Rally Casino only)
   - Track per-mechanic contribution accumulators
   - Compute p5/p95 from sorted session scores (sort at end, not per-session)
   - Use CSPRNG lineage from §2.1 (seededRng with per-session derived seeds)
5. Add `runMonteCarloV2(config: SimConfig): MonteCarloResultV2`
6. Keep old `calibrateNormalizer` + `runMonteCarlo` as deprecated wrappers (backward compat for existing sandbox.ts calls)

**No floating-point accumulation:** All intermediate scores must be `Math.round()` after each multiplication (same rule as live game). All result fields stored as integers or fixed-precision via `toFixed(4)` before serialisation.

**Performance:** 100,000 sessions × ~30 turns each = 3M iterations. With synchronous XOR-shift PRNG and pure integer math, this should complete in < 10 seconds. Must not block event loop — call via `setImmediate` chunking in Node or yield every 10,000 sessions.

### Batch B — `rtpConfig.ts` (CORE SACRED)

**Show diff before writing.**

Changes:
1. Extend `RTPConfig` interface (in `types.ts` — check if sacred) to add:
   - `bonusSpawnRates`: per-bonus spawn probability per turn
   - `roleEffects`: toggle per rally role on/off
   - `varianceTarget`: `'LOW' | 'MEDIUM' | 'HIGH'`
   - `milestoneConfig?`: override milestone tiers for this mode
2. Add per-mode bonus spawn rate defaults to `RTP_CONFIGS`
3. Note: `RTPConfig` interface is defined in `types.ts` (CORE SACRED) — changes to the interface require `types.ts` authorization separately

**RTPConfig interface lives in:** `core/packages/farkle-shared/src/types.ts:253-258`
This is a CORE SACRED file. Any change to `RTPConfig` requires the same sacred authorization as `rtpConfig.ts`.

### Batch C — `farkleScorer.ts` (VERIFY ONLY)

Confirm:
- `scoreFarkle(faces, multiplier)` is pure — ✅ CONFIRMED (no side effects, no hidden state)
- `lookupScore()` is deterministic — ✅ CONFIRMED (uses lazy-initialized table, same logic as live game)
- Bomb trigger logic (`BOMB_STANDARD` for Six-of-a-Kind, `BOMB_RAINBOW` for Straight) — ✅ CONFIRMED in `farkleScorer.ts:41-45`
- No changes to `farkleScorer.ts` required

### Batch D — `sandbox.ts` (SURFACE)

**Confirmed path:** `core/apps/server/src/sandbox.ts`

**Existing endpoints (must not break):**
- `POST /simulate` — calls `runMonteCarlo(mode, sessions)` with a patch body; returns `avgScore`, `farkleRate`, `multiplierDistribution`, `sessionsRun`
- `POST /analyze` — calls `analyzeRTPImpact()` which uses Gemini API with deterministic fallback; returns projected RTP, risk level, recommendations
- `GET /health` — health check

**Existing import to update:** `import { runMonteCarlo } from '@match3d/farkle-engine'` — add `runMonteCarloV2` alongside it when Batch A is complete.

**Existing `buildMultiplierDistribution(farkleRate)`** — this is a geometric series approximation based solely on farkle rate. It will be superseded by the actual `multiplierStepDistribution` field from `MonteCarloResultV2`. Keep the function for backward compat with `POST /simulate` responses.

**`applyWeightBias(baseScore, weights)`** — applies `face_1` / `face_5` weight adjustments. Unrelated to P3 new endpoints; leave untouched.

**`analyzeRTPImpact()` fallback** uses hardcoded `BASE_SCORE = 4500` and `(avgScore / BASE_SCORE) * 0.92` to project RTP — this is a placeholder not calibrated to actual game mechanics. The new `/rtp-audit` endpoint replaces this for compliance runs; `POST /analyze` is left unchanged as an AI-assisted patch review tool.

**New endpoints to add:**
```
POST /simulate-v2
  Body: { mode: GameMode, playerModel: 'OPTIMAL'|'AVERAGE'|'WEAK', seed?: number, sessions?: number }
  → runs runMonteCarloV2(config); returns MonteCarloResultV2 JSON
  → replaces POST /simulate for compliance work; old endpoint stays for backward compat

POST /rtp-audit
  Body: { seed?: number, sessions?: number }
  → runs all casino modes × 3 player models = 6 simulation runs
     (SOLO_CASINO, VS_CASINO, RALLY_CASINO × OPTIMAL, AVERAGE, WEAK)
  → computes all 6 validation gates (§6)
  → saves to core/art/profiling/rtp_audit_<YYYY-MM-DD>_<seed>.json
  → returns full JSON report with gate pass/fail per mode

POST /role-audit
  Body: { seed?: number, sessions?: number }
  → runs RALLY_CASINO × 3 player models × 4 role slots
  → reports per-role RTP contribution using roleContribution field
  → checks Gate 6 (role balance)
  → saves to core/art/profiling/role_audit_<YYYY-MM-DD>_<seed>.json
```

Seed defaults to `Date.now()` if omitted; always echoed in response so the run is reproducible. File output path for profiling: `core/art/profiling/` (directory confirmed to exist).

---

## SECTION 6 — VALIDATION GATES

### Gate 1 — Simulation Convergence
- Run each mode × player model to 100,000 sessions
- Compare RTP at 50,000 sessions vs 100,000 sessions
- Pass if `|RTP_100k − RTP_50k| ≤ 0.005` (±0.5%)
- Fail action: increase to 200,000 sessions and re-check

### Gate 2 — RTP Band Compliance Per Mode
| Mode | Required Band | Player Model Scope |
|---|---|---|
| SOLO_CASINO | 0.82 – 1.02 | All three |
| VS_CASINO | 0.84 – 1.00 | All three (8% fee applied) |
| RALLY_CASINO | Inclusive of milestones: positive EV for AVERAGE | All three |
| Free-to-play modes | No hard requirement | Report only |

### Gate 3 — Skill Influence
- `RTP_OPTIMAL − RTP_WEAK ≥ 0.05` per mode
- Document exact delta as skill attestation evidence
- Fail action: investigate which mechanic most closes the gap; consider increasing orb/doubler spawn rate or ladder step difficulty to widen gap

### Gate 4 — Bonus Contribution Limits
- No single bonus type > 30% of total RTP
- No single role > 25% of team RTP (RALLY)
- Role RTP contributions within 10% of each other (RALLY)

### Gate 5 — Reproducibility
- Three independent runs: seed=1, seed=42, seed=999
- Each run must produce identical output given same seed + config
- Compare run 1 and a re-run of seed=1 — must be byte-identical
- Also: all three seeds must pass Gate 2 independently

### Gate 6 — Role Balance (Rally Casino Only)
- Run 10,000 Rally sessions per role assignment (each of the 4 roles as primary)
- No single role > 2× any other role in per-session RTP contribution
- ARCHIVIST individual RTP advantage must be documented but does not fail this gate (individual mechanic, not team advantage)
- Confirm CONDUCTOR + OPTIMAL does not produce > 1.5× team RTP vs WEAK without CONDUCTOR

---

## SECTION 7 — RESOLVED RUNTIME EVIDENCE

All three open evidence items are now resolved from `VoxelPhysicsSystem.ts` (`core/packages/game-core/src/systems/VoxelPhysicsSystem.ts`). Two additional client-server discrepancies were also found and documented below.

### 7.1 RAINMAKER `activateBomb(bombId, targetFace)` — RESOLVED

**Source:** `VoxelPhysicsSystem.ts:309-319`

```typescript
if (targetFace !== undefined) {
  if ((data.entityType === 'die' || data.entityType === 'ice' || data.entityType === 'mirror')
      && data.face === targetFace) {
    if (data.face === 1) score += BOMB_CONSTANTS.DIE_PTS_ONE;
    else if (data.face === 5) score += BOMB_CONSTANTS.DIE_PTS_FIVE;
    toRemove.push(id);
  }
  continue;  // skips all radius/y-proximity checks
}
```

**RAINMAKER bomb is GLOBAL, not radius-limited.** When `targetFace` is provided, the function skips the `Math.abs(column - bombCol) > R` and `|y - bombY| > 1.5` checks entirely via `continue` on line 319. It destroys **every** die/ice/mirror tile matching the chosen face across the entire board.

**Corrected RAINMAKER RTP model** (replaces Section 3.3 estimate):
- Standard bomb (no RAINMAKER): radius=1 → ~9 tiles affected; E[score] ≈ 250 pts
- RAINMAKER targeting face=1 (RED): all RED tiles on board cleared globally
  - 7×7 board at PRIME has ~25-35 die-type tiles; ~1/6 ≈ 4-6 are RED
  - E[RAINMAKER score] ≈ 25 (self) + 5 × 100 = 525 pts vs 250 pts baseline
  - **Delta: ~+275 pts per bomb event for OPTIMAL RAINMAKER** (targeting face=1)
- Stones, spheres, locks, wilds, bombs, catalyst are NOT affected by RAINMAKER mode
- Self-score (+25) still applies: `score = BOMB_CONSTANTS.SELF_PTS` initialised before loop

**Implication for Section 3.3:** RAINMAKER RTP contribution is significantly larger than the original estimate. The plan's ~+35-80 pts/session figure was calculated assuming a radius-limited blast. The corrected figure is ~+100-200 pts/session depending on board state and trigger rate.

**Player model update for simulation:**
- OPTIMAL RAINMAKER: always picks face=1 (RED) if any RED tiles exist; else face=5; else random
- AVERAGE RAINMAKER: picks face=1 with probability 0.70; else random face from {1,2,3,4,5,6}
- WEAK RAINMAKER: picks face=1 with probability 0.40; else random

### 7.2 Rainbow bomb target colour selection — RESOLVED

**Source:** `VoxelPhysicsSystem.ts:375-388`

```typescript
if (!face) {
  const inPlay = new Set<number>();
  for (const [, d] of this.bodies) {
    if ((d.entityType === 'die' || d.entityType === 'ice' || d.entityType === 'mirror') && d.face) {
      inPlay.add(d.face);
    }
  }
  const candidates = [...inPlay];
  if (candidates.length > 0) {
    face = candidates[Math.floor(this.rng() * candidates.length)];
  }
}
```

**Target face is a random draw from all DISTINCT face values currently present on the board** — NOT the most common face, NOT player-chosen. Uses `this.rng()` (main seeded XOR-shift PRNG). The rainbow bomb destroys ALL die/ice/mirror tiles matching that face globally (entire board, not radius-limited). No `SELF_PTS` — `score = 0` initialised.

**Scoring:** face=1 → +100 pts each, face=5 → +50 pts each, all other faces → 0 pts each (`VoxelPhysicsSystem.ts:401-403`).

**Client-server scoring discrepancy (ADDITIONAL FINDING):** The client (`VoxelPhysicsSystem`) uses fixed 100/50 per tile. The server (`gridUtils.ts:applyRainbowBomb`) uses `rainbowRedReward × multiplier` and `rainbowBlueReward × multiplier` — the current room multiplierStep multiplier is applied. `DEFAULT_SETTINGS.rainbowRedReward = 100`, `rainbowBlueReward = 50`, so at ×1.0 they match; at ×2.0–×4.0 the server awards 2–4× more than the client for a rainbow bomb. **Monte Carlo must use the server model** (multiplied by current `multiplierStep` multiplier), as the server is authoritative.

**EV calculation for simulation:**
```
E[rainbow_face] = random from {1,2,3,4,5,6} distinct faces present
P(face=1 selected) = 1/N  where N = distinct faces on board (typically 4-6)
E[rainbow_score] = P(face=1) × count_RED × 100 × mult
                 + P(face=5) × count_BLUE × 50 × mult
                 + P(other) × 0
```
With N=5 distinct faces: P(RED)=0.20, P(BLUE)=0.20. At ×1.0: E ≈ 0.20 × 5 × 100 + 0.20 × 5 × 50 = 150 pts. At ×4.0: E ≈ 600 pts.

**CSPRNG trace update for rainbow bomb:** draw uses `this.rng()` = `seededRng(seed)` main stream, same as entity-type rolls. In the simulation, map this to the `boardRng` stream (entity-type draws) since this is a board-state resolution event.

### 7.3 RALLY_CASINO `banked` pool — RESOLVED

**Source:** `gameRoom.ts:29-38`, `gameRoom.ts:430-436`, `gameRoom.ts:576-587`

```typescript
interface GameRoomState {
  banked: number;   // ← single room-level field, not per-player
  ...
}

// In processChainFaces():
this.state.banked += this.state.unbanked;
this.checkMilestones(playerId, this.state.banked);
if (this.state.banked >= WIN_SCORE) { void this.endSession(playerId); }

// In checkMilestones():
if (this.gameMode !== 'RALLY_CASINO') return;
for (const m of RALLY_MILESTONES) {
  if (banked >= m.points && !hit.has(m.tier)) {
    const payout = Math.round(this.settings.stakeAmount * m.multiplier);
    this.broadcast({ type: 'MILESTONE_PAYOUT', ... });
  }
}
```

**`this.state.banked` is a SINGLE SHARED ROOM-LEVEL POOL.** All players' successful chains accumulate into the same `banked` value. Milestones are team milestones checked against the shared total. Win condition (`banked >= WIN_SCORE`) is a team win.

**Payout formula confirmed:** `Math.round(this.settings.stakeAmount * m.multiplier)` — payout is based on the **per-player stake amount**, not the total pot. So a tier-4 milestone (×5.0) pays `stakeAmount × 5` per event, regardless of how many players are in the room.

**Simulation impact:**
- In RALLY_CASINO, the Monte Carlo session must accumulate `banked` as a team total across all simulated player turns
- Milestones fire when team `banked` crosses 10k/25k/50k/100k
- Expected milestone payout EV = Σ P(tier_hit) × stakeAmount × tier.multiplier
- `p.profile.banked` (per-player, on the `Player` interface) is never updated in the server code — it is initialised to 0 and only used in VS_CASINO's winner-by-highest-score logic. In RALLY mode it is unused.

### 7.4 Additional Finding — Stone HP Client-Server Discrepancy

**Source:** `VoxelPhysicsSystem.ts:16` vs `types.ts:174`

- Client (`VoxelPhysicsSystem`): `const STONE_HP = 3` (local constant)
- Server (`GAME_CONSTANTS.STONE_HP = 2`) used by `gridUtils.ts:makeStoneCell()`

The server is authoritative. **Monte Carlo simulation must use HP=2 for stones**, not HP=3. HEADHUNTER double damage (2 HP per hit from `gridUtils.ts`) kills a server-side stone in a single bomb hit; non-HEADHUNTER requires 2 hits.

### 7.5 Additional Finding — HEADHUNTER Damage Not in VoxelPhysicsSystem

**Source:** `VoxelPhysicsSystem.ts:338-345` vs `gridUtils.ts:399-403`

`VoxelPhysicsSystem.activateBomb()` always applies 1 HP stone damage. The `isHeadhunter` double-damage is only in `gridUtils.ts:applyStandardBomb()`. The simulation must use the server (gridUtils) model: HEADHUNTER = 2 damage/hit, standard = 1.

### 7.6 `sandbox.ts` file location — RESOLVED

**Path confirmed:** `core/apps/server/src/sandbox.ts`

**Existing endpoints:** `POST /simulate`, `POST /analyze`, `GET /health`. No existing `/calibrate` endpoint — the plan's earlier reference to `GET /calibrate` was incorrect. New endpoints are `POST /simulate-v2`, `POST /rtp-audit`, `POST /role-audit`. See updated Batch D in §5 for full details.

**Notable finding:** `analyzeRTPImpact()` fallback uses a hardcoded `BASE_SCORE = 4500` constant and `(avgScore / BASE_SCORE) * 0.92` formula to project RTP. This is not calibrated to actual game mechanics and will report inaccurate RTP on any mode with a different score ceiling. The new `/rtp-audit` endpoint replaces it for compliance work.

---

## Roadmap Entry

Added to `roadmap/01-current-sprint.md` as next item after P2.6.

---

## CSPRNG Lineage Summary (For Auditors)

| Mechanism | PRNG Used | Seed Derivation | Synchronous? |
|---|---|---|---|
| Session master seed | `seededRng(masterSeed)` | User-supplied integer | YES |
| Per-session dice seed | derived from session RNG | `masterSeed + sessionIndex` | YES |
| Die face draws | `seededRng(sessionSeed ^ 0xAA_BB_CC)` | Per-session | YES |
| Board tile draws | `seededRng(sessionSeed ^ 0x11_22_33)` | Per-session | YES |
| Bonus spawn events | `seededRng(sessionSeed ^ 0x44_55_66)` | Per-session | YES |
| Player decisions | `seededRng(sessionSeed ^ 0x77_88_99)` | Per-session | YES |
| Live game provable-fairness | `CSPRNG` (HMAC-SHA256) | serverSeed + clientSeed | ASYNC |
| Grid creation (live) | `seededRng(Date.now())` | Session timestamp | YES |
| `monteCarlo.ts` current | `seededRng(i)` | Session index only | YES |

The simulation uses the same `seededRng()` XOR-shift function as the current `monteCarlo.ts` and `gridUtils.ts`. This is consistent with the W1 compliance requirement (all game randomness via seeded deterministic PRNG).

---

## Pre-Authorization Checklist (Before Any Sacred File Write)

- [ ] Run `cd core && pnpm type-check` — 0 errors
- [ ] Run `cd core && pnpm test` (all 16 farkleScorer cases pass)
- [ ] Run Bito review at ≥80 confidence on full diff
- [ ] Confirm `DECISIONS_LOCKED_v4.txt` updated if any constant changes
- [ ] Human authorizes each sacred file separately
- [ ] Show diffs for `monteCarlo.ts`, `rtpConfig.ts`, and `types.ts` before writing

**Stop here. Await human approval before implementation.**
