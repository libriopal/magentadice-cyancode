import { describe, test, expect } from 'vitest';
import { buildCanonicalCatalog, PLAYABLE_BINDINGS, CANONICAL_SEED } from '../forest/catalog';
import { bustProbabilityPerRound } from '../experiments/hold-crown/holdCrown';

describe('canonical catalog + ledger wiring', () => {
  test('registers all 28 branches from seed-42', () => {
    const { seed, specs, ledger } = buildCanonicalCatalog();
    expect(seed).toBe(CANONICAL_SEED);
    expect(specs.length).toBe(28);
    expect(ledger.summary().total).toBe(28);
  });

  test('the playable subset is seeded-playable; the rest stay generated (dormant)', () => {
    const { ledger, playableIds } = buildCanonicalCatalog();
    expect(playableIds.length).toBe(PLAYABLE_BINDINGS.length);
    for (const id of playableIds) expect(ledger.get(id)!.state).toBe('seeded-playable');
    const seededCount = ledger.all().filter((e) => e.state === 'seeded-playable').length;
    expect(seededCount).toBe(playableIds.length);
    const dormant = ledger.all().filter((e) => e.state === 'generated').length;
    expect(dormant).toBe(28 - playableIds.length);
  });

  test('Hold the Crown (King of Tokyo family) is in the emphasized playable subset', () => {
    const { experimentToBranch, branchToExperiment } = buildCanonicalCatalog();
    const holdId = experimentToBranch['hold-crown'];
    expect(holdId).toBeDefined();
    expect(branchToExperiment[holdId!]).toBe('hold-crown');
    expect(holdId).toMatch(/^br:commitment:hidden:/); // resolved by coordinate, substrate from seed
  });

  test('per-round bust probability is the real Farkle constant ~0.023 (calibration read)', () => {
    const p = bustProbabilityPerRound();
    expect(p).toBeGreaterThan(0.02);
    expect(p).toBeLessThan(0.03);
    expect(bustProbabilityPerRound()).toBe(p); // cached constant
  });
});
