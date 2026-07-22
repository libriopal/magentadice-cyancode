// Experiment #1 "One-Roll" — single-player skill dice (BUILD_DIRECTIVE P1).
// Skill decision: the player commits to HOW MANY dice to roll (1..6) BEFORE the reveal.
// Fewer dice = a cleaner but lower-ceiling outcome; more dice = higher ceiling but more
// Farkle risk. That single pre-commitment is the "skill decision" whose reflection we capture.
//
// Provable fairness (Constitution C4): commit-reveal.
//   1) commit:  server picks serverSeed, publishes commitment = sha256(serverSeed).
//   2) player:  supplies a clientSeed + the dice-count decision.
//   3) reveal:  combined = sha256(serverSeed + clientSeed); dice rolled from CSPRNG(combined);
//               serverSeed is revealed so anyone can recompute via the public Verify view.
//
// We record ONLY the raw decision + raw outcome. We NEVER compute or store skill_score /
// was_optimal (C7 / anti-circularity) — the app captures, it never grades the human.
import type { DieFace } from '../../engine/farkle-engine';
import { scoreFarkle, type FarkleResult } from '../../engine/farkle-engine';
import { commit as sharedCommit, rollDice as sharedRollDice, deriveCombinedSeed, verifyServerSeed, clampInt, type CommitData } from '../shared/fairness';

export const EXPERIMENT_ID = 'one-roll';
export const MIN_DICE = 1;
export const MAX_DICE = 6;

// Kept as a named alias for backwards-compatible imports.
export type OneRollCommit = CommitData;

export interface OneRollOutcome {
  experiment_id: 'one-roll';
  dice_count: number;      // the player's pre-commitment (the skill decision)
  client_seed: string;
  server_seed: string;     // revealed
  commitment: string;
  combined_seed: string;
  faces: DieFace[];
  score: number;
  is_farkle: boolean;
  combo: string;
  // NB: no skill_score, no was_optimal — forbidden by C7.
}

/** Step 1 — commit. Produces the server seed (private) and its published commitment. */
export async function commit(): Promise<OneRollCommit> {
  return sharedCommit();
}

function clampDiceCount(n: number): number {
  return clampInt(n, MIN_DICE, MAX_DICE);
}

/** Deterministically roll `diceCount` faces from a combined seed (uniform d6). */
export async function rollDice(combinedSeed: string, diceCount: number): Promise<DieFace[]> {
  return sharedRollDice(combinedSeed, diceCount);
}

/** Step 3 — reveal + resolve. Given the committed seed, the player's clientSeed and
 *  dice-count decision, produce the full recorded outcome. */
export async function reveal(
  commitData: OneRollCommit,
  clientSeed: string,
  diceCount: number
): Promise<{ outcome: OneRollOutcome; result: FarkleResult }> {
  const count = clampDiceCount(diceCount);
  const combined = await deriveCombinedSeed(commitData.serverSeed, [clientSeed]);
  const faces = await rollDice(combined, count);
  const result = scoreFarkle(faces);
  const outcome: OneRollOutcome = {
    experiment_id: 'one-roll',
    dice_count: count,
    client_seed: clientSeed,
    server_seed: commitData.serverSeed,
    commitment: commitData.commitment,
    combined_seed: combined,
    faces,
    score: result.score,
    is_farkle: result.isFarkle,
    combo: result.combo,
  };
  return { outcome, result };
}

export interface VerificationReport {
  commitmentValid: boolean;   // sha256(revealed serverSeed) === commitment
  combinedSeedMatch: boolean; // recomputed combined === recorded combined
  facesMatch: boolean;        // recomputed faces === recorded faces
  scoreMatch: boolean;        // recomputed score === recorded score
  ok: boolean;                // all of the above
  recomputed: { combined_seed: string; faces: DieFace[]; score: number };
}

/** Public Verify view logic — recomputes everything from the revealed data and checks parity. */
export async function verifyOutcome(outcome: OneRollOutcome): Promise<VerificationReport> {
  const commitmentValid = await verifyServerSeed(outcome.server_seed, outcome.commitment);
  const combined = await deriveCombinedSeed(outcome.server_seed, [outcome.client_seed]);
  const faces = await rollDice(combined, outcome.dice_count);
  const result = scoreFarkle(faces);

  const combinedSeedMatch = combined === outcome.combined_seed;
  const facesMatch =
    faces.length === outcome.faces.length && faces.every((f, i) => f === outcome.faces[i]);
  const scoreMatch = result.score === outcome.score;

  return {
    commitmentValid,
    combinedSeedMatch,
    facesMatch,
    scoreMatch,
    ok: commitmentValid && combinedSeedMatch && facesMatch && scoreMatch,
    recomputed: { combined_seed: combined, faces, score: result.score },
  };
}
