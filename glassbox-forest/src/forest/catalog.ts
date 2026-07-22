// Canonical catalog wiring: generate the seed-42 branch library, register all of it into a FOREST
// ledger, and mark the playable subset as seeded-playable. The playable subset EMPHASIZES the King of
// Tokyo family (Hold the Crown) per the human's request, and includes the three recreated experiments
// so at least one branch from every playable family is live. Everything else stays 'generated'
// (dormant) until real play or a human seeds it — never auto-promoted.
//
// Branch ids are seed-dependent (the generator chooses each cell's substrate from the seed), so the
// playable subset is resolved by COORDINATE against the generated catalog rather than hardcoded.
import { generateCatalog, type BranchSpec } from '../generator/branchGenerator';
import { ForestLedger } from './ledger';
import type { Family, InfoSurface } from '../geometry/d2geometry';

export const CANONICAL_SEED = 'seed-42';

interface PlayableBinding {
  experimentId: string;
  label: string;
  anchorId?: string;                                  // for the three recreated experiments
  coord?: { family: Family; infoSurface: InfoSurface }; // for generated branches (Hold the Crown)
}

/** Playable experiments this stage — Hold the Crown (emphasized) + the three recreated anchors. */
export const PLAYABLE_BINDINGS: PlayableBinding[] = [
  { experimentId: 'hold-crown', label: 'Hold the Crown (King of Tokyo family)', coord: { family: 'commitment', infoSurface: 'hidden' } },
  { experimentId: 'one-roll', label: 'One-Roll', anchorId: 'anchor:one-roll' },
  { experimentId: 'keeper', label: "Keeper's Dilemma", anchorId: 'anchor:keeper' },
  { experimentId: 'target', label: 'Call Your Shot', anchorId: 'anchor:target' },
  { experimentId: 'author-gambit', label: "Author's Gambit", coord: { family: 'intervention', infoSurface: 'authored' } },
  { experimentId: 'transmute', label: 'Transmute', coord: { family: 'transformation', infoSurface: 'hidden' } },
  { experimentId: 'scout', label: 'Scout', coord: { family: 'foresight', infoSurface: 'partial' } },
];

function resolveBranchId(specs: BranchSpec[], b: PlayableBinding): string {
  if (b.anchorId) return b.anchorId;
  const s = specs.find(
    (x) => x.kind === 'generated' && x.coordinate.family === b.coord!.family && x.coordinate.infoSurface === b.coord!.infoSurface
  );
  if (!s) throw new Error(`no generated branch for ${b.coord!.family}/${b.coord!.infoSurface}`);
  return s.id;
}

export interface CatalogHandle {
  seed: string;
  specs: BranchSpec[];
  ledger: ForestLedger;
  playableIds: string[];
  experimentToBranch: Record<string, string>;
  branchToExperiment: Record<string, string>;
}

/** Build the canonical catalog + a ledger with everything registered and the playable subset seeded. */
export function buildCanonicalCatalog(seed: string = CANONICAL_SEED): CatalogHandle {
  const specs = generateCatalog(seed);
  const ledger = new ForestLedger();
  for (const spec of specs) ledger.register(spec);

  const experimentToBranch: Record<string, string> = {};
  const branchToExperiment: Record<string, string> = {};
  const playableIds: string[] = [];
  for (const b of PLAYABLE_BINDINGS) {
    const id = resolveBranchId(specs, b);
    experimentToBranch[b.experimentId] = id;
    branchToExperiment[id] = b.experimentId;
    playableIds.push(id);
    ledger.markSeededPlayable(id);
  }

  return { seed, specs, ledger, playableIds, experimentToBranch, branchToExperiment };
}
