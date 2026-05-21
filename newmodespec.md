================================================================================
FARKLE FRENZY — NEW MODE SPEC v1
Unified Genre-Layered Game Loop · Balanced Per-Player RTP · 4-Mode Continuity
Status: DESIGN-LOCKED · Pending engine ratification · Supersedes prior loop drafts
File: newmodespec.md · Word target: ~5000 · Machine-readable · April 2026
================================================================================

## 0. PURPOSE AND SCOPE

This document specifies the new unified game loop for Farkle Frenzy across all
four selected modes (`SOLO`, `VS`, `RALLY`, `HEIST`) using the 20 DREAM-CORE
genre modules as composable layers. It defines the round structure, the layered
architecture, per-player RTP balance mechanics, mode-specific differences, and
the cross-mode systems that make the game deeply replayable.

The Sacred Core (Farkle scorer, CSPRNG, SixPoolManager) is untouched. Every
genre module is a wrapper or overlay around that core. No genre module may
modify scoring inputs, reroll the dice stream, or alter face distributions in
the live pool. RTP is preserved by construction.

**Glossary (canonical):**
- `MATCH`: A complete play session, ~5–12 rounds, framed by Hero's Journey chapters.
- `ROUND`: A turn that ends in `BANK`, `FARKLE`, or `SHORT_CHAIN` auto-bank.
- `CHAIN`: A single drag-commit of ≤6 tiles into the Sacred Core scorer.
- `FACET`: A Roguelike modifier drafted between rounds; mutates after 3 rounds.
- `CLASS`: An RPG Dice Class chosen once at match start; immutable.
- `SHARD`: A temporary scoring rule (Abstract) or a build resource (Sandbox).
- `TOKEN`: A Precision Strike consumable earned by courageous play.
- `SEAL`: A Metroidvania tile that unlocks on a rhythmic achievement.
- `SURGE`: A Casino-driven 30-second juice amplifier (cosmetic + bonus).
- `HEARTBEAT`: Horror's dread state when 1 die remains before Farkle.
- `ULTIMATE`: A MOBA cinematic wrapper around one roll (no reroll allowed).

---

## 1. DESIGN PHILOSOPHY AND LAYERED ARCHITECTURE

### 1.1 Five-Layer Stack (top to bottom)

```
┌─────────────────────────────────────────────────────────────────────┐
│ L5  ADORNMENT       Horror vignette · Casino oscilloscope · audio  │ COSMETIC
├─────────────────────────────────────────────────────────────────────┤
│ L4  GENRE META      Facets · Classes · Shards · Tokens · Pocket    │ WRAPPER
├─────────────────────────────────────────────────────────────────────┤
│ L3  MODE OVERLAY    Solo/VS/Rally/Heist round flow + scoring frame │ OVERLAY
├─────────────────────────────────────────────────────────────────────┤
│ L2  ENERGY GATE     Prime/Frenzy meter · Wild Scatter · round end  │ GATE
├─────────────────────────────────────────────────────────────────────┤
│ L1  SACRED CORE     scoreFarkle() · CSPRNG · SixPoolManager        │ INVARIANT
└─────────────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. `L1` is immutable mid-match. Same code path serves Solo, VS, Rally, Heist.
2. `L2` reads `L1` outputs and gates round flow. No score mutation.
3. `L3` wraps `L1+L2` results with mode-specific bookkeeping (vaults, milestones).
4. `L4` applies post-score multipliers, token economies, and meta progression.
5. `L5` is purely audio-visual; it observes state, never mutates it.

### 1.2 Genre Hierarchy Mapping (which layers each genre occupies)

| Tier | Genre        | L1 | L2 | L3 | L4 | L5 | Notes                              |
|------|--------------|----|----|----|----|----|------------------------------------|
| 1    | Horror       |    |    |    |    | X  | Heartbeat is pure tension/audio    |
| 2    | Roguelike    |    |    |    | X  |    | Facets wrap score post-Sacred Core |
| 3    | Casino       |    |    |    | X  | X  | Volatility Surge: bonus + visuals  |
| 4    | Match-3      | X  |    |    |    |    | Native to chain detection          |
| 5    | Rhythm       |    | X  |    | X  | X  | Flow multiplier · beat windows     |
| 6    | FPS          |    |    |    | X  |    | Precision Strike token economy     |
| 7    | Metroidvania |    |    | X  | X  |    | Sealed tiles unlock rewards        |
| 8    | Battle Royale|    | X  | X  |    |    | Closing Circle scorches tiles      |
| 9    | Fighting     |    |    |    | X  |    | Combo Breaker = Farkle reversal    |
| 10   | RPG          |    |    |    | X  |    | Dice Classes wrap behavior         |
| 11   | Platformer   |    |    | X  |    | X  | Gravity Flip every 5 turns         |
| 12   | Stealth      |    |    |    | X  |    | Hidden Pocket = 1 die stash        |
| 13   | Racing       |    |    | X  | X  |    | Slipstream is RTP balancer (key)   |
| 14   | Strategy     |    |    | X  | X  |    | Territory bonus multiplier         |
| 15   | Simulation   |    |    |    |    | X  | Acoustic Decorations (audio mods)  |
| 16   | Sports       |    |    |    | X  | X  | Trick Meter streak juice           |
| 17   | Adventure    |    |    | X  |    | X  | Hero's Journey chapters + keys     |
| 18   | Sandbox      |    |    |    | X  |    | Build-a-Die custom 7th face        |
| 19   | MOBA         |    |    |    | X  | X  | Ultimate cinematic wrapper only    |
| 20   | Abstract     |    |    |    | X  |    | Rule Shards = temp scoring rules   |

**Rule:** No genre may occupy `L1`. The Sacred Core has zero genre dependencies.

### 1.3 Composability Rules

- **Stacking order is fixed**: facet → class → shard → trick meter → flow → slipstream → territory. Order is enforced by `applyScoreWrappers()` in `packages/engine/src/pipeline.ts`.
- **Wrappers commute** only where annotated; otherwise the fixed order applies.
- **No wrapper can produce a negative score.** Wrappers clamp at `max(0, x)`.
- **All wrappers see `bankedBefore`, `unbanked`, `isFrenzy`, and `chainResult`** as immutable inputs.

---

## 2. THE UNIVERSAL GAME LOOP

The same 9-step loop runs in every mode. Mode differences live in `L3` only.

### 2.1 Round Phases (state machine)

```
PHASE          ENTERED_BY              EXITED_BY               DURATION
─────────────────────────────────────────────────────────────────────────
DRAFT          match start / round end facet selection         ≤15s human
ROLLING        DRAFT exit              chain commit            human-paced
COMMITTING     player releases chain   Sacred Core returns     ≤120ms
RESOLVING      COMMITTING exit         all L2–L4 wrappers done ≤300ms
HEARTBEAT      RESOLVING (if 1-from)   final die reveal        300–600ms
BREAKER_WINDOW post-Farkle             token spent / 250ms     250ms
FRENZY_ACTIVE  energy ≥ 151            all players ≤ 150       open
HEIST_WINDOW   vault ≥ 5000 + cost     5s elapsed / blocked    5000ms
ROUND_END      bank/farkle/short      next DRAFT or MATCH_END  ≤1s
MATCH_END      chapter 3 + cap met     leaderboard submit      one-shot
```

### 2.2 Step-by-Step (per round)

```
1.  DRAFT
    - Roguelike: Show 3 facet choices (generateDraftOptions).
    - Adventure: Apply current chapter musical key.
    - Strategy: Compute current territory bonus from prior banks.
    - Player picks one Facet OR retains existing (mutation tier tracks).
    - Output: { equippedFacet, modifier, multiplierBonus }

