// L4 — BRANCH GENERATOR. A seeded, deterministic sampler over the D2 geometry (L3). It produces
// candidate branch-SPECS — coordinates + composed rule layers + a descriptive trait vector. It does
// NOT decide which branches are good (that is selection, which is barred); it only enumerates the
// search structure. Every spec carries its seed so it is reproducible + archivable (CON-3).
//
// Structure: the 25 primary branches fully cover the family × info-surface grid (structured coverage),
// while substrate assignment and trait-weight jitter are seeded-random per coordinate ("randomized
// branches mapped across the D2 field"). The three current experiments are emitted as fixed anchors
// so "recreate current" is represented without losing anything.
import {
  FAMILIES, INFO_SURFACES, SUBSTRATES, FAMILY_TRAIT_ANCHORS, FAMILY_RULE_LAYERS, INFO_RULE_LAYERS,
  coordinateLabel, type Coordinate, type TraitVector, type Family, type InfoSurface, type Substrate,
} from '../geometry/d2geometry';
import { SeededRng } from './prng';

export interface BranchSpec {
  id: string;                    // stable id derived from coordinate (+ seed for generated branches)
  kind: 'anchor' | 'generated';
  coordinate: Coordinate;
  traitVector: TraitVector;      // descriptive weights (sum ~1), NEVER a score/ranking
  ruleLayers: string[];          // L2 layers to compose (instantiated in stage 2)
  seed: string;                  // provenance: reproducible from this
  provenance: 'generated';       // never 'observed' — only real play produces observed provenance
}

/** The three current experiments, re-expressed as fixed anchor coordinates (recreate-current). */
export const ANCHORS: { id: string; coordinate: Coordinate }[] = [
  { id: 'anchor:one-roll', coordinate: { family: 'shaping', infoSurface: 'hidden', substrate: 'single-roll' } },
  { id: 'anchor:keeper', coordinate: { family: 'shaping', infoSurface: 'full-read', substrate: 'multi-roll' } },
  { id: 'anchor:target', coordinate: { family: 'foresight', infoSurface: 'authored', substrate: 'single-roll' } },
];

function normalize(weights: Record<string, number>): TraitVector {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const out: TraitVector = {};
  for (const [k, v] of Object.entries(weights)) out[k as keyof TraitVector] = Math.round((v / total) * 1000) / 1000;
  return out;
}

/** Descriptive trait vector for a coordinate: dominant family anchors + seeded jitter. */
function traitVectorFor(family: Family, rng: SeededRng): TraitVector {
  const [a, b] = FAMILY_TRAIT_ANCHORS[family];
  const wa = 0.4 + rng.next() * 0.3; // dominant
  const wb = 0.25 + rng.next() * 0.2;
  const wRest = 0.15 + rng.next() * 0.15; // spread as flavour
  return normalize({ [a]: wa, [b]: wb, flow: wRest });
}

function specId(coordinate: Coordinate): string {
  return `br:${coordinate.family}:${coordinate.infoSurface}:${coordinate.substrate}`;
}

/** Deterministically choose a substrate for a coordinate (seeded per family).
 *  `_info` is accepted for future substrate/info-surface coupling; unused today. */
function substrateFor(family: Family, _info: InfoSurface, rng: SeededRng): Substrate {
  // Bias each family toward a natural substrate, but let the seed vary it.
  const bias: Record<Family, Substrate> = {
    foresight: 'single-roll',
    intervention: 'pool-compose',
    shaping: 'pool-compose',
    transformation: 'sequence',
    commitment: 'contest',
  };
  return rng.next() < 0.6 ? bias[family] : rng.pick(SUBSTRATES);
}

/**
 * Generate the branch catalog from a master seed. Produces the 25-cell family × info-surface grid
 * plus the 3 anchors = 28 specs. Fully deterministic: same seed → identical catalog.
 */
export function generateCatalog(masterSeed: string): BranchSpec[] {
  const specs: BranchSpec[] = [];

  // Anchors first (fixed coordinates; still reproducible, seed recorded for provenance).
  for (const anchor of ANCHORS) {
    const rng = new SeededRng(`${masterSeed}|${anchor.id}`);
    specs.push({
      id: anchor.id,
      kind: 'anchor',
      coordinate: anchor.coordinate,
      traitVector: traitVectorFor(anchor.coordinate.family, rng),
      ruleLayers: [...FAMILY_RULE_LAYERS[anchor.coordinate.family], ...INFO_RULE_LAYERS[anchor.coordinate.infoSurface]],
      seed: `${masterSeed}|${anchor.id}`,
      provenance: 'generated',
    });
  }

  // The 25 generated branches: structured grid coverage, seeded detail.
  for (const family of FAMILIES) {
    for (const infoSurface of INFO_SURFACES) {
      const cellSeed = `${masterSeed}|${family}|${infoSurface}`;
      const rng = new SeededRng(cellSeed);
      const substrate = substrateFor(family, infoSurface, rng);
      const coordinate: Coordinate = { family, infoSurface, substrate };
      specs.push({
        id: specId(coordinate),
        kind: 'generated',
        coordinate,
        traitVector: traitVectorFor(family, rng),
        ruleLayers: [...FAMILY_RULE_LAYERS[family], ...INFO_RULE_LAYERS[infoSurface]],
        seed: cellSeed,
        provenance: 'generated',
      });
    }
  }

  return specs;
}

/** Convenience: human-readable one-line summary of a spec. */
export function describeSpec(s: BranchSpec): string {
  const traits = Object.entries(s.traitVector).map(([t, w]) => `${t} ${w}`).join(', ');
  return `${s.id} [${s.kind}] ${coordinateLabel(s.coordinate)} :: ${traits}`;
}
