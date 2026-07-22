// App singleton for the playable front-end + the persistent nutrient loop. The canonical seed-42
// catalog is rebuilt deterministically, then the ForestJournal is replayed onto it so lifecycle state +
// evidence survive reloads (a real DB is a G3 step; localStorage for now). Every real play/survey is an
// event: it feeds the FOREST ledger (real, observed) AND the exportable evidence, and is persisted.
import { buildCanonicalCatalog, type CatalogHandle } from '../forest/catalog';
import { ForestJournal, replay, applyEvent, exportEvidence as strip, type ForestEvent } from '../forest/journal';
import { decideRegion, toRegionCheckRecord, type RegionDecision } from '../region/regionGate';
import { makeEarnRecord, SPARKS } from '../sparks/wallet';
import type { EvidenceStoreShape, RegionMethod } from '../evidence/schema';

const CONSENT_KEY = 'glassbox.forest.consent.v1';
const REGION_KEY = 'glassbox.forest.region.v1';
const USER_KEY = 'glassbox.forest.user.v1';
export const REGION_METHOD: RegionMethod = 'manual-dev-override';

function ls(): Storage | undefined { return (globalThis as { localStorage?: Storage }).localStorage; }
function read(k: string): string | null { return ls()?.getItem(k) ?? null; }
function write(k: string, v: string): void { ls()?.setItem(k, v); }
function uuid(): string { return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

export function getUserId(): string {
  let id = read(USER_KEY);
  if (!id) { id = uuid(); write(USER_KEY, id); }
  return id;
}
export function hasConsent(): boolean { return read(CONSENT_KEY) === '1'; }
export function grantConsent(): void { write(CONSENT_KEY, '1'); }
export function setRegion(state: string): void { write(REGION_KEY, state.toUpperCase().trim()); }
export function getRegion(): string | null { return read(REGION_KEY); }

// Canonical catalog + persisted journal, replayed into live evidence.
export const catalog: CatalogHandle = buildCanonicalCatalog();
export const journal = new ForestJournal();
export const evidence: EvidenceStoreShape = replay(catalog, journal);

/** Emit an event: persist it AND apply it to live state (ledger + evidence) in one step. */
function emit(event: ForestEvent): void {
  journal.append(event);
  applyEvent(catalog, evidence, event);
}

/** Hard region gate before every play/earn; logs the check (persisted). Fail-closed on unknown. */
export function assertPlayAllowed(): RegionDecision {
  const decision = decideRegion(getRegion(), REGION_METHOD);
  emit({ kind: 'region-check', at: new Date().toISOString(), check: toRegionCheckRecord(decision, getUserId()) });
  return decision;
}

export interface PlayableOutcome { server_seed: string; commitment: string }

/**
 * Record a REAL play session: region-gate → persist the session (outcome + pre-commit decision) → award
 * the flat play reward → feed the FOREST ledger (observed). Returns the session id, or null if blocked.
 */
export function recordPlaySession(experimentId: string, outcome: PlayableOutcome, decision: unknown): string | null {
  const region = assertPlayAllowed();
  if (!region.allowed) return null;
  const uid = getUserId();
  const now = new Date().toISOString();
  const sid = uuid();
  emit({
    kind: 'play', at: now,
    session: {
      id: sid, user_id: uid, experiment_id: experimentId,
      detected_region: getRegion(), region_method: REGION_METHOD, region_allowed: true,
      server_seed: outcome.server_seed, server_seed_hash: outcome.commitment, revealed_at: now,
      outcome_json: JSON.stringify(outcome), decision_json: decision === undefined ? null : JSON.stringify(decision),
      sparks_awarded: SPARKS.PLAY, created_at: now,
    },
  });
  emit({ kind: 'sparks', at: now, sparks: makeEarnRecord(uid, SPARKS.PLAY, `play:${experimentId}`, sid, now) });
  return sid;
}

/** Record a completed reflection survey for a session (flat bonus; content never graded). */
export function recordSurvey(sessionId: string, experimentId: string, answers: unknown, reflection: string): void {
  const uid = getUserId();
  const now = new Date().toISOString();
  emit({
    kind: 'survey', at: now,
    survey: {
      id: uuid(), session_id: sessionId, user_id: uid, experiment_id: experimentId,
      answers_json: JSON.stringify(answers), reflection_text: reflection,
      sparks_bonus: SPARKS.SURVEY_COMPLETION, created_at: now,
    },
  });
  emit({ kind: 'sparks', at: now, sparks: makeEarnRecord(uid, SPARKS.SURVEY_COMPLETION, 'survey:completion', sessionId, now) });
}

/** Human promotes a dormant branch to playable (the selection step the proposer may never take). */
export function promoteBranch(branchId: string): void {
  emit({ kind: 'promote', at: new Date().toISOString(), branchId });
}

/** Human nourishes a branch (continue growth). Ledger refuses without real play — a no-op if it throws. */
export function nourishBranch(branchId: string, reason = 'human nourish'): boolean {
  try { catalog.ledger.nourish(branchId, reason); emit({ kind: 'nourish', at: new Date().toISOString(), branchId, reason }); return true; }
  catch { return false; }
}

/**
 * Run one epoch (the FOREST "others are archived" half). NON-destructive + reversible: it shelves only
 * TRULY untouched branches — 'generated', zero real plays, never promoted — and returns the branches that
 * have crossed the real-play threshold as NOURISH candidates for the human to confirm. It never nourishes
 * or archives on synthetic signal, and never archives anything with real play or a human promotion.
 */
export function runEpoch(nourishThreshold = 3): { archived: string[]; nourishCandidates: string[] } {
  const now = new Date().toISOString();
  const archived: string[] = [];
  const nourishCandidates: string[] = [];
  for (const spec of catalog.specs) {
    const e = catalog.ledger.get(spec.id);
    if (!e) continue;
    if (e.state === 'generated' && e.realPlayCount === 0) {
      catalog.ledger.archive(spec.id, 'epoch: untouched (0 real plays)', now);
      journal.append({ kind: 'archive', at: now, branchId: spec.id, reason: 'epoch: untouched (0 real plays)' });
      archived.push(spec.id);
    } else if (e.realPlayCount >= nourishThreshold && e.state !== 'nourished' && e.state !== 'archived') {
      nourishCandidates.push(spec.id); // real-evidence-driven; human confirms via nourishBranch
    }
  }
  return { archived, nourishCandidates };
}

export function sparksBalance(userId: string = getUserId()): number {
  return evidence.sparks_ledger.filter((s) => s.user_id === userId).reduce((sum, s) => sum + s.delta, 0);
}

/** Admin evidence export with the forbidden-field strip (skill_score/was_optimal can never leave). */
export function exportEvidence(): EvidenceStoreShape {
  return strip(evidence);
}
