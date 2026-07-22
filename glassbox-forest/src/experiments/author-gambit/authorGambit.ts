// Experiment (INTERVENTION family → agency/sovereignty). "Author's Gambit".
// The player AUTHORS the future: before the reveal they may FORCE up to MAX_FORCED dice to chosen faces
// (author-seed / force-combo / create-scarcity), but each forced die cuts the roll's value (the cost of
// intervention). The remaining dice come from the provably-fair CSPRNG. The skill decision is how much to
// author vs. leave to chance — high agency vs. high ceiling. Forced faces are recorded transparently; the
// random half is verifiable. We record the raw decision + outcome, never a skill grade (C7).
import type { DieFace } from '../../engine/farkle-engine';
import { bestSubsetScore } from '../../engine/bestSubset';
import { commit, rollDice, deriveCombinedSeed, verifyServerSeed, type CommitData } from '../shared/fairness';

export const EXPERIMENT_ID = 'author-gambit';
export const DICE = 6;
export const MAX_FORCED = 3;
export const FORCE_COST = 0.2; // each forced die reduces the multiplier by this much

export type AuthorGambitCommit = CommitData;
export type ForcedMap = Record<number, DieFace>; // die index → forced face

export interface AuthorGambitOutcome {
  experiment_id: 'author-gambit';
  client_seed: string;
  server_seed: string;
  commitment: string;
  combined_seed: string;
  forced: { index: number; face: DieFace }[];
  rolled_faces: DieFace[];   // the raw CSPRNG roll (verifiable)
  final_faces: DieFace[];    // rolled with forced overrides applied
  base_score: number;        // best-subset score of final_faces
  multiplier: number;        // 1 - FORCE_COST * forcedCount
  score: number;             // round(base_score * multiplier)
  kept_indices: number[];
  // no skill_score / was_optimal (C7).
}

export { commit };

function sanitizeForced(forced: ForcedMap): { index: number; face: DieFace }[] {
  const out: { index: number; face: DieFace }[] = [];
  const seen = new Set<number>();
  for (const [k, v] of Object.entries(forced)) {
    const i = Number(k);
    if (Number.isInteger(i) && i >= 0 && i < DICE && !seen.has(i) && v >= 1 && v <= 6) {
      seen.add(i);
      out.push({ index: i, face: v });
    }
    if (out.length >= MAX_FORCED) break;
  }
  return out.sort((a, b) => a.index - b.index);
}

function resolveFaces(rolled: DieFace[], forced: { index: number; face: DieFace }[]): DieFace[] {
  const final = [...rolled];
  for (const f of forced) final[f.index] = f.face;
  return final;
}

export async function reveal(commitData: AuthorGambitCommit, clientSeed: string, forcedInput: ForcedMap): Promise<AuthorGambitOutcome> {
  const combined = await deriveCombinedSeed(commitData.serverSeed, [clientSeed]);
  const rolled = await rollDice(combined, DICE);
  const forced = sanitizeForced(forcedInput);
  const final = resolveFaces(rolled, forced);
  const best = bestSubsetScore(final);
  const multiplier = Math.max(0, 1 - FORCE_COST * forced.length);
  return {
    experiment_id: 'author-gambit',
    client_seed: clientSeed, server_seed: commitData.serverSeed, commitment: commitData.commitment, combined_seed: combined,
    forced, rolled_faces: rolled, final_faces: final,
    base_score: best.score, multiplier, score: Math.round(best.score * multiplier), kept_indices: best.keptIndices,
  };
}

export interface AuthorGambitVerification {
  commitmentValid: boolean; rolledMatch: boolean; finalMatch: boolean; scoreMatch: boolean; ok: boolean;
}

export async function verifyOutcome(o: AuthorGambitOutcome): Promise<AuthorGambitVerification> {
  const commitmentValid = await verifyServerSeed(o.server_seed, o.commitment);
  const combined = await deriveCombinedSeed(o.server_seed, [o.client_seed]);
  const rolled = await rollDice(combined, DICE);
  const rolledMatch = combined === o.combined_seed && rolled.length === o.rolled_faces.length && rolled.every((f, i) => f === o.rolled_faces[i]);
  const final = resolveFaces(rolled, o.forced);
  const finalMatch = final.every((f, i) => f === o.final_faces[i]);
  const best = bestSubsetScore(final);
  const scoreMatch = Math.round(best.score * o.multiplier) === o.score;
  return { commitmentValid, rolledMatch, finalMatch, scoreMatch, ok: commitmentValid && rolledMatch && finalMatch && scoreMatch };
}
