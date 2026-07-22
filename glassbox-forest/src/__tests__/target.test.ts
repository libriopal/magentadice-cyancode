// Call Your Shot — reveal/verify, met_target derivation, clamping, no forbidden fields.
import { describe, test, expect } from 'vitest';
import { commit, reveal, verifyOutcome, MIN_DICE, MAX_DICE, MIN_TARGET, MAX_TARGET } from '../experiments/target/target';
import { containsForbidden } from '../evidence/forbiddenFields';

describe('Target commit-reveal-verify', () => {
  test('a genuine session verifies end-to-end', async () => {
    const c = await commit();
    const outcome = await reveal(c, 'client', 6, 500);
    const report = await verifyOutcome(outcome);
    expect(report.ok).toBe(true);
    expect(report.metTargetMatch).toBe(true);
  });

  test('met_target reflects score >= target (self-set goal, not a grade)', async () => {
    const c = await commit();
    const easy = await reveal(c, 's', 6, MIN_TARGET);   // very low bar
    const hard = await reveal(c, 's', 6, MAX_TARGET);   // near-impossible bar, same roll
    expect(easy.met_target).toBe(easy.score >= easy.target_score);
    expect(hard.met_target).toBe(hard.score >= hard.target_score);
  });

  test('dice count and target are clamped to their ranges', async () => {
    const c = await commit();
    const oc = await reveal(c, 'x', 999, 999999);
    expect(oc.dice_count).toBe(MAX_DICE);
    expect(oc.target_score).toBe(MAX_TARGET);
    const oc2 = await reveal(c, 'x', 0, 1);
    expect(oc2.dice_count).toBe(MIN_DICE);
    expect(oc2.target_score).toBe(MIN_TARGET);
  });

  test('tampering with the met_target flag fails verification', async () => {
    const c = await commit();
    const outcome = await reveal(c, 'client', 6, 500);
    const tampered = { ...outcome, met_target: !outcome.met_target };
    const report = await verifyOutcome(tampered);
    expect(report.ok).toBe(false);
  });

  test('outcome contains no forbidden fields', async () => {
    const c = await commit();
    const outcome = await reveal(c, 'z', 4, 300);
    expect(containsForbidden(outcome)).toBe(false);
  });
});