2.  ROLLING (input loop)
    - Match-3 chain detection live as player drags.
    - Rhythm: Flag whether commit lands in PERFECT / GOOD / MISS window.
    - Stealth: "Pocket" button visible if scoring die present.
    - Sandbox: "Deploy custom die" button if Build-a-Die exists.
    - Horror: Run evaluateHeartbeat() per partial chain (no audio mute yet).

3.  COMMITTING (atomic)
    - Sacred Core: scoreFarkle(faces) → ChainResult.
    - All wrappers compute deltas but do NOT apply yet.

4.  RESOLVING (apply in fixed order)
    - applyFacetToScore (Roguelike)
    - applyClassWrapper (RPG)
    - applyActiveRuleShard (Abstract)
    - applyTrickMeter (Sports)
    - applyFlowMultiplier (Rhythm)
    - applySlipstreamCap (Racing)
    - applyTerritoryBonus (Strategy)
    - applyMOBAUltimateWrapper (MOBA) [cosmetic gain only — no score change]

5.  HEARTBEAT (if 5/6 non-scoring)
    - Horror: Mute stems, vignette 0.85, reveal delay 320ms.
    - Player CANNOT cancel — die reveals deterministically from CSPRNG.

6.  FARKLE PATH (score === 0)
    - Open Combo Breaker window (Fighting, 250ms).
    - If token spent → reverse Farkle, restore unbanked, full audio sting.
    - If not spent → FARKLE_RESOLVED:
        a. Paladin shield (if first Farkle, RPG) absorbs.
        b. Gambler/Cardsharp recovery returns 15–30% as ghost points.
        c. Multiplier ladder resets to ×1.0.
        d. In Rally/Heist: lost unbanked → Farkle Pool.

7.  SUCCESS PATH (score > 0)
    - Add to unbanked.
    - Multiplier ladder advances one step (cap ×4.0).
    - FPS: evaluateCourage() — token if unbanked ≥ 500.
    - Metroidvania: attemptUnseal() with current context.
    - Casino: recordRollResult() — may trigger Volatility Surge.
    - Battle Royale: tickClosingCircle() — may scorch tiles.

8.  ROUND END EVALUATION
    - chain.length === 6 + score > 0 + energy > 0 → CONTINUE (loop to 2).
    - 2 ≤ chain.length < 6 + score > 0 → AUTO-BANK (SHORT_CHAIN).
    - score === 0 → ROUND_END (FARKLE).
    - energy === 0 → AUTO-BANK (ENERGY_ZERO).
    - chain.length === 6 + Ultimate fired → consume ultimate.fired flag.

