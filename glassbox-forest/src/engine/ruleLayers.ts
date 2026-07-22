// L2 seam — RULE-LAYER REGISTRY. Ties the design-space geometry (L3) to concrete, playable experiment
// implementations. A BranchSpec references rule-layer names (from FAMILY_RULE_LAYERS / INFO_RULE_LAYERS);
// this registry records which of those layers are implemented today and which experiment realizes each
// family. Unimplemented layers are 'planned' — the FOREST ledger keeps their branches dormant until a
// human seeds them playable (never auto-promoted).
import type { Family } from '../geometry/d2geometry';

export interface RuleLayerDescriptor {
  name: string;
  scope: 'family' | 'info' | 'shared';
  implemented: boolean;
  note: string;
}

/** Every rule-layer name referenced by the geometry, with its current implementation status. */
export const RULE_LAYERS: Record<string, RuleLayerDescriptor> = {
  // shared fair core (always present)
  'commit-reveal': { name: 'commit-reveal', scope: 'shared', implemented: true, note: 'ported CSPRNG fairness' },
  // foresight
  'predict-before-reveal': { name: 'predict-before-reveal', scope: 'family', implemented: true, note: 'realized by Call Your Shot' },
  'resolution-scoring': { name: 'resolution-scoring', scope: 'family', implemented: true, note: 'met-target resolution' },
  // shaping
  'compose-pool': { name: 'compose-pool', scope: 'family', implemented: false, note: 'planned (pool composition)' },
  'curate-bag': { name: 'curate-bag', scope: 'family', implemented: true, note: 'realized by Keeper (subset curation)' },
  // commitment (KING OF TOKYO family)
  'push-your-luck': { name: 'push-your-luck', scope: 'family', implemented: true, note: 'realized by Hold the Crown' },
  'closed-loop-contest': { name: 'closed-loop-contest', scope: 'family', implemented: true, note: 'hold-under-pressure, solo/closed-loop' },
  // intervention (planned)
  'author-seed': { name: 'author-seed', scope: 'family', implemented: false, note: 'planned (author the draw)' },
  'force-combo': { name: 'force-combo', scope: 'family', implemented: false, note: 'planned' },
  'create-scarcity': { name: 'create-scarcity', scope: 'family', implemented: false, note: 'planned' },
  // transformation (planned)
  recombine: { name: 'recombine', scope: 'family', implemented: false, note: 'planned (recombine dice)' },
  'unlock-eureka': { name: 'unlock-eureka', scope: 'family', implemented: false, note: 'planned' },
  // information-surface layers
  'reveal-partial-distribution': { name: 'reveal-partial-distribution', scope: 'info', implemented: false, note: 'planned' },
  'reveal-full-distribution': { name: 'reveal-full-distribution', scope: 'info', implemented: true, note: 'full-read shown (Keeper)' },
  'reveal-authored-state': { name: 'reveal-authored-state', scope: 'info', implemented: true, note: 'authored target shown' },
  'reveal-social-witness': { name: 'reveal-social-witness', scope: 'info', implemented: false, note: 'planned (needs multiplayer)' },
};

/** A playable experiment bound to a design-space family. */
export interface ExperimentBinding {
  experimentId: string;
  family: Family;
  label: string;
  provablyFair: true;
}

/** Which experiment currently realizes each family (used to resolve a branch → a playable module). */
export const FAMILY_EXPERIMENTS: Partial<Record<Family, ExperimentBinding[]>> = {
  shaping: [
    { experimentId: 'one-roll', family: 'shaping', label: 'One-Roll', provablyFair: true },
    { experimentId: 'keeper', family: 'shaping', label: "Keeper's Dilemma", provablyFair: true },
  ],
  foresight: [{ experimentId: 'target', family: 'foresight', label: 'Call Your Shot', provablyFair: true }],
  commitment: [{ experimentId: 'hold-crown', family: 'commitment', label: 'Hold the Crown (King of Tokyo family)', provablyFair: true }],
};

/** Families with at least one playable experiment today. */
export function playableFamilies(): Family[] {
  return (Object.keys(FAMILY_EXPERIMENTS) as Family[]).filter((f) => (FAMILY_EXPERIMENTS[f]?.length ?? 0) > 0);
}

/** True if every rule layer a branch references is implemented (i.e. the branch is playable now). */
export function branchIsPlayable(ruleLayers: string[]): boolean {
  return ruleLayers.every((rl) => RULE_LAYERS[rl]?.implemented === true);
}
