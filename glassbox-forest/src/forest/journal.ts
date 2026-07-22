// ForestJournal — the durable geometrical memory. An append-only event log persisted to localStorage
// (a real DB is a G3 step). On load, the canonical seed-42 catalog is rebuilt deterministically and the
// journal is replayed onto it, so the ecosystem's lifecycle state + evidence survive reloads and stay
// fully reconstructible + auditable. Only human/real-play events ever move ledger state; Cohere
// proposals enter as dormant. This is the single source of truth for the nutrient loop.
import type { CatalogHandle } from './catalog';
import type { BranchSpec } from '../generator/branchGenerator';
import type {
  EvidenceStoreShape, SessionRecord, SurveyRecord, SparksLedgerRecord, RegionCheckRecord,
} from '../evidence/schema';
import { EMPTY_STORE } from '../evidence/schema';
import { stripForbidden } from '../evidence/forbiddenFields';

export type ForestEvent =
  | { kind: 'play'; at: string; session: SessionRecord }
  | { kind: 'survey'; at: string; survey: SurveyRecord }
  | { kind: 'sparks'; at: string; sparks: SparksLedgerRecord }
  | { kind: 'region-check'; at: string; check: RegionCheckRecord }
  | { kind: 'promote'; at: string; branchId: string }
  | { kind: 'nourish'; at: string; branchId: string; reason: string }
  | { kind: 'archive'; at: string; branchId: string; reason: string }
  | { kind: 'proposal'; at: string; spec: BranchSpec; origin: string; rationale: string };

const KEY = 'glassbox.forest.journal.v1';

function ls(): Storage | undefined {
  return (globalThis as { localStorage?: Storage }).localStorage;
}

export class ForestJournal {
  private events: ForestEvent[] = [];

  constructor(private key = KEY) {
    const raw = ls()?.getItem(this.key);
    if (raw) {
      try { this.events = JSON.parse(raw) as ForestEvent[]; } catch { this.events = []; }
    }
  }

  all(): ForestEvent[] { return this.events; }

  append(e: ForestEvent): void {
    this.events.push(e);
    this.persist();
  }

  /** Persist to localStorage, tolerant of quota exhaustion: on failure, shed the oldest low-value events
   *  (region-checks, then sparks — both derivable/non-load-bearing) and retry, and NEVER throw upward so a
   *  play can't crash from a full store. Worst case it keeps the log in memory for the session. */
  private persist(): void {
    const store = ls();
    if (!store) return;
    for (let attempt = 0; attempt < 6; attempt++) {
      try { store.setItem(this.key, JSON.stringify(this.events)); return; }
      catch {
        const before = this.events.length;
        this.shedOldest();
        if (this.events.length === before) return; // nothing left to shed — give up quietly
      }
    }
  }

  private shedOldest(): void {
    const drop = (kind: ForestEvent['kind']) => {
      const i = this.events.findIndex((x) => x.kind === kind);
      if (i >= 0) { this.events.splice(i, 1); return true; }
      return false;
    };
    // shed the most numerous, least load-bearing first; keep plays/surveys/promotes/nourish/archive/proposals.
    if (drop('region-check')) return;
    if (drop('sparks')) return;
    this.events.shift(); // last resort: drop the single oldest event
  }

  clear(): void {
    this.events = [];
    ls()?.removeItem(this.key);
  }
}

/** Apply one event to the live ledger + evidence accumulator. Used on replay AND for new events, so the
 *  in-memory state and the persisted journal never diverge. Ledger guards still apply (nourish needs
 *  real play; recordPlay rejects non-observed) — a corrupt journal can't bypass them. */
export function applyEvent(handle: CatalogHandle, ev: EvidenceStoreShape, event: ForestEvent): void {
  switch (event.kind) {
    case 'proposal': {
      if (!handle.ledger.get(event.spec.id)) {
        handle.ledger.register(event.spec);
        handle.ledger.noteSyntheticSignal(event.spec.id, `proposal (${event.origin}): ${event.rationale}`);
        handle.specs.push(event.spec);
      }
      break;
    }
    case 'promote': {
      const e = handle.ledger.get(event.branchId);
      if (e && e.state === 'generated') handle.ledger.markSeededPlayable(event.branchId);
      break;
    }
    case 'play': {
      ev.sessions.push(event.session);
      // Feed the ledger a REAL observed play (guard enforces observed-only).
      const branchId = branchOf(handle, event.session);
      if (handle.ledger.get(branchId)) {
        handle.ledger.recordPlay(branchId, { sessionId: event.session.id, provenance: 'observed', surveyed: false, at: event.at });
      }
      break;
    }
    case 'survey': {
      ev.surveys.push(event.survey);
      const branchId = branchOfSession(handle, ev, event.survey.session_id);
      if (branchId) handle.ledger.recordSurvey(branchId);
      break;
    }
    case 'sparks': ev.sparks_ledger.push(event.sparks); break;
    case 'region-check': ev.region_checks.push(event.check); break;
    case 'nourish': try { handle.ledger.nourish(event.branchId, event.reason, event.at); } catch { /* guard refused */ } break;
    case 'archive': handle.ledger.archive(event.branchId, event.reason, event.at); break;
  }
}

// The session record carries experiment_id; map it to the playable branch id via the catalog.
function branchOf(handle: CatalogHandle, session: SessionRecord): string {
  return handle.experimentToBranch[session.experiment_id] ?? session.experiment_id;
}
function branchOfSession(handle: CatalogHandle, ev: EvidenceStoreShape, sessionId: string): string | null {
  const s = ev.sessions.find((x) => x.id === sessionId);
  return s ? branchOf(handle, s) : null;
}

/** Replay the whole journal onto a fresh catalog, returning the derived evidence store. */
export function replay(handle: CatalogHandle, journal: ForestJournal): EvidenceStoreShape {
  const ev = structuredClone(EMPTY_STORE);
  for (const event of journal.all()) applyEvent(handle, ev, event);
  return ev;
}

/** Export evidence with the forbidden-field strip (admin export). */
export function exportEvidence(ev: EvidenceStoreShape): EvidenceStoreShape {
  return stripForbidden(ev);
}