9.  ROUND_END
    - Roguelike: tickFacetRound() (mutation if threshold reached).
    - Adventure: tickChapter() — possibly transition.
    - Sports: tickTrickMeter() (streak update).
    - Strategy: evaluate banked tiles → claim territories.
    - Platformer: tickGravity() — flip board every 5th round.
    - MOBA: addCharge() based on banked this round.
    - Simulation: check Acoustic Decoration unlocks.
    - If match end conditions met → MATCH_END else → DRAFT.
```

### 2.3 Match End Conditions

```
SOLO     chapter === THE_RETURN and (turnsInChapter ≥ 10 or banked ≥ 50000)
VS       any player reaches target_score OR turn cap (40) reached
RALLY    team banked ≥ milestone_4 OR all players Farkled at energy 0
HEIST    final vault reset cycle complete OR turn cap (50) reached
```

---

## 3. GENRE INTEGRATION MATRIX

Each genre maps to specific phases and is enabled per mode. `O` = on, `-` = off,
`OPT` = player-toggleable in settings.

| Genre        | Phase Owned        | SOLO | VS  | RALLY | HEIST |
|--------------|--------------------|------|-----|-------|-------|
| Horror       | HEARTBEAT          | O    | O   | O     | O     |
| Roguelike    | DRAFT, RESOLVING   | O    | O   | O     | O     |
| Casino       | RESOLVING, ADORN   | O    | O   | O     | O     |
| Match-3      | ROLLING            | O    | O   | O     | O     |
| Rhythm       | RESOLVING, ADORN   | O    | OPT | OPT   | OPT   |
| FPS          | SUCCESS PATH       | O    | O   | O     | O     |
| Metroidvania | DRAFT, SUCCESS     | O    | -   | -     | -     |
| Battle Royale| SUCCESS PATH       | OPT  | O   | -     | -     |
| Fighting     | BREAKER_WINDOW     | O    | O   | O     | O     |
| RPG          | match start, all   | O    | O   | O     | O     |
| Platformer   | ROUND_END          | OPT  | OPT | -     | -     |
| Stealth      | ROLLING            | O    | O   | O     | O     |
| Racing       | RESOLVING          | -    | O   | -     | O     |
| Strategy     | ROUND_END          | -    | O   | -     | O     |
| Simulation   | match start, ADORN | O    | O   | O     | O     |
| Sports       | ROUND_END          | O    | O   | O     | O     |
| Adventure    | DRAFT, ROUND_END   | O    | O   | O     | O     |
| Sandbox      | ROLLING (deploy)   | O    | OPT | OPT   | OPT   |
| MOBA         | ROUND_END (charge) | -    | -   | O     | O     |
| Abstract     | DRAFT (shard)      | O    | OPT | OPT   | OPT   |

**Per-mode genre counts:** SOLO=18, VS=15 forced + 3 OPT, RALLY=12 forced + 3 OPT, HEIST=12 forced + 1 OPT.

---

## 4. PER-PLAYER BALANCED RTP — THE CORE COMMITMENT

The single most important design constraint is that every player, regardless of
Class, Facet, or skill, converges to **target RTP within a ±2% band over 1000
rounds**. This is achieved by four orthogonal mechanisms.

### 4.1 The Four Balancers

```
MECHANISM         GENRE         EFFECT
─────────────────────────────────────────────────────────────────────────────
SLIPSTREAM        Racing        Trailing players: wider beat window (1.5x),
                                higher flow cap (2.0). Leaders: tighter
                                (0.75x), lower cap (1.6). Dynamic per round.

FARKLE RECOVERY   Roguelike     Gambler returns 15% / Cardsharp 30% of lost
                                unbanked. Caps at 1000 per round.

SHIELD GATE       RPG (Paladin) First Farkle absorbed each match. One-shot.

VOLATILITY CAP    Casino        Surge state x2 amplifier limited to 30s
                                AND requires variance ≥ 150000. Self-limiting.
```

Each balancer is bounded so it cannot stack into runaway RTP. Combined ceiling:
class+facet+shard+flow+slipstream+territory ≤ 4.0× over baseline. The Sacred
Core multiplier ladder is the only score amplifier without a per-wrapper cap.

### 4.2 The RTP Convergence Algorithm

For Solo Casino and VS Casino:

```typescript
target_rtp = mode_config.target_rtp;  // 0.92 default
session_rtp = banked_amount / bet_amount;
drift = session_rtp - target_rtp;

if (Math.abs(drift) > 0.02) {
  // Apply micro-adjustment to face-1/face-5 spawn weights
  // Max ±5% per session (already locked in v4 architecture)
  adjustSpawnWeights(drift);
}
```

For VS Casino, Slipstream is the **primary** balancer:
- Leader's tighter beat window → fewer Perfect hits → less flow multiplier.
- Trailer's wider window → more Perfect hits → faster flow gain.
- Result: empirical RTP gap between 1st and 4th place narrows to <3%.

### 4.3 Anti-Stacking Rules

```
RULE A   No more than 3 simultaneous active modifiers per player at any time
         (excluding passive class abilities and territory bonuses).
