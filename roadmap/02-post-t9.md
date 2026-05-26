# Roadmap 02 — Post-T9

**Date:** 2026-05-25

## After T9 PASS (EXECUTE.md HALT state)

All tiers T0–T9 = PASS. EXECUTE.md reports: "All tiers complete." Human decides next direction.

## Queued Work (priority order)

### 1. OpportunityWeightController (OWC) — Highest Value
- Design: `design/OpportunityWeightController.md`
- Component audit: `audit/COMPONENT_AUDIT.md`
- New file: `core/packages/farkle-engine/src/opportunityWeight.ts`
- Modifies: `core/packages/farkle-engine/src/gridUtils.ts` (`spawnTiles` — backward-compatible)
- Gate: RTP simulation via monteCarlo.ts must pass (88–96% bounds)
- ADR-021 required

### 2. HollaEx Crypto Payment
- Design: `design/02-hollaex-integration.md`
- New file: `core/apps/server/src/hollaex.ts`
- Webhook endpoint in `core/apps/server/src/index.ts`
- Legal review required before production
- ADR-022 required

### 3. ADR-010 Monte Carlo Calibration
- Status: PROPOSE ONLY — pending Human approval since T6
- Affects: rtpConfig.ts (Sacred Core — requires Human explicit authorization)

### 4. Play Store Submission
- Checklist: `docs/playstore-checklist.md`
- Pending: Privacy policy URL, signing keystore, Official Rules URL
- Command: `cd core/android && ./gradlew bundleRelease`

### 5. STONE Weakness Face Mechanic (COMPONENT_AUDIT B-tier recommendation)
- Extends Cell type with `weaknessFace?: DieFace`
- UI indicator for weakness face on stone cluster
- Not Sacred Core

### 6. Lobby ClassArchetype Selection
- Currently defaults to 'Paladin'
- Add JOIN_ROOM message field `classArchetype?: ClassArchetype`
- Pass through to addPlayer()
