# ADR-019 — T8 Economy & Production Hardening

**Date:** 2026-05-25  
**Branch:** tier/T8-economy-farnzy-20260525  
**Status:** ACCEPTED  
**Author:** Claude Code (Execution Runtime)  
**Session:** Session 12

---

## Context

T8 addresses three production readiness gaps identified across T6–T7:

1. **L0-event-store-retry (carried from T6):** `IEventStore.v1.md §3` requires retry at the application layer for write failures. The T6 implementation used fire-and-forget `.catch(e => console.error(...))` — logged but no retry. Transient network failures produce chain gaps.

2. **MATCH_SCORE not wired (carried from T6):** The `MATCH_SCORE` event type is defined in `SupabaseEventStore.ts` and handled in `buildStateFromEvents()`, but never written when a player banks. Per-player running scores are absent from the production event chain.

3. **ClassArchetypeBadge import error (carried from T5/T6):** `ClassArchetypeBadge.tsx` imports `ClassArchetype` from an incorrect relative path (`../../../packages/...` resolves to `apps/packages/...` which does not exist; correct is `../../../../packages/...`). This caused 14 TypeScript errors in `@match3d/web` type-check.

---

## Decisions

### D1 — SupabaseEventStore Retry Wrapper

**Decision:** Add module-level `writeWithRetry()` helper in `gameRoom.ts`. Max 3 attempts with exponential backoff: 100ms → 200ms → 400ms. On final failure, logs to `console.error` (captured by production log aggregation). Replace all existing fire-and-forget write calls with `void writeWithRetry(...)`.

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

**Safety:** `SupabaseEventStore.write()` fetches the predecessor hash on each call. A failed write (no row inserted) means the retry will fetch the same predecessor on the next attempt — no double-write risk. Duplicate `event_id` (UUID) would be rejected by the DB unique constraint on the `id` column.

**Rejected:** Retry inside `SupabaseEventStore.write()` itself — would change the IEventStore contract surface. Application-layer retry is cleaner and keeps the store implementation focused.

### D2 — MATCH_SCORE Event Wiring

**Decision:** Write `MATCH_SCORE` events via `writeWithRetry` immediately after `activePlayer.profile.banked += gain` in both banking paths:

- **Auto-bank path** (~line 700): fires when `chain.length < 6`; `bank_type: 'auto'`
- **Explicit bank path** (~line 848): fires on `handleBank()` message; `bank_type: 'explicit'`

**Payload:**
```json
{
  "player_id": "string",
  "score_delta": integer,     // raw Farkle score units (not Q×1000 currency)
  "running_total": integer,   // activePlayer.profile.banked after update
  "bank_type": "auto|explicit"
}
```

**FIXED_POINT_CHECK:** PASS. `score_delta` and `running_total` are integers derived from integer arithmetic. `profile.banked` accumulates via `+= gain` where `gain` is always an integer from Farkle scoring. No floats enter the payload.

**Not a Sacred Core change:** The scoring arithmetic in `profile.banked` is unchanged. This only adds an event write alongside the existing banking update.

### D3 — ClassArchetypeBadge Import Path

**Decision:** Change line 10 of `ClassArchetypeBadge.tsx`:
- Before: `'../../../packages/game-core/src/replay/types.js'`
- After: `'../../../../packages/game-core/src/replay/types.js'`

The file lives at `apps/web/src/components/` — four directory levels below the `core/` root. The `packages/` directory is at the `core/` root. Correct relative path requires 4 `../` segments.

`ClassArchetype` type (`'Paladin' | 'Rogue' | 'Bard'`) is defined in `packages/game-core/src/replay/types.ts` which already existed. This fix resolves 14 TypeScript errors: 1 module-not-found + 13 `style is possibly undefined` (caused by `ClassArchetype` resolving to `any` when the module is missing).

---

## Sacred Core Compliance

- `farkleStore.ts` — not touched  
- `gameStore.ts` — not touched  
- `farkleScorer.ts` — not touched  
- `rtpConfig.ts` — not touched  
- `monteCarlo.ts` — not touched  
- `csprng.ts` — not touched  
- `gameRoom.ts` — modified (not on Sacred Core list per `sacred-core-spec.md`)

---

## Pass Gates

| Gate | Result |
|---|---|
| `pnpm type-check` 0 new errors (ClassArchetypeBadge 14 errors resolved) | PASS |
| 41/41 tests pass (16 farkle-engine + 22 game-core + 3 rtp.harness) | PASS |
| `writeWithRetry` present; MATCH_START/MATCH_END use it | PASS |
| MATCH_SCORE event wired at both banking paths | PASS |
| FIXED_POINT_CHECK: PASS | PASS |
| Sacred Core 0 writes | PASS |

---

## Consequences

- Transient Supabase write failures retry up to 3× before logging; chain gap risk significantly reduced.
- Per-player running scores now appear in the production event chain via MATCH_SCORE events.
- ClassArchetypeBadge TypeScript errors resolved — `@match3d/web` type-check is cleaner.
- `writeWithRetry` is fire-and-forget at the call site; does not block the game loop.
