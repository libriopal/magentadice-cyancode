import { describe, test, expect } from 'vitest';
import { runEcosystemAudit } from '../audit/ecosystemAudit';

describe('ecosystem execution audit — full play→journal→ledger→evidence with forced mistakes', () => {
  test('mistakes are genuinely made and faithfully captured', async () => {
    const r = await runEcosystemAudit();
    expect(r.mistakesObserved).toBe(true);
  });
  test('every forced-mistake session stays provably fair', async () => {
    const r = await runEcosystemAudit();
    expect(r.scenarios.every((s) => s.fairnessOk)).toBe(true);
  });
  test('survey nutrient ingests + no forbidden fields + ledger reflects real plays', async () => {
    const r = await runEcosystemAudit();
    expect(r.surveyNutrientIngested).toBe(true);
    expect(r.forbiddenPresent).toBe(false);
    expect(r.ledgerReflectsPlays).toBe(true);
  });
  test('the audit is non-ratifying and overall invariants hold', async () => {
    const r = await runEcosystemAudit();
    expect(r.ratifying).toBe(false);
    expect(r.ok).toBe(true);
  });
});
