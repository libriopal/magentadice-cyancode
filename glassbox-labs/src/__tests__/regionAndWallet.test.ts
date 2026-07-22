// Region gate (C8, fail-closed) + closed-loop Sparks wallet earn-only guard.
import { describe, test, expect } from 'vitest';
import { decideRegion, BLOCKED_REGIONS, toRegionCheckRecord } from '../region/regionGate';
import { makeEarnRecord, SPARKS } from '../sparks/wallet';

describe('region gate (C8)', () => {
  test('a blocked state is denied with a reason', () => {
    const blocked = BLOCKED_REGIONS.blocked_us_states[0];
    const d = decideRegion(blocked);
    expect(d.allowed).toBe(false);
    expect(d.region).toBe(blocked);
  });

  test('an allowed state passes', () => {
    // TX is not in the default blocklist.
    const d = decideRegion('TX');
    expect(d.allowed).toBe(true);
    expect(d.region).toBe('TX');
  });

  test('fail-closed: unknown region is denied', () => {
    const d = decideRegion(null);
    expect(d.allowed).toBe(false);
  });

  test('case/whitespace-insensitive matching', () => {
    const blocked = BLOCKED_REGIONS.blocked_us_states[0].toLowerCase();
    const d = decideRegion(`  ${blocked}  `);
    expect(d.allowed).toBe(false);
  });

  test('produces a persistable region-check record', () => {
    const rec = toRegionCheckRecord(decideRegion('TX'), 'u1');
    expect(rec.allowed).toBe(true);
    expect(rec.detected_region).toBe('TX');
    expect(rec.user_id).toBe('u1');
  });
});

describe('sparks wallet (closed-loop)', () => {
  test('earn record carries a positive delta', () => {
    const r = makeEarnRecord('u1', SPARKS.PLAY, 'play:one-roll', 'se1');
    expect(r.delta).toBe(SPARKS.PLAY);
    expect(r.delta).toBeGreaterThan(0);
  });

  test('non-positive delta is rejected — there is no redemption/debit path', () => {
    expect(() => makeEarnRecord('u1', 0, 'play:one-roll', null)).toThrow();
    expect(() => makeEarnRecord('u1', -5, 'play:one-roll', null)).toThrow();
  });
});
