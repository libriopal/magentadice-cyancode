// G1 SEAM — real-money / redemption / value-model. Built UP TO the gate: the interface exists and is
// wired, but every real-value action is REFUSED until a human grants G1 (+ G4 for the value-model flip)
// with licensed-counsel sign-off. The Sparks wallet stays earn-only + closed-loop; there is no working
// cash-out. This module makes the boundary executable — it does not open it.
import { requireGate } from '../governance/gates';

export type ValueModel = 'closed-loop' | 'redeemable';

// The value model is CLOSED-LOOP. Flipping to 'redeemable' is a human decision behind G1 + G4 + counsel —
// never a code edit the agent makes on its own. This constant is the single source of truth.
export const VALUE_MODEL: ValueModel = 'closed-loop';

export interface RedemptionRequest { userId: string; sparks: number }
export interface RedemptionResult { ok: boolean; reason: string }

/**
 * Attempt to redeem Sparks for real value. Structurally blocked: it calls requireGate('G1_REAL_MONEY'),
 * which throws because no client-side token can ever be granted (fail-closed). Even if reached, the
 * value model is closed-loop. This exists so the seam is testable + visible, not so it works.
 */
export function redeemSparks(_req: RedemptionRequest): RedemptionResult {
  requireGate('G1_REAL_MONEY'); // throws GateError — HALT
  // unreachable while closed-loop; kept explicit so the refusal is total.
  return { ok: false, reason: 'closed-loop: Sparks are non-redeemable' };
}

/** True only if the value model is redeemable AND G1 is granted. Always false today (closed-loop). */
export function isRedemptionOpen(): boolean {
  try { requireGate('G1_REAL_MONEY'); return VALUE_MODEL === 'redeemable'; }
  catch { return false; }
}
