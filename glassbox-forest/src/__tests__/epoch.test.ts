// Epoch/archive policy (#8): shelves only truly-untouched branches (reversible, never synthetic-driven),
// and surfaces real-play-threshold branches as nourish candidates (human confirms). Never archives a
// branch with real play or a human promotion.
import { describe, test, expect } from 'vitest';
import { catalog, runEpoch } from '../app/forestApp';

describe('epoch/archive policy', () => {
  test('archives untouched dormant branches, leaves seeded-playable alone, is reversible', () => {
    const generatedZero = catalog.specs.filter((s) => {
      const e = catalog.ledger.get(s.id)!;
      return e.state === 'generated' && e.realPlayCount === 0;
    }).length;
    const seededBefore = catalog.ledger.summary().byState['seeded-playable'];

    const { archived } = runEpoch();
    expect(archived.length).toBe(generatedZero);
    // playable subset was seeded-playable, not generated → untouched by epoch
    expect(catalog.ledger.summary().byState['seeded-playable']).toBe(seededBefore);
    // archived branches can be revived (non-destructive)
    if (archived[0]) {
      expect(catalog.ledger.get(archived[0])!.state).toBe('archived');
      catalog.ledger.revive(archived[0]);
      expect(catalog.ledger.get(archived[0])!.state).toBe('generated');
    }
  });
});
