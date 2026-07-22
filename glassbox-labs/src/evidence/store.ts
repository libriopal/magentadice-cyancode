// Local evidence store (sandbox). Backed by localStorage in the browser and an
// in-memory object under test / SSR. A real database is a G3-gated step — this
// interface is intentionally DB-shaped so a real backend can slot in later without
// touching callers.
import {
  EMPTY_STORE,
  type EvidenceStoreShape,
  type ProfileRecord,
  type SessionRecord,
  type SurveyRecord,
  type SparksLedgerRecord,
  type ExperimentRecord,
  type RegionCheckRecord,
} from './schema';
import { stripForbidden } from './forbiddenFields';

const STORAGE_KEY = 'glassbox.evidence.v1';

type Persist = { read: () => EvidenceStoreShape; write: (s: EvidenceStoreShape) => void };

function makePersist(): Persist {
  const ls = typeof globalThis !== 'undefined' ? (globalThis as { localStorage?: Storage }).localStorage : undefined;
  if (ls) {
    return {
      read: () => {
        const raw = ls.getItem(STORAGE_KEY);
        if (!raw) return structuredClone(EMPTY_STORE);
        try {
          return { ...structuredClone(EMPTY_STORE), ...(JSON.parse(raw) as EvidenceStoreShape) };
        } catch {
          return structuredClone(EMPTY_STORE);
        }
      },
      write: (s) => ls.setItem(STORAGE_KEY, JSON.stringify(s)),
    };
  }
  // In-memory fallback (tests / node without localStorage)
  let mem: EvidenceStoreShape = structuredClone(EMPTY_STORE);
  return { read: () => mem, write: (s) => { mem = s; } };
}

export class EvidenceStore {
  private persist: Persist;

  constructor(persist: Persist = makePersist()) {
    this.persist = persist;
  }

  private mutate(fn: (s: EvidenceStoreShape) => void): void {
    const s = this.persist.read();
    fn(s);
    this.persist.write(s);
  }

  snapshot(): EvidenceStoreShape {
    return this.persist.read();
  }

  reset(): void {
    this.persist.write(structuredClone(EMPTY_STORE));
  }

  addProfile(r: ProfileRecord): void { this.mutate((s) => s.profiles.push(r)); }
  updateProfile(user_id: string, patch: Partial<ProfileRecord>): void {
    this.mutate((s) => {
      const p = s.profiles.find((x) => x.user_id === user_id);
      if (p) Object.assign(p, patch);
    });
  }
  getProfile(user_id: string): ProfileRecord | undefined {
    return this.persist.read().profiles.find((x) => x.user_id === user_id);
  }

  addSession(r: SessionRecord): void { this.mutate((s) => s.sessions.push(r)); }
  updateSession(id: string, patch: Partial<SessionRecord>): void {
    this.mutate((s) => {
      const sess = s.sessions.find((x) => x.id === id);
      if (sess) Object.assign(sess, patch);
    });
  }
  getSession(id: string): SessionRecord | undefined {
    return this.persist.read().sessions.find((x) => x.id === id);
  }

  addSurvey(r: SurveyRecord): void { this.mutate((s) => s.surveys.push(r)); }
  addRegionCheck(r: RegionCheckRecord): void { this.mutate((s) => s.region_checks.push(r)); }
  setExperiments(rows: ExperimentRecord[]): void { this.mutate((s) => { s.experiments = rows; }); }

  // Sparks ledger — closed-loop. Callers must only append; there is no debit-to-external path.
  addSparks(r: SparksLedgerRecord): void { this.mutate((s) => s.sparks_ledger.push(r)); }
  sparksBalance(user_id: string): number {
    return this.persist
      .read()
      .sparks_ledger.filter((x) => x.user_id === user_id)
      .reduce((sum, x) => sum + x.delta, 0);
  }

  /**
   * Admin evidence export. ALWAYS passes through the forbidden-field strip so
   * `skill_score` / `was_optimal` can never leave the system (C7), even if a
   * future bug introduced one upstream. Returns a deep-cleaned copy.
   */
  exportEvidence(): EvidenceStoreShape {
    return stripForbidden(this.persist.read());
  }
}
