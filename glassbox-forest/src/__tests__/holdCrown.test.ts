// Hold the Crown (King of Tokyo family) — push-your-luck hold mechanic, provable fairness, and the
// anti-circularity property: no forbidden fields, and the system records the decision without grading it.
import { describe, test, expect } from 'vitest';
import {
  commit, resolveSession, playRound, verifyOutcome, multiplierFor, MAX_ROUNDS, HOLD_INCREMENT,
  type Decision,
} from '../experiments/hold-crown/holdCrown';
import { containsForbidden } from '../evidence/forbiddenFields';

describe('Hold the Crown — commitment/contestability', () => {
  test('a held session verifies end-to-end', async () => {
    const c = await commit();
    const decisions: Decision[] = ['hold', 'hold', 'hold', 'hold', 'hold', 'hold'];
    const outcome = await resolveSession(c, 'player', decisions);
    const report = await verifyOutcome(outcome);
    expect(report.ok).toBe(true);
    expect(report.commitmentValid).toBe(true);
    expect(report.roundsMatch).toBe(true);
    expect(report.totalMatch).toBe(true);
  });

  test('banking on round 0 secures a single-round pot and ends the session', async () => {
    const c = await commit();
    const outcome = await resolveSession(c, 'seed', ['bank']);
    // either it farkled round 0 (total 0, not busted) or it scored once and banked
    expect(outcome.rounds.length).toBe(1);
    expect(outcome.busted).toBe(false);
    if (!outcome.rounds[0]!.isFarkle) {
      expect(outcome.final_total).toBe(Math.round(outcome.rounds[0]!.roundScore * 1));
    } else {
      expect(outcome.final_total).toBe(0);
    }
  });

  test('multiplier grows by HOLD_INCREMENT each held round', () => {
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(1)).toBe(1 + HOLD_INCREMENT);
    expect(multiplierFor(2)).toBe(1 + 2 * HOLD_INCREMENT);
  });

  test('a bust while holding (round > 0) wipes the entire pot', async () => {
    // find a seed whose round-1+ farkles after a scoring round 0, by searching client seeds
    const c = await commit();
    let found = false;
    for (let i = 0; i < 400 && !found; i++) {
      const seed = `bust-search-${i}`;
      const r0 = await playRound(c, seed, 0);
      if (r0.isFarkle) continue; // need a scoring round 0 to have a pot to wipe
      const r1 = await playRound(c, seed, 1);
      if (!r1.isFarkle) continue; // need a bust on round 1
      const outcome = await resolveSession(c, seed, ['hold', 'hold']);
      expect(outcome.busted).toBe(true);
      expect(outcome.final_total).toBe(0);
      expect((await verifyOutcome(outcome)).ok).toBe(true);
      found = true;
    }
    expect(found).toBe(true);
  });

  test('never exceeds MAX_ROUNDS', async () => {
    const c = await commit();
    const outcome = await resolveSession(c, 'x', Array<Decision>(20).fill('hold'));
    expect(outcome.rounds.length).toBeLessThanOrEqual(MAX_ROUNDS);
  });

  test('outcome contains no forbidden fields', async () => {
    const c = await commit();
    const outcome = await resolveSession(c, 'y', ['hold', 'bank']);
    expect(containsForbidden(outcome)).toBe(false);
    expect(Object.keys(outcome)).not.toContain('skill_score');
    expect(Object.keys(outcome)).not.toContain('was_optimal');
  });

  test('tampering with the recorded total fails verification', async () => {
    const c = await commit();
    const outcome = await resolveSession(c, 'z', ['hold', 'bank']);
    const tampered = { ...outcome, final_total: outcome.final_total + 999 };
    expect((await verifyOutcome(tampered)).ok).toBe(false);
  });
});
