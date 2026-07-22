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

## Not yet built (later stages, gated by your go)
- Stage 2: composable game engine (L2) — port farkle-engine + rule layers; recreate the 3 experiments.
- Stage 3: generate the 28-branch catalog from your chosen seed; seed the playable subset.
- Stage 4: nutrient loop — play+survey → ledger; nourish/archive from real evidence; ecosystem audit.
- Stage 5: close — ledger + STATE + audit artifact; push.

## Gates
- Crossed: NONE. Pending (none created by agent): G1, G2, G3, G4, G5. Real-money/PvP/deploy/secrets/geo
  remain gated and untouched by this overhaul.
