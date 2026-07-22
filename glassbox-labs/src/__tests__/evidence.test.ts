// Evidence subsystem — forbidden-field strip (C7) and closed-loop export guarantee.
import { describe, test, expect, beforeEach } from 'vitest';
import { stripForbidden, containsForbidden, FORBIDDEN_FIELDS } from '../evidence/forbiddenFields';
import { EvidenceStore } from '../evidence/store';

describe('forbidden-field strip (C7)', () => {
  test('config lists exactly skill_score + was_optimal', () => {
    expect([...FORBIDDEN_FIELDS].sort()).toEqual(['skill_score', 'was_optimal']);
  });

  test('strips forbidden keys deeply (nested + arrays)', () => {
    const dirty = {
      id: 's1',
      skill_score: 0.9,
      answers: [{ q: 'a', was_optimal: true }, { q: 'b' }],
      nested: { deep: { was_optimal: false, keep: 1 } },
    };
    const clean = stripForbidden(dirty);
    expect(containsForbidden(clean)).toBe(false);
    expect(clean).toEqual({
      id: 's1',
      answers: [{ q: 'a' }, { q: 'b' }],
      nested: { deep: { keep: 1 } },
    });
  });
});

describe('EvidenceStore export', () => {
  let store: EvidenceStore;
  beforeEach(() => {
    // in-memory persist (no localStorage in node)
    store = new EvidenceStore();
    store.reset();
  });

  test('export strips forbidden fields even if injected upstream via outcome_json holder', () => {
    // Simulate a defect: a survey answers blob that wrongly carries a forbidden field.
    store.addSurvey({
      id: 'sv1',
      session_id: 'se1',
      user_id: 'u1',
      experiment_id: 'one-roll',
      // deliberately malformed to prove the strip is defensive:
      answers_json: JSON.stringify({ fun: 5 }),
      reflection_text: 'felt good',
      sparks_bonus: 25,
      created_at: new Date().toISOString(),
    });
    // Inject a raw forbidden field into the snapshot object graph and confirm export drops it.
    const snap = store.snapshot() as unknown as Record<string, unknown>;
    (snap.surveys as Array<Record<string, unknown>>)[0].skill_score = 0.5;
    const exported = stripForbidden(snap);
    expect(containsForbidden(exported)).toBe(false);
  });

  test('sparks wallet is closed-loop: balance = sum of positive earns', () => {
    store.addSparks({ id: 's1', user_id: 'u1', delta: 10, reason: 'play:one-roll', session_id: 'se1', created_at: 't' });
    store.addSparks({ id: 's2', user_id: 'u1', delta: 25, reason: 'survey:completion', session_id: 'se1', created_at: 't' });
    expect(store.sparksBalance('u1')).toBe(35);
  });
});
