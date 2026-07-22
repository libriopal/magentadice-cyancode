// The L2 seam: the rule-layer registry must correctly report which branches are playable and bind the
// King of Tokyo family to Hold the Crown.
import { describe, test, expect } from 'vitest';
import { RULE_LAYERS, FAMILY_EXPERIMENTS, playableFamilies, branchIsPlayable } from '../engine/ruleLayers';
import { FAMILY_RULE_LAYERS, INFO_RULE_LAYERS } from '../geometry/d2geometry';
import { generateCatalog } from '../generator/branchGenerator';

describe('rule-layer registry (L2 seam)', () => {
  test('every rule-layer name used by the geometry exists in the registry', () => {
    const referenced = new Set<string>();
    for (const layers of Object.values(FAMILY_RULE_LAYERS)) layers.forEach((l) => referenced.add(l));
    for (const layers of Object.values(INFO_RULE_LAYERS)) layers.forEach((l) => referenced.add(l));
    for (const name of referenced) expect(RULE_LAYERS[name]).toBeDefined();
  });

  test('the King of Tokyo family (commitment) is bound to Hold the Crown', () => {
    const bindings = FAMILY_EXPERIMENTS.commitment ?? [];
    expect(bindings.some((b) => b.experimentId === 'hold-crown')).toBe(true);
    expect(RULE_LAYERS['push-your-luck']!.implemented).toBe(true);
    expect(RULE_LAYERS['closed-loop-contest']!.implemented).toBe(true);
  });

  test('all five competency families now have at least one playable experiment', () => {
    const playable = playableFamilies();
    for (const fam of ['shaping', 'foresight', 'commitment', 'intervention', 'transformation']) {
      expect(playable).toContain(fam);
    }
  });

  test('branchIsPlayable reflects implemented rule layers', () => {
    const catalog = generateCatalog('seed-42');
    const commitmentBranch = catalog.find((s) => s.coordinate.family === 'commitment' && s.coordinate.infoSurface === 'hidden');
    expect(commitmentBranch && branchIsPlayable(commitmentBranch.ruleLayers)).toBe(true);
    // a branch referencing a still-unimplemented info layer (partial reveal) is not playable
    const partial = catalog.find((s) => s.coordinate.infoSurface === 'partial');
    expect(partial && branchIsPlayable(partial.ruleLayers)).toBe(false);
  });
});
