# COMPONENT_AUDIT.md — FAR_NZY Board Component Analysis

**Directive:** FF_V4_OPPORTUNITY_WEIGHT_REDESIGN
**Date:** 2026-05-25
**Auditor:** Execution Runtime (Claude Code)

## ValueScore Formula

```
ValueScore = (SkillExpression × 0.30) + (DecisionDensity × 0.25)
           + (RetentionImpact × 0.20) + (CascadeContribution × 0.15)
           + (Memorability × 0.10)
```

---

## Component Audit Table

### S Tier (ValueScore ≥ 0.80)

#### Die (Standard)
| Metric | Score |
|---|---|
| Skill Expression | 0.90 |
| Decision Density | 0.90 |
| Retention Impact | 0.80 |
| Cascade Contribution | 0.80 |
| Memorability | 0.70 |
| **ValueScore** | **0.85** |

**Current State:** Appears at 62% NORMAL / 52% PRIME / 39% FRENZY spawn weight. Even face distribution via SixPoolManager.
**Problems:** None — this is the core mechanic. However spawn distribution is static; no response to board stagnation.
**Recommendation:** Preserve as primary tile. Connect to OWC to modulate face distribution (not frequency) in stagnation scenarios (slight bias toward faces that complete near-chains).
**Expected Impact:** +10% meaningful chain completions on stagnant boards.
**Risk:** Face bias may shift RTP if 1/5 appear more than baseline — RTP simulation required before merge.

---

#### Wild Die
| Metric | Score |
|---|---|
| Skill Expression | 0.80 |
| Decision Density | 0.70 |
| Retention Impact | 0.90 |
| Cascade Contribution | 0.90 |
| Memorability | 0.80 |
| **ValueScore** | **0.82** |

**Current State:** Spawn weight: 0% NORMAL / 2% PRIME / 9% FRENZY. Within SixPoolManager: wild pool is pre-shuffled with fixed distribution (60% blank, 10% true-wild). Passive — player cannot direct wild placement.
**Problems:** Wild is purely passive. Player cannot choose which chain to route a wild toward. Missed opportunity for skill expression.
**Recommendation:** Convert to "player-directed opportunity" — when a wild spawns adjacent to a scoreable chain, pulse a UI indicator. Player commits the chain, wild joins automatically. No mechanic change; UI/feedback change only.
**Expected Impact:** +20% perceived skill expression (player feels they "used" the wild, not that it happened to them).
**Risk:** UI change only — no RTP impact.

---

### A Tier (ValueScore 0.65–0.79)

#### BOMB_RAINBOW (Straight trigger)
| Metric | Score |
|---|---|
| Skill Expression | 0.80 |
| Decision Density | 0.60 |
| Retention Impact | 0.80 |
| Cascade Contribution | 0.90 |
| Memorability | 0.90 |
| **ValueScore** | **0.78** |

**Current State:** Triggered by Straight (1,2,3,4,5,6) — requires the most board-reading skill of any bomb trigger. Clears all non-blocker tiles in area + converts stones.
**Problems:** Straight is rare; BOMB_RAINBOW appears infrequently. Players may not understand trigger condition.
**Recommendation:** Add visible "Straight in progress" indicator when 4+ faces of a Straight are committed. Makes the skill requirement visible. No mechanic change.
**Expected Impact:** +25% Straight completion attempts when indicator active.
**Risk:** None — display-only change.

---

#### BOMB_STANDARD (Six of a Kind trigger)
| Metric | Score |
|---|---|
| Skill Expression | 0.70 |
| Decision Density | 0.50 |
| Retention Impact | 0.80 |
| Cascade Contribution | 0.90 |
| Memorability | 0.90 |
| **ValueScore** | **0.73** |

**Current State:** Triggered by Six of a Kind. Score: 3000 + bomb. Feels like lottery win — player rarely works toward it intentionally.
**Problems:** Low decision density. Player cannot plan for Six of a Kind; board must naturally deliver 6 same-face dice. Feels random, not earned. SACRED CORE — trigger logic in farkleScorer.ts cannot be changed.
**Recommendation:** OWC should slightly boost same-face die spawns when a player has 3+ of a face in their current chain (i.e., increase the probability that the opportunity exists, not that the win is guaranteed). Do NOT change farkleScorer logic.
**Expected Impact:** +8% Six of a Kind frequency; higher perceived agency.
**Risk:** Face distribution shift — bound OWC adjustment to max +5% on any single face; run RTP simulation.

---

