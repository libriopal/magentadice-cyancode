// Node-side gate check: reads ratification/<GATE>.granted from disk. Used by node scripts (deploy,
// db-migrate, cohere) to HALT at a gate. The agent never creates these tokens — a human does.
import { existsSync, readFileSync } from 'node:fs';

export const GATE_TOKENS = {
  G1_REAL_MONEY: 'ratification/G1_REAL_MONEY.granted',
  G2_DEPLOY: 'ratification/G2_DEPLOY.granted',
  G3_SECRETS: 'ratification/G3_SECRETS.granted',
  G4_LEGAL_CONFIG: 'ratification/G4_LEGAL_CONFIG.granted',
  G5_IRREVERSIBLE: 'ratification/G5_IRREVERSIBLE.granted',
};

export function isGrantedNode(gate) {
  const token = GATE_TOKENS[gate];
  if (!token || !existsSync(token)) return false;
  // a valid token is a non-empty file (human writes "GRANTED BY <name> ON <date> FOR <scope>")
  try { return readFileSync(token, 'utf8').trim().length > 0; } catch { return false; }
}

export function escalate(gate, artifact) {
  console.error(`\nESCALATION — ${gate} is NOT granted; HALTING.`);
  console.error(`To proceed, a HUMAN must place ${GATE_TOKENS[gate]} and provide: ${artifact}.`);
  console.error('The agent cannot create this token and did not attempt to.\n');
}
