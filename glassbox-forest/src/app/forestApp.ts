// App singleton for the playable front-end. Holds the canonical seed-42 catalog + its FOREST ledger,
// the local consent/region state, and the ONLY nutrient hook this stage exposes: recordRealPlay, which
// feeds a REAL (observed) play session into the ledger so the geometrical memory fills as humans play.
// Full evidence capture (survey, Sparks, admin export) + nourish/archive-from-evidence is Stage 4.
import { buildCanonicalCatalog, type CatalogHandle } from '../forest/catalog';
import { decideRegion, toRegionCheckRecord, type RegionDecision } from '../region/regionGate';
import type { RegionMethod } from '../evidence/schema';

const CONSENT_KEY = 'glassbox.forest.consent.v1';
const REGION_KEY = 'glassbox.forest.region.v1';
const USER_KEY = 'glassbox.forest.user.v1';

export const REGION_METHOD: RegionMethod = 'manual-dev-override';

function ls(): Storage | undefined {
  return (globalThis as { localStorage?: Storage }).localStorage;
}
function read(key: string): string | null { return ls()?.getItem(key) ?? null; }
function write(key: string, v: string): void { ls()?.setItem(key, v); }

export function getUserId(): string {
  let id = read(USER_KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `u_${Date.now()}`;
    write(USER_KEY, id);
  }
  return id;
}

export function hasConsent(): boolean {
  return read(CONSENT_KEY) === '1';
}
export function grantConsent(): void { write(CONSENT_KEY, '1'); }

export function setRegion(state: string): void { write(REGION_KEY, state.toUpperCase().trim()); }
export function getRegion(): string | null { return read(REGION_KEY); }

// The canonical catalog + ledger, built once from seed-42 (with the playable subset seeded).
export const catalog: CatalogHandle = buildCanonicalCatalog();

/** Hard region gate re-run before every play/earn action; logs the check. Fail-closed on unknown. */
export function assertPlayAllowed(): RegionDecision {
  const decision = decideRegion(getRegion(), REGION_METHOD);
  // (region_checks are persisted in the full evidence store in Stage 4; here we just enforce.)
  void toRegionCheckRecord(decision, getUserId());
  return decision;
}

/**
 * The nutrient hook: record a REAL play of a branch into the FOREST ledger. `provenance: 'observed'`
 * is enforced by the ledger — synthetic signal can never enter here. Marks the branch 'played'.
 */
export function recordRealPlay(branchId: string, surveyed: boolean): void {
  catalog.ledger.recordPlay(branchId, {
    sessionId: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `se_${Date.now()}`,
    provenance: 'observed',
    surveyed,
    at: new Date().toISOString(),
  });
}
