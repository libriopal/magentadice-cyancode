# IEVENTSTORE CONTRACT — VERSION 1
## FAR_NZY / magentadice-cyancode
## File: contracts/IEventStore.v1.md
## Status: FROZEN at v1.0.0 — any change requires MAJOR version bump + ADR + Human approval
## Companion: contracts/ReplayEvent.v1.md, contracts/Snapshot.v1.md

---

## Freeze Declaration

This contract is frozen.
Replay systems are extremely expensive to refactor once built.
Any change to this interface requires:
1. New version (IEventStore.v2.md)
2. Migration adapter (IEventStore.migrate.ts)
3. ADR documenting the breaking change
4. Full replay regression test on historical dataset
5. Human approval

The interface below is the implementation target for Phase 1C.
Implementations may extend it but may not narrow it.

---

## TypeScript Interface

```typescript
// contracts/IEventStore.ts
// Frozen v1.0.0 — do not modify without IEventStore.v2.md

import type { GameEvent, EventFilter, ChainVerificationResult } from './ReplayEvent.v1';
import type { EventSnapshot } from './Snapshot.v1';

export interface IEventStore {

  /**
   * Write a new event to the store.
   * Automatically:
   *   - assigns event_id (UUID v4)
   *   - computes predecessor_hash (SHA-256 of previous event)
   *   - computes signature (HMAC-SHA256 with server secret)
   *   - sets created_at (server-side timestamp)
   * Throws if predecessor_hash chain would break.
   * Throws if PDX event and hardware attestation verdict is absent.
   */
  write(
    event: Omit<GameEvent, 'event_id' | 'predecessor_hash' | 'signature' | 'created_at'>
  ): Promise<GameEvent>;

  /**
   * Read events matching filter criteria.
   * Validates SHA-256 chain integrity on every read.
   * Throws if chain break detected.
   */
  read(filters: EventFilter): Promise<GameEvent[]>;

  /**
   * Verify the SHA-256 chain from startEventId to endEventId (inclusive).
   * Returns verification result — does not throw on failure.
   * Callers must check result.valid and act accordingly.
   */
  verifyChain(
    startEventId: string,
    endEventId: string
  ): Promise<ChainVerificationResult>;

  /**
   * Migrate an event from an older schema version to the current version.
   * Required when reading historical events after a MAJOR schema version bump.
   * Returns the migrated event — does not modify storage.
   */
  migrate(
    oldEvent: GameEvent,
    targetVersion: string
  ): Promise<GameEvent>;

  /**
   * Create a checkpoint snapshot at the given event index.
   * Snapshot includes full game state hash and predecessor_snapshot_hash.
   * For PDX matches: called every 60 events.
   * For FD casual: called every 1,000 events.
   * For SDX awards: called immediately on SDX_AWARD event.
   */
  snapshot(eventIndex: number): Promise<EventSnapshot>;

  /**
   * Load the nearest snapshot at or before the target event index.
   * Returns null if no snapshot exists before the target.
   */
  loadSnapshot(beforeEventIndex: number): Promise<EventSnapshot | null>;

  /**
   * Replay a full match from SESSION seed + input log.
   * Returns the reconstructed final state.
   * Throws if reconstructed state does not match stored state hash.
   */
  replay(sessionSeed: string, inputLog: MatchInputLog): Promise<ReplayResult>;

  /**
   * Health check: verifies store connectivity and chain head integrity.
   */
  healthCheck(): Promise<{ connected: boolean; chainHeadValid: boolean; lastEventIndex: number }>;
}

/**
 * Match input log — the minimum data required to replay a match deterministically.
 * Contains no computed values — only raw inputs and the committed session seed.
 */
export interface MatchInputLog {
  sessionSeed: string;           // Committed before match start
  roomId: string;
  matchId: string;
  roundNumber: number;
  classArchetype: 'Paladin' | 'Rogue' | 'Bard';
  inputs: Array<{
    tick: number;                // Fixed dt=1/60 tick counter
    type: 'TILE_SWAP' | 'POCKET_DEPLOY' | 'MATCH_PASS';
    payload: Record<string, unknown>;
  }>;
}

export interface ReplayResult {
  finalState: Record<string, unknown>;
  finalStateHash: string;        // SHA-256 of JSON.stringify(finalState, sortedKeys)
  matchesStoredHash: boolean;    // Must be true for replay to be valid
  replayTicks: number;
  eventsProcessed: number;
}
```

---

## Method Contracts (invariants that all implementations must satisfy)

### write()
- MUST assign a unique UUID v4 event_id
- MUST compute predecessor_hash as SHA-256 of the previous event's raw JSON
- MUST compute HMAC-SHA256 signature using server secret
- MUST reject if PDX_AWARD event and attestation_verdict is absent from payload
- MUST reject if event would break the chain (predecessor_hash mismatch)
- MUST be atomic — partial writes are not acceptable
- MUST NOT accept Math.random() in any payload field

### read()
- MUST verify chain integrity for every event returned
- MUST throw ChainIntegrityError if any chain break is detected
- MUST return events in replay_tick ascending order unless filter specifies otherwise
- MUST NOT return events with invalid signatures

### verifyChain()
- MUST return { valid: false, breakAt: eventId } if any chain link is broken
- MUST NOT throw — callers handle the result
- MUST verify the full range, not a sample

### snapshot()
- MUST compute state_hash as SHA-256(JSON.stringify(state, sortedKeys))
- MUST set predecessor_snapshot_hash linking to the prior snapshot
- MUST be immutable — snapshots cannot be updated, only superseded

### replay()
- MUST use the committed session_seed — never regenerate it
- MUST produce identical output given identical inputs (deterministic)
- MUST compare final state hash against stored hash
- MUST throw if hashes do not match

---

## Storage Agnosticism

IEventStore is intentionally storage-agnostic.
Concrete implementations for Phase 1C:

```text
InMemoryEventStore   — testing only, never ships
SupabaseEventStore   — FD casual (NoSQL compatible subset)
PostgresEventStore   — PDX real-money (serializable ACID required)
```

Implementations must satisfy all method contracts.
The abstract interface is the governance layer.
The storage layer is replaceable.

---

## Version

contracts/IEventStore.v1.md
Status: FROZEN v1.0.0
Any modification → IEventStore.v2.md + migration adapter + ADR + Human approval
