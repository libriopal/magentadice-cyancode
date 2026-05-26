<!--
  FAR_NZY TIER PROMPT — T8
  File: mesh/prompt-09-economy-farnzy.md
  Tier: T8 — Economy & Production Hardening
  Prerequisites: T0–T7 PASS
  One tier per session. Read completely before taking any action.
-->

# T8 — Economy & Production Hardening

## Identity

You are Claude Code operating as the FAR_NZY Session Orchestrator.
Authority ceiling: Execution Runtime.
Constitutional documents: mesh/authority-model.md, mesh/sacred-core-spec.md.
Sacred Core files are PROPOSE ONLY — read permitted, writes require Human approval.

## Objective

Wire the MATCH_SCORE event into the production event chain, harden the
SupabaseEventStore write path with retry, and fix the ClassArchetypeBadge
import error that has been blocking the type-check for several sessions.

---

## Task 1 — SupabaseEventStore retry (`core/apps/server/src/gameRoom.ts`)

**Problem:** MATCH_START and MATCH_END event writes are fire-and-forget with a
single `.catch(e => console.error(...))`. `IEventStore.v1.md §3` requires retry
at the application layer. Chain gaps are possible on transient network failures.

**Fix:** Add a `writeWithRetry` module-level helper in `gameRoom.ts`:

```typescript
async function writeWithRetry(
  store: SupabaseEventStore,
  event: Parameters<SupabaseEventStore['write']>[0],
  label: string,
): Promise<void> {
  const delays = [100, 200, 400];
  for (let attempt = 0; attempt < 3; attempt++) {
    try { await store.write(event); return; }
    catch (e) {
      if (attempt < 2) await new Promise(r => setTimeout(r, delays[attempt]!));
      else console.error(`[EventStore] ${label} failed after 3 attempts:`, e);
    }
  }
}
```

Replace both existing fire-and-forget patterns:
- MATCH_START (line ~786): `void this._eventStore.write({...}).catch(...)` → `void writeWithRetry(this._eventStore, {...}, 'MATCH_START')`
- MATCH_END (line ~1144): same → `void writeWithRetry(this._eventStore, {...}, 'MATCH_END')`

**Sacred Core contact:** None. gameRoom.ts is not on the sacred list.
**FIXED_POINT_CHECK:** NOT_APPLICABLE (no arithmetic; helper is string/async only).

---

## Task 2 — MATCH_SCORE event wiring (`core/apps/server/src/gameRoom.ts`)

**Problem:** MATCH_SCORE is defined as an EventType (SupabaseEventStore.ts line 30)
and handled in `buildStateFromEvents` (line 535), but is never written when a player
banks. The event chain is missing per-player score updates.

**Fix:** Add `writeWithRetry(this._eventStore, MATCH_SCORE_event, 'MATCH_SCORE')`
immediately after `activePlayer.profile.banked += gain` in **both** banking paths:

Banking path 1 — auto-bank (chain < 6, around line 700):
```typescript
if (activePlayer) {
  activePlayer.profile.banked += gain;
  if (this._eventStore) {
    void writeWithRetry(this._eventStore, {
      schema_version: '1.0.0',
      event_type: 'MATCH_SCORE',
      replay_tick: this._eventReplayTick++,
      payload: {
        player_id: playerId,
        score_delta: gain,           // Q×1 integer — raw Farkle score units
        running_total: activePlayer.profile.banked,
        class_archetype: activePlayer.classArchetype,
      },
    }, 'MATCH_SCORE(auto)');
  }
}
```

Banking path 2 — explicit bank (handleBank, around line 848):
```typescript
if (activePlayer) {
  activePlayer.profile.banked += gain;
  if (this._eventStore) {
    void writeWithRetry(this._eventStore, {
      schema_version: '1.0.0',
      event_type: 'MATCH_SCORE',
      replay_tick: this._eventReplayTick++,
      payload: {
        player_id: playerId,
        score_delta: gain,
        running_total: activePlayer.profile.banked,
        class_archetype: activePlayer.classArchetype,
      },
    }, 'MATCH_SCORE(explicit)');
  }
}
```

**Note:** `score_delta` and `running_total` are raw Farkle score integers (not Q×1000
currency). They are stored in the event payload (string-serialized JSON) — no
fixed-point arithmetic in the event write path. No float violations.

**Sacred Core contact:** None.
**FIXED_POINT_CHECK:** PASS — score_delta and running_total are integers from integer
arithmetic (profile.banked is always integer — accumulated via `+= gain` where gain
is always integer from Farkle scoring). No floats enter the payload.

---

## Task 3 — ClassArchetypeBadge import fix (`core/apps/web/src/components/ClassArchetypeBadge.tsx`)

**Problem:** Line 10 imports from `'../../../packages/game-core/src/replay/types.js'`.
Resolved path from `apps/web/src/components/` is `apps/packages/game-core/...` which
does not exist. Correct path requires 4 levels up (not 3) to reach the `core/` root.
This causes 14 TypeScript errors: 1 module-not-found + 13 `style is possibly undefined`
(because `ClassArchetype` resolves to `any` when import fails).

**Fix:** Change line 10:
```typescript
// Before:
import type { ClassArchetype } from '../../../packages/game-core/src/replay/types.js';
// After:
import type { ClassArchetype } from '../../../../packages/game-core/src/replay/types.js';
```

Also inline-fix two hardcoded colors in ARCHETYPE_STYLE:
- `'#c94c4c'` (Rogue) → `OV.amberHot` (no — amberHot is orange; use literal or PILLAR token)
  → Keep `'#c94c4c'` (not a palette color — Rogue crimson is not in the token system).
  → **Skip** — not a T8 concern; only fix the import.

**Sacred Core contact:** None.
**FIXED_POINT_CHECK:** NOT_APPLICABLE (no numeric operations).

---

## Task 4 — ADR-019 (`docs/adr/ADR-019-t8-economy-farnzy.md`)

Document:
- D1: SupabaseEventStore retry (3 attempts, exponential backoff 100/200/400ms)
- D2: MATCH_SCORE event payload shape (score_delta, running_total, class_archetype)
- D3: ClassArchetypeBadge import path correction
- Pass gates table
- Sacred Core compliance section

---

## Task 5 — Audit cells + session artifacts

Run all 6 audit cells (mesh/audit-cells-all-six.md).
Write `runs/2026-05-25/session-12.json`.
Append `sessions/session-log.md`.

---

## Pass Gate

- `pnpm type-check` → 0 new errors (ClassArchetypeBadge 14 errors resolved)
- `pnpm test` → 41/41 (all prior tests still pass)
- `writeWithRetry` present in gameRoom.ts; MATCH_START/MATCH_END use it
- MATCH_SCORE event wired at both banking paths
- FIXED_POINT_CHECK: PASS on all T8 files
- Sacred Core 0 writes
- ADR-019 written

## Audit Signature (append to each modified file)

```text
AUDIT::PATHWAY_DEPS: [list]
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: [description]
AUDIT::FIXED_POINT_CHECK: PASS | NOT_APPLICABLE
```
