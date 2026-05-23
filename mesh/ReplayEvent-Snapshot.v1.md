# REPLAY EVENT CONTRACT — VERSION 1
# SNAPSHOT CONTRACT — VERSION 1
## FAR_NZY / magentadice-cyancode
## File: contracts/ReplayEvent.v1.md + Snapshot.v1.md (combined for efficiency)
## Status: FROZEN at v1.0.0

---

# PART 1 — ReplayEvent.v1

## TypeScript Types

```typescript
// contracts/ReplayEvent.v1.ts
// Frozen v1.0.0

export type SchemaVersion = `${number}.${number}.${number}`;

export type EventType =
  | 'MATCH_START'
  | 'ROUND_START'
  | 'TILE_SWAP'
  | 'CASCADE_COMPLETE'
  | 'MATCH_SCORE'
  | 'PDX_AWARD'
  | 'FD_EMIT'
  | 'SDX_AWARD'
  | 'ROUND_END'
  | 'MATCH_END';

export type ClassArchetype = 'Paladin' | 'Rogue' | 'Bard';

/**
 * Canonical game event — frozen v1.0.0.
 * All fields marked IMMUTABLE cannot change after write.
 * All SHA-256 hashes use lowercase hex encoding.
 */
export interface GameEvent {
  // --- Required fields — IMMUTABLE after write ---
  schema_version: SchemaVersion;         // e.g. "1.0.0"
  event_id: string;                      // UUID v4 — IMMUTABLE
  event_type: EventType;                 // IMMUTABLE
  replay_tick: number;                   // Fixed dt=1/60 tick — IMMUTABLE
  predecessor_hash: string;              // sha256: prefix + hex — IMMUTABLE
  signature: string;                     // hmac-sha256: prefix + hex — IMMUTABLE
  created_at: string;                    // ISO 8601, server-side — IMMUTABLE

  // --- Optional fields — type-safe per event_type ---
  session_seed_ref?: string;             // sha256 ref to committed SESSION seed
  payload: GameEventPayload;
}

export type GameEventPayload =
  | MatchStartPayload
  | RoundStartPayload
  | TileSwapPayload
  | CascadeCompletePayload
  | MatchScorePayload
  | PDXAwardPayload
  | FDEmitPayload
  | SDXAwardPayload
  | RoundEndPayload
  | MatchEndPayload;

export interface MatchStartPayload {
  event_type: 'MATCH_START';
  room_id: string;
  player_ids: string[];
  class_archetypes: Record<string, ClassArchetype>;
  session_seed_committed: true;          // Must be true — seed committed before start
  attestation_verdicts: Record<string, 'PASS' | 'ABSENT'>;
}

export interface RoundStartPayload {
  event_type: 'ROUND_START';
  round_number: number;
  game_seed_ref: string;                 // sha256 ref to derived GAME seed
}

export interface TileSwapPayload {
  event_type: 'TILE_SWAP';
  player_id: string;
  position_a: [number, number];
  position_b: [number, number];
  input_tick: number;                    // Tick at which input was registered
}

export interface CascadeCompletePayload {
  event_type: 'CASCADE_COMPLETE';
  chain_depth: number;
  tiles_cleared: number;
  score_delta: number;                   // Q32.32 fixed-point integer
  class_multiplier_applied: string;      // "1.0", "1.15", "1.85", "2.5" etc.
}

export interface MatchScorePayload {
  event_type: 'MATCH_SCORE';
  player_id: string;
  score_delta: number;                   // Q32.32 fixed-point integer
  running_total: number;                 // Q32.32 fixed-point integer
  class_archetype: ClassArchetype;
}

export interface PDXAwardPayload {
  event_type: 'PDX_AWARD';
  player_id: string;
  amount: number;                        // Fixed-point integer — never float
  match_id: string;
  attestation_verdict: 'PASS';           // Only PASS — absent verdict = no award
}

export interface FDEmitPayload {
  event_type: 'FD_EMIT';
  player_id: string;
  amount: number;                        // Fixed-point integer
  source: 'MATCH_REWARD' | 'DAILY_CLAIM' | 'BIO_GARDEN_HARVEST' | 'QUEST_COMPLETE';
}

export interface SDXAwardPayload {
  event_type: 'SDX_AWARD';
  player_id: string;
  amount: number;                        // Fixed-point integer
  award_source: 'LEVEL_COMPLETION' | 'STAKING_MATURITY' | 'GIVEAWAY' | 'MARKETPLACE';
  blockchain_tx_id: string;             // REQUIRED — on-chain confirmation
  confirmation_block: number;           // Block number at confirmation
}

export interface RoundEndPayload {
  event_type: 'ROUND_END';
  round_number: number;
  final_score: number;                  // Q32.32
  rtp_running_average: number;          // Q32.32 — running RTP over this session
}

export interface MatchEndPayload {
  event_type: 'MATCH_END';
  winner_player_id: string;
  final_scores: Record<string, number>; // Q32.32 per player
  rtp_final: number;                    // Q32.32
  replay_hash: string;                  // SHA-256 of full event stream
}

/**
 * Filter for reading events.
 */
export interface EventFilter {
  match_id?: string;
  player_id?: string;
  event_types?: EventType[];
  replay_tick_gte?: number;
  replay_tick_lte?: number;
  created_after?: string;               // ISO 8601
  created_before?: string;             // ISO 8601
  limit?: number;
  offset?: number;
}

/**
 * Chain verification result.
 */
export interface ChainVerificationResult {
  valid: boolean;
  events_verified: number;
  break_at_event_id?: string;          // Present only if valid === false
  break_reason?: string;               // Human-readable reason
}
```

---

# PART 2 — Snapshot.v1

## TypeScript Types

```typescript
// contracts/Snapshot.v1.ts
// Frozen v1.0.0

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

## Freeze Declaration (Both Contracts)

`ReplayEvent.v1.md` and `Snapshot.v1.md` are frozen at v1.0.0.

Any change to these type definitions:
- Requires a new contract file (ReplayEvent.v2.md)
- Requires a migration adapter
- Requires ADR
- Requires Human approval
- Requires replay regression test on full historical dataset

These contracts are the foundation of the replay system.
Refactoring them after the system is built would be extremely expensive.
Freeze now, not later.

---

## Version

contracts/ReplayEvent.v1.md v1.0.0 — FROZEN
contracts/Snapshot.v1.md v1.0.0 — FROZEN
