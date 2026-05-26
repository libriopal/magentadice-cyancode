# Audit 05 — Security & Compliance

**Date:** 2026-05-25

## Geofence Enforcement

| State | Blocked | Enforcement |
|---|---|---|
| WA (Washington) | YES | `checkGeofence('WA')` → false |
| ID (Idaho) | YES | `checkGeofence('ID')` → false |
| MI (Michigan) | YES | `checkGeofence('MI')` → false |
| AK (Alaska) | YES | `checkGeofence('AK')` → false |
| AL (Alabama) | YES | `checkGeofence('AL')` → false |
| CA, TX, FL, ... | ALLOWED | `checkGeofence(state)` → true |

**File:** `core/apps/server/src/playIntegrity.ts`
**Test coverage:** 3/3 geofence tests pass (playIntegrity.test.ts)

## RTP Bounds

- Configured range: 88–96% per `rtpConfig.ts`
- ADR-010 Monte Carlo calibration: **PROPOSE ONLY — pending Human approval**
- Risk: ADR-010 carries since T6; non-blocking until production deployment

## Provable Fairness Chain

| Component | Implementation | Status |
|---|---|---|
| ServerSeed commitment | SHA-256 hash in MATCH_START event | ACTIVE |
| CSPRNG seeding | HMAC-SHA256 from combined seed | ACTIVE |
| Event chain | SHA-256 predecessor hash in each event | ACTIVE |
| Replay hash | Committed in MATCH_END payload | ACTIVE |
| writeWithRetry | 3-attempt exponential backoff (T8) | ACTIVE |

## PostHog Analytics Security

- API key: Server-side env var (`POSTHOG_API_KEY`) only — never exposed to client
- No-op if key absent: `if (!apiKey) return;` in `postHogTrack`
- Data sent: `userId` (anonymous), event name, app version, platform — no direct identifiers observed in this payload; formal privacy review recommended before production
- Fire-and-forget: PostHog outage cannot affect game loop

## Sweepstakes Compliance

- "No purchase necessary": confirmed in docs/playstore-checklist.md §7
- Skill-differential report: `getSkillDifferentialReport()` in analytics.ts — available for regulator queries
- Alternate method of entry: documented in checklist (TODO: Official Rules URL)
- Legal posture: no obvious scoring-path float issues observed at T0–T9 (see FIXED_POINT_CHECK summary below). Formal legal conclusions — including sweepstakes classification and compliance posture — should be deferred to qualified legal/privacy review.

## FIXED_POINT_CHECK Summary (T0–T9)

| Session | New floats in scoring path | Verdict |
|---|---|---|
| T0–T7 | 0 | PASS |
| T8 | 0 (score_delta, running_total are integers) | PASS |
| T9 | 0 (classArchetype is string; postHogTrack has no arithmetic) | PASS |

```text
AUDIT::PATHWAY_DEPS: core/apps/server/src/playIntegrity.ts, mesh/hashing-strategy.md
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: All fairness chains intact; no new float violations
AUDIT::FIXED_POINT_CHECK: PASS
```
