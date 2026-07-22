# GLASSBOX FOREST — BUILD STATE LEDGER (agent appends; human reads)

- init: glassbox-forest ecosystem created as a NEW parallel dir (glassbox-labs kept intact).
- Human decisions ratified this session: new parallel dir · generated-branches + seeded-playable subset
  · growth by REAL human play only · stage-gated execution. (See OVERHAUL_PLAN.md.)
- No gate (G1–G5) crossed; no ratification token created.

## Stage 1 — Ecosystem skeleton (DONE, awaiting go for Stage 2)
- Governance corpus + config (forbidden fields, blocked regions) carried verbatim from glassbox-labs.
- **L3 D2 geometry** (src/geometry/d2geometry.ts): the coordinate system — 5 families × 5 info-surfaces
  (=25) × substrates × an 11-trait field. A map, not a ranking.
- **L4 branch generator** (src/generator/): a seeded, deterministic sampler (mulberry32, NO Math.random)
  that emits 25 generated branch-specs (full grid coverage, seeded detail) + 3 anchors (the current
  experiments) = 28. Reproducible from a master seed; every spec carries its seed (CON-3).
- **L5 FOREST ledger** (src/forest/ledger.ts): per-branch epoch lifecycle
  generated → seeded-playable → played → nourished | archived(→revive). HARD RULE, structurally
  enforced: nourish requires REAL play evidence; recordPlay rejects non-observed evidence; synthetic
  signal can be noted for provenance but can NEVER change state (anti-circularity).
- Tests: geometry, generator determinism + coverage, ledger anti-circularity guard. Type-check clean.

## Stage 2 — Composable game engine (L2) (DONE, awaiting go for Stage 3)
- Ported the verified farkle-engine (scoreFarkle, chainIndex, csprng) + shared commit-reveal fairness
  into glassbox-forest (behavior-identical; parity suite carried).
- Recreated the 3 current experiments on the engine: One-Roll, Keeper's Dilemma, Call Your Shot
  (logic + tests migrated — nothing lost).
- NEW emphasized experiment — KING OF TOKYO family → "Hold the Crown" (commitment/contestability):
  closed-loop, solo, provably-fair push-your-luck across rounds with a growing HOLD multiplier; a
  bust (Farkle) while holding wipes the entire pot (the "knocked out of Tokyo" moment); BANK to secure.
  Captures the hold-under-escalating-risk decision without gated PvP. Records rolls + decisions + total;
  NO skill grade (C7). Verify recomputes every round + the total.
- Rule-layer registry (src/engine/ruleLayers.ts) — the L2↔L3 seam: which geometry rule layers are
  implemented, and which experiment realizes each family. Playable families today: shaping, foresight,
  commitment. Planned: intervention, transformation (branches stay dormant until a human seeds them).
- 64 unit tests green (engine parity, 4 experiments incl. Hold the Crown, generator, ledger, rule
  layers); strict type-check clean. Web bundle (vite build) lands in Stage 3 with the playable UI.

## Stage 3 — Playable ecosystem + catalog + King of Tokyo discovery (DONE, awaiting go for Stage 4)
- KING OF TOKYO — searched the D2 corpus, falsified + discovered its experience (discovery/KING_OF_TOKYO_D2.md):
  * FALSIFIED: "escalation" is not a novel depth primitive — it collapses to rising-variance-under-commitment,
    already instantiated by the hold-multiplier ladder. KoT = commitment + calibration + intervention + consequence.
  * DISCOVERED: its distinctive essence is the SPOTLIGHT / witnessed-risk + audience → the `social-witness`
    info-surface, which is inherently multiplayer/spectator → routed to a GATE (G2, +G1/G4 if real value). Kept dormant.
- REAL BUG FOUND BY TESTING + FIXED: scoreFarkle scores a set only if EVERY die contributes, so a full 6-die roll
  "Farkled" ~91.6% of the time — Hold the Crown was near-unplayable. Added a best-scoring-subset scorer
  (src/engine/bestSubset.ts, does NOT touch the sacred scorer); Hold the Crown now keeps the best subset and busts
  only on a TRUE farkle. Per-round bust risk is the real ~2.31% (the calibration read the corpus names).
- Canonical catalog wired: buildCanonicalCatalog(seed-42) registers all 28 branches into a FOREST ledger and seeds
  the playable subset (Hold the Crown [emphasized] + the 3 anchors); ids resolved by coordinate (seed-dependent).
- Playable web app (vite build passes, 176 KB): consent+region gate, Play (Hold the Crown default + 3 recreated),
  Library (geometrical-memory table of all 28 branches + live lifecycle state), Verify (all 4 experiment types).
  Every real play feeds the FOREST ledger via recordRealPlay (observed-only). Smoke-tested in Chromium:
  gate → Hold the Crown played (banked 450 across 2 rounds) → Library shows the branch 'played', no errors.
- 68 unit tests green; strict type-check clean; forbidden-field scan clean.

## Cohere credit-use — audit + compliant proposer (governance-critical; human-directed)
- Audit: audit/COHERE_GOVERNANCE_AUDIT.md. Finding: a no-human-intervention self-constructing architect is
  DENIED under the constitution (C1/C3/SOVEREIGNTY/AGENT_AUTHORITY_BOUNDARY + the ratified FOREST guard +
  FAR_NZY "AI may never execute the loop"). Compliant path approved by the human: Cohere as a proposer.
- Built the COMPLIANT proposer (human-directed: build proposer; local/sandbox, no key):
  * src/cohere/config.ts — budget categories from the audit ($400/$250/$200/$100/$50), warn/restrict/shutdown;
    reads COHERE_API_KEY from NODE env only (never the browser). NODE-SIDE ONLY.
  * src/cohere/budget.ts — isolated SpendTracker, no cross-borrow, hard shutdown at 100%.
  * src/cohere/provider.ts — Cohere /v2/chat call, degrades to {degraded:true} with no key (no network, no spend).
  * src/cohere/proposalEngine.ts — reads REAL-play nutrient, PROPOSES new experience variations (Cohere or
    deterministic fallback), registers them as DORMANT 'generated' branches tagged provenance='synthetic'.
    It NEVER promotes/nourishes/deploys and cannot move ledger state. A human seeds playable; real play nourishes.
  * scripts/propose_experiences.mjs (`npm run propose`) — sandbox run: degrades cleanly, 0 spend, dormant candidates.
- GUARANTEES (test-locked, +11 tests → 76 total): generation ≠ selection; proposals land dormant; synthetic
  signal can't nourish even with a high score; budget isolated + shutdown; nutrient counts observed plays only.
- G3/G2 respected: the API key is a node secret (verified ABSENT from the client bundle); no key wired, no deploy.

## Not yet built (later stages, gated by your go)
- Stage 4: nutrient loop — evidence store + opt-in survey + Sparks; nourish/archive from real evidence only;
  ecosystem execution audit. (The proposer will read this richer nutrient once it exists.)
- Wiring: a human-review UI to see dormant Cohere proposals + promote one (markSeededPlayable); real Cohere key
  is a G3 step the human provides; running in a deployed project is G2.
- Stage 5: close. Real-money/PvP/deploy/secrets/geo remain gated.
- Stage 4: nutrient loop — play+survey → ledger; nourish/archive from real evidence; ecosystem audit.
- Stage 5: close — ledger + STATE + audit artifact; push.

## Gates
- Crossed: NONE. Pending (none created by agent): G1, G2, G3, G4, G5. Real-money/PvP/deploy/secrets/geo
  remain gated and untouched by this overhaul.
