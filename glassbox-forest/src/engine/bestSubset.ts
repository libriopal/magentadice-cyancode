// Best-scoring-subset helper on top of the ported (sacred) scoreFarkle. In real Farkle you keep the
// scoring dice and set aside the rest — a roll only truly BUSTS when no subset scores at all. The
// ported scoreFarkle scores a set where EVERY die must contribute (it returns 0 if any die is unusable),
// which is correct for a chosen keep-set but wrong for "what is this roll worth?". This helper answers
// the latter by taking the max over subsets. It does NOT modify the sacred scorer.
import type { DieFace } from './farkle-engine';
import { scoreFarkle } from './farkle-engine';

export interface BestSubset {
  score: number;
  keptIndices: number[];
  isFarkle: boolean; // true iff no subset scores
}

/** Highest-scoring subset of a roll (partial credit). n<=6 → at most 63 subsets, cheap. */
export function bestSubsetScore(faces: DieFace[]): BestSubset {
  const n = faces.length;
  let best = 0;
  let bestIdx: number[] = [];
  for (let mask = 1; mask < 1 << n; mask++) {
    const subset: DieFace[] = [];
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(faces[i]!);
        idx.push(i);
      }
    }
    const s = scoreFarkle(subset).score;
    if (s > best) {
      best = s;
      bestIdx = idx;
    }
  }
  return { score: best, keptIndices: bestIdx, isFarkle: best === 0 };
}
