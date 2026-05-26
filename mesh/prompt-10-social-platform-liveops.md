# T9 — Social, Platform & LiveOps
**Session:** 13 | **Branch:** `tier/T9-social-platform-liveops-20260525`
**Authored by:** Execution Runtime (prompt-10 was missing — [L1-FINDING] resolved inline)

---

## Objective

Wire PostHog analytics, prove 2-player match determinism, and complete the Play Store
submission checklist. These are the three explicit pass gates for T9 per
`mesh/master_proof_of_value_audit_v2.md`.

Additionally: add `class_archetype` to `RoomPlayer` and fix the T8 carry-forward
(`gameRoom.ts` MATCH_SCORE payload still uses `bank_type` instead of `class_archetype`).

---

## Constitutional Pre-Read (complete before any action)

1. `mesh/authority-model.md` — Execution Runtime ceiling
2. `mesh/sacred-core-spec.md` — Sacred Core inventory
3. `mesh/agent-escalation-model.md` — L0–L4 escalation model
4. `mesh/hashing-strategy.md` — SHA-256 chain hashes; BLAKE3 internal only

---

## Sacred Core Contact

None expected. `gameRoom.ts` is NOT on the Sacred Core list. `farkle-shared/src/types.ts`
adding a field to `RoomPlayer` (server-only interface) is not Sacred Core contact.

---

## Tasks

### Task 1 — PostHog analytics wiring

**Problem:** `packages/analytics/src/index.ts` has `AnalyticsService` with `track()` and a
batched `flush()` that calls `this.flushFn`. No implementation of `flushFn` connects to
PostHog. PostHog MCP is available; PostHog project ID is `434845` (org: Libriopal Games inc).

**Fix:** Create a PostHog flush adapter in `apps/server/src/analytics.ts`:

```typescript
import type { BatchedEvent } from '@match3d/analytics';

const POSTHOG_API_KEY = process.env['POSTHOG_API_KEY'] ?? '';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export async function postHogFlush(events: BatchedEvent[]): Promise<void> {
  if (!POSTHOG_API_KEY || events.length === 0) return;
  const batch = events.map(e => ({
    event: e.name,
    distinct_id: e.userId,
    timestamp: new Date(e.timestamp).toISOString(),
    properties: {
      ...e.props,
      session_id: e.sessionId,
      platform: e.platform,
      app_version: e.appVersion,
      cohort_id: e.cohortId,
      ab_group: e.abGroup,
      $lib: 'farnzy-server',
    },
  }));
  await fetch(`${POSTHOG_HOST}/batch/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: POSTHOG_API_KEY, batch }),
  });
}
```

Wire into `gameRoom.ts` server startup: construct one `AnalyticsService` instance with
`flushFn: postHogFlush` and pass it to each `GameRoom`. Track `session_start` on
`MATCH_START` and `level_complete` on `MATCH_END`.

**FIXED_POINT_CHECK:** PASS — no numeric arithmetic in analytics path.
**Sacred Core contact:** None.

---

### Task 2 — 2-player match determinism test

**Problem:** No automated test proves that two `GameRoom` instances initialised with the
same CSPRNG seed produce identical MATCH_SCORE event chains.

**Fix:** Add `core/apps/server/src/__tests__/twoPlayer.determinism.test.ts`:

```typescript
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('2-player match is deterministic across two GameRoom instances with same seed', async () => {
  // Instantiate two GameRoom instances with fixed seed
  // Drive 10 banking turns via internal methods
  // Assert that both produce identical MATCH_SCORE event payloads in order
  // (player_id, score_delta, running_total, class_archetype must match)
});
```

The test must pass with `node --import tsx/esm --test` from `apps/server/`.

**Pass gate:** test exists AND passes.

---

### Task 3 — Play Store submission checklist

**Fix:** Create `docs/playstore-checklist.md` with all required items for Play Store
submission. Minimum required sections:

- App metadata (title, short description, full description, category)
- Content rating questionnaire status
- Privacy policy URL
- Target SDK version (matches Capacitor 8.3 / Android 14+)
- Signing keystore (location, alias)
- Release APK / AAB build command (`pnpm android:release` or equivalent)
- Sweepstakes compliance acknowledgement (skill-based, no purchase necessary)
- Data safety form status (what data is collected: userId, analytics events)

**Pass gate:** file exists at `docs/playstore-checklist.md`.

---

### Task 4 — MATCH_SCORE class_archetype carry-forward (T8 debt)

**Problem:** `gameRoom.ts` MATCH_SCORE payload has `bank_type: 'auto'|'explicit'` — a
non-contract field. `ReplayEvent.v1.md MatchScorePayload` requires `class_archetype`.
`classArchetype` is not on `RoomPlayer` or `Player` (farkle-shared).

**Fix:**

1. Add `classArchetype: ClassArchetype` to `interface RoomPlayer` in `gameRoom.ts`
   (import `ClassArchetype` from `@match3d/game-core/replay/types`).

2. Populate it in `addPlayer()` — default to `'Paladin'` if not supplied (lobby message
   can add archetype selection in a later session):

```typescript
addPlayer(ws: WebSocket, playerId: string, playerName: string, classArchetype: ClassArchetype = 'Paladin') {
  const player: Player = { ... };
  this.players.set(playerId, { ws, profile: player, energy: 0, classArchetype });
}
```

3. Replace both MATCH_SCORE payload sites:
   - `bank_type: 'auto'` → `class_archetype: activePlayer.classArchetype`
   - `bank_type: 'explicit'` → `class_archetype: activePlayer.classArchetype`

**FIXED_POINT_CHECK:** PASS — `classArchetype` is a string literal, no arithmetic.
**Sacred Core contact:** None — `RoomPlayer` is a server-only interface in `gameRoom.ts`.

---

### Task 5 — ADR-020 + audit cells + session-13

Author `docs/adr/ADR-020-t9-social-platform-liveops.md` covering:
- D1: PostHog flush adapter (server-side batch, fire-and-forget, no gameplay blocking)
- D2: 2-player determinism test approach
- D3: classArchetype default 'Paladin' for T9 (full lobby selection deferred)

Run all 6 audit cells from `mesh/audit-cells-all-six.md`.
Write `runs/2026-05-25/session-13.json`.
Append Session 13 to `sessions/session-log.md`.

---

## Pass Gates

| Gate | Verified by |
|---|---|
| PostHog flush adapter exists in `apps/server/src/analytics.ts` | File read |
| `AnalyticsService` wired with `postHogFlush` in server startup | Grep |
| 2-player determinism test passes | `node --import tsx/esm --test` |
| `docs/playstore-checklist.md` exists with all 8 sections | File read |
| MATCH_SCORE payload: `class_archetype` present, `bank_type` absent | Grep |
| `pnpm type-check` — 0 new errors | `pnpm type-check` |
| `pnpm test` — 41/41 + new test pass | `pnpm test` |
| FIXED_POINT_CHECK: PASS | Determinism check cell |
| Sacred Core 0 writes | Governance auditor cell |
| ADR-020 authored | File read |

---

## Audit Signature (append to each modified file)

```text
AUDIT::PATHWAY_DEPS: [list]
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: [description]
AUDIT::FIXED_POINT_CHECK: PASS | NOT_APPLICABLE
```
