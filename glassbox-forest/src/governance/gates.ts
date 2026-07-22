// STRUCTURAL GATE ENFORCEMENT (in code, not just docs). Every gated action calls requireGate() and is
// REFUSED unless a human-created token exists. This is the "build up to the gate and HALT" boundary made
// executable. The agent CANNOT grant a gate: in the browser there is no runtime token access at all
// (fail-closed — no gate is ever granted client-side), and node scripts consult ratification/<GATE>.granted
// on disk via scripts/lib/gatesNode.mjs. There is deliberately no setter that grants a gate from code.
export type GateId = 'G1_REAL_MONEY' | 'G2_DEPLOY' | 'G3_SECRETS' | 'G4_LEGAL_CONFIG' | 'G5_IRREVERSIBLE';

export interface GateSpec { blocks: string; humanArtifact: string; token: string }

export const GATES: Record<GateId, GateSpec> = {
  G1_REAL_MONEY: { blocks: 'real-money / redemption / sweepstakes / value-model flip', humanArtifact: 'licensed-counsel sign-off + the value-model decision', token: 'ratification/G1_REAL_MONEY.granted' },
  G2_DEPLOY: { blocks: 'production deploy / public exposure / multiplayer spotlight', humanArtifact: 'deploy target + rollback plan', token: 'ratification/G2_DEPLOY.granted' },
  G3_SECRETS: { blocks: 'secrets / real DB writes / real Cohere spend', humanArtifact: 'scoped credentials (COHERE_API_KEY, DATABASE_URL)', token: 'ratification/G3_SECRETS.granted' },
  G4_LEGAL_CONFIG: { blocks: 'blocked_regions / value-model / geo-legal / KYC / age logic', humanArtifact: 'the approved change', token: 'ratification/G4_LEGAL_CONFIG.granted' },
  G5_IRREVERSIBLE: { blocks: 'data delete / force-push / irreversible actions', humanArtifact: 'explicit confirmation', token: 'ratification/G5_IRREVERSIBLE.granted' },
};

export class GateError extends Error {
  constructor(public readonly gate: GateId, public readonly escalation: string) {
    super(`GateError[${gate}]: blocked — ${escalation}`);
    this.name = 'GateError';
  }
}

export function escalationFor(id: GateId): string {
  const g = GATES[id];
  return [
    `ESCALATION — ${id} is NOT granted; this action is blocked and HALTED.`,
    `Blocks: ${g.blocks}.`,
    `To proceed, a HUMAN must place ${g.token} and provide: ${g.humanArtifact}.`,
    `The agent cannot create this token and did not attempt to.`,
  ].join(' ');
}

// Client-side grant registry: PERMANENTLY EMPTY. There is no code path that adds to it. Node scripts do
// their own on-disk token check (they never import this browser module for granting).
const CLIENT_GRANTS = new Set<GateId>();

export function isGranted(id: GateId): boolean {
  return CLIENT_GRANTS.has(id); // always false in the client — fail-closed
}

/** Throw a GateError unless the gate is granted. Every gated seam funnels through here. */
export function requireGate(id: GateId): void {
  if (!isGranted(id)) throw new GateError(id, escalationFor(id));
}