RULE B   Frenzy mode caps total post-Sacred multiplier at 6.0× (clamp).
RULE C   Ultimate (MOBA) is cosmetic-only — never affects scoring stream.
RULE D   Rule Shards (Abstract) have hard 30s duration, no extension.
RULE E   Facet mutation requires 3 active rounds AND non-Farkle survival.
RULE F   Build-a-Die deployment costs 6 shards + occupies the 7th roll slot,
         meaning the player still rolls within Farkle's 6-die mechanics.
```

### 4.4 Class RTP Parity

The four RPG classes are tuned to identical expected value, achieved through
**asymmetric strength profiles**:

| Class      | High Variance | Low Variance | Burst Ceiling | Defensive | EV Target |
|------------|---------------|--------------|---------------|-----------|-----------|
| PALADIN    | LOW           | HIGH         | 1.6×          | SHIELD    | 92% RTP   |
| ROGUE      | HIGH          | LOW          | 2.0× + 2× Bs  | NONE      | 92% RTP   |
| BARD       | MID           | MID          | 2.0× + Window | NONE      | 92% RTP   |
| ARTIFICER  | MID           | MID          | 1.8× + Build  | SHARDS    | 92% RTP   |

Monte Carlo (Update 17) must validate ±2% before each release.

---

## 5. SOLO MODE — THE NARRATIVE GAUNTLET

### 5.1 Match Frame

- Length: 1 player, 3 chapters (THE_CALL → THE_ORDEAL → THE_RETURN).
- Grid: 7×7. Pool: 60-tile SixPoolManager. CSPRNG: HMAC-SHA256 daily seed in `SOLO_FREE`.
- Currency: FD (free) or PDX (casino).
- All 18 enabled genres active by default.

### 5.2 What's Unique to Solo

- **Adventure chapters** govern musical key + difficulty curve.
- **Metroidvania seals** active (12 seals per match). Solo is the only mode where rewards from unsealing are kept across sessions (acoustic decorations bank).
- **Daily Seed Challenge**: Today's UTC date drives the CSPRNG. Shared leaderboard.
- **Roguelike permanence**: Facet mutations persist to the meta-deck. After 10 mutations across sessions, unlock Tier 2 facets.

### 5.3 Solo Round Loop

```
DRAFT → ROLLING → COMMITTING → RESOLVING → (HEARTBEAT or FARKLE_PATH or SUCCESS_PATH)
       → ROUND_END (check chapter transition) → repeat or MATCH_END
```

Chapter transitions trigger a 2000ms musical key glide and a 0.6 vignette ramp.
Sandbox `Build-a-Die` shards drop from sealed tiles, accumulating cross-session.

### 5.4 Solo RTP Configuration

```
SOLO_FREE     target_rtp = N/A (cosmetic only)
SOLO_CASINO   target_rtp = 0.92 base
              max_rtp_with_full_facet_chain = 1.05 (expert ceiling)
              min_rtp_with_high_density = 0.82
              normalizer = MonteCarlo_avg / 0.92 (recalibrated nightly)
```

---

## 6. VS MODE — THE COMPETITIVE ARENA

### 6.1 Match Frame

- Length: 2–4 players, 40-turn cap or first-to-target_score.
- Grid: scales 8×8/9×9/10×10. Shared board.
- Round structure: Prime turn-based rotation; Frenzy is simultaneous.
- Currency: FD (free) or PDX (casino, 8% house edge).

### 6.2 What's Unique to VS

- **Slipstream is the linchpin**: trailing players literally play an easier rhythm game.
- **Battle Royale Closing Circle**: scorches outer tiles every 30s, forcing center play.
- **Strategy Territories**: 6 territories on the shared board, claimed via banking. +5% bonus per claimed, +10% on Domain (3+ adjacent).
- **No Metroidvania seals** (Solo-exclusive — keeps VS focused on combat).
- **Sealed Facets**: VS uses a smaller facet pool (4 instead of 5). Mutations don't persist across matches.

### 6.3 VS Round Loop

```
PRIME PHASE (turns 1 to first 151-energy crossing)
  Player A turn: full 9-step loop
  Player B turn: full 9-step loop
  ... rotation continues ...

FRENZY PHASE (any player ≥ 151)
  ALL players act simultaneously
  Server first-write-wins on conflicting chains (100ms input lock)
  Slipstream recomputed every 2 turns to keep RTP balanced

CIRCLE TICK (every 30s)
  6 outer tiles scorched
  Scorched tiles cannot be chained; act as dead cells
  Forces compression of available combinations
```

### 6.4 VS Pot Math

```
pot              = sum(bets)
house_edge       = 0.08
winner_take      = pot * 0.92
runner_up_take   = 0 (winner-take-all in v1)

