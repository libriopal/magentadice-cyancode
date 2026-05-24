// contracts/IEventStore.ts
// Frozen v1.0.0 — do not modify without IEventStore.v2.md + ADR + Human approval

import type { GameEvent, EventFilter, ChainVerificationResult } from './ReplayEvent.v1';
import type { EventSnapshot } from './Snapshot.v1';

export interface IEventStore {
  write(
    event: Omit<GameEvent, 'event_id' | 'predecessor_hash' | 'signature' | 'created_at'>
  ): Promise<GameEvent>;

  read(filters: EventFilter): Promise<GameEvent[]>;

  verifyChain(
    startEventId: string,
    endEventId: string
  ): Promise<ChainVerificationResult>;

  migrate(
    oldEvent: GameEvent,
    targetVersion: string
  ): Promise<GameEvent>;

  snapshot(eventIndex: number): Promise<EventSnapshot>;

  loadSnapshot(beforeEventIndex: number): Promise<EventSnapshot | null>;

  // sessionSeed is supplied separately (not only via inputLog.sessionSeed) so the
  // caller can provide an independently-verified seed for cross-validation. Implementations
  // must assert sessionSeed === inputLog.sessionSeed and reject if they differ.
  replay(sessionSeed: string, inputLog: MatchInputLog): Promise<ReplayResult>;

  healthCheck(): Promise<{ connected: boolean; chainHeadValid: boolean; lastEventIndex: number }>;
}

export interface MatchInputLog {
  sessionSeed: string;
  roomId: string;
  matchId: string;
  roundNumber: number;
  classArchetype: 'Paladin' | 'Rogue' | 'Bard';
  inputs: Array<{
    tick: number;
    type: 'TILE_SWAP' | 'POCKET_DEPLOY' | 'MATCH_PASS';
    payload: Record<string, unknown>;
  }>;
}

export interface ReplayResult {
  finalState: Record<string, unknown>;
  finalStateHash: string;
  matchesStoredHash: boolean;
  replayTicks: number;
  eventsProcessed: number;
}

export type { GameEvent, EventFilter, ChainVerificationResult } from './ReplayEvent.v1';
export type { EventSnapshot } from './Snapshot.v1';