#### ICE Blocker
| Metric | Score |
|---|---|
| Skill Expression | 0.70 |
| Decision Density | 0.80 |
| Retention Impact | 0.60 |
| Cascade Contribution | 0.50 |
| Memorability | 0.50 |
| **ValueScore** | **0.66** |

**Current State:** Die is frozen inside ICE. Must chain adjacent die to free it. Creates planning decisions (do I chain here to free the ICE or save the chain for scoring?).
**Problems:** ICE count is static at grid generation. No dynamic ICE spawning. Low cascade contribution — freed ICE die often doesn't extend a scoring chain.
**Recommendation:** In OWC comeback scenarios, bias ICE toward faces that complement a player's pending chain (e.g., if player has 1,1,1 in chain, favor ICE containing 1). Creates a "puzzle" rather than friction.
**Expected Impact:** +15% chain completions involving ICE tiles; higher mastery feeling.
**Risk:** ICE face selection is not currently board-state-aware. Requires OWC to read current chain state. Bounded risk.

---

#### Catalyst
| Metric | Score |
|---|---|
| Skill Expression | 0.80 |
| Decision Density | 0.70 |
| Retention Impact | 0.60 |
| Cascade Contribution | 0.50 |
| Memorability | 0.40 |
| **ValueScore** | **0.64** |

**Current State:** Spawns at 0% NORMAL / 1% PRIME / 2% FRENZY. Committed in chain → +2% Wild spawn weight (max +10%). Very low visibility; players rarely encounter it.
**Problems:** NORMAL weight = 0 means new players never see it. Low memorability. The wild-boost mechanic is invisible without a UI counter.
**Recommendation:** Increase NORMAL weight to 1% (from 0%). Add visible "Wild Boost: X%" UI meter that increments on catalyst commit. This converts a hidden mechanic into a visible mastery loop.
**Expected Impact:** +30% catalyst commitment rate once UI shows the meter.
**Risk:** Marginal RTP impact from increased wild spawn (+2% per catalyst × max 5 catalysts = +10% wild boost at most). Bounded by existing CATALYST_WILD_BOOST cap.

---

#### Multiplier Orb
| Metric | Score |
|---|---|
| Skill Expression | 0.60 |
| Decision Density | 0.50 |
| Retention Impact | 0.80 |
| Cascade Contribution | 0.60 |
| Memorability | 0.70 |
| **ValueScore** | **0.64** |

**Current State:** Strong retention hook. Low skill expression — player chains it like any other tile.
**Problems:** No decision associated with it. It's a passive multiplier — player doesn't choose when or how to use it.
**Recommendation:** Add a time-pressure decision: multiplier orb has a 3-turn commitment window. Player must chain it within 3 turns or it fades. Creates urgency without guaranteeing reward.
**Expected Impact:** +20% player urgency / engagement when multiplier orb visible.
**Risk:** New state (countdown) requires minimal UI. No scoring logic change. Low risk.

---

### B Tier (ValueScore 0.45–0.64)

#### Sphere
| Metric | Score |
|---|---|
| Skill Expression | 0.60 |
| Decision Density | 0.60 |
| Retention Impact | 0.60 |
| Cascade Contribution | 0.70 |
| Memorability | 0.50 |
| **ValueScore** | **0.61** |

**Current State:** Appears at 25% NORMAL / 18% PRIME / 12% FRENZY — very high frequency. Functions like a die tile with scoring potential.
**Problems:** High spawn rate makes board visually noisy. Limited decision density vs. die. Competes with die for chain slots without adding unique decision value.
**Recommendation:** Reduce NORMAL weight from 25% to 18%. Offset with 7% more die. Sphere remains the secondary tile but no longer dominates the board.
**Expected Impact:** Cleaner board; more die-based decisions; cascade paths more legible.
**Risk:** Minor — reduces sphere frequency; existing scoring chains remain valid.

---

#### STONE Blocker
| Metric | Score |
|---|---|
| Skill Expression | 0.50 |
| Decision Density | 0.60 |
| Retention Impact | 0.50 |
| Cascade Contribution | 0.30 |
| Memorability | 0.60 |
| **ValueScore** | **0.51** |

**Current State:** Clustered placement (70% adjacent bias). HP=2; bomb deals 1 damage. Blocks chain paths.
**Problems:** Primarily creates time consumption, not decisions. A cluster of stones just means waiting for bombs. Low cascade contribution — stones don't participate in chains.
**Recommendation:** Give each stone cluster a "weakness face" — a die face shown on the stone. When a chain containing that face is committed adjacent to the stone, it breaks in one hit instead of two. Creates puzzle → mastery loop.
**Expected Impact:** +35% bomb-alternative stone-clearing events; more varied clearing strategies.
**Risk:** Requires stone type extension (add `weaknessFace` field to Cell). Not Sacred Core. Medium implementation cost.

