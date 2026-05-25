# ADR-010: RTP Variance Bound Tightening

**Status:** Proposed — pending Monte Carlo 10,000-generation pass
**Date:** 2026-05-24
**Session:** tier/T1B-audit-runtime-20260524
**Human approval:** Granted 2026-05-24 (direction approved; implementation gated on Monte Carlo)
**Change authority:** Human only (payout_math Sacred Core)
**ADR required:** Yes (this document)
**Monte Carlo required:** Yes — 10,000-generation pass, RTP within ±0.003

---

## Context

Current RTP variance bound in `rtpConfig.ts` is ±0.005.
A tighter bound of ±0.003 was proposed to reduce the probability of short-term RTP
outliers exceeding regulatory tolerance windows in jurisdictions with strict RTP floors.

This change targets `core/packages/farkle-engine/src/rtpConfig.ts` — a **Sacred Core** file
in the `payout_math` category. Per `sacred-core-spec.md`, any change to this file requires:

1. This ADR
2. Monte Carlo 10,000-generation pass
3. RTP within ±0.003 confirmed across all 20 genre module combinations
4. Human sign-off on Monte Carlo results

---

## Decision

**Approved in principle:** RTP variance bound to be tightened from ±0.005 to ±0.003.

**Implementation blocked on:** Monte Carlo harness infrastructure (T4 scope — not yet available).
Implementation SHALL NOT proceed until:
- [ ] Monte Carlo harness is operational (T4 prerequisite)
- [ ] 10,000-generation run confirms RTP within ±0.003 across all genre/mode combinations
- [ ] Human reviews and signs off on Monte Carlo results

---

## Consequences

**Positive:**
- More conservative RTP profile — lower regulatory risk
- Tighter variance reduces short-run player experience variance

**Negative:**
- Requires Monte Carlo infrastructure to validate (T4 dependency)
- May require rebalancing multiplier tables if current variance is structurally > ±0.003

---

## T6 Harness Results (2026-05-25 — rtp.harness.test.ts, T4 gate 0.20)

| Mode | Target | Realized | Deviance | AA+ Gate (±0.005) |
|---|---|---|---|---|
| SOLO_FREE | 0.9200 | 0.9558 | 0.0358 | FAIL |
| SOLO_CASINO | 0.9200 | 0.9558 | 0.0358 | FAIL |
| VS_FREE | 1.0000 | 1.0358 | 0.0358 | FAIL |
| VS_CASINO | 0.9200 | 0.9558 | 0.0358 | FAIL |
| **RALLY_FREE** | 0.9200 | 1.0358 | **0.1158** | **FAIL** |
| RALLY_CASINO | 0.9200 | 0.9558 | 0.0358 | FAIL |
| **HEIST_FREE** | 0.9200 | 1.0358 | **0.1158** | **FAIL** |
| HEIST_CASINO | 0.9200 | 0.9558 | 0.0358 | FAIL |

**Root cause (PROPOSE ONLY — Sacred Core):** RALLY_FREE/HEIST_FREE over-pay because the
cooperative/vault mechanics effectively add to the prize pool without reducing target RTP.
`monteCarlo.ts` adjusts the normalization factor for FREE modes. Current normalization
applies the same factor as CASINO modes, causing the +0.1158 overshoot.

**Proposed calibration:** In `monteCarlo.ts`, adjust FREE-mode RTP normalization:
- RALLY_FREE target → 0.9200; normalization factor to account for cooperative split math
- HEIST_FREE target → 0.9200; vault contribution factored into normalization

**Implementation Gate:** PROPOSE ONLY — monteCarlo.ts is Sacred Core.
- [ ] Human reviews proposed calibration approach
- [ ] Human approves modification to monteCarlo.ts
- [ ] Monte Carlo 10,000-generation pass confirms ±0.003 after calibration
- [ ] ADR-010 status updated to Accepted

## Implementation Gate

This ADR remains **Proposed**. It becomes **Accepted** only when:
1. Human approves calibration approach above
2. 10,000-generation Monte Carlo pass confirms ±0.003 across all 8 modes
3. Human signs off on results

Until then: `rtpConfig.ts` and `monteCarlo.ts` are NOT modified.

---

## Notes

- T1C IEventStore freeze ADR shall be numbered **ADR-011** (this ADR takes ADR-010)
- Update memory MCP: `outstanding_l1_adr009_number_collision` → resolved; T1C uses ADR-011
