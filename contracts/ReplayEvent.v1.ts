// contracts/ReplayEvent.v1.ts
// Frozen v1.0.0 — do not modify without ReplayEvent.v2.md + ADR + Human approval

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

export interface GameEvent {
  schema_version: SchemaVersion;
  event_id: string;
  event_type: EventType;
  replay_tick: number;
  predecessor_hash: string;
  signature: string;
  created_at: string;
  session_seed_ref?: string;
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
  session_seed_committed: true;
  attestation_verdicts: Record<string, 'PASS' | 'ABSENT'>;
}

export interface RoundStartPayload {
  event_type: 'ROUND_START';
  round_number: number;
  game_seed_ref: string;
}

export interface TileSwapPayload {
  event_type: 'TILE_SWAP';
  player_id: string;
  position_a: [number, number];
  position_b: [number, number];
  input_tick: number;
}

export interface CascadeCompletePayload {
  event_type: 'CASCADE_COMPLETE';
  chain_depth: number;
  tiles_cleared: number;
  score_delta: number;                   // Q32.32 fixed-point integer
  class_multiplier_applied: string;
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
  amount: number;                        // Q32.32 fixed-point integer — never float
  match_id: string;
  attestation_verdict: 'PASS';
}

export interface FDEmitPayload {
  event_type: 'FD_EMIT';
  player_id: string;
  amount: number;                        // Q32.32 fixed-point integer
  source: 'MATCH_REWARD' | 'DAILY_CLAIM' | 'BIO_GARDEN_HARVEST' | 'QUEST_COMPLETE';
}

export interface SDXAwardPayload {
  event_type: 'SDX_AWARD';
  player_id: string;
  amount: number;                        // Q32.32 fixed-point integer
  award_source: 'LEVEL_COMPLETION' | 'STAKING_MATURITY' | 'GIVEAWAY' | 'MARKETPLACE';
  blockchain_tx_id: string;
  confirmation_block: number;
}

export interface RoundEndPayload {
  event_type: 'ROUND_END';
  round_number: number;
  final_score: number;                   // Q32.32
  rtp_running_average: number;           // Q32.32
}

export interface MatchEndPayload {
  event_type: 'MATCH_END';
  winner_player_id: string;
  final_scores: Record<string, number>;  // Q32.32 per player
  rtp_final: number;                     // Q32.32
  replay_hash: string;
}

export interface EventFilter {
  match_id?: string;
  player_id?: string;
  event_types?: EventType[];
  replay_tick_gte?: number;
  replay_tick_lte?: number;
  created_after?: string;
  created_before?: string;
  limit?: number;
  offset?: number;
}

export interface ChainVerificationResult {
  valid: boolean;
  events_verified: number;
  break_at_event_id?: string;
  break_reason?: string;
}
