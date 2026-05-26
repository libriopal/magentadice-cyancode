# Audit 06 — Open Issues

**Date:** 2026-05-25

## L0 Flags (non-blocking, carried)

| Tag | Description | Carried since | Resolution |
|---|---|---|---|
| L0-ADR010-calibration | ADR-010 Monte Carlo RTP calibration — PROPOSE ONLY | T6 | Pending Human approval |

## T9 Pending Artifacts

| Artifact | Status | Blocking |
|---|---|---|
| `docs/adr/ADR-020-t9-social-platform-liveops.md` | NOT WRITTEN | YES — required for T9 PASS |
| `runs/2026-05-25/session-13.json` | NOT WRITTEN | YES — required for T9 PASS |
| Session 13 in `sessions/session-log.md` | NOT APPENDED | YES — required for T9 PASS |
| pnpm type-check | NOT VERIFIED | YES — required for T9 PASS |
| pnpm test (44/44) | NOT VERIFIED | YES — required for T9 PASS |

## Requested but Not Started

| Item | Status | Notes |
|---|---|---|
| HollaEx crypto payment integration | PLANNED | User has API key; design in design/02-hollaex-integration.md |
| OpportunityWeightController | PLANNED | FF_V4_OPPORTUNITY_WEIGHT_REDESIGN directive; requires audit approval first |

## Proof of Value

- **Expected impact:** Resolving T9 pending items closes the final tier gate; EXECUTE.md reaches HALT state
- **Risk:** type-check may surface errors from ClassArchetype import — fixable in same session
- **Dependencies:** pnpm, node:test, tsx
- **Rollback:** Each pending item is independent; can be resolved in sequence

```text
AUDIT::PATHWAY_DEPS: docs/adr/, runs/2026-05-25/, sessions/session-log.md
AUDIT::CURRENT_GRADE: Grade A (pending T9 completion)
AUDIT::ENTROPY_VECTOR: 5 artifacts pending; no production risk until committed
AUDIT::FIXED_POINT_CHECK: PASS
```
