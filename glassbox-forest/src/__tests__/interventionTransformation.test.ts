import { describe, test, expect } from 'vitest';
import * as ag from '../experiments/author-gambit/authorGambit';
import * as tm from '../experiments/transmute/transmute';
import { containsForbidden } from '../evidence/forbiddenFields';
import type { DieFace } from '../engine/farkle-engine';

describe("Author's Gambit (intervention)", () => {
  test('forcing dice applies overrides, cuts the multiplier, and verifies', async () => {
    const c = await ag.commit();
    const o = await ag.reveal(c, 'p', { 0: 1 as DieFace, 1: 1 as DieFace });
    expect(o.forced.length).toBe(2);
    expect(o.final_faces[0]).toBe(1);
    expect(o.final_faces[1]).toBe(1);
    expect(o.multiplier).toBeCloseTo(1 - 2 * ag.FORCE_COST);
    expect((await ag.verifyOutcome(o)).ok).toBe(true);
  });
  test('forced count is capped at MAX_FORCED', async () => {
    const c = await ag.commit();
    const o = await ag.reveal(c, 'p', { 0: 5, 1: 5, 2: 5, 3: 5, 4: 5 } as Record<number, DieFace>);
    expect(o.forced.length).toBe(ag.MAX_FORCED);
  });
  test('zero authoring keeps full multiplier', async () => {
    const c = await ag.commit();
    const o = await ag.reveal(c, 'p', {});
    expect(o.multiplier).toBe(1);
    expect((await ag.verifyOutcome(o)).ok).toBe(true);
  });
  test('tampering with a forced override fails verification', async () => {
    const c = await ag.commit();
    const o = await ag.reveal(c, 'p', { 0: 1 as DieFace });
    const bad = { ...o, final_faces: [...o.final_faces] };
    bad.final_faces[0] = ((bad.final_faces[0] % 6) + 1) as DieFace;
    expect((await ag.verifyOutcome(bad)).ok).toBe(false);
  });
  test('no forbidden fields', async () => {
    const c = await ag.commit();
    expect(containsForbidden(await ag.reveal(c, 'p', { 0: 1 as DieFace }))).toBe(false);
  });
});

describe('Transmute (transformation)', () => {
  test('transforms upgrade dice by +1 (capped 6) and verify', async () => {
    const c = await tm.commit();
    const o = await tm.reveal(c, 'p', [0, 0]); // +2 on die 0
    expect(o.transforms.length).toBe(2);
    const expected = Math.min(6, o.rolled_faces[0]! + 2);
    expect(o.final_faces[0]).toBe(expected);
    expect((await tm.verifyOutcome(o)).ok).toBe(true);
  });
  test('transform budget is capped', async () => {
    const c = await tm.commit();
    const o = await tm.reveal(c, 'p', [0, 1, 2, 3]);
    expect(o.transforms.length).toBe(tm.TRANSFORM_BUDGET);
  });
  test('no transforms = raw roll scored', async () => {
    const c = await tm.commit();
    const o = await tm.reveal(c, 'p', []);
    expect(o.final_faces).toEqual(o.rolled_faces);
    expect((await tm.verifyOutcome(o)).ok).toBe(true);
  });
  test('no forbidden fields', async () => {
    const c = await tm.commit();
    expect(containsForbidden(await tm.reveal(c, 'p', [0]))).toBe(false);
  });
});