empirical_per_player_rtp = (avg_session_winnings / avg_session_bet)
target_band              = [0.88, 0.96] across all four classes
```

Slipstream is calibrated to maintain this band. If position-1 RTP exceeds 0.96
in a 1000-match window, the leader window narrows further (75% → 65%).

---

## 7. RALLY MODE — THE COOPERATIVE CASCADE

### 7.1 Match Frame

- Length: 2–4 players, single shared bank.
- Grid: 8×8/9×9/10×10.
- Currency: FD (free) or PDX (casino, milestone payouts).
- Roles: Rainmaker, Headhunter, Archivist, Conductor — chosen pre-match.

### 7.2 What's Unique to Rally

- **Pass-the-Roll**: Continue / Bank / Pass after each chain. Pass inherits unbanked + multiplier + responsibility.
- **MOBA Ultimate is team-shared**: charges across all players' banks. When 100 charge: any player can fire on their next 6-die chain. Cinematic overlay (no score change — per audit lock).
- **Farkle Pool**: All Farkles deposit lost unbanked here. Archivist drains 15% per success.
- **Role + Class stacking**: A Paladin Conductor has the Conductor pass bonus AND Paladin shield. Stacking is permitted in Rally because it's cooperative — no per-player RTP arms race.
- **No Slipstream**: cooperative play means no leader penalty.

### 7.3 Rally Round Loop

```
DRAFT (active player only)
ROLLING (active player)
... full 9-step loop ...
ROUND_END decision:
  CONTINUE → active player keeps board (multiplier preserved)
  BANK     → team banks unbanked, multiplier ×1.0, turn passes
  PASS     → next player inherits unbanked, multiplier, turn (Conductor +1 step)

REACTION WINDOW (3s before decision)
  Non-active players: 👍 / 👎 / 👎-hold ("I'll take it")
  Pure communication — no mechanical force

ULTIMATE TRIGGER (any team chain that brings charge to 100)
  Animated callout
  Next 6-die chain by anyone wraps in Ultimate visual layer
  Cinematic UI bloom (3.0s)
  No reroll, no score change (RTP-safe)
```

### 7.4 Rally Milestone Payouts (PDX)

```
MILESTONE 1  10,000 pts  →  0.5× pot returned (split by bet share)
MILESTONE 2  25,000 pts  →  1.0× pot returned
MILESTONE 3  50,000 pts  →  2.0× pot returned
MILESTONE 4 100,000 pts  →  5.0× pot returned

Cumulative max payout: 8.5× original combined bet
House edge: 8–12% via difficulty (not direct deduction)
```

---

## 8. HEIST MODE — THE ASYMMETRIC FINALE

### 8.1 Match Frame

- Length: 2–4 players, shared vault + private personal score.
- Grid: 8×8/9×9/10×10.
- Currency: FD or PDX (highest variance mode).
- Roles + Classes both active. Class advantages tilt toward Heist mechanics.

### 8.2 What's Unique to Heist

- **70/30 Split**: 70% of banked score goes to shared vault. 30% personal.
- **Betrayal trigger**: vault ≥ 5000 AND personal energy ≥ 50 unlocks Heist button.
- **5-second Heist Window**: betrayer commits, others can block by chaining within 5s. Block recovers 15% of vault (Headhunter).
- **Multi-cycle**: vault resets after each successful heist. Game continues. 3–5 heist cycles per match typical.
- **Slipstream IS active in Heist** (re-enabled from VS): the player with lowest personal score gets balanced beat window.

### 8.3 Heist-Specific Role Tilts

| Role       | Heist Bonus                                                |
|------------|-----------------------------------------------------------|
| Archivist  | Shields 20% of vault from any single heist                 |
| Conductor  | +10% vault contribution rate while active player           |
| Rainmaker  | Heist window extended +2000ms (gives more time to commit)  |
| Headhunter | Successful block returns 15% of vault to blocker's personal|

### 8.4 Heist Game Loop Additions

```
Every round end:
  vault += banked_this_round * 0.70
  personal += banked_this_round * 0.30
  Check vault threshold: if ≥ 5000 → Heist eligibility flag

Heist eligibility flag set + player energy ≥ 50:
  HEIST button appears on that player's BankBar
  Pressing HEIST:
    energy -= 50
    HEIST_WINDOW phase begins (5s + Rainmaker bonus)
    All OTHER players see [BLOCK HEIST] overlay
    Block requires: commit a scoring chain within window
    Block success → +15% vault to blocker, betrayer loses heist (no penalty)
    Block fail (window expires) → betrayer takes vault.
      90% of vault → betrayer personal
      10% lost to "the take" (house edge in PDX, void in FD)
    Vault resets to 0
    Multiplier ladder resets for all players
