// The compliant Cohere proposer: it may PROPOSE (generation), never SELECT/promote (selection). These
// tests lock the governance guarantees — dormant-only proposals, budget isolation, graceful degrade
// with no key, and synthetic signal never moving ledger state.
import { describe, test, expect, beforeEach } from 'vitest';
import { buildCanonicalCatalog } from '../forest/catalog';
import { SpendTracker } from '../cohere/budget';
import { BUDGET_CEILINGS_USD } from '../cohere/config';
import { proposeExperiences, registerProposals, readNutrient } from '../cohere/proposalEngine';

describe('Cohere budget guard (isolated, no cross-borrow)', () => {
  let t: SpendTracker;
  beforeEach(() => { t = new SpendTracker(); });

  test('categories are isolated: spending one never affects another', () => {
    t.record('experience-proposal', 100);
    expect(t.spentIn('experience-proposal')).toBe(100);
    expect(t.spentIn('governance-audit')).toBe(0);
    expect(t.fraction('retrieval')).toBe(0);
  });

  test('shutdown at 100% of the category ceiling; cannot spend over', () => {
    t.record('quest', BUDGET_CEILINGS_USD.quest);
    expect(t.status('quest')).toBe('shutdown');
    expect(t.canSpend('quest', 0.01)).toBe(false);
    expect(() => t.record('quest', 0.01)).toThrow(/ceiling/);
  });

  test('warn / restrict thresholds', () => {
    t.record('retrieval', BUDGET_CEILINGS_USD.retrieval * 0.8);
    expect(t.status('retrieval')).toBe('warn');
    t.record('retrieval', BUDGET_CEILINGS_USD.retrieval * 0.11);
    expect(t.status('retrieval')).toBe('restrict');
  });
});

describe('proposer degrades gracefully with no COHERE_API_KEY (sandbox)', () => {
  test('still proposes (deterministically) and marks degraded', async () => {
    const handle = buildCanonicalCatalog();
    const { proposals, degraded } = await proposeExperiences(handle, new SpendTracker(), 3);
    expect(degraded).toBe(true); // no key in sandbox
    expect(proposals.length).toBeGreaterThan(0);
    for (const p of proposals) {
      expect(p.provenance).toBe('synthetic');
      expect(p.origin).toBe('deterministic-fallback');
    }
  });

  test('no spend is recorded on the degraded path', async () => {
    const handle = buildCanonicalCatalog();
    const t = new SpendTracker();
    await proposeExperiences(handle, t, 3);
    expect(t.spentIn('experience-proposal')).toBe(0);
  });
});

describe('anti-circularity: proposals are DORMANT and never self-promote', () => {
  test('registered proposals land as generated (dormant), never seeded/nourished by the proposer', async () => {
    const handle = buildCanonicalCatalog();
    const before = handle.ledger.summary().total;
    const { proposals } = await proposeExperiences(handle, new SpendTracker(), 4);
    const ids = registerProposals(handle, proposals);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const e = handle.ledger.get(id)!;
      expect(e.state).toBe('generated');        // dormant
      expect(e.realPlayCount).toBe(0);          // no real play
      expect(e.syntheticNotes.length).toBeGreaterThan(0); // provenance-tagged
    }
    // no proposed branch is seeded-playable or nourished
    const seededOrNourished = handle.ledger.all().filter((e) => ids.includes(e.branchId) && (e.state === 'seeded-playable' || e.state === 'nourished'));
    expect(seededOrNourished.length).toBe(0);
    expect(handle.ledger.summary().total).toBe(before + ids.length);
  });

  test('a proposal cannot be nourished without real play, even with a high synthetic score', async () => {
    const handle = buildCanonicalCatalog();
    const { proposals } = await proposeExperiences(handle, new SpendTracker(), 2);
    const [id] = registerProposals(handle, proposals);
    handle.ledger.noteSyntheticSignal(id!, 'synthetic score 0.99 — very promising');
    expect(() => handle.ledger.nourish(id!, 'on synthetic score')).toThrow(/real play evidence/);
  });

  test('nutrient counts only real (observed) plays', () => {
    const handle = buildCanonicalCatalog();
    const holdId = handle.experimentToBranch['hold-crown']!;
    handle.ledger.recordPlay(holdId, { sessionId: 's1', provenance: 'observed', surveyed: true, at: 't' });
    const n = readNutrient(handle);
    expect(n.totalRealPlays).toBe(1);
    expect(n.byFamily.commitment).toBe(1);
  });
});