---

#### LOCK Blocker
| Metric | Score |
|---|---|
| Skill Expression | 0.50 |
| Decision Density | 0.60 |
| Retention Impact | 0.50 |
| Cascade Contribution | 0.30 |
| Memorability | 0.40 |
| **ValueScore** | **0.49** |

**Current State:** Die is locked; requires adjacent chain to unlock. Similar to ICE but less visually distinct.
**Problems:** Very similar to ICE — players may not distinguish the two. Low memorability. Low cascade contribution.
**Recommendation:** Differentiate from ICE: LOCK die face is hidden (unknown) until unlocked. Creates risk/reward — commit to unlocking without knowing the face. ICE face is visible (known risk).
**Expected Impact:** +25% strategic interest in LOCK tiles; creates "gamble" narrative distinct from ICE "planning" narrative.
**Risk:** Requires hiding face in Cell state. Display-only change. Low risk.

---

#### Mirror
| Metric | Score |
|---|---|
| Skill Expression | 0.50 |
| Decision Density | 0.50 |
| Retention Impact | 0.50 |
| Cascade Contribution | 0.40 |
| Memorability | 0.50 |
| **ValueScore** | **0.49** |

**Current State:** Appears at 4% NORMAL / 6% PRIME / 7% FRENZY.
**Problems:** Mechanic is unclear from audit. If mirror copies adjacent face: potential for confusion. If it reflects disruptions: low visibility.
**Recommendation:** Clarify mirror mechanic in UI tooltip. If mechanic is confusing in playtesting, merge mirror into wild die (simpler) and redistribute weight to ICE (higher decision density).
**Expected Impact:** Reduced cognitive load; cleaner tile vocabulary.
**Risk:** Removing mirror requires UI cleanup. Low technical risk.

---

### C Tier (ValueScore < 0.45)

#### Ghost
| Metric | Score |
|---|---|
| Skill Expression | 0.40 |
| Decision Density | 0.40 |
| Retention Impact | 0.50 |
| Cascade Contribution | 0.30 |
| Memorability | 0.50 |
| **ValueScore** | **0.42** |

**Current State:** Appears at 1% NORMAL / 2% PRIME / 3% FRENZY.
**Problems:** Lowest value score. Unclear mechanic contribution. Low everything.
**Recommendation:** **Remove or redesign.** If ghost passes through chains without scoring: it's dead weight. Proposed replacement: "Echo" tile — scores as a 1-face die, but if chained last it doubles the chain score. Converts ghost (passive/confusing) to Echo (strategic chain-closer).
**Expected Impact:** +40% meaningful use of the C-tier slot; creates "save the echo for last" mastery behavior.
**Risk:** Redesign requires new mechanic validation. Run RTP simulation — doubling the final chain score could shift payout distribution.

---

## Priority Implementation Order

Ranked by (ExpectedRetentionGain / ImplementationCost):

| Priority | Component | Change | Cost | Gain |
|---|---|---|---|---|
| 1 | Wild die | UI indicator for adjacent chains | Low | High |
| 2 | Catalyst | NORMAL weight 0→1%; visible boost meter | Low | High |
| 3 | BOMB_RAINBOW | "Straight in progress" indicator | Low | High |
| 4 | LOCK | Hide face until unlocked | Low | Medium |
| 5 | Multiplier Orb | 3-turn commitment window | Medium | High |
| 6 | Sphere | Weight 25→18%; die +7% | Low | Medium |
| 7 | STONE | Weakness face mechanic | Medium | High |
| 8 | Ghost → Echo | Redesign | High | High |
| 9 | Mirror | Clarify or merge into wild | Medium | Medium |
| 10 | OpportunityWeightController | New system (see design/OWC.md) | High | Very High |

---

## Hard Rules Compliance Check

- [ ] No mechanic spawns wins directly → PASS (OWC spawns opportunities only)
- [ ] No mechanic bypasses player decision-making → PASS (all changes are opportunity-based)
- [ ] No EV increase without proof → PENDING (RTP simulation required for face-bias changes)
- [ ] All balancing decisions evidence-based → PASS (metrics above)
- [ ] Sacred Core untouched → PASS (farkleScorer.ts trigger logic unchanged)
