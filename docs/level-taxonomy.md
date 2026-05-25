<!--
AUDIT::PATHWAY_DEPS: core/packages/game-core/src/level/LevelDef.schema.json,
  core/packages/game-core/src/level/types.ts
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: documentation only; no code changes
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# FAR_NZY Level Taxonomy — 50-Stage Sequence
## Session: tier/T6-content-pipeline-20260525
## Authority: LevelDef.schema.json v1.0.0

All `win_score` values are Q×1000 fixed-point integers.
Grid sizes: 7 (solo intro) → 10 (expert multiplayer).
Blocker density: LOW (1–10), MEDIUM (11–30), HIGH (31–50).

---

## Stages 1–10: Introductory (LOW density, grid 7)

| # | id | name | lattice_module | win_score | time_limit_sec | archetype_bias |
|---|---|---|---|---|---|---|
| 1 | L01-neural-foyer | Neural Foyer | SOLO | 3000 | 180 | null |
| 2 | L02-ember-drift | Ember Drift | PRIME | 3500 | 180 | null |
| 3 | L03-cascade-seed | Cascade Seed | CASCADE | 4000 | 170 | null |
| 4 | L04-pulse-wake | Pulse Wake | PULSE | 4000 | 170 | Bard |
| 5 | L05-echo-chamber | Echo Chamber | ECHO | 4500 | 160 | null |
| 6 | L06-horizon-gate | Horizon Gate | HORIZON | 4500 | 160 | null |
| 7 | L07-shard-atrium | Shard Atrium | SHARD | 5000 | 150 | Rogue |
| 8 | L08-facet-hall | Facet Hall | FACET | 5000 | 150 | null |
| 9 | L09-rhythm-court | Rhythm Court | RHYTHM | 5500 | 150 | Bard |
| 10 | L10-token-vault | Token Vault | TOKEN | 5500 | 150 | null |

---

## Stages 11–30: Mid-Game (MEDIUM density, grid 8)

| # | id | name | lattice_module | win_score | time_limit_sec | archetype_bias |
|---|---|---|---|---|---|---|
| 11 | L11-gravity-well | Gravity Well | GRAVITY | 6000 | 150 | null |
| 12 | L12-combo-arch | Combo Arch | COMBO | 6000 | 145 | Rogue |
| 13 | L13-slipstream-bay | Slipstream Bay | SLIPSTREAM | 6500 | 145 | null |
| 14 | L14-surge-prism | Surge Prism | SURGE | 6500 | 140 | Paladin |
| 15 | L15-vault-deep | Vault Deep | VAULT | 7000 | 140 | null |
| 16 | L16-drift-corridor | Drift Corridor | DRIFT | 7000 | 140 | null |
| 17 | L17-frenzy-gate | Frenzy Gate | FRENZY | 7500 | 135 | null |
| 18 | L18-vs-arena | VS Arena | VS | 7500 | 135 | null |
| 19 | L19-rally-cross | Rally Cross | RALLY | 8000 | 130 | Bard |
| 20 | L20-heist-lobby | Heist Lobby | HEIST | 8000 | 130 | Rogue |
| 21 | L21-crystalline-nexus | Crystalline Nexus | CASCADE | 8000 | 150 | Rogue |
| 22 | L22-echo-recursion | Echo Recursion | ECHO | 8500 | 145 | null |
| 23 | L23-horizon-breach | Horizon Breach | HORIZON | 8500 | 140 | null |
| 24 | L24-shard-matrix | Shard Matrix | SHARD | 9000 | 140 | Paladin |
| 25 | L25-facet-apex | Facet Apex | FACET | 9000 | 135 | Rogue |
| 26 | L26-pulse-storm | Pulse Storm | PULSE | 9500 | 135 | Bard |
| 27 | L27-rhythm-collapse | Rhythm Collapse | RHYTHM | 9500 | 130 | null |
| 28 | L28-surge-depths | Surge Depths | SURGE | 10000 | 130 | null |
| 29 | L29-token-breach | Token Breach | TOKEN | 10000 | 130 | Rogue |
| 30 | L30-gravity-inversion | Gravity Inversion | GRAVITY | 10500 | 125 | null |

