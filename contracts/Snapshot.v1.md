# SNAPSHOT CONTRACT — VERSION 1
## FAR_NZY / magentadice-cyancode
## File: contracts/Snapshot.v1.md
## Status: FROZEN at v1.0.0 — any change requires migration adapter + ADR + Human approval
## Companion: contracts/IEventStore.v1.md, contracts/ReplayEvent.v1.md

---

## Freeze Declaration

`Snapshot.v1.md` is frozen at v1.0.0.

Any change to these type definitions:
- Requires a new contract file (Snapshot.v2.md)
- Requires a migration adapter
- Requires ADR
- Requires Human approval
- Requires replay regression test on full historical dataset

These contracts are the foundation of the replay system.
Refactoring them after the system is built would be extremely expensive.
Freeze now, not later.

---

## TypeScript Types

```typescript
// contracts/Snapshot.v1.ts
// Frozen v1.0.0

import type { SchemaVersion, ClassArchetype } from './ReplayEvent.v1';

/**
 * Checkpoint snapshot — immutable once written.
 * Predecessor hash chain links snapshots the same way events are linked.
 */
export interface EventSnapshot {
  snapshot_version: SchemaVersion;           // "1.0.0"
  snapshot_id: string;                       // UUID v4
  event_index: number;                       // Event count at this checkpoint
  event_id_at_snapshot: string;             // event_id of the event at this index
  state_hash: string;                        // sha256: SHA-256(JSON.stringify(state, sortedKeys))
  predecessor_snapshot_hash: string;         // sha256: hash of prior snapshot, or "genesis" for first
  state: SnapshotState;
  snapshot_trigger: SnapshotTrigger;
  created_at: string;                        // ISO 8601
  schema_version_at_snapshot: SchemaVersion; // Event schema version when snapshot was taken

  // Only present for SDX_AWARD snapshots
  blockchain_tx_id?: string;
  sdx_amount?: number;
}

export type SnapshotTrigger =
  | 'INTERVAL_1000'    // Standard 1,000-event interval
  | 'INTERVAL_60'      // PDX competitive 60-event interval
  | 'INTERVAL_5000'    // FD casual 5,000-event interval
  | 'SDX_AWARD'        // Immediate on every SDX award
  | 'MATCH_END'        // Always snapshot at match end
  | 'MANUAL';          // Explicitly triggered (testing, migration)

/**
 * The game state captured at a checkpoint.
 * Sufficient to reconstruct all subsequent events without
 * replaying from the beginning of the event stream.
 */
export interface SnapshotState {
  match_id: string;
  round_number: number;
  replay_tick: number;
  player_states: Record<string, PlayerSnapshotState>;
  ledger_running_totals: LedgerRunningTotals;
  rtp_running_average: number;               // Q32.32
  board_state: number[][];                   // Fixed-point tile type grid
  class_archetypes: Record<string, ClassArchetype>;
}

export interface PlayerSnapshotState {
  player_id: string;
  running_score: number;                     // Q32.32
  fd_balance_delta: number;                  // Q32.32 — delta since match start
  pdx_balance_delta: number;                 // Q32.32 — delta since match start
  sdx_balance_delta: number;                 // Q32.32 — delta since match start
}

export interface LedgerRunningTotals {
  total_fd_emitted: number;                  // Q32.32
  total_pdx_awarded: number;                 // Q32.32
  total_sdx_awarded: number;                 // Q32.32
  reconciliation_check: boolean;             // ΣDeposits + ΣWinnings - ΣFees - ΣRedemptions ≡ ΣActiveLedgers
}
```

---

## State Hash Computation

```typescript
// Deterministic deep serialization: recursively sort all object keys
function deterministicSerialize(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return (obj as unknown[]).map(deterministicSerialize);
  }
  const sorted: Record<string, unknown> = {};
  Object.keys(obj as Record<string, unknown>).sort().forEach(key => {
    sorted[key] = deterministicSerialize((obj as Record<string, unknown>)[key]);
  });
  return sorted;
}

// Hash the deterministically serialized state
// stateHash = sha256(JSON.stringify(deterministicSerialize(snapshot.state)))
```

All implementations MUST use this exact serialization to produce consistent state hashes.

---

## Version

contracts/Snapshot.v1.md v1.0.0 — FROZEN
Any modification → Snapshot.v2.md + migration adapter + ADR + Human approval
