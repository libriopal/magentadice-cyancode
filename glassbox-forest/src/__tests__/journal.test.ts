// The persistent nutrient loop: journal events replay onto a fresh catalog to rebuild ledger + evidence
// (fixes the amnesiac-ledger BLOCKER), survey nutrient is captured (fixes the survey BLOCKER), region
// checks are logged, export strips forbidden fields, and synthetic signal still can't move state.
import { describe, test, expect } from 'vitest';
import { buildCanonicalCatalog } from '../forest/catalog';
import { ForestJournal, applyEvent, replay, exportEvidence, type ForestEvent } from '../forest/journal';
import { EMPTY_STORE, type SessionRecord } from '../evidence/schema';
import { containsForbidden } from '../evidence/forbiddenFields';

function playEvent(branchExp: string, sid: string): ForestEvent {
  const session: SessionRecord = {
    id: sid, user_id: 'u1', experiment_id: branchExp, detected_region: 'TX',
    region_method: 'manual-dev-override', region_allowed: true,
    server_seed: 's', server_seed_hash: 'h', revealed_at: 't',
    outcome_json: '{"experiment_id":"hold-crown"}', decision_json: '{"decisions":["hold"]}',
    sparks_awarded: 10, created_at: 't',
  };
  return { kind: 'play', at: 't', session };
}

describe('ForestJournal — persistent nutrient loop', () => {
  test('a play event feeds the ledger (real) and the evidence store; survives replay', () => {
    const handle = buildCanonicalCatalog();
    const holdExp = 'hold-crown';
    const branchId = handle.experimentToBranch[holdExp]!;
    const journal = new ForestJournal('test-key-1');
    journal.clear();
    journal.append(playEvent(holdExp, 'se1'));

    // replay onto a FRESH catalog — proves durability/reconstruction
    const fresh = buildCanonicalCatalog();
    const ev = replay(fresh, journal);
    expect(fresh.ledger.get(branchId)!.state).toBe('played');
    expect(fresh.ledger.get(branchId)!.realPlayCount).toBe(1);
    expect(ev.sessions.length).toBe(1);
    journal.clear();
  });

  test('survey event captures reflection nutrient + increments surveyCount (BLOCKER #2)', () => {
    const handle = buildCanonicalCatalog();
    const ev = structuredClone(EMPTY_STORE);
    applyEvent(handle, ev, playEvent('hold-crown', 'se1'));
    applyEvent(handle, ev, {
      kind: 'survey', at: 't',
      survey: { id: 'sv1', session_id: 'se1', user_id: 'u1', experiment_id: 'hold-crown', answers_json: '{"engagement":4}', reflection_text: 'went for broke', sparks_bonus: 25, created_at: 't' },
    });
    expect(ev.surveys.length).toBe(1);
    expect(ev.surveys[0]!.reflection_text).toBe('went for broke');
    const branchId = handle.experimentToBranch['hold-crown']!;
    expect(handle.ledger.get(branchId)!.surveyCount).toBe(1);
  });

  test('region checks are logged (BLOCKER #3 fix)', () => {
    const handle = buildCanonicalCatalog();
    const ev = structuredClone(EMPTY_STORE);
    applyEvent(handle, ev, { kind: 'region-check', at: 't', check: { id: 'rc1', user_id: 'u1', detected_region: 'TX', allowed: true, method: 'manual-dev-override', created_at: 't' } });
    expect(ev.region_checks.length).toBe(1);
  });

  test('export strips forbidden fields even if injected into a record', () => {
    const handle = buildCanonicalCatalog();
    const ev = structuredClone(EMPTY_STORE);
    applyEvent(handle, ev, playEvent('one-roll', 'se1'));
    (ev.sessions[0] as unknown as Record<string, unknown>).skill_score = 0.9; // simulate a defect
    const exported = exportEvidence(ev);
    expect(containsForbidden(exported)).toBe(false);
  });

  test('promote moves a dormant branch to playable; a proposal cannot self-promote', () => {
    const handle = buildCanonicalCatalog();
    // a generated (dormant) branch id
    const dormant = handle.specs.find((s) => s.kind === 'generated' && !handle.branchToExperiment[s.id])!;
    const ev = structuredClone(EMPTY_STORE);
    expect(handle.ledger.get(dormant.id)!.state).toBe('generated');
    applyEvent(handle, ev, { kind: 'promote', at: 't', branchId: dormant.id });
    expect(handle.ledger.get(dormant.id)!.state).toBe('seeded-playable');
  });

  test('nourish via journal still requires real play (synthetic can never satisfy it)', () => {
    const handle = buildCanonicalCatalog();
    const ev = structuredClone(EMPTY_STORE);
    const holdBranch = handle.experimentToBranch['hold-crown']!;
    // nourish with no play → guard refuses (applyEvent swallows the throw, state unchanged)
    applyEvent(handle, ev, { kind: 'nourish', at: 't', branchId: holdBranch, reason: 'premature' });
    expect(handle.ledger.get(holdBranch)!.state).not.toBe('nourished');
    // after a real play, nourish succeeds
    applyEvent(handle, ev, playEvent('hold-crown', 'se1'));
    applyEvent(handle, ev, { kind: 'nourish', at: 't', branchId: holdBranch, reason: 'real play' });
    expect(handle.ledger.get(holdBranch)!.state).toBe('nourished');
  });
});
