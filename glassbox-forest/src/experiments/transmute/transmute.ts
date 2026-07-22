// Experiment (TRANSFORMATION family → discovery/curiosity). "Transmute".
// The player rolls six provably-fair dice, then RECOMBINES them: each transform upgrades one die by +1
// (capped at 6) from a small budget, to DISCOVER a scoring combo hidden in the raw roll (recombine /
// unlock-eureka). The roll is verifiable; the transforms are recorded decisions. We score the best subset
// of the transformed dice. We record the raw decision + outcome, never a skill grade (C7).
import type { DieFace } from '../../engine/farkle-engine';
import { bestSubsetScore } from '../../engine/bestSubset';
import { commit, rollDice, deriveCombinedSeed, verifyServerSeed, type CommitData } from '../shared/fairness';

export const EXPERIMENT_ID = 'transmute';
export const DICE = 6;
export const TRANSFORM_BUDGET = 2;

export type TransmuteCommit = CommitData;

export interface TransmuteOutcome {
  experiment_id: 'transmute';
  client_seed: string;
  server_seed: string;
  commitment: string;
  combined_seed: string;
  rolled_faces: DieFace[];
  transforms: number[];      // die indices upgraded (+1 each), in order
  final_faces: DieFace[];
  score: number;
  is_farkle: boolean;
  kept_indices: number[];
  // no skill_score / was_optimal (C7).
}

export { commit };

function sanitizeTransforms(transforms: number[]): number[] {
  const out: number[] = [];
  for (const i of transforms) {
    if (Number.isInteger(i) && i >= 0 && i < DICE) out.push(i);
    if (out.length >= TRANSFORM_BUDGET) break;
  }
  return out;
}

/** Apply each transform: upgrade the die at that index by +1 (capped at 6). Order matters (2 on same
 *  die = +2), so applied sequentially. */
function applyTransforms(rolled: DieFace[], transforms: number[]): DieFace[] {
  const final = [...rolled];
  for (const i of transforms) final[i] = Math.min(6, (final[i]! + 1)) as DieFace;
  return final;
}

export async function reveal(commitData: TransmuteCommit, clientSeed: string, transformsInput: number[]): Promise<TransmuteOutcome> {
  const combined = await deriveCombinedSeed(commitData.serverSeed, [clientSeed]);
  const rolled = await rollDice(combined, DICE);
  const transforms = sanitizeTransforms(transformsInput);
  const final = applyTransforms(rolled, transforms);
  const best = bestSubsetScore(final);
  return {
    experiment_id: 'transmute',
    client_seed: clientSeed, server_seed: commitData.serverSeed, commitment: commitData.commitment, combined_seed: combined,
    rolled_faces: rolled, transforms, final_faces: final,
    score: best.score, is_farkle: best.isFarkle, kept_indices: best.keptIndices,
  };
}

export interface TransmuteVerification {
  commitmentValid: boolean; rolledMatch: boolean; finalMatch: boolean; scoreMatch: boolean; ok: boolean;
}

export async function verifyOutcome(o: TransmuteOutcome): Promise<TransmuteVerification> {
  const commitmentValid = await verifyServerSeed(o.server_seed, o.commitment);
  const combined = await deriveCombinedSeed(o.server_seed, [o.client_seed]);
  const rolled = await rollDice(combined, DICE);
  const rolledMatch = combined === o.combined_seed && rolled.every((f, i) => f === o.rolled_faces[i]);
  const final = applyTransforms(rolled, o.transforms);
  const finalMatch = final.every((f, i) => f === o.final_faces[i]);
  const scoreMatch = bestSubsetScore(final).score === o.score;
  return { commitmentValid, rolledMatch, finalMatch, scoreMatch, ok: commitmentValid && rolledMatch && finalMatch && scoreMatch };
}
