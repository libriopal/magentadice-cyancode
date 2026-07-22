// Scout (foresight × partial): the scout peek is consistent with the committed roll, all-or-nothing
// scoring holds, and everything verifies. No forbidden fields.
import { describe, test, expect } from 'vitest';
import * as scout from '../experiments/scout/scout';
import { containsForbidden } from '../evidence/forbiddenFields';
import { scoreFarkle, type DieFace } from '../engine/farkle-engine';

describe('Scout — partial-read calibration', () => {
  test('the peeked scout equals the first committed die (same stream)', async () => {
    const c = await scout.commit();
    const { scout: peek } = await scout.revealScout(c, 'p');
    const o = await scout.reveal(c, 'p', 6);
    expect(o.faces[0]).toBe(peek);
    expect(o.scout).toBe(peek);
  });

  test('a genuine session verifies end-to-end', async () => {
    const c = await scout.commit();
    const o = await scout.reveal(c, 'client', 3);
    const r = await scout.verifyOutcome(o);
    expect(r.ok).toBe(true);
    expect(r.scoutMatch).toBe(true);
  });

  test('scoring is all-or-nothing (matches scoreFarkle over the committed faces)', async () => {
    const c = await scout.commit();
    const o = await scout.reveal(c, 'x', 4);
    expect(o.score).toBe(scoreFarkle(o.faces).score);
  });

  test('dice count is clamped', async () => {
    const c = await scout.commit();
    expect((await scout.reveal(c, 'x', 99)).dice_count).toBe(scout.MAX_DICE);
    expect((await scout.reveal(c, 'x', 0)).dice_count).toBe(scout.MIN_DICE);
  });

  test('tampering with a recorded face fails verification', async () => {
    const c = await scout.commit();
    const o = await scout.reveal(c, 'x', 3);
    const bad = { ...o, faces: [...o.faces] };
    bad.faces[0] = ((bad.faces[0] % 6) + 1) as DieFace;
    expect((await scout.verifyOutcome(bad)).ok).toBe(false);
  });

  test('no forbidden fields', async () => {
    const c = await scout.commit();
    expect(containsForbidden(await scout.reveal(c, 'x', 2))).toBe(false);
  });
});
