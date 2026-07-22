// Cohere proposer config — budget categories + thresholds, mirroring the FAR_NZY ai/config.ts model
// (isolated ceilings, no cross-borrow, warn/restrict/shutdown). NODE-SIDE ONLY: the COHERE_API_KEY is a
// G3 secret and must NEVER be read into the browser bundle. Nothing in src/app/** may import this file.
export type SpendCategory =
  | 'experience-proposal'
  | 'governance-audit'
  | 'retrieval'
  | 'monte-carlo'
  | 'quest';

/** $1000 allocation from the Cohere governance audit — isolated per category, no cross-borrow. */
export const BUDGET_CEILINGS_USD: Record<SpendCategory, number> = {
  'experience-proposal': 400,
  'governance-audit': 250,
  retrieval: 200,
  'monte-carlo': 100,
  quest: 50,
};

export const THRESHOLDS = { warn: 0.75, restrict: 0.9, shutdown: 1.0 } as const;

/** Read the Cohere key from the node environment only. Returns '' in the browser (by design — the
 *  secret must never reach the client), which forces graceful degradation to the deterministic path. */
export function cohereApiKey(): string {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.COHERE_API_KEY ?? '';
}

export function isCohereAvailable(): boolean {
  return cohereApiKey().length > 0;
}

export const COHERE_MODEL =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.COHERE_PROPOSAL_MODEL ??
  'command-r-08-2024';