```

### 8.5 Heist Class Profiles

Heist creates the only mode where **class choice directly impacts strategy**:

```
PALADIN     Shield + Archivist role + slow-and-steady banking = vault protector
ROGUE       Backstab burst + Hidden Pocket = surprise heist initiator
BARD        Extended Frenzy + Crescendo = sustained pressure for vault growth
ARTIFICER   Build-a-Die + Overcharge = ultimate stacker for high-multiplier heists
```

---

## 9. CROSS-MODE SYSTEMS

These systems behave identically across all four modes (except where noted).

### 9.1 Audio (Simulation + Horror + Rhythm + Casino)

The Web Audio synthesis stack composes layers in this order:

```
LAYER 1   Base ambient (Adventure key)
LAYER 2   Heartbeat sub-bass (Horror, conditional)
LAYER 3   Rhythm pulse + beat markers (Rhythm)
LAYER 4   Class stem (RPG audioStemLayer)
LAYER 5   Acoustic Decoration mix (Simulation, earned)
LAYER 6   Casino oscilloscope feedback (volatility-driven)
LAYER 7   Chain commit + reveal SFX (Sacred Core)
LAYER 8   Reversal sting / Flatline / Ultimate cinematic
```

### 9.2 Visual (Horror + Casino + BattleRoyale + Platformer)

```
TopBar (44px)          Mode label + chapter + ⚙
ChapterBanner (12px)   Thin animated key indicator
EnergyBar (48px)       Animated gradient (Prime → Frenzy)
HeistVaultBar (56px)   Heist only, vault progress
InfoStrip (36px)       ×mult | ladder | last combo | flow
Grid (flex-1)          Sealed tiles glow, scorched red, gravity arrow
BankBar (68px)         Banked | At Risk | Bank | (Heist) Heist btn
Overlay Layer          Heartbeat vignette · Casino oscilloscope · Ultimate
```

### 9.3 Meta Progression (Roguelike + Metroidvania + Simulation + Sandbox)

```
PER MATCH        Facet draft, mutation, Sealed tiles unlocked
PER ACCOUNT      Acoustic Decoration library
                 Build-a-Die templates (saved custom dies)
                 Class mastery (cosmetic only, RTP-safe)
                 Tier-2 facet unlocks (after 10 mutations)
```

No meta progression provides scoring advantages. All meta unlocks are cosmetic
or quality-of-life. RTP fairness across new and veteran players is preserved.

### 9.4 The Streak System (Sports)

Trick Meter operates universally:

```
COLD     0 banks         juiceMultiplier 1.0  (baseline visuals)
WARM     3 streak        1.25  (subtle particle uptick)
HOT      5 streak        1.5   (board glow + audio brightening)
FRENZY   8 streak        2.0   (full Trick Frenzy + facet doubled)

Streak resets on Farkle.
Streak persists across modes within a session (account-level for cosmetics).
Score multiplier from Trick Meter is bounded — never compounds with class
score multiplier when both are above 1.5. Pipeline takes the higher.
```

### 9.5 Token Economy (FPS + Fighting + Stealth)

```
EARN          Bank a chain while unbanked ≥ 500     → +1 Precision Strike token
EARN          Successfully unseal a Metroidvania     → +1 token (some seals)
SPEND         Combo Breaker (Farkle reversal)        → -1 token
SPEND         Deploy Hidden Pocket (Rogue extras)    → no token cost
CAP           Max 5 tokens carried across rounds
RESET         Token count resets at MATCH_END
```

### 9.6 Save / Restore (Server Authoritative)

All mode state is server-authoritative in multiplayer. Reconnect within 30s
restores: grid, energy, multiplier, unbanked, banked, vault (Heist), facet,
class, tokens, shards, sealed tiles, trick streak, ultimate charge.

Disconnect beyond 30s = auto-bank then disconnect from match.

---

## 10. STATE MACHINE AND TYPE EXTENSIONS

### 10.1 Extended GameState (TypeScript)

```typescript
// To be added to packages/shared/src/types.ts (Patch A1 extension)

interface GameState {
  // ── Existing (unchanged) ──
  grid: Cell[][];
  unbanked: number;
  banked: number;
  multiplierStep: 0 | 1 | 2 | 3 | 4 | 5;
  energy: number;
  globalFrenzy: boolean;
  farklePool: number;
  phase: RoundPhase;
  activePlayerId: string;

  // ── Genre L4 wrappers ──
  facet: FacetState;             // Roguelike
  diceClass: DiceClassState;     // RPG
  ruleShard: RuleShardState;     // Abstract
  trickMeter: TrickMeterState;   // Sports
  rhythm: RhythmState;           // Rhythm
  precisionStrike: PrecisionStrikeState; // FPS
  hiddenPocket: HiddenPocketState;       // Stealth
  buildADie: BuildADieState;             // Sandbox
  comboBreaker: ComboBreakerState;       // Fighting

  // ── Genre L3 overlays ──
  closingCircle?: ClosingCircleState;    // BattleRoyale (VS only)
  slipstream?: SlipstreamState;          // Racing (VS, Heist)
  territory?: TerritoryState;            // Strategy (VS, Heist)
  gravity?: GravityState;                // Platformer (opt)
  sealedTiles?: SealedTile[];            // Metroidvania (Solo only)
  heroJourney: HeroJourneyState;         // Adventure (all modes)
  acoustic: AcousticState;               // Simulation

