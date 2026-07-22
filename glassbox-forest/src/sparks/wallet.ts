// Sparks wallet — CLOSED-LOOP by construction (BUILD_DIRECTIVE P1, Constitution C6/C10).
// Sparks are non-redeemable: there is NO purchase, NO cash-out, NO transfer, and NO
// external value. This module exposes ONLY earn (append positive delta) + balance read.
// There is deliberately no debit/redeem/withdraw API — adding one is a G1 (real-money)
// gated action and must route to a human gate, never be added here casually.
import type { SparksLedgerRecord } from '../evidence/schema';

/** Fixed, content-independent award amounts. Surveys pay a FLAT bonus for completion,
 *  never for the content of answers (anti-circularity: we never grade the human). */
export const SPARKS = {
  PLAY: 10,
  SURVEY_COMPLETION: 25,
} as const;

/** Flat play reward is the same across every experiment (never tied to outcome quality). */
export type SparksReason = `play:${string}` | 'survey:completion';

export function makeEarnRecord(
  user_id: string,
  delta: number,
  reason: SparksReason,
  session_id: string | null,
  now: string = new Date().toISOString(),
  id: string = cryptoRandomId()
): SparksLedgerRecord {
  if (delta <= 0) {
    // Guardrail: the wallet only earns. Any non-positive delta is a programming error,
    // not a redemption path.
    throw new Error('Sparks wallet is closed-loop earn-only; delta must be > 0');
  }
  return { id, user_id, delta, reason, session_id, created_at: now };
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `sp_${Math.random().toString(36).slice(2)}`;
}
