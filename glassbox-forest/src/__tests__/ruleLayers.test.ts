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

  test('shaping + foresight + commitment are playable today; intervention + transformation are not', () => {
    const playable = playableFamilies();
    expect(playable).toContain('shaping');
    expect(playable).toContain('foresight');
    expect(playable).toContain('commitment');
    expect(playable).not.toContain('intervention');
    expect(playable).not.toContain('transformation');
  });

  test('branchIsPlayable is true only when all referenced rule layers are implemented', () => {
    const catalog = generateCatalog('seed-42');
    const commitmentBranch = catalog.find((s) => s.coordinate.family === 'commitment' && s.coordinate.infoSurface === 'hidden');
    const interventionBranch = catalog.find((s) => s.coordinate.family === 'intervention');
    expect(commitmentBranch && branchIsPlayable(commitmentBranch.ruleLayers)).toBe(true);
    expect(interventionBranch && branchIsPlayable(interventionBranch.ruleLayers)).toBe(false);
  });
});
