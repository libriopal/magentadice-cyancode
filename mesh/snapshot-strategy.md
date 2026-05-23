# SNAPSHOT STRATEGY
## FAR_NZY / magentadice-cyancode
## Document: snapshot-strategy.md
## Status: Constitutional — changes require ADR + Human approval

---

## Principle

An event stream alone is insufficient for a long-lived system.
Reconstructing three years of match history from event zero
is computationally impractical.

Snapshots solve this by creating checkpoints:
reconstruct to the nearest snapshot, then replay forward.
This makes replay practical at any scale.

---

## Three-Layer Architecture

```
Event Stream
  ↓ (every event, chained)
Checkpoint Snapshots
  ↓ (every N events)
State Hashes
  ↓ (every snapshot, for verification)
```

All three layers must be consistent for a state to be considered verified.

---

## Snapshot Format

```json
{
  "snapshot_version": "1.0.0",
  "event_index": 1000,
  "event_id_at_snapshot": "uuid-v4",
  "state_hash": "sha256:...",
  "predecessor_snapshot_hash": "sha256:...",
  "state": {
    "match_state": { ... },
    "player_states": { ... },
    "ledger_running_totals": { ... },
    "rtp_running_average": "Q32.32 integer",
    "replay_tick": 60000
  },
  "created_at": "ISO 8601",
  "schema_version_at_snapshot": "1.0.0"
}
```

### State Hash Computation

```typescript
// Deterministic: recursively sort all keys before hashing
function deterministicSerialize(value: unknown): string {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return JSON.stringify(value);
  const sorted = Object.fromEntries(
    Object.keys(value as object).sort().map(k => [k, (value as Record<string, unknown>)[k]])
  );
  return "{" + Object.keys(sorted).map(k =>
    JSON.stringify(k) + ":" + deterministicSerialize(sorted[k])
  ).join(",") + "}";
}
const stateHash = sha256(deterministicSerialize(snapshot.state));
```

Recursive key sorting ensures the same state always produces the same hash
regardless of JavaScript object insertion order, including nested objects.
This is the same principle as Q32.32 math: eliminate environmental variance.

---

## Checkpoint Frequency

| Scenario | Checkpoint Interval | Rationale |
|---|---|---|
| Standard match play | Every 1,000 events | Practical reconstruction limit |
| PDX competitive match | Every 60 events (1 block) | Maximum auditability for real-money |
| FD casual play | Every 5,000 events | Lower stakes, larger interval acceptable |
| SDX award events | Immediate snapshot | Every SDX award triggers a checkpoint |

### Why 1,000 events as default?

At 60 events/second of heavy play:
- 1,000 events ≈ ~16 seconds of play
- Reconstruction from checkpoint: replay ~16 seconds forward
- Storage cost per snapshot: ~2–5KB (compressed)
- 1 million events = ~1,000 snapshots = ~5MB compressed

This is practical for years of operation.

---

## Reconstruction Protocol

```
1. Identify target event (by event_id or event_index)
2. Find the nearest snapshot BEFORE the target event
3. Load snapshot state
4. Verify snapshot state_hash matches computed hash of snapshot.state
5. Verify predecessor_snapshot_hash links to prior checkpoint
6. Replay events from snapshot.event_index forward to target event
7. Verify final state_hash matches expected output hash
8. If any verification fails → Level 3 Critical Violation
```

---

## Snapshot Chain Integrity

Snapshots form their own chain via `predecessor_snapshot_hash`.
This means tampering with a snapshot breaks the snapshot chain,
just as tampering with an event breaks the event chain.

Both chains must be valid for a match to be considered verified:

```
Valid state = valid event chain ∧ valid snapshot chain ∧ hashes match
```

---

## Snapshot Storage

| Location | Content | Retention |
|---|---|---|
| Supabase (PDX matches) | All PDX match snapshots | Permanent |
| Supabase (FD casual) | FD match snapshots | 1 year rolling |
| `runs/snapshots/` | Local test snapshots | Per session, git-committed |
| @match3d/blockchain | SDX award snapshots | Permanent (on-chain reference) |

---

## SDX Award Snapshots

Every SDX award creates an immediate snapshot because:
- SDX is blockchain-backed
- The blockchain transaction ID must be verifiable against match state
- The snapshot provides the state at the exact moment of SDX award

```json
{
  "snapshot_trigger": "SDX_AWARD",
  "blockchain_tx_id": "0x...",
  "sdx_amount": "Q32.32 integer",
  "state_hash": "sha256:...",
  "event_id": "uuid-v4"
}
```

This snapshot is stored both in Supabase and referenced on-chain.

---

## State Schema Stability

Snapshots embed `schema_version_at_snapshot` for the same reason
events embed `schema_version`: future readers must know
how to interpret historical state objects.

When event schema has a MAJOR version bump:
- Existing snapshots retain their original `schema_version_at_snapshot`
- Reconstruction uses the version-appropriate state reader
- Migration adapter handles state format differences

---

## Version

snapshot-strategy.md v1.0.0
Effective: at plan approval
Change authority: Human only
ADR required for checkpoint frequency changes or state format changes
