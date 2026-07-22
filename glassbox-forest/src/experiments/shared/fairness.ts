// Shared commit-reveal fairness primitives (Constitution C4). Every experiment reuses
// these so the fairness contract is single-sourced (C10 reuse). Outcome shapes stay
// experiment-specific; only the crypto primitives live here.
import type { DieFace } from '../../engine/farkle-engine';
import {
  CSPRNG,
  generateServerSeed,
  hashServerSeed,
  deriveCombinedSeed,
  verifyServerSeed,
} from '../../engine/farkle-engine';

export interface CommitData {
  serverSeed: string;   // private until reveal
  commitment: string;   // sha256(serverSeed) — published before the roll
}

/** Step 1 — commit. */
export async function commit(): Promise<CommitData> {
  const serverSeed = await generateServerSeed();
  const commitment = await hashServerSeed(serverSeed);
  return { serverSeed, commitment };
}

/** Deterministically roll `count` uniform d6 faces from a combined seed. */
export async function rollDice(combinedSeed: string, count: number): Promise<DieFace[]> {
  const rng = new CSPRNG(combinedSeed);
  const faces: DieFace[] = [];
  for (let i = 0; i < count; i++) {
    faces.push((await rng.nextInt(1, 6)) as DieFace);
  }
  return faces;
}

export { deriveCombinedSeed, verifyServerSeed };

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/** Re-derive the dice from revealed data and check commitment + seed + faces parity. */
export async function verifyRoll(
  serverSeed: string,
  commitment: string,
  clientSeed: string,
  recordedCombined: string,
  recordedFaces: DieFace[]
): Promise<{ commitmentValid: boolean; combinedSeedMatch: boolean; facesMatch: boolean; combined: string; faces: DieFace[] }> {
  const commitmentValid = await verifyServerSeed(serverSeed, commitment);
  const combined = await deriveCombinedSeed(serverSeed, [clientSeed]);
  const faces = await rollDice(combined, recordedFaces.length);
  const combinedSeedMatch = combined === recordedCombined;
  const facesMatch = faces.length === recordedFaces.length && faces.every((f, i) => f === recordedFaces[i]);
  return { commitmentValid, combinedSeedMatch, facesMatch, combined, faces };
}
