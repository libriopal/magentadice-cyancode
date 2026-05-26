# Design 01 — T9 Social, Platform & LiveOps

**Date:** 2026-05-25

## PostHog Analytics Wiring

**Proof of value:** Enables cohort analysis, session funnel tracking, A/B variant monitoring. Required for data-driven LiveOps decisions.
**Expected impact:** Visibility into session_start→level_complete conversion rate; identify sessions that end before first bank.
**Risk:** POSTHOG_API_KEY absent = silent no-op (game never affected). PostHog outage = fire-and-forget (game never affected).
**Dependencies:** `POSTHOG_API_KEY` env var in server process. `fetch` global (Node 18+).
**Rollback:** Remove postHogTrack calls from gameRoom.ts. No data loss. No DB changes.

## 2-Player Determinism Test

**Proof of value:** Legal/regulatory requirement for sweepstakes — outcomes must be reproducible from seed.
**Expected impact:** CI gate proving determinism; required for sweepstakes compliance certification.
**Risk:** CSPRNG is HMAC-SHA256 (deterministic by construction). Test failure would indicate a csprng regression.
**Dependencies:** CSPRNG, scoreFarkle exports from @match3d/farkle-engine.
**Rollback:** Delete test file. No production impact.

## classArchetype on RoomPlayer

**Proof of value:** Fixes T8 debt — MATCH_SCORE payload was non-compliant with ReplayEvent.v1.md MatchScorePayload.
**Expected impact:** Event chain carries class_archetype per player; enables class-based analytics queries.
**Risk:** classArchetype defaults to 'Paladin' until lobby selection is implemented in a future session.
**Dependencies:** ClassArchetype type from @match3d/game-core/replay/types.
**Rollback:** Remove classArchetype from RoomPlayer; revert MATCH_SCORE payload. One-line change.
