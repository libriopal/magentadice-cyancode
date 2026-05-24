// contracts/Snapshot.v1.ts
// Frozen v1.0.0 — do not modify without Snapshot.v2.md + ADR + Human approval

import type { SchemaVersion, ClassArchetype } from './ReplayEvent.v1';

export interface EventSnapshot {
  snapshot_version: SchemaVersion;
  snapshot_id: string;
  event_index: number;
  event_id_at_snapshot: string;
  state_hash: string;
  predecessor_snapshot_hash: string;
  state: SnapshotState;
  snapshot_trigger: SnapshotTrigger;
  created_at: string;
  schema_version_at_snapshot: SchemaVersion;
  blockchain_tx_id?: string;
  sdx_amount?: number;                       // Q32.32 fixed-point integer
}

export type SnapshotTrigger =
  | 'INTERVAL_1000'
  | 'INTERVAL_60'
  | 'INTERVAL_5000'
  | 'SDX_AWARD'
  | 'MATCH_END'
  | 'MANUAL';

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
  fd_balance_delta: number;                  // Q32.32
  pdx_balance_delta: number;                 // Q32.32
  sdx_balance_delta: number;                 // Q32.32
}

export interface LedgerRunningTotals {
  total_fd_emitted: number;                  // Q32.32
  total_pdx_awarded: number;                 // Q32.32
  total_sdx_awarded: number;                 // Q32.32
  reconciliation_check: boolean;
}