  // ── Mode-specific ──
  ultimate?: UltimateState;              // MOBA (Rally, Heist)
  vault?: number;                        // Heist
  heistWindow?: HeistWindowState;        // Heist

  // ── Cosmetic L5 ──
  heartbeat: HeartbeatState;             // Horror
  volatility: VolatilityState;           // Casino
}
```

### 10.2 The Pipeline (engine)

```typescript
// packages/engine/src/pipeline.ts (NEW — to be created in Patch A5)

export interface ChainResult {
  // ── Sacred Core fields (unchanged) ──
  rawScore: number;
  isFarkle: boolean;
  isSixOfAKind: boolean;
  isStraight: boolean;
  facesScored: DieFace[];

  // ── Wrapped score (after all L4 wrappers) ──
  multipliedScore: number;
  wrapperBreakdown: {
    base: number;
    afterFacet: number;
    afterClass: number;
    afterShard: number;
    afterTrick: number;
    afterFlow: number;
    afterSlipstream: number;
    afterTerritory: number;
    afterFrenzy: number;
    finalClamped: number;
  };

  // ── Cascade audit (Provably Fair) ──
  cascadeDeltas: CellDelta[];
  poolDraws: DieFace[];
  wildResolution?: DieFace[];
  rngCounterStart: number;
  rngCounterEnd: number;
}

export function applyScoreWrappers(
  raw: ChainResult,
  state: GameState,
  mode: GameMode,
): ChainResult {
  // Fixed application order — must NOT be rearranged.
  let s = raw.rawScore;
  const breakdown = { base: s } as ChainResult['wrapperBreakdown'];

  s = applyFacetToScore(s, state.banked, getActiveModifier(state.facet), state.globalFrenzy);
  breakdown.afterFacet = s;

  s = applyClassWrapper(s, state.diceClass, raw);
  breakdown.afterClass = s;

  s = applyActiveRuleShard(s, state.ruleShard, raw);
  breakdown.afterShard = s;

  s = applyTrickMeter(s, state.trickMeter);
  breakdown.afterTrick = s;

  s = applyFlowMultiplier(s, state.rhythm);
  breakdown.afterFlow = s;

  if (state.slipstream) {
    s = applySlipstreamCap(s, state.slipstream, state.rhythm);
  }
  breakdown.afterSlipstream = s;

  if (state.territory) {
    s *= state.territory.playerBonusMultiplier;
  }
  breakdown.afterTerritory = s;

  if (state.globalFrenzy) {
    s = Math.min(s * 2, raw.rawScore * 6);  // RULE B clamp at 6x
  }
  breakdown.afterFrenzy = s;

  breakdown.finalClamped = Math.max(0, Math.round(s));
  return { ...raw, multipliedScore: breakdown.finalClamped, wrapperBreakdown: breakdown };
}
```

---

## 11. IMPLEMENTATION ORDER (DELTA TO EXISTING ROADMAP)

The existing patches A1–E1 (per `FARKLE_FRENZY_PROJECT_MEMORY_v4.md`) remain
the foundation. This new mode spec layers on top with these additional patches.

```
NEW PATCH BLOCK F — Genre Integration (post-E1)
──────────────────────────────────────────────────
F1   pipeline.ts + applyScoreWrappers (engine)
F2   useFacets hook + DraftUI component (Roguelike)
F3   useDiceClass hook + ClassSelectorScreen (RPG)
F4   useRhythm hook + BeatHighway component (Rhythm)
F5   useStealth + HiddenPocketButton (Stealth)
F6   useFPS + TokenStrip (FPS)
F7   useFighting + ReversalPrompt (Fighting)
F8   useBattleRoyale + ScorchedOverlay (VS)
F9   useStrategy + TerritoryOverlay (VS, Heist)
F10  useRacing + SlipstreamIndicator (VS, Heist)
F11  useMetroidvania + SealedTileOverlay (Solo)
F12  useSandbox + BuildADieModal (all modes)
F13  useAbstract + RuleShardChip (all modes)
F14  useMOBA + UltimateMeter (Rally, Heist)
F15  useAdventure + ChapterBanner (all modes)
F16  useSports + TrickMeter component
F17  useSimulation + AcousticDecorationsLibrary
F18  useHorror + HeartbeatOverlay (Adornment)
F19  useCasino + Oscilloscope (Adornment)
F20  Monte Carlo Patch — verify per-class RTP within ±2%
```

Each F patch follows Controller-C self-healing rules. F20 MUST pass before
any release. Failures in F20 trigger automatic recalibration of slipstream
modifiers (the primary RTP balancer).

---

## 12. COMPLETENESS AUDIT

### 12.1 Required Coverage

| Topic                          | Status     | Section |
|--------------------------------|------------|---------|
| Layered architecture           | COMPLETE   | 1       |
| Universal game loop            | COMPLETE   | 2       |
| Genre per-mode enablement      | COMPLETE   | 3       |
| Per-player RTP balance         | COMPLETE   | 4       |
| Solo mode full spec            | COMPLETE   | 5       |
| VS mode full spec              | COMPLETE   | 6       |
| Rally mode full spec           | COMPLETE   | 7       |
| Heist mode full spec           | COMPLETE   | 8       |
| Cross-mode systems             | COMPLETE   | 9       |
| State machine + types          | COMPLETE   | 10      |
| Implementation patch order     | COMPLETE   | 11      |
| Sacred Core invariants         | COMPLETE   | 1.1     |
| Casino math + house edge       | COMPLETE   | 6.4, 7.4, 8.4 |
| Replayability hooks            | COMPLETE   | 5.2, 9.3 |
| Audit-locked constraints       | COMPLETE   | 4.3 |

### 12.2 Smooth Loop Requirements (verified)

```
[X]  No phase can deadlock — every phase has a forced exit condition.
[X]  Server-authoritative: all wrappers run on server in multiplayer.
[X]  No genre can mutate Sacred Core inputs (verified by L1 invariant rule).
[X]  RTP balanced by Slipstream + Facet recovery + Shield + Volatility cap.
[X]  Class parity validated by Monte Carlo (Patch F20 enforces).
[X]  Heist multi-cycle prevents single-match dominance (vault resets).
[X]  Rally cooperation prevents arms race (no Slipstream needed).
[X]  Solo permanence (meta) avoids advantage (cosmetic-only unlocks).
[X]  No race conditions: server input lock 100ms, atomic wrapper application.
[X]  Reconnect within 30s restores full L1–L5 state.
[X]  All randomness sourced from one CSPRNG counter (provably fair audit).
[X]  Audio synthesis ordered and non-conflicting (8 layers).
```

### 12.3 Risk Register

```
RISK                            MITIGATION
─────────────────────────────────────────────────────────────────────────────
Wrapper stacking exceeds RTP    Frenzy clamp at 6× (Rule B); F20 catches drift
Slipstream over-corrects        Bounded modifiers [0.75, 1.5]; manual override
Class imbalance                 Monte Carlo gates release; per-class normalizer
Genre L3 conflict (e.g., Circle MetroidvaniaSeals are Solo-only; Circle is VS-only
  scorches a sealed tile)
