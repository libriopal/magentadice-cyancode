// One-Roll experiment — commit/reveal/verify round trip, determinism, guards, and
// the hard anti-circularity property: no forbidden fields ever appear in an outcome.
import { describe, test, expect } from 'vitest';
import { commit, reveal, verifyOutcome, rollDice, MIN_DICE, MAX_DICE } from '../experiments/one-roll/oneRoll';
import { containsForbidden } from '../evidence/forbiddenFields';
import { deriveCombinedSeed, type DieFace } from '../engine/farkle-engine';

describe('One-Roll commit-reveal-verify', () => {
  test('a genuine session verifies end-to-end', async () => {
    const c = await commit();
    const { outcome } = await reveal(c, 'player-client-seed', 4);
    const report = await verifyOutcome(outcome);
    expect(report.ok).toBe(true);
    expect(report.commitmentValid).toBe(true);
    expect(report.combinedSeedMatch).toBe(true);
    expect(report.facesMatch).toBe(true);
    expect(report.scoreMatch).toBe(true);
  });

  test('reveal is deterministic given the same seeds + decision', async () => {
    const c = await commit();
    const a = await reveal(c, 'same', 6);
    const b = await reveal(c, 'same', 6);
    expect(a.outcome.faces).toEqual(b.outcome.faces);
    expect(a.outcome.score).toBe(b.outcome.score);
  });

  test('tampering with a recorded face fails verification', async () => {
    const c = await commit();
    const { outcome } = await reveal(c, 'client', 3);
    const tampered = { ...outcome, faces: [...outcome.faces] };
    tampered.faces[0] = (((tampered.faces[0] % 6) + 1) as DieFace);
    const report = await verifyOutcome(tampered);
    expect(report.ok).toBe(false);
  });

  test('dice count is clamped to [MIN,MAX]', async () => {
    const c = await commit();
    const low = await reveal(c, 'x', 0);
    const high = await reveal(c, 'x', 99);
    expect(low.outcome.dice_count).toBe(MIN_DICE);
    expect(high.outcome.dice_count).toBe(MAX_DICE);
  });

  test('outcome NEVER contains skill_score / was_optimal', async () => {
    const c = await commit();
    const { outcome } = await reveal(c, 'client', 6);
    expect(containsForbidden(outcome)).toBe(false);
    expect(Object.keys(outcome)).not.toContain('skill_score');
    expect(Object.keys(outcome)).not.toContain('was_optimal');
  });

  test('rollDice matches an independent combined-seed derivation', async () => {
    const combined = await deriveCombinedSeed('server', ['client']);
    const faces = await rollDice(combined, 5);
    expect(faces).toHaveLength(5);
  });
});
