// L5 — FOREST LEDGER ("geometrical memory"). Tracks each branch's epoch lifecycle. The ONE rule
// that defines this whole ecosystem (from the D2 corpus + the human's ratified decision this session):
//
//   Revive/grow vs. archive is driven ONLY by REAL human play + reflection evidence.
//   Simulated / model / agent "fitness" may be recorded for provenance, but it can NEVER move a branch
//   between states and is NEVER presented as observed. Generation is allowed; SELECTION is barred.
//
// This is enforced structurally below: `recordPlay` accepts only observed evidence; `nourish` refuses
// unless real play evidence exists; `noteSyntheticSignal` can only annotate. There is no code path by
// which a synthetic signal changes state.
import type { BranchSpec } from '../generator/branchGenerator';

export type BranchState = 'generated' | 'seeded-playable' | 'played' | 'nourished' | 'archived';

/** Real, observed play evidence. `provenance` MUST be 'observed' — synthetic is rejected at the door. */
export interface PlayEvidence {
  sessionId: string;
  provenance: 'observed';
  surveyed: boolean;
  at: string;
}

export interface Transition {
  at: string;
  from: BranchState;
  to: BranchState;
  reason: string;
  evidenceKind: 'real-play' | 'human-decision'; // synthetic can NEVER appear here
}

export interface LedgerEntry {
  branchId: string;
  state: BranchState;
  realPlayCount: number;   // counts ONLY observed sessions
  surveyCount: number;     // counts ONLY observed surveys
  syntheticNotes: string[]; // annotations only — provenance-tagged, never gates a transition
  history: Transition[];
}

const NOURISH_MIN_REAL_PLAYS = 1; // a branch cannot be "nourished" without at least one real session

export class ForestLedger {
  private entries = new Map<string, LedgerEntry>();

  /** Register a generated branch spec → state 'generated'. Idempotent. */
  register(spec: BranchSpec, at: string = new Date().toISOString()): LedgerEntry {
    const existing = this.entries.get(spec.id);
    if (existing) return existing;
    const entry: LedgerEntry = {
      branchId: spec.id,
      state: 'generated',
      realPlayCount: 0,
      surveyCount: 0,
      syntheticNotes: [],
      history: [{ at, from: 'generated', to: 'generated', reason: 'registered', evidenceKind: 'human-decision' }],
    };
    this.entries.set(spec.id, entry);
    return entry;
  }

  get(branchId: string): LedgerEntry | undefined {
    return this.entries.get(branchId);
  }

  all(): LedgerEntry[] {
    return [...this.entries.values()];
  }

  private require(branchId: string): LedgerEntry {
    const e = this.entries.get(branchId);
    if (!e) throw new Error(`branch not registered: ${branchId}`);
    return e;
  }

  /** Human/dev promotes a generated branch to playable (allowed — this is a build decision, not a
   *  quality judgement about the branch). */
  markSeededPlayable(branchId: string, at: string = new Date().toISOString()): LedgerEntry {
    const e = this.require(branchId);
    if (e.state !== 'generated') throw new Error(`can only seed-play a 'generated' branch (was '${e.state}')`);
    e.history.push({ at, from: e.state, to: 'seeded-playable', reason: 'seeded playable', evidenceKind: 'human-decision' });
    e.state = 'seeded-playable';
    return e;
  }

  /** Record a REAL play session. Rejects anything not provenance 'observed'. Moves a playable branch
   *  to 'played'. This is the ONLY nutrient source. */
  recordPlay(branchId: string, evidence: PlayEvidence): LedgerEntry {
    const e = this.require(branchId);
    if (evidence.provenance !== 'observed') {
      throw new Error('recordPlay accepts only observed (real) evidence; synthetic signal cannot feed the ledger');
    }
    e.realPlayCount += 1;
    if (evidence.surveyed) e.surveyCount += 1;
    if (e.state === 'seeded-playable') {
      e.history.push({ at: evidence.at, from: e.state, to: 'played', reason: `real session ${evidence.sessionId}`, evidenceKind: 'real-play' });
      e.state = 'played';
    }
    return e;
  }

  /** Record that a REAL survey (reflection nutrient) was completed for a branch. Increments surveyCount
   *  only; it does NOT count as an extra play. Survey is human-produced evidence, never synthetic. */
  recordSurvey(branchId: string): LedgerEntry {
    const e = this.require(branchId);
    e.surveyCount += 1;
    return e;
  }

  /** Promote to 'nourished' (continue growth/development). Structurally requires real play evidence —
   *  a branch with zero real sessions can NEVER be nourished, no matter what any simulation says. */
  nourish(branchId: string, reason: string, at: string = new Date().toISOString()): LedgerEntry {
    const e = this.require(branchId);
    if (e.realPlayCount < NOURISH_MIN_REAL_PLAYS) {
      throw new Error(`cannot nourish '${branchId}': needs real play evidence (has ${e.realPlayCount}); synthetic fitness cannot substitute`);
    }
    e.history.push({ at, from: e.state, to: 'nourished', reason, evidenceKind: 'real-play' });
    e.state = 'nourished';
    return e;
  }

  /** Archive (make dormant). Reversible via `revive`. Archiving is safe to do on any branch — it never
   *  destroys the spec (it is regenerable from its seed). */
  archive(branchId: string, reason: string, at: string = new Date().toISOString()): LedgerEntry {
    const e = this.require(branchId);
    e.history.push({ at, from: e.state, to: 'archived', reason, evidenceKind: 'human-decision' });
    e.state = 'archived';
    return e;
  }

  /** Revive an archived branch back to 'generated' so it can re-enter the lifecycle. */
  revive(branchId: string, at: string = new Date().toISOString()): LedgerEntry {
    const e = this.require(branchId);
    if (e.state !== 'archived') throw new Error(`can only revive an 'archived' branch (was '${e.state}')`);
    e.history.push({ at, from: e.state, to: 'generated', reason: 'revived', evidenceKind: 'human-decision' });
    e.state = 'generated';
    return e;
  }

  /** Record a synthetic/simulated signal for provenance ONLY. It is annotated and never gates state.
   *  This exists so simulation can be logged honestly — never so it can decide. */
  noteSyntheticSignal(branchId: string, note: string): LedgerEntry {
    const e = this.require(branchId);
    e.syntheticNotes.push(note);
    return e;
  }

  /** Snapshot for reporting. */
  summary(): { total: number; byState: Record<BranchState, number> } {
    const byState: Record<BranchState, number> = {
      generated: 0, 'seeded-playable': 0, played: 0, nourished: 0, archived: 0,
    };
    for (const e of this.entries.values()) byState[e.state] += 1;
    return { total: this.entries.size, byState };
  }
}
