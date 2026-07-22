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

## Not yet built (later stages, gated by your go)
- Stage 3: generate the 28-branch catalog from seed-42; seed the playable subset (emphasis: the King
  of Tokyo family / Hold the Crown); build the playable UI + web bundle.
- Stage 4: nutrient loop — play+survey → ledger; nourish/archive from real evidence; ecosystem audit.
- Stage 5: close — ledger + STATE + audit artifact; push.

## Gates
- Crossed: NONE. Pending (none created by agent): G1, G2, G3, G4, G5. Real-money/PvP/deploy/secrets/geo
  remain gated and untouched by this overhaul.
