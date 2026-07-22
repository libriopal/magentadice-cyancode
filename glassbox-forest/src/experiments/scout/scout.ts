// Experiment (FORESIGHT family × PARTIAL info-surface). "Scout".
// Realizes the "partial-read" information surface (partial < full): the player PEEKS one die (the scout)
// before committing HOW MANY dice to lock in. Scoring is ALL-OR-NOTHING (scoreFarkle over the committed
// faces — every die must contribute) — INTENTIONAL, because it makes the peek load-bearing: a scoring
// scout (1/5) lets you bank a safe single or push for more; a non-scoring scout forces a gamble. The
// scout is the first face of the same CSPRNG stream the commit rolls, so it is provably consistent.
// We record the scout, the commit, and the raw outcome — never a skill grade (C7).
import type { DieFace } from '../../engine/farkle-engine';
import { scoreFarkle } from '../../engine/farkle-engine';
import { commit, rollDice, deriveCombinedSeed, verifyServerSeed, clampInt, type CommitData } from '../shared/fairness';

export const EXPERIMENT_ID = 'scout';
export const MIN_DICE = 1;
export const MAX_DICE = 6;

export type ScoutCommit = CommitData;

export interface ScoutOutcome {
  experiment_id: 'scout';
  client_seed: string;
  server_seed: string;
  commitment: string;
  combined_seed: string;
  scout: DieFace;          // the peeked die (= faces[0])
  dice_count: number;      // total dice committed (incl. the scout), on partial info
  faces: DieFace[];
  score: number;           // all-or-nothing: every committed die must contribute
  is_farkle: boolean;
  combo: string;
  // no skill_score / was_optimal (C7).
}

export { commit };

/** Peek the scout die (the first face of the combined stream), before committing a dice count. */
export async function revealScout(commitData: ScoutCommit, clientSeed: string): Promise<{ scout: DieFace; combined: string }> {
  const combined = await deriveCombinedSeed(commitData.serverSeed, [clientSeed]);
  const faces = await rollDice(combined, 1);
  return { scout: faces[0]!, combined };
}

/** Commit `diceCount` dice (including the scout) on the partial info, then score all-or-nothing. */
export async function reveal(commitData: ScoutCommit, clientSeed: string, diceCount: number): Promise<ScoutOutcome> {
  const count = clampInt(diceCount, MIN_DICE, MAX_DICE);
  const combined = await deriveCombinedSeed(commitData.serverSeed, [clientSeed]);
  const faces = await rollDice(combined, count);
  const result = scoreFarkle(faces); // all-or-nothing (see header)
  return {
    experiment_id: 'scout',
    client_seed: clientSeed, server_seed: commitData.serverSeed, commitment: commitData.commitment, combined_seed: combined,
    scout: faces[0]!, dice_count: count, faces,
    score: result.score, is_farkle: result.isFarkle, combo: result.combo,
  };
}

export interface ScoutVerification {
  commitmentValid: boolean; combinedSeedMatch: boolean; scoutMatch: boolean; facesMatch: boolean; scoreMatch: boolean; ok: boolean;
}

export async function verifyOutcome(o: ScoutOutcome): Promise<ScoutVerification> {
  const commitmentValid = await verifyServerSeed(o.server_seed, o.commitment);
  const combined = await deriveCombinedSeed(o.server_seed, [o.client_seed]);
  const faces = await rollDice(combined, o.dice_count);
  const combinedSeedMatch = combined === o.combined_seed;
  const scoutMatch = faces[0] === o.scout;
  const facesMatch = faces.length === o.faces.length && faces.every((f, i) => f === o.faces[i]);
  const scoreMatch = scoreFarkle(faces).score === o.score;
  return {
    commitmentValid, combinedSeedMatch, scoutMatch, facesMatch, scoreMatch,
    ok: commitmentValid && combinedSeedMatch && scoutMatch && facesMatch && scoreMatch,
  };
}