---

## Stages 31–50: Expert (HIGH density, grid 9–10)

| # | id | name | lattice_module | grid_size | win_score | time_limit_sec | archetype_bias |
|---|---|---|---|---|---|---|---|
| 31 | L31-combo-storm | Combo Storm | COMBO | 9 | 11000 | 125 | Rogue |
| 32 | L32-slipstream-collapse | Slipstream Collapse | SLIPSTREAM | 9 | 11000 | 120 | null |
| 33 | L33-vault-siege | Vault Siege | VAULT | 9 | 11500 | 120 | Paladin |
| 34 | L34-drift-apex | Drift Apex | DRIFT | 9 | 12000 | 120 | null |
| 35 | L35-frenzy-crucible | Frenzy Crucible | FRENZY | 9 | 12000 | 115 | null |
| 36 | L36-vs-coliseum | VS Coliseum | VS | 9 | 12500 | 115 | null |
| 37 | L37-rally-summit | Rally Summit | RALLY | 9 | 13000 | 115 | Bard |
| 38 | L38-heist-endgame | Heist Endgame | HEIST | 9 | 13000 | 110 | Rogue |
| 39 | L39-prime-core | Prime Core | PRIME | 9 | 13500 | 110 | null |
| 40 | L40-solo-gauntlet | Solo Gauntlet | SOLO | 10 | 14000 | 110 | null |
| 41 | L41-cascade-abyss | Cascade Abyss | CASCADE | 10 | 14500 | 110 | null |
| 42 | L42-echo-void | Echo Void | ECHO | 10 | 15000 | 105 | null |
| 43 | L43-horizon-end | Horizon End | HORIZON | 10 | 15000 | 105 | Paladin |
| 44 | L44-shard-throne | Shard Throne | SHARD | 10 | 15500 | 105 | Rogue |
| 45 | L45-facet-crown | Facet Crown | FACET | 10 | 16000 | 100 | Paladin |
| 46 | L46-pulse-omega | Pulse Omega | PULSE | 10 | 16500 | 100 | Bard |
| 47 | L47-rhythm-final | Rhythm Final | RHYTHM | 10 | 17000 | 100 | Bard |
| 48 | L48-token-sovereign | Token Sovereign | TOKEN | 10 | 18000 | 95 | null |
| 49 | L49-surge-throne | Surge Throne | SURGE | 10 | 19000 | 90 | Paladin |
| 50 | L50-void-apex | Void Apex | COMBO | 10 | 20000 | 120 | Paladin |

---

## Coverage Verification

| Lattice Module | Stages | Count |
|---|---|---|
| SOLO | 1, 40 | 2 |
| VS | 18, 36 | 2 |
| RALLY | 19, 37 | 2 |
| HEIST | 20, 38 | 2 |
| PRIME | 2, 39 | 2 |
| FRENZY | 17, 35 | 2 |
| CASCADE | 3, 21, 41 | 3 |
| DRIFT | 16, 34 | 2 |
| VAULT | 15, 33 | 2 |
| PULSE | 4, 26, 46 | 3 |
| ECHO | 5, 22, 42 | 3 |
| SURGE | 14, 28, 49 | 3 |
| SHARD | 7, 24, 44 | 3 |
| FACET | 8, 25, 45 | 3 |
| RHYTHM | 9, 27, 47 | 3 |
| SLIPSTREAM | 13, 32 | 2 |
| TOKEN | 10, 29, 48 | 3 |
| GRAVITY | 11, 30 | 2 |
| HORIZON | 6, 23, 43 | 3 |
| COMBO | 12, 31, 50 | 3 |

**All 20 lattice modules covered. Total stages: 50.**

---

## T6 Pass Gate

- Schema validates: L01, L25, L50 — PASS (levelSchema.test.ts 6/6)
- Taxonomy covers: all 20 lattice modules — PASS
- win_score Q×1000: all values are integers ≥ 1000 — PASS
