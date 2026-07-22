// Region gate (Constitution C8). `config/blocked_regions.json` is HUMAN-OWNED (Gate G4):
// this module READS it and NEVER writes it. Editing the blocklist requires a human G4 token.
// Every check returns a RegionCheckRecord the caller must persist (region_checks table) —
// the directive requires logging every region check.
import blockedRegions from '../../config/blocked_regions.json';
import type { RegionCheckRecord, RegionMethod } from '../evidence/schema';

export interface BlockedRegionsConfig {
  active: boolean;
  blocked_us_states: string[];
  source: string;
  reasons: Record<string, string>;
}

// Frozen so no code path can mutate the human-owned config in memory.
export const BLOCKED_REGIONS: Readonly<BlockedRegionsConfig> = Object.freeze({
  active: blockedRegions.active,
  blocked_us_states: Object.freeze([...blockedRegions.blocked_us_states]) as string[],
  source: blockedRegions.source,
  reasons: Object.freeze({ ...blockedRegions.reasons }),
}) as BlockedRegionsConfig;

export interface RegionDecision {
  region: string | null;
  allowed: boolean;
  method: RegionMethod;
  reason?: string;
}

/**
 * Decide whether a detected region may play/earn. Conservative by default:
 * an unknown/undetectable region is BLOCKED (fail-closed), and if the config is
 * inactive we still fail closed rather than opening the gate silently.
 */
export function decideRegion(
  detectedState: string | null,
  method: RegionMethod = 'ip-geolocation'
): RegionDecision {
  const region = detectedState ? detectedState.toUpperCase().trim() : null;

  if (!BLOCKED_REGIONS.active) {
    return { region, allowed: false, method, reason: 'blocklist-inactive: fail closed' };
  }
  if (!region) {
    return { region: null, allowed: false, method, reason: 'region-undetermined: fail closed' };
  }
  if (BLOCKED_REGIONS.blocked_us_states.includes(region)) {
    return {
      region,
      allowed: false,
      method,
      reason: BLOCKED_REGIONS.reasons[region] ?? 'blocked-region',
    };
  }
  return { region, allowed: true, method };
}

/** Build a persistable region_checks row from a decision. Caller stores it. */
export function toRegionCheckRecord(
  decision: RegionDecision,
  user_id: string | null,
  now: string = new Date().toISOString(),
  id: string = cryptoRandomId()
): RegionCheckRecord {
  return {
    id,
    user_id,
    detected_region: decision.region,
    allowed: decision.allowed,
    method: decision.method,
    created_at: now,
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `rc_${Math.random().toString(36).slice(2)}`;
}
