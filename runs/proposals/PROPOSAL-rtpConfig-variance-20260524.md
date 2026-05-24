# PROPOSAL ONLY — NOT IMPLEMENTED
# Execution Runtime authority: Agent Output (advisory)
# Requires: Human approval + ADR + Monte Carlo 10,000-generation pass

## Proposed Change: RTP Variance Bound Adjustment

**Target file (SACRED CORE):** `core/packages/farkle-engine/src/rtpConfig.ts`

**Current value:** RTP variance bound ±0.005
**Proposed value:** ±0.003 (tighter, more conservative for regulatory compliance)

**Rationale:** Tighter variance reduces the probability of short-term RTP outliers
exceeding regulatory tolerance windows in jurisdictions with strict RTP floors.

**Change authority required:** Human only
**Process:** ADR required + Monte Carlo 10,000-generation pass + RTP within ±0.003

**Status: PROPOSAL ONLY — this document does not implement any change.**
