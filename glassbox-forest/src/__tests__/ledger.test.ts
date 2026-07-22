// The anti-circularity heart of the ecosystem: the FOREST ledger must let ONLY real human play move
// a branch toward growth, and must never let simulated/synthetic signal decide.
import { describe, test, expect, beforeEach } from 'vitest';
import { ForestLedger, type PlayEvidence } from '../forest/ledger';
import { generateCatalog, type BranchSpec } from '../generator/branchGenerator';

const realPlay = (sessionId: string, surveyed = true): PlayEvidence => ({
  sessionId, provenance: 'observed', surveyed, at: '2026-07-22T00:00:00Z',
});

describe('FOREST ledger (L5) — human-evidence-only growth', () => {
  let ledger: ForestLedger;
  let spec: BranchSpec;
  beforeEach(() => {
    ledger = new ForestLedger();
    spec = generateCatalog('seed-42')[3]!;
    ledger.register(spec);
  });

  test('a freshly registered branch is "generated" with zero real plays', () => {
    const e = ledger.get(spec.id)!;
    expect(e.state).toBe('generated');
    expect(e.realPlayCount).toBe(0);
  });

  test('full lifecycle on REAL evidence: generated → seeded-playable → played → nourished', () => {
    ledger.markSeededPlayable(spec.id);
    expect(ledger.get(spec.id)!.state).toBe('seeded-playable');
    ledger.recordPlay(spec.id, realPlay('s1'));
    expect(ledger.get(spec.id)!.state).toBe('played');
    ledger.nourish(spec.id, 'sustained real play');
    expect(ledger.get(spec.id)!.state).toBe('nourished');
    expect(ledger.get(spec.id)!.surveyCount).toBe(1);
  });

  test('a branch with NO real play can NEVER be nourished', () => {
    ledger.markSeededPlayable(spec.id);
    expect(() => ledger.nourish(spec.id, 'premature')).toThrow(/real play evidence/);
  });

  test('synthetic/simulated signal can be noted but NEVER changes state (anti-circularity)', () => {
    ledger.markSeededPlayable(spec.id);
    ledger.noteSyntheticSignal(spec.id, 'epoch sim fitness=0.91');
    ledger.noteSyntheticSignal(spec.id, 'model says promising');
    const e = ledger.get(spec.id)!;
    expect(e.syntheticNotes.length).toBe(2);
    expect(e.state).toBe('seeded-playable'); // unchanged by synthetic signal
    expect(() => ledger.nourish(spec.id, 'on synthetic fitness')).toThrow(); // still barred
    // and synthetic never appears in the transition history — only real-play / human-decision can
    expect(e.history.every((h) => h.evidenceKind === 'real-play' || h.evidenceKind === 'human-decision')).toBe(true);
  });

  test('recordPlay rejects anything that is not observed (real)', () => {
    ledger.markSeededPlayable(spec.id);
    const fake = { sessionId: 'x', provenance: 'synthetic', surveyed: true, at: 't' } as unknown as PlayEvidence;
    expect(() => ledger.recordPlay(spec.id, fake)).toThrow(/observed/);
  });

  test('archive is reversible: archive → revive → generated', () => {
    ledger.archive(spec.id, 'no real interest this epoch');
    expect(ledger.get(spec.id)!.state).toBe('archived');
    ledger.revive(spec.id);
    expect(ledger.get(spec.id)!.state).toBe('generated');
  });

  test('summary counts branches by state', () => {
    const cat = generateCatalog('seed-42');
    const l = new ForestLedger();
    cat.forEach((s) => l.register(s));
    const sum = l.summary();
    expect(sum.total).toBe(cat.length);
    expect(sum.byState.generated).toBe(cat.length);
  });
});
