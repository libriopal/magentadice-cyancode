// Experiment #2 "Keeper's Dilemma" (P3). Closed-loop skill dice reusing the ported engine.
// Flow: commit → reveal all 6 faces → the player KEEPS a subset (the skill decision) → we
// score only the kept faces via scoreFarkle. The keep decision is post-reveal, so it never
// touches randomness; the 6 faces remain provably fair. We record the kept indices and the
// raw score — never a grade of whether the keep was "optimal" (C7 / anti-circularity).
import type { DieFace } from '../../engine/farkle-engine';
import { scoreFarkle } from '../../engine/farkle-engine';
import { commit, rollDice, deriveCombinedSeed, verifyRoll, type CommitData } from '../shared/fairness';

export const EXPERIMENT_ID = 'keeper';
export const DICE = 6;

export type KeeperCommit = CommitData;

export interface KeeperOutcome {
  experiment_id: 'keeper';
  client_seed: string;
  server_seed: string;
  commitment: string;
  combined_seed: string;
  faces: DieFace[];             // all 6 revealed faces (provably fair)
  kept_indices: number[];       // the player's skill decision
  kept_faces: DieFace[];
  score: number;
  is_farkle: boolean;
  combo: string;
  // no skill_score / was_optimal — C7.
}

export { commit };

function sanitizeKept(faces: DieFace[], keptIndices: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const i of keptIndices) {
    if (Number.isInteger(i) && i >= 0 && i < faces.length && !seen.has(i)) {
      seen.add(i);
      out.push(i);
    }
  }
  return out.sort((a, b) => a - b);
}

/** Step A — reveal all six faces (before the keep decision is made). */
export async function revealFaces(commitData: KeeperCommit, clientSeed: string): Promise<{ faces: DieFace[]; combined: string }> {
  const combined = await deriveCombinedSeed(commitData.serverSeed, [clientSeed]);
  const faces = await rollDice(combined, DICE);
  return { faces, combined };
}

/** Step B — resolve the keep decision into a recorded outcome. */
export function resolve(
  commitData: KeeperCommit,
  clientSeed: string,
  combined: string,
  faces: DieFace[],
  keptIndices: number[]
): KeeperOutcome {
  const kept = sanitizeKept(faces, keptIndices);
  const keptFaces = kept.map((i) => faces[i]!);
  const result = scoreFarkle(keptFaces);
  return {
    experiment_id: 'keeper',
    client_seed: clientSeed,
    server_seed: commitData.serverSeed,
    commitment: commitData.commitment,
    combined_seed: combined,
    faces,
    kept_indices: kept,
    kept_faces: keptFaces,
    score: result.score,
    is_farkle: keptFaces.length > 0 && result.isFarkle,
    combo: result.combo,
  };
}

export interface KeeperVerification {
  commitmentValid: boolean;
  combinedSeedMatch: boolean;
  facesMatch: boolean;
  scoreMatch: boolean;
  ok: boolean;
}

export async function verifyOutcome(o: KeeperOutcome): Promise<KeeperVerification> {
  const base = await verifyRoll(o.server_seed, o.commitment, o.client_seed, o.combined_seed, o.faces);
  // Re-score the kept subset independently from the (verified) faces.
  const keptFaces = o.kept_indices.map((i) => o.faces[i]!);
  const scoreMatch = scoreFarkle(keptFaces).score === o.score;
  return {
    commitmentValid: base.commitmentValid,
    combinedSeedMatch: base.combinedSeedMatch,
    facesMatch: base.facesMatch,
    scoreMatch,
    ok: base.commitmentValid && base.combinedSeedMatch && base.facesMatch && scoreMatch,
  };
}
