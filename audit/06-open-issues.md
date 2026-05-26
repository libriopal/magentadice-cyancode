# Audit 06 — Open Issues

**Date:** 2026-05-25

## L0 Flags (non-blocking, carried)

| Tag | Description | Carried since | Resolution |
|---|---|---|---|
| L0-ADR010-calibration | ADR-010 Monte Carlo RTP calibration — PROPOSE ONLY | T6 | Pending Human approval |

## T9 Artifacts (resolved)

| Artifact | Status | Evidence |
|---|---|---|
| `docs/adr/ADR-020-t9-social-platform-liveops.md` | WRITTEN | Committed in 688e35f (integration repo) |
| `runs/2026-05-25/session-13.json` | WRITTEN | Score 96/100, verdict PASS_PROPOSE_COMMIT; committed in 688e35f |
| Session 13 in `sessions/session-log.md` | DONE | Appended in 688e35f; git log session-log.md confirms |
| pnpm type-check | VERIFIED | 0 new errors; 3 pre-existing ads/InMemoryEventStore.ts errors unchanged |
| pnpm test (44/44) | VERIFIED | 16+3+22+3 = 44; runs/2026-05-25/session-13.json `.tests_pass.TOTAL: "44/44"` |

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
