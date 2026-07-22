// Keeper's Dilemma — reveal/keep/verify, keep-subset scoring, sanitization, no forbidden fields.
import { describe, test, expect } from 'vitest';
import { commit, revealFaces, resolve, verifyOutcome } from '../experiments/keeper/keeper';
import { containsForbidden } from '../evidence/forbiddenFields';
import { scoreFarkle } from '../engine/farkle-engine';

describe('Keeper commit-reveal-keep-verify', () => {
  test('a genuine session verifies end-to-end', async () => {
    const c = await commit();
    const { faces, combined } = await revealFaces(c, 'client');
    const outcome = resolve(c, 'client', combined, faces, [0, 1, 2]);
    const report = await verifyOutcome(outcome);
    expect(report.ok).toBe(true);
  });

  test('kept score equals scoreFarkle of the kept faces only', async () => {
    const c = await commit();
    const { faces, combined } = await revealFaces(c, 'seed');
    const outcome = resolve(c, 'seed', combined, faces, [0, 3, 5]);
    const expected = scoreFarkle(outcome.kept_faces).score;
    expect(outcome.score).toBe(expected);
  });

  test('keep indices are sanitized (dedup, in-range, sorted)', async () => {
    const c = await commit();
    const { faces, combined } = await revealFaces(c, 's');
    const outcome = resolve(c, 's', combined, faces, [5, 5, 99, -1, 2, 2]);
    expect(outcome.kept_indices).toEqual([2, 5]);
  });

  test('revealed faces are provably fair regardless of the keep choice', async () => {
    const c = await commit();
    const { faces, combined } = await revealFaces(c, 'x');
    const a = resolve(c, 'x', combined, faces, [0]);
    const b = resolve(c, 'x', combined, faces, [0, 1, 2, 3, 4, 5]);
    expect(a.faces).toEqual(b.faces); // same underlying roll
    expect((await verifyOutcome(a)).facesMatch).toBe(true);
    expect((await verifyOutcome(b)).facesMatch).toBe(true);
  });

  test('outcome contains no forbidden fields', async () => {
    const c = await commit();
    const { faces, combined } = await revealFaces(c, 'y');
    const outcome = resolve(c, 'y', combined, faces, [0, 1]);
    expect(containsForbidden(outcome)).toBe(false);
  });
});
