// G2 SEAM — the "social-witness / spotlight" multiplayer feature the D2 King-of-Tokyo discovery named as
// KoT's distinctive essence (an AUDIENCE around one risk-taker). It is inherently multiplayer + public, so
// it is behind G2 (deploy/public exposure) — and spectator information asymmetry tensions with symmetric
// fairness (G1/G4 if it ever carries real value). Built UP TO the gate: the types + entry point exist and
// are dormant; startSpotlightSession() REFUSES without a G2 token. No server, no networking, no exposure.
import { requireGate } from '../governance/gates';

export type SpotlightRole = 'holder' | 'witness';

export interface SpotlightParticipant { userId: string; role: SpotlightRole }

export interface SpotlightSession {
  id: string;
  experimentId: string;      // e.g. 'hold-crown' — the risk-taker's live push-your-luck
  holder: string;            // the user in the spotlight
  witnesses: string[];       // the audience (never sees more than the holder — no spectator asymmetry until cleared)
  startedAt: string;
}

/**
 * Start a live spotlight session (holder + witnesses). Structurally blocked: requireGate('G2_DEPLOY')
 * throws because there is no client-side grant and no server. This exists so the seam is testable +
 * visible in the roadmap, not so it runs.
 */
export function startSpotlightSession(_experimentId: string, _holder: string): SpotlightSession {
  requireGate('G2_DEPLOY'); // throws — HALT until human grants G2 (+ counsel/G4 if real value)
  throw new Error('unreachable: G2 not granted');
}
