// App-level singleton wiring the subsystems together for the UI. Everything here is
// sandbox/local (no real DB — that's G3). A single anonymous local user id is minted
// per browser so evidence rows have a stable owner without any auth (auth is P2).
import { EvidenceStore } from '../evidence/store';
import { toExperimentRecords } from '../experiments/registry';
import { decideRegion, toRegionCheckRecord, type RegionDecision } from '../region/regionGate';
import { makeEarnRecord, SPARKS } from '../sparks/wallet';
import type { RegionMethod } from '../evidence/schema';

const USER_KEY = 'glassbox.user.v1';
const CONSENT_KEY = 'glassbox.consent.v1';
const REGION_KEY = 'glassbox.region.v1';

function readLS(key: string): string | null {
  const ls = (globalThis as { localStorage?: Storage }).localStorage;
  return ls ? ls.getItem(key) : null;
}
function writeLS(key: string, val: string): void {
  const ls = (globalThis as { localStorage?: Storage }).localStorage;
  if (ls) ls.setItem(key, val);
}

export interface ConsentState {
  age_confirmed_at: string | null;
  consent_at: string | null;
}

export function getUserId(): string {
  let id = readLS(USER_KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `u_${Date.now()}`;
    writeLS(USER_KEY, id);
  }
  return id;
}

export function getConsent(): ConsentState {
  const raw = readLS(CONSENT_KEY);
  if (!raw) return { age_confirmed_at: null, consent_at: null };
  try {
    return JSON.parse(raw) as ConsentState;
  } catch {
    return { age_confirmed_at: null, consent_at: null };
  }
}

export function grantConsent(): ConsentState {
  const now = new Date().toISOString();
  const state: ConsentState = { age_confirmed_at: now, consent_at: now };
  writeLS(CONSENT_KEY, JSON.stringify(state));
  // Persist a profile row too.
  const uid = getUserId();
  const existing = store.getProfile(uid);
  if (existing) {
    store.updateProfile(uid, { age_confirmed_at: now, consent_at: now });
  } else {
    store.addProfile({ user_id: uid, age_confirmed_at: now, consent_at: now, created_at: now });
  }
  return state;
}

export function hasConsent(): boolean {
  const c = getConsent();
  return Boolean(c.age_confirmed_at && c.consent_at);
}

export function setRegion(state: string): void {
  writeLS(REGION_KEY, state.toUpperCase().trim());
}
export function getRegion(): string | null {
  return readLS(REGION_KEY);
}

// The sandbox has no real IP-geolocation provider (that's a network/secrets concern,
// P2/G3). Until then the region is entered via a manual dev override so the gate is
// still fully exercised end-to-end.
export const REGION_METHOD: RegionMethod = 'manual-dev-override';

// Shared store singleton, seeded with the experiment registry.
export const store = new EvidenceStore();
store.setExperiments(toExperimentRecords());

/**
 * Hard region gate re-run before EVERY play/earn action (directive requirement).
 * Re-decides from the stored region, logs the check, and returns the decision so the
 * caller can refuse to play/earn when not allowed. Fail-closed on a missing region.
 */
export function assertPlayAllowed(): RegionDecision {
  const decision = decideRegion(getRegion(), REGION_METHOD);
  store.addRegionCheck(toRegionCheckRecord(decision, getUserId()));
  return decision;
}

/**
 * Central play/earn path shared by every experiment. Runs the hard region gate, persists
 * the session (with the raw outcome + the player's pre-commit decision), and awards the
 * FLAT play reward. Returns the new session id, or null when the region gate blocks play.
 */
export function recordPlaySession(
  experimentId: string,
  outcome: { server_seed: string; commitment: string },
  decision: unknown
): { sessionId: string | null; region: RegionDecision } {
  const regionDecision = assertPlayAllowed();
  if (!regionDecision.allowed) return { sessionId: null, region: regionDecision };
  const uid = getUserId();
  const now = new Date().toISOString();
  const sid = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `se_${Date.now()}`;
  store.addSession({
    id: sid,
    user_id: uid,
    experiment_id: experimentId,
    detected_region: getRegion(),
    region_method: REGION_METHOD,
    region_allowed: true,
    server_seed: outcome.server_seed,
    server_seed_hash: outcome.commitment,
    revealed_at: now,
    outcome_json: JSON.stringify(outcome),
    decision_json: decision === undefined ? null : JSON.stringify(decision),
    sparks_awarded: SPARKS.PLAY,
    created_at: now,
  });
  // Flat play reward — identical for every experiment, never tied to outcome quality.
  store.addSparks(makeEarnRecord(uid, SPARKS.PLAY, `play:${experimentId}`, sid, now));
  return { sessionId: sid, region: regionDecision };
}
