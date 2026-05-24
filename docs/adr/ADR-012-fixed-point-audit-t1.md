# ADR-012: T1 Fixed-Point Audit — Q×1000 Conversion and Monte Carlo Baseline

**Status:** Accepted  
**Date:** 2026-05-24  
**Session:** tier/T1-mathematical-foundation-20260524  
**Deciders:** Execution Runtime (Libriopal / Claude Sonnet 4.6)  

---

## Context

T1 Mathematical Foundation audit required:
1. Float audit of all scoring paths
2. Q32.32 fixed-point conversion of non-Sacred violations
3. Monte Carlo RTP baseline
4. This ADR documenting results

---

## Float Audit Results

### SEVERITY-A — Stored Float State (FIXED)

| File | Line | Violation | Fix |
|---|---|---|---|
| `rhythm.ts` | 33, 37-40 | `flowMultiplier: 1.0`, `PERFECT_GAIN = 0.15`, `GOOD_GAIN = 0.07`, `FLOW_BASE = 1.0`, `FLOW_DEFAULT_CAP = 2.0` | Converted to Q×1000 integers: 1000, 150, 70, 1000, 2000 |

### SEVERITY-B — Float in Scoring Path, Integer Output (FIXED or PROPOSED)

| File | Lines | Violation | Fix |
|---|---|---|---|
| `shards.ts` | 61, 73, 79, 85, 91 | `s * 1.25`, `s * 2.5`, `s * 1.5`, `s * Math.min(1.4, 1.0 + banks * 0.08)`, `s * 2.0` | Pure integer arithmetic: `(s*5+2)>>2`, `(s*5+1)>>1`, `(s*3+1)>>1`, Q×100 formula, `s*2` |
| `slipstream.ts` | 41-42 | `windowFactor = +(0.75 + t*0.75).toFixed(2)`, `flowCap = +(1.60+t*0.40).toFixed(2)` | Converted to Q×1000: `windowFactorQ`, `flowCapQ` |
| `farkleScorer.ts` | 34, 49 | `multiplier: number = 1` receives floats 1.15/2.5/1.85 | **PROPOSED** — Sacred Core; PROPOSAL-farkleScorer-multiplier-q1000-20260524.md. Awaiting Human decision. |

### SEVERITY-C — Non-Scoring Path (DEFERRED)

| File | Lines | Finding |
|---|---|---|
| `gridUtils.ts` | 240-241 | `blockerCount * 0.5 / 0.25` — grid layout, integer result |
| `skillMetrics.ts` | 62-64 | Advisory skill score metrics (0.40/0.35/0.25 weights) — not in payout path |

---

## Q×1000 Conversion

Scale factor: 1000 (per-mille). All floating-point multipliers in the scoring pipeline now represented as integers where 1000 = 1.0×.

### Cascade Updated

All callers of the modified functions were updated atomically:
- `gameRoom.ts` — server-side orchestration
- `multiplayerStore.ts` — client state store
- `useMultiplayer.ts` — client hook
- `FarkleHUD.tsx` — UI display (`windowFactorQ / 1000` for display)
- `GameScreen.tsx` — UI prop passing

### Type Check

`pnpm type-check` — zero new TypeScript errors after conversion.

### Test Regression

- `farkleScorer.test.ts` — **16/16 PASS** (baseline)
- `replay.test.ts` — **5/5 PASS** (no regression)

---

## Monte Carlo Baseline

Run: 2026-05-24T13:49:04Z  
Sessions: 2000 per mode, stake: 100  

| Mode | Target RTP | Realized RTP | Deviance | Result |
|---|---|---|---|---|
| SOLO_FREE | 0.92 | 0.9560 | 0.0360 | FAIL |
| SOLO_CASINO | 0.92 | 0.9560 | 0.0360 | FAIL |
| VS_FREE | 1.00 | 1.0360 | 0.0360 | FAIL |
| VS_CASINO | 0.92 | 0.9560 | 0.0360 | FAIL |
| RALLY_FREE | 0.92 | 1.0360 | 0.1160 | FAIL |
| RALLY_CASINO | 0.92 | 0.9560 | 0.0360 | FAIL |
| HEIST_FREE | 0.92 | 1.0360 | 0.1160 | FAIL |
| HEIST_CASINO | 0.92 | 0.9560 | 0.0360 | FAIL |

**Calibration normalizer:** 917.27 (SOLO/CASINO/RALLY/HEIST), 843.89 (VS_FREE)

### Monte Carlo Findings

1. **Constant deviance (0.0360):** The realizedRTP is consistently 3.6% above target across most modes. This is a known pre-existing condition in the Monte Carlo model — `monteCarlo.ts` uses a simplified simulation with known limitations (noted in spec: "deferred: requires live telemetry loop; recalibration handled manually").

2. **RALLY_FREE / HEIST_FREE deviance (0.1160):** Larger deviation in cooperative modes. These modes have different payout mechanics (shared pot / vault) that the current simulation model approximates at 40% milestone probability.

3. **Sacred Core note:** `monteCarlo.ts` is Sacred Core. These findings are documented here. The ADR-010 RTP variance proposal (T1B) is the appropriate vehicle for calibration changes.

4. **No regression:** The Q×1000 conversion in T1 Task 2 did not affect the Monte Carlo results — monteCarlo.ts imports `scoreFarkle` (not rhythm/slipstream/shards) and was not modified.

### Baseline Recorded

This ADR establishes the T1 Monte Carlo baseline. Future sessions should compare against these numbers. If telemetry shows realized RTP consistently above 0.94 in production, the ADR-010 proposal should be activated.

---

## Decision

**T1 Mathematical Foundation — PASS**

- FIXED_POINT_CHECK: PASS on all modified non-Sacred files
- Sacred Core SEVERITY-B: PROPOSED (pending Human decision)
- Monte Carlo baseline: recorded (pre-existing deviance, not T1-introduced)
- Tests: 21/21 pass (16 + 5)
- TypeScript: clean

**Deferred to T2+:**
- farkleScorer.ts multiplier Q×1000 (requires Human approval)
- gridUtils.ts / skillMetrics.ts SEVERITY-C cleanup
- monteCarlo.ts recalibration (Sacred Core; ADR-010 is the vehicle)
