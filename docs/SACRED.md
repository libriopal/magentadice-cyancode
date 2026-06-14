# Sacred Systems Registry — FAR_NZY
## Authority: Constitutional (mesh/sacred-core-spec.md)
## Status: Informational — derived from sacred-core-spec.md v1.0.0
## Changes to this document require: Human approval (Elevated tier — no ADR required)

---

## What "Sacred" Means

A sacred file contains logic that directly governs:
- Scoring outcomes (money-equivalent)
- RNG lineage (fairness and replay integrity)
- Ledger state (financial record)
- Replay hash chain (audit trail integrity)
- Event signatures (tamper evidence)
- Game state authority (authoritative game truth)

Modifying a sacred file without the authorization chain below is a legal violation,
not a development shortcut.

Do not treat the sacred designation as bureaucratic friction.
Every engineering decision in a sacred file is a legal decision.

---

## Sacred Systems

### payout_math — Scoring and RTP

| File | Protected Elements |
|------|--------------------|
| `core/packages/farkle-engine/src/farkleScorer.ts` | All scoring functions, Q32.32 implementations, cascade depth calculations, class archetype multipliers (Paladin 1.15×, Rogue 2.5×, Bard 1.85×) |
| `core/packages/farkle-engine/src/rtpConfig.ts` | RTP target values, variance bounds, platform fees, bonus spawn rates, milestone configs |
| `core/packages/farkle-engine/src/monteCarlo.ts` | Simulation engine, player decision models, per-turn OWC integration, RTP attribution, `runMonteCarloV2` |

**Change authority:** Human only
**Change process:**
1. Execution Runtime drafts proposal — no implementation
2. Human reviews and gives written approval
3. ADR written and committed
4. Change implemented
5. Monte Carlo 10,000-generation pass run
6. RTP within ±0.005 of target verified
7. Human signs off on test results

---

### rng — Random Number Generation

| File | Protected Elements |
|------|--------------------|
| `core/packages/farkle-engine/src/csprng.ts` | HMAC-SHA256 seed generation algorithm, seed derivation chain (genesis → session → game → event), entropy source selection, RNG output format |

**Change authority:** Human only
**Change process:** ADR required → full RNG lineage re-verification → Monte Carlo pass → Human sign-off

---

### game_state_authority — Authoritative Game State

| File | Protected Elements |
|------|--------------------|
| `core/packages/farkle-engine/src/farkleStore.ts` | Authoritative game state shape, state transition logic, any field driving scoring or payout |
| `core/packages/farkle-engine/src/gameStore.ts` | Authoritative game state shape, state transition logic |

**Change authority:** Human only (state shape changes)
**Change process:** ADR required if state shape changes → downstream audit required → Human sign-off

---

### ledger_state, replay_hash_chain, event_signatures

Defined in `mesh/sacred-core-spec.md`. Not yet active in deployed code paths.
**Change authority:** Human only.
**Change process:** ADR required for any implementation or modification.

---

## Authorization Chain Summary

```
1. Propose     — Execution Runtime drafts, no code written
2. Approve     — Human gives explicit written approval
3. ADR         — Write and commit ADR before implementation begins
4. Implement   — Change made in code
5. Verify      — Monte Carlo pass (payout_math) / RNG lineage (rng)
6. Sign off    — Human reviews test results and confirms
7. Commit      — With ADR reference in commit message
```

---

## Current Open Sacred Findings

| Finding | File | Line | Status | ADR Required |
|---------|------|------|--------|--------------|
| Finding A — playerContinue OPTIMAL inversion | `monteCarlo.ts` | 126 | Deferred to P6; awaiting ADR-022 | Yes |
| DEBT-01 — MULTIPLIER_LADDER float representation | `farkleStore.ts` | 28 | Deferred; awaiting authorization | Yes |
| DEBT-02 — Orb float intermediate | `useFarkleGame.ts` | 305 | Deferred; `Math.round()` confirmed safe | Yes |

---

## What Is NOT Sacred

The following are explicitly excluded per `mesh/sacred-core-spec.md`:
- Three.js materials, shaders, particle systems, post-processing
- Web Audio routing, sound assets, music tracks
- Level/content definitions, quest text, UI copy
- Leaderboard display, avatar cosmetics, NFT visual presentation
- Build config, dev tooling, CI/CD scripts, documentation
- Test utilities (non-RTP), profiling artifacts
- Sandbox UI, sandbox server (`sandbox.ts`, `sessionStore.ts`)
- Meshy AI pipeline, manifest pipeline, CLI scripts
- OWC package (`packages/owc/`) — surface layer, not sacred

---

## Version

docs/SACRED.md v1.0.0 — created 2026-06-14 (P5-GOVERNANCE sprint)
Derived from: `mesh/sacred-core-spec.md` v1.0.0
Next review: at any sacred system change or constitutional amendment
