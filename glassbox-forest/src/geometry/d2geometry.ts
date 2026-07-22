// L3 — D2 GEOMETRY. The coordinate system of the design space (a MAP, not a ranking).
// Derived from the DevOS D2 corpus: competency lens × information-surface × substrate, over a trait
// vector. No axis, coordinate, or trait is "better" than another — this module only NAMES the space.
// Selecting a "positive" region is barred (anti-circularity); only real human play may do that.

/** Competency lens — the five experience families the corpus keeps circling. */
export type Family =
  | 'foresight'        // calibration / prediction-before-reveal
  | 'intervention'     // author-the-future / seed / force / create scarcity
  | 'shaping'          // curate the pool / compose the bag
  | 'transformation'   // recombine / unlock / eureka discovery
  | 'commitment';      // push-your-luck / contestability / stakes-shaped (closed-loop)

export const FAMILIES: readonly Family[] = ['foresight', 'intervention', 'shaping', 'transformation', 'commitment'];

/** Information-surface — "what the player can perceive" (the corpus's orthogonal axis:
 *  meaningful action <= perceivable relevant information). */
export type InfoSurface = 'hidden' | 'partial' | 'full-read' | 'authored' | 'social-witness';
export const INFO_SURFACES: readonly InfoSurface[] = ['hidden', 'partial', 'full-read', 'authored', 'social-witness'];

/** Substrate variant — the mechanical shell a branch runs on (all reuse the same fair dice core). */
export type Substrate = 'single-roll' | 'multi-roll' | 'pool-compose' | 'sequence' | 'contest';
export const SUBSTRATES: readonly Substrate[] = ['single-roll', 'multi-roll', 'pool-compose', 'sequence', 'contest'];

/** Traits — the "D2 field of positive human experiences". Descriptive weights only, never a score. */
export type Trait =
  | 'discovery' | 'foresight' | 'mastery' | 'agency' | 'flow'
  | 'commitment' | 'tension' | 'recognition' | 'scarcity' | 'curiosity' | 'sovereignty';
export const TRAITS: readonly Trait[] = [
  'discovery', 'foresight', 'mastery', 'agency', 'flow',
  'commitment', 'tension', 'recognition', 'scarcity', 'curiosity', 'sovereignty',
];

export type TraitVector = Partial<Record<Trait, number>>;

/** A point in the design space. */
export interface Coordinate {
  family: Family;
  infoSurface: InfoSurface;
  substrate: Substrate;
}

/** The dominant trait pair each family expresses (descriptive anchor, not a ranking).
 *  The generator jitters weights around these anchors deterministically. */
export const FAMILY_TRAIT_ANCHORS: Record<Family, [Trait, Trait]> = {
  foresight: ['foresight', 'recognition'],
  intervention: ['agency', 'sovereignty'],
  shaping: ['mastery', 'scarcity'],
  transformation: ['discovery', 'curiosity'],
  commitment: ['commitment', 'tension'],
};

/** The rule layers each family contributes on top of the shared fair-dice substrate (L2, stage 2).
 *  Named here so branch-specs can reference them before the engine exists. */
export const FAMILY_RULE_LAYERS: Record<Family, string[]> = {
  foresight: ['predict-before-reveal', 'resolution-scoring'],
  intervention: ['author-seed', 'force-combo', 'create-scarcity'],
  shaping: ['compose-pool', 'curate-bag'],
  transformation: ['recombine', 'unlock-eureka'],
  commitment: ['push-your-luck', 'closed-loop-contest'],
};

/** The rule layer each information-surface contributes (how much the player perceives). */
export const INFO_RULE_LAYERS: Record<InfoSurface, string[]> = {
  hidden: [],
  partial: ['reveal-partial-distribution'],
  'full-read': ['reveal-full-distribution'],
  authored: ['reveal-authored-state'],
  'social-witness': ['reveal-social-witness'],
};

/** Total size of the primary grid (families × info-surfaces). */
export const GRID_SIZE = FAMILIES.length * INFO_SURFACES.length; // 25

/** Human-readable label for a coordinate. */
export function coordinateLabel(c: Coordinate): string {
  return `${c.family}/${c.infoSurface}/${c.substrate}`;
}
