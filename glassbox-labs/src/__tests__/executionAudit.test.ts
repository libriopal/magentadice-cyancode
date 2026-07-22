// Execution audit as an enforced CI gate: the full play→survey→evidence pipeline must
// capture genuinely imperfect play (a Farkle, a zero-keep, a missed target), stay provably
// fair, ingest the survey nutrient, and NEVER leak a forbidden field.
import { describe, test, expect } from 'vitest';
import { runExecutionAudit, renderAuditMarkdown } from '../audit/executionAudit';

describe('execution audit — full play-facing pipeline with mistakes', () => {
  test('mistakes are genuinely made AND faithfully captured', async () => {
    const r = await runExecutionAudit();
    expect(r.mistakesObserved.farkle).toBe(true);
    expect(r.mistakesObserved.zeroKeepBank).toBe(true);
    expect(r.mistakesObserved.missedTarget).toBe(true);
  });

  test('every forced-mistake session stays provably fair', async () => {
    const r = await runExecutionAudit();
    expect(r.scenarios.every((s) => s.fairnessOk)).toBe(true);
  });

  test('no forbidden field enters the store or the export, even under losing play', async () => {
    const r = await runExecutionAudit();
    expect(r.forbiddenFieldsPresentAnywhere).toBe(false);
  });

  test('rewarded-survey nutrient ingests with reflection + flat bonus', async () => {
    const r = await runExecutionAudit();
    expect(r.surveyNutrient.ingested).toBe(true);
    expect(r.surveyNutrient.reflectionStored).toBe(true);
  });

  test('the audit declares itself non-ratifying and overall invariants hold', async () => {
    const r = await runExecutionAudit();
    expect(r.ratifying).toBe(false);
    expect(r.ok).toBe(true);
    // report renders without throwing and mentions non-ratification
    expect(renderAuditMarkdown(r)).toContain('NON-RATIFYING');
  });
});
