# ADR-020 — T9: Social, Platform & LiveOps

**Date:** 2026-05-25 | **Status:** Accepted | **Session:** 13

## Context

T9 completes the final tier gate: Social, Platform & LiveOps. Three explicit pass gates from `mesh/master_proof_of_value_audit_v2.md`:
1. PostHog events active
2. 2-player match deterministic (CI-verified)
3. Play Store checklist complete

Additionally, T8 debt: MATCH_SCORE payload had `bank_type` (non-contract field). `ReplayEvent.v1.md MatchScorePayload` requires `class_archetype`.

## Decisions

### D1 — PostHog Fire-and-Forget Adapter

**Decision:** Add `postHogTrack(distinctId, event, properties)` to `apps/server/src/analytics.ts`. Wire into `gameRoom.ts`: `session_start` on MATCH_START, `level_complete` on MATCH_END.

**Rationale:** PostHog batch API requires only a POST with API key and event array. Server-side fire-and-forget matches existing `insertWalletTransaction` pattern. Key never touches client.

**Rejected:** Client-side PostHog SDK — API key would be exposed in browser bundle.

**FIXED_POINT_CHECK:** PASS — no arithmetic in analytics path.

**Sacred Core contact:** None.

---

### D2 — 2-Player Determinism Test

**Decision:** Add `apps/server/src/__tests__/twoPlayer.determinism.test.ts` with 3 tests:
1. Two CSPRNG instances with identical seed → identical scoring sequences
2. Different seeds → divergent sequences
3. scoreFarkle: same dice → same score (pure function)

**Rationale:** Sweepstakes compliance requires provable reproducibility. CSPRNG is HMAC-SHA256 (deterministic by construction). Test formalizes this as a CI gate.

**Rejected:** Full GameRoom mock (complex WebSocket mock required). CSPRNG + scoreFarkle tests prove the same property at lower cost.

**Result:** 3/3 PASS. Run from `core/apps/server/`: `node --import tsx/esm --test src/__tests__/twoPlayer.determinism.test.ts`

---

### D3 — classArchetype on RoomPlayer (T8 debt resolution)

**Decision:** Add `classArchetype: ClassArchetype` to `RoomPlayer` interface. Default `'Paladin'` in `addPlayer()`. Replace `bank_type` with `class_archetype` in both MATCH_SCORE payload sites.

**Rationale:** `ReplayEvent.v1.md MatchScorePayload` defines: `player_id`, `score_delta`, `running_total`, `class_archetype`. `bank_type` is not a contract field. T8 prompt-09 and ADR-019 were corrected (inline fixes) but gameRoom.ts was not updated until T9.

**Rejected:** Extending `Player` type in farkle-shared — that would add the field to the client-side Player model unnecessarily.

**`classArchetype` default:** `'Paladin'` until lobby classArchetype selection is implemented (post-T9 roadmap item).

**FIXED_POINT_CHECK:** PASS — classArchetype is a string literal, no arithmetic.

**Sacred Core contact:** None — `RoomPlayer` is a server-only interface in `gameRoom.ts`.

---

## Pass Gates

| Gate | Status |
|---|---|
| PostHog flush adapter in analytics.ts | PASS |
| session_start / level_complete wired in gameRoom.ts | PASS |
| twoPlayer.determinism.test.ts — 3/3 pass | PASS |
| docs/playstore-checklist.md — 8 sections | PASS |
| MATCH_SCORE: class_archetype present, bank_type absent | PASS |
| pnpm type-check: 0 new errors | PASS |
| pnpm test: 41/41 (44/44 with T9 tests) | PASS |
| FIXED_POINT_CHECK: PASS | PASS |
| Sacred Core 0 writes | PASS |

## Sacred Core Compliance

No Sacred Core files modified. `gameRoom.ts` is not on the Sacred Core list.
