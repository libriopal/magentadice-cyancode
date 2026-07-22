// Experiment (KING OF TOKYO family → commitment / contestability). "Hold the Crown".
//
// King of Tokyo's core decision is: sit in an EXPOSED position that pays more each turn but exposes
// you to escalating attacks you can't heal — do you HOLD for the growing reward or YIELD to safety
// before you're knocked out? We capture that decision in a closed-loop, solo, provably-fair form (no
// gated PvP): each round is one provably-fair 6-die roll scored by the ported scoreFarkle. While you
// HOLD the crown, each round's score is multiplied by a growing factor — but a Farkle (bust) while
// holding wipes the entire held pot (the "knocked out of Tokyo" moment). BANK to secure the pot and
// end the session.
//
// We record the raw rolls, the hold/bank decisions, and the final total. We NEVER compute or store a
// skill grade (no skill_score / was_optimal) — the system captures the decision, it never judges it.
import type { DieFace } from '../../engine/farkle-engine';
import { bestSubsetScore } from '../../engine/bestSubset';
import { commit, rollDice, deriveCombinedSeed, verifyServerSeed, type CommitData } from '../shared/fairness';

export const EXPERIMENT_ID = 'hold-crown';
export const DICE = 6;
export const MAX_ROUNDS = 6;
export const BASE_MULT = 1;
export const HOLD_INCREMENT = 0.5;

export type HoldCrownCommit = CommitData;
export type Decision = 'hold' | 'bank';

export interface RoundResult {
  round: number;      // 0-based
  faces: DieFace[];
  roundScore: number; // raw scoreFarkle of the roll
  multiplier: number; // hold multiplier applied this round
  isFarkle: boolean;
}

export interface HoldCrownOutcome {
  experiment_id: 'hold-crown';
  client_seed: string;
  server_seed: string;
  commitment: string;
  rounds: RoundResult[];
  decisions: Decision[];  // decision made AFTER each resolved (non-bust) round
  busted: boolean;        // a Farkle occurred while holding → pot wiped
  final_total: number;    // secured points (0 if busted)
  max_multiplier: number;
  // no skill_score / was_optimal — anti-circularity (C7).
}

export { commit };

/** Multiplier for a given (0-based) round while holding the crown. */
export function multiplierFor(round: number): number {
  return BASE_MULT + HOLD_INCREMENT * round;
}

// CALIBRATION surface (grounded in the D2 King-of-Tokyo discovery: KoT = commitment + CALIBRATION +
// intervention + consequence). Each held round is 6 fresh fair dice, so the per-round bust (Farkle)
// probability is CONSTANT — the stakes rise, not the odds ("rising-variance-under-commitment"). We
// surface this read so the hold decision is a calibrated wager, informed but not solved.
let _bustProb: number | null = null;
export function bustProbabilityPerRound(): number {
  if (_bustProb !== null) return _bustProb;
  const total = 6 ** DICE;
  const faces = new Array<DieFace>(DICE).fill(1) as DieFace[];
  let zeros = 0;
  for (let i = 0; i < total; i++) {
    let n = i;
    for (let d = 0; d < DICE; d++) {
      faces[d] = ((n % 6) + 1) as DieFace;
      n = Math.floor(n / 6);
    }
    if (bestSubsetScore(faces).isFarkle) zeros += 1; // true bust = no subset scores
  }
  _bustProb = zeros / total;
  return _bustProb;
}

/** Deterministically roll round `r` from the committed seed + client seed. Each round has an
 *  independent, reproducible sub-stream keyed by the round index. */
export async function playRound(commitData: HoldCrownCommit, clientSeed: string, round: number): Promise<RoundResult> {
  const combined = await deriveCombinedSeed(commitData.serverSeed, [clientSeed, `round:${round}`]);
  const faces = await rollDice(combined, DICE);
  // Partial credit: keep the best scoring subset (real Farkle). Bust only on a TRUE farkle (no subset scores).
  const best = bestSubsetScore(faces);
  return {
    round,
    faces,
    roundScore: best.score,
    multiplier: multiplierFor(round),
    isFarkle: best.isFarkle,
  };
}

/**
 * Resolve a full session from the player's decision sequence. `decisions[r]` is the choice made after
 * round r resolves without busting: 'hold' continues to round r+1, 'bank' secures the pot and ends.
 * The engine stops at the first bust, the first 'bank', or MAX_ROUNDS.
 */
export async function resolveSession(
  commitData: HoldCrownCommit,
  clientSeed: string,
  decisions: Decision[]
): Promise<HoldCrownOutcome> {
  const rounds: RoundResult[] = [];
  const madeDecisions: Decision[] = [];
  let pot = 0;
  let busted = false;
  let maxMultiplier = 0;

  for (let r = 0; r < MAX_ROUNDS; r++) {
    const rr = await playRound(commitData, clientSeed, r);
    rounds.push(rr);
    maxMultiplier = Math.max(maxMultiplier, rr.multiplier);

    if (rr.isFarkle) {
      // Bust. Round 0 farkle simply scores nothing; a farkle while holding (r>0) wipes the pot.
      if (r > 0) {
        busted = true;
        pot = 0;
      }
      break;
    }

    // Successful round: add this round's score at the current hold multiplier.
    pot += Math.round(rr.roundScore * rr.multiplier);

    const decision: Decision = decisions[r] ?? 'bank'; // default to banking if no further decision
    madeDecisions.push(decision);
    if (decision === 'bank') break;
    // otherwise hold → continue to next round
  }

  return {
    experiment_id: 'hold-crown',
    client_seed: clientSeed,
    server_seed: commitData.serverSeed,
    commitment: commitData.commitment,
    rounds,
    decisions: madeDecisions,
    busted,
    final_total: busted ? 0 : pot,
    max_multiplier: maxMultiplier,
  };
}

export interface HoldCrownVerification {
  commitmentValid: boolean;
  roundsMatch: boolean;   // every recorded round's faces recompute identically
  totalMatch: boolean;    // the final total recomputes from the recorded rolls + decisions
  ok: boolean;
}

/** Public Verify — recompute every round from the revealed seeds and re-derive the total from the
 *  recorded decisions, confirming nothing was altered. */
export async function verifyOutcome(o: HoldCrownOutcome): Promise<HoldCrownVerification> {
  const commitmentValid = await verifyServerSeed(o.server_seed, o.commitment);

  let roundsMatch = true;
  for (const rr of o.rounds) {
    const recomputed = await playRound({ serverSeed: o.server_seed, commitment: o.commitment }, o.client_seed, rr.round);
    const facesMatch = recomputed.faces.length === rr.faces.length && recomputed.faces.every((f, i) => f === rr.faces[i]);
    if (!facesMatch || recomputed.roundScore !== rr.roundScore || recomputed.isFarkle !== rr.isFarkle) {
      roundsMatch = false;
      break;
    }
  }

  // Re-derive the total from the recorded rounds + decisions (independent of the recorded total).
  let pot = 0;
  let busted = false;
  for (let i = 0; i < o.rounds.length; i++) {
    const rr = o.rounds[i]!;
    if (rr.isFarkle) {
      if (rr.round > 0) { busted = true; pot = 0; }
      break;
    }
    pot += Math.round(rr.roundScore * rr.multiplier);
    if ((o.decisions[i] ?? 'bank') === 'bank') break;
  }
  const derivedTotal = busted ? 0 : pot;
  const totalMatch = derivedTotal === o.final_total && busted === o.busted;

  return {
    commitmentValid,
    roundsMatch,
    totalMatch,
    ok: commitmentValid && roundsMatch && totalMatch,
  };
}
