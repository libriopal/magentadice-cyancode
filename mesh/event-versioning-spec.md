# EVENT VERSIONING SPECIFICATION
## FAR_NZY / magentadice-cyancode
## Document: event-versioning-spec.md
## Status: Constitutional — major version changes require ADR + Human approval

---

## Principle

Without versioned events, future replay breaks.
A match played today must be replayable in three years
even if the event schema has evolved.
Versioning is the contract between now and the future.

---

## Canonical Event Schema

```json
{
  "schema_version": "1.0.0",
  "event_id": "uuid-v4",
  "event_type": "MATCH_SCORE | TILE_SWAP | CASCADE_COMPLETE | PDX_AWARD | FD_EMIT | SDX_AWARD | MATCH_START | MATCH_END | ROUND_START | ROUND_END",
  "replay_tick": 3600,
  "session_seed_ref": "sha256:...",
  "predecessor_hash": "sha256:...",
  "signature": "hmac-sha256:...",
  "created_at": "2026-05-22T12:00:00.000Z",
  "payload": {
    // event-type-specific fields
  }
}
```

### Required Fields (all events, all versions)

| Field | Type | Immutable |
|---|---|---|
| schema_version | semver string | Per event at write time |
| event_id | UUID v4 | YES — never changes after write |
| event_type | enum string | YES |
| replay_tick | integer | YES |
| predecessor_hash | sha256 string | YES |
| signature | hmac-sha256 string | YES |
| created_at | ISO 8601 | YES |

### Optional Fields (may vary by event_type)

| Field | Event Types | Notes |
|---|---|---|
| session_seed_ref | All match events | Reference to committed SESSION seed |
| player_id | Competitive events | Authoritative player identifier |
| class_archetype | Scoring events | Paladin / Rogue / Bard |
| score_delta | MATCH_SCORE | Fixed-point Q32.32 integer |
| currency_amount | PDX_AWARD, FD_EMIT, SDX_AWARD | Fixed-point integer, never float |
| chain_depth | CASCADE_COMPLETE | Integer |

---

## Versioning Rules

### Semantic Versioning — MAJOR.MINOR.PATCH

**MAJOR version increment:**
- Removing a required field
- Changing the type of a required field
- Changing the meaning of a required field
- Changing the hash algorithm
- Changing the signature algorithm

MAJOR changes break backward compatibility.
Every MAJOR change requires:
- ADR document
- Human approval
- Migration adapter in IEventStore
- Full replay test on historical dataset
- Version bump in all event writers

**MINOR version increment:**
- Adding a new optional field
- Adding a new event_type enum value
- Adding new optional payload fields

MINOR changes are backward compatible (readers ignore unknown fields).
MINOR changes require:
- ADR document
- Human approval
- Updated payload type definitions in TypeScript

**PATCH version increment:**
- Documentation corrections
- Metadata changes only
- No structural changes

PATCH changes require no special process.

---

## Compatibility Requirements

### Forward Compatibility (readers handle future versions)

All event readers MUST:
```typescript
// REQUIRED: Ignore unknown fields
const event = JSON.parse(rawEvent);
// Do not throw on unknown fields in payload
// Process only known fields for the reader's schema_version
```

### Backward Compatibility (readers handle past versions)

All event readers MUST handle:
- Any event with schema_version MAJOR matching current MAJOR
- Events with lower MINOR versions (missing optional fields → use defaults)

```typescript
// REQUIRED: Default handling for missing optional fields
const DEFAULT_SCORE_MULTIPLIER_FIXED = 100; // Q0.32 fixed-point: 1.0 × 100
const scoreMultiplier = event.payload.score_multiplier ?? DEFAULT_SCORE_MULTIPLIER_FIXED;
```

### Migration Strategy

When a MAJOR version increment is unavoidable:

```text
1. Write migration adapter: IEventStore.migrate(oldEvent) → newEvent
2. Test adapter on 100% of historical event dataset
3. Dual-write period: write both old and new version simultaneously
4. Verify new version replays identically to old version (100% match)
5. Retire old version after dual-write verification window (minimum 30 days)
6. ADR records the migration date and verification results
```

---

## Event Type Catalog v1.0.0

| event_type | Trigger | Sacred Core | Payload Fields |
|---|---|---|---|
| MATCH_START | Match initialized with committed SESSION seed | YES | session_seed, room_id, player_ids, class_archetypes |
| ROUND_START | Round begins | YES | round_number, game_seed |
| TILE_SWAP | Player swaps tiles | YES | positions, replay_tick, player_id |
| CASCADE_COMPLETE | Cascade resolved | YES | chain_depth, score_delta, tiles_cleared |
| MATCH_SCORE | Authoritative score update | YES | score_delta, class_multiplier, running_total |
| PDX_AWARD | PDX payout confirmed | YES | player_id, amount, match_id, attestation_verdict |
| FD_EMIT | FD emission | NO | player_id, amount, source |
| SDX_AWARD | SDX blockchain award | YES | player_id, amount, blockchain_tx_id, confirmation_block |
| ROUND_END | Round complete | YES | final_score, rtp_running_average |
| MATCH_END | Match complete | YES | final_score, winner, rtp_final, replay_hash |

---

## IEventStore Interface

> **Source of Truth:** The canonical frozen contract is `mesh/IEventStore.v1.md` (v1.0.0).
> The interface reproduced here is informational only and must not diverge from the frozen contract.
> See also: `mesh/ReplayEvent.v1.md`, `mesh/Snapshot.v1.md`.

```typescript
interface IEventStore {
  // Write a new event — signs and hashes automatically
  write(event: Omit<GameEvent, 'event_id' | 'predecessor_hash' | 'signature'>): Promise<GameEvent>;

  // Read events — validates signature and hash chain on read
  read(filters: EventFilter): Promise<GameEvent[]>;

  // Verify chain integrity from startEventId to endEventId
  verifyChain(startEventId: string, endEventId: string): Promise<ChainVerificationResult>;

  // Migrate events from oldVersion to currentVersion
  migrate(oldEvent: GameEvent, targetVersion: string): Promise<GameEvent>;

  // Create a snapshot at a given event index
  snapshot(eventIndex: number): Promise<EventSnapshot>;
}
```

The interface is storage-agnostic.
Concrete implementations (SQLite, PostgreSQL, EventStoreDB) swap
without changing the interface or the event schema.

---

## Version

event-versioning-spec.md v1.0.0
Effective: 2026-05-22
Last confirmed as constitutional baseline: 2026-05-22 (session: feat/godot-deprecation-20260522).
MAJOR changes: ADR + Human approval + migration test
MINOR changes: ADR + Human approval
PATCH changes: no special process
