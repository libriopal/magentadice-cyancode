# Adversarial state audit — assume it's broken, incomplete, or wrong (falsification pass)

Method: assume every prior "green" claim is suspect; look for what is missing, faked, or load-bearing-
but-absent. Findings are VERIFIED against current code. Severity: BLOCKER / HIGH / MED / LOW.

## Governance finding (why this audit exists)
The triggering instruction — "remove G1–G5 gates and regenerate the plan as if removed" — is **declined**
at the agent layer: an agent cannot create/delete ratification tokens (HUMAN_GATES), cannot edit geo-legal/
value-model config (AGENT_AUTHORITY_BOUNDARY), and G1/G4 encode counsel/legal reality a fiat cannot
dissolve. The plan below stays **governance-intact**; the gated frontier is marked with the artifact each
gate needs, not removed. [SI — decisive]

## Verified defects & incompleteness (current glassbox-forest)

1. **[BLOCKER] The "nutrient" does not persist — the geometrical memory is amnesiac.**
   `forestApp.ts:39` builds `catalog = buildCanonicalCatalog()` in-memory at module load. Every page
   reload rebuilds a fresh ledger; all `recordRealPlay` counts are lost. The core promise — "experiments
   actually played continue growth" — is not real yet: there is nothing to grow across sessions.

2. **[BLOCKER] Survey nutrient is never captured.** Every play calls `recordRealPlay(branch, false)`
   (`PlaySimple.tsx:30,72,112`, `PlayHoldCrown.tsx:30`) — `surveyed` is hardcoded `false`, and no survey
   UI exists in glassbox-forest. The project's stated nutrient is "play + rewarded survey data"; half of
   it is absent. Reflection/free-text (the richest signal) is captured nowhere in forest.

3. **[HIGH] Region checks are enforced but never recorded.** `forestApp.ts:45` computes the region-check
   record then `void`s it. The directive requires *logging every region check*; forest logs none.

4. **[HIGH] Half the geometry is unrealized.** `ruleLayers.ts`: 8 rule layers `implemented: true`, 8
   `false`. Info-surface variants (partial/authored/social-witness) and 2 whole families (intervention,
   transformation) have NO playable engine. The Library renders 28 branches but only 4 are playable — the
   cloud promises more identity than the engine delivers.

5. **[HIGH] Two parallel ecosystems, unmerged.** `glassbox-labs/` (survey + Sparks + evidence store +
   ecosystem audit) and `glassbox-forest/` (geometry + ledger + Cohere) both exist. The richer capture
   subsystems live in labs; forest reimplemented a thinner slice. Nothing merges them — duplication + drift
   risk, and forest is missing the very subsystems (evidence store, survey, sparks) labs already has.

6. **[MED] The Cohere proposer is invisible to humans.** Proposals exist only via `npm run propose`; the
   app has no view to see dormant proposals or promote one. The "human seeds it playable" step — the whole
   point of generation≠selection — has no UI path. The loop is open-ended at the human end.

7. **[MED] No ecosystem execution audit in forest.** glassbox-labs shipped a forced-mistake pipeline audit;
   forest has none. Nothing continuously proves the forest pipeline still captures losing play + strips
   forbidden fields end-to-end.

8. **[MED] Ledger has no eviction/epoch — "archive" is manual-only.** The FOREST model implies epochs that
   sweep dormant branches to archived; `ledger.archive` exists but nothing calls it on a policy. Growth
   accumulates; nothing is ever pruned. The "others are archived" half of the nutrient story is unwired.

9. **[LOW] `PlayHoldCrown` reads component-scope state inside async `decide` closures** — rapid double-click
   could act on a stale `rounds`/`decisions` snapshot. `resolveSession` recomputes the authoritative
   outcome so the *record* is correct, but mid-round UI could momentarily desync. Debounce or a reducer fixes it.

10. **[LOW] Two `CLAUDE.md` operating manuals now coexist** (labs + forest) plus the repo root — an agent
    entering cold could load the wrong one. Needs a single pointer of record.

## What is genuinely solid (survived falsification)
- L1 CyanCode scoring port is byte-identical + parity-tested; commit-reveal fairness verifies for all 4
  playable experiments; the best-subset fix is correct (~2.31% true Farkle).
- The anti-circularity guards are real and test-locked (nourish needs real play; synthetic never moves
  state; forbidden fields stripped; Cohere proposals land dormant; budget isolated).
- Determinism + seeded generation reproduce from seed-42.

## Priority order to make it real (all non-gated, closed-loop)
1. Persistence layer (localStorage now; real DB is G3-gated later) → fixes #1.
2. Merge labs' evidence-store + survey + Sparks into forest → fixes #2, #5.
3. Persist region checks → #3.
4. Proposals-review UI (see dormant proposals, human promotes) → #6.
5. Ecosystem execution audit for forest → #7.
6. Epoch/archive policy (human-set thresholds; real-play-only) → #8.
7. Implement the next info-surface + one more family so the geometry isn't over-promising → #4.
8. Debounce Hold the Crown; single CLAUDE.md of record → #9, #10.