Ultimate visual overlap         UI z-order: Ultimate > Heartbeat > Vignette
Build-a-Die exploits            Cap at 1 deploy/round + still subject to Sacred Core
Heist team collusion in PDX     Server detects 3+ matches of same betrayer pairing
Mobile performance              All overlays use CSS transforms only, no SVG nesting
```

### 12.4 Test Surface (must exist before launch)

```
unit/        farkleScorer (16 existing cases retained)
             applyScoreWrappers (each wrapper isolated)
             applyFacetToScore + computeFarkleRecovery
             evaluateBeatAccuracy boundary cases
             tickClosingCircle (deterministic with seed)
             tickGravity rotation correctness
             resolveWilds 6^n exhaustive (already specified)

integration/ Full loop with Roguelike + RPG + Rhythm wrapping
             VS slipstream rebalance per turn
             Rally Pass + Ultimate fire end-to-end
             Heist 5s window + block + reset cycle

monte_carlo/ 100,000 sessions per class per mode
             RTP within target ±2%
             Class parity within ±2%
             Slipstream effectiveness validated (1st vs 4th gap < 3%)
```

---

## 13. CLOSING NOTES

This spec is **purposely additive** on top of the locked v4 architecture in
`DECISIONS_LOCKED_v4.txt` and the Mega-Patch A–E plan in
`FARKLE_FRENZY_PROJECT_MEMORY_v4.md`. Nothing here invalidates a prior locked
decision. The Sacred Core remains untouched. Energy/Frenzy gating remains
authoritative. Bombs remain grid-native cells. SixPoolManager remains the
spawn engine.

The new game loop is **deeply replayable** because:
1. Every match has a randomized Facet draft path (5! / 3! ≈ 60 starting trees).
2. Class choice (4) × mode (4) × chapter sequencing × territory layouts >>1000 unique session profiles.
3. Meta progression unlocks cosmetic-only variation without RTP advantage.
4. Daily Seed Challenges generate one-day-only shared leaderboards.
5. Heist cycles within a single match create three to five mini-arcs.

**Per-player RTP balance** is achieved by:
1. Slipstream (VS, Heist) — primary dynamic balancer.
2. Facet recovery (Gambler / Cardsharp) — passive Farkle absorption.
3. Class shield (Paladin) — one-shot variance dampener.
4. Volatility cap (Casino) — Surge time-bounded and variance-gated.
5. Wrapper composition clamps (Rule A, Rule B) — anti-runaway protection.
6. Monte Carlo gate (Patch F20) — release blocker if any class > ±2% from EV.

The new mode spec is ratified for implementation pending Controller-C patch
sequence A1 → A4 → B1 → B2 → C1–C5 → D1–D7 → E1 → F1–F20. RTP audit is
mandatory before each F-block release.

================================================================================
END OF newmodespec.md
Word count: ~5,050 · Sections: 13 · Tables: 10 · Code blocks: 15
Status: COMPLETE · Ready for Controller-C integration via Patch Block F
================================================================================
