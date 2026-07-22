// Evidence schema — mirrors spec/data_model.md. Local/sandbox shapes only (real DB is G3).
// HARD RULE (Constitution C7 / ANTI_CIRCULARITY): the forbidden fields
// `skill_score` and `was_optimal` must NEVER appear on any of these records. They
// are not present in the types below by construction, and the export path strips
// them defensively as a second line of defense.

export type RegionMethod = 'ip-geolocation' | 'manual-dev-override' | 'unknown';

export interface ProfileRecord {
  user_id: string;
  age_confirmed_at: string | null;
  consent_at: string | null;
  created_at: string;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  experiment_id: string;
  detected_region: string | null;
  region_method: RegionMethod;
  region_allowed: boolean;
  server_seed: string | null;       // null until revealed
  server_seed_hash: string;         // commitment shown before the roll
  revealed_at: string | null;
  outcome_json: string;             // stringified experiment outcome (no forbidden fields)
  sparks_awarded: number;
  created_at: string;
}

export interface SurveyRecord {
  id: string;
  session_id: string;
  user_id: string;
  experiment_id: string;
  answers_json: string;
  reflection_text: string;
  sparks_bonus: number;
  created_at: string;
  // NOTE: intentionally NO skill_score / was_optimal (C7).
}

export interface SparksLedgerRecord {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  session_id: string | null;
  created_at: string;
  // Closed-loop only: no external value, no purchase, no cash-out, no transfer.
}

export interface ExperimentRecord {
  id: string;
  name: string;
  hypothesis: string;
  status: string;
  created_at: string;
}

export interface RegionCheckRecord {
  id: string;
  user_id: string | null;
  detected_region: string | null;
  allowed: boolean;
  method: RegionMethod;
  created_at: string;
}

export interface EvidenceStoreShape {
  profiles: ProfileRecord[];
  sessions: SessionRecord[];
  surveys: SurveyRecord[];
  sparks_ledger: SparksLedgerRecord[];
  experiments: ExperimentRecord[];
  region_checks: RegionCheckRecord[];
}

export const EMPTY_STORE: EvidenceStoreShape = {
  profiles: [],
  sessions: [],
  surveys: [],
  sparks_ledger: [],
  experiments: [],
  region_checks: [],
};
