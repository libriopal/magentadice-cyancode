// Tests locking the fixes found by the falsification pass.
import { describe, test, expect } from 'vitest';
import * as target from '../experiments/target/target';
import { proposeLocal } from '../forest/proposeLocal';
import { buildCanonicalCatalog } from '../forest/catalog';
import { ForestJournal, type ForestEvent } from '../forest/journal';

describe('FIX: Target scores the roll\'s real value (not degenerate all-or-nothing)', () => {
  test('a low target on 6 dice is met the large majority of the time (best-subset scoring)', async () => {
    const c = await target.commit();
    let met = 0;
    for (let i = 0; i < 20; i++) {
      const o = await target.reveal(c, `seed-${i}`, 6, target.MIN_TARGET);
      if (o.met_target) met += 1;
    }
    // best-subset: ~97% of rolls score > 0, so a MIN_TARGET is met almost always.
    // (the old full-roll all-or-nothing scored 0 ~91% of the time → this would fail.)
    expect(met).toBeGreaterThanOrEqual(15);
  });
});

describe('FIX: in-app deterministic proposer connects the human-promote loop (browser-safe)', () => {
  test('proposes dormant variations into open coordinates, biased by nutrient', () => {
    const handle = buildCanonicalCatalog();
    const proposals = proposeLocal(handle, 4);
    expect(proposals.length).toBe(4);
    for (const p of proposals) {
      expect(p.origin).toBe('deterministic-local');
      expect(p.spec.provenance).toBe('generated'); // synthetic candidate, dormant
      expect(handle.ledger.get(p.spec.id)).toBeUndefined(); // not yet registered (caller does that)
    }
  });
});

describe('FIX: journal persistence tolerates localStorage quota exhaustion', () => {
  test('sheds low-value events instead of throwing when setItem fails', () => {
    // mock a Storage whose setItem throws until the payload is small enough
    let calls = 0;
    const store: Record<string, string> = {};
    const mock = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { calls += 1; if (v.length > 400) throw new Error('QuotaExceeded'); store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    } as unknown as Storage;
    const g = globalThis as { localStorage?: Storage };
    const prev = g.localStorage;
    g.localStorage = mock;
    try {
      const j = new ForestJournal('quota-test');
      const region: ForestEvent = { kind: 'region-check', at: 't', check: { id: 'r', user_id: 'u', detected_region: 'TX', allowed: true, method: 'manual-dev-override', created_at: 't' } };
      // appending many events must never throw, even as the store rejects large writes
      expect(() => { for (let i = 0; i < 40; i++) j.append({ ...region }); }).not.toThrow();
      expect(calls).toBeGreaterThan(0);
    } finally {
      g.localStorage = prev;
    }
  });
});
