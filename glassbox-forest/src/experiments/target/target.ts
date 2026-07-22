// Experiment #3 "Call Your Shot" (P3). Closed-loop skill dice reusing the ported engine.
// Flow: BEFORE the reveal the player sets a self-chosen target score AND a dice count (the
// skill decision — a risk contract with themselves). Reveal → roll → score. We record the
// target, the dice count, the raw score, and whether the player MET THEIR OWN target.
// `met_target` is the player's self-defined goal outcome, NOT a system grade of skill — we
// still never compute or store skill_score / was_optimal (C7).
import type { DieFace } from '../../engine/farkle-engine';
import { scoreFarkle } from '../../engine/farkle-engine';
import { commit, rollDice, deriveCombinedSeed, verifyRoll, clampInt, type CommitData } from '../shared/fairness';

export const EXPERIMENT_ID = 'target';
export const MIN_DICE = 1;
export const MAX_DICE = 6;
export const MIN_TARGET = 50;
export const MAX_TARGET = 3000;

export type TargetCommit = CommitData;

export interface TargetOutcome {
  experiment_id: 'target';
  client_seed: string;
  server_seed: string;
  commitment: string;
  combined_seed: string;
  dice_count: number;      // pre-commit decision
  target_score: number;    // pre-commit self-set goal
  faces: DieFace[];
  score: number;
  met_target: boolean;     // player's own goal outcome, not a skill grade
  is_farkle: boolean;
  combo: string;
  // no skill_score / was_optimal — C7.
}

export { commit };

export async function reveal(
  commitData: TargetCommit,
  clientSeed: string,
  diceCount: number,
  targetScore: number
): Promise<TargetOutcome> {
  const count = clampInt(diceCount, MIN_DICE, MAX_DICE);
  const target = clampInt(targetScore, MIN_TARGET, MAX_TARGET);
  const combined = await deriveCombinedSeed(commitData.serverSeed, [clientSeed]);
  const faces = await rollDice(combined, count);
  const result = scoreFarkle(faces);
  return {
    experiment_id: 'target',
    client_seed: clientSeed,
    server_seed: commitData.serverSeed,
    commitment: commitData.commitment,
    combined_seed: combined,
    dice_count: count,
    target_score: target,
    faces,
    score: result.score,
    met_target: result.score >= target,
    is_farkle: result.isFarkle,
    combo: result.combo,
  };
}

export interface TargetVerification {
  commitmentValid: boolean;
  combinedSeedMatch: boolean;
  facesMatch: boolean;
  scoreMatch: boolean;
  metTargetMatch: boolean;
  ok: boolean;
}

export async function verifyOutcome(o: TargetOutcome): Promise<TargetVerification> {
  const base = await verifyRoll(o.server_seed, o.commitment, o.client_seed, o.combined_seed, o.faces);
  const score = scoreFarkle(o.faces).score;
  const scoreMatch = score === o.score;
  const metTargetMatch = (score >= o.target_score) === o.met_target;
  return {
    commitmentValid: base.commitmentValid,
    combinedSeedMatch: base.combinedSeedMatch,
    facesMatch: base.facesMatch,
    scoreMatch,
    metTargetMatch,
    ok: base.commitmentValid && base.combinedSeedMatch && base.facesMatch && scoreMatch && metTargetMatch,
  };
}
