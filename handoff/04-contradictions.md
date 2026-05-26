AUDIT::PATHWAY_DEPS: handoff/01-pathway-deps.json, handoff/02-session-snapshot.json, handoff/03-governance-report.md
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: Low — retry wrapper is application-layer only; MATCH_SCORE payload shape is consistent with existing event schema; import fix is structural only
AUDIT::FIXED_POINT_CHECK: PASS

## Contradiction Report — tier/T8-economy-farnzy-20260525

### Source Truth Violations
None.

---

### Check 1 — writeWithRetry: IEventStore contract compliance

**Claim:** `writeWithRetry` wraps `SupabaseEventStore.write()` at the application layer.
It calls `store.write()` which fetches the predecessor hash on each attempt.

**Constitutional check:**
- `contracts/IEventStore.v1.md §3`: "Write failures MUST be logged and retried at
  the application layer." — writeWithRetry satisfies both requirements: retries (up to 3×)
  and logs on final failure.
- Retry safety: A failed write attempt means no row was inserted (SupabaseEventStore.write
  throws before the insert succeeds). The retry fetches a fresh predecessor hash from the
  DB state, which is correct — no stale hash risk.
- Duplicate event_id risk: Each call to `store.write()` generates a new `randomUUID()` —
  retries produce new event_ids, not duplicates. No uniqueness constraint violation.

**Verdict:** No contradiction. writeWithRetry fully satisfies IEventStore.v1.md §3.

---

### Check 2 — MATCH_SCORE payload: fixed-point compliance

**Claim:** `score_delta` is `gain` (an integer from banking arithmetic) and `running_total`
is `activePlayer.profile.banked` (an integer accumulated via `+= gain`).

**Constitutional check:**
- `hashing-strategy.md`: Q×1000 applies to currency amounts (FD/PDX/SDX/rtp_final).
  Raw Farkle score units are not currency — they are integer game scores used for win
  condition comparison. No Q×1000 encoding required for score_delta or running_total.
- `gain` originates from `this.state.unbanked` which is accumulated from Farkle scoring
  integers. No float arithmetic enters the banking path (FIXED_POINT_CHECK PASS across T0–T7).
- `running_total` is `profile.banked` — always integer (integer accumulation only).

**Verdict:** No contradiction. FIXED_POINT_CHECK: PASS.

---

### Check 3 — ClassArchetypeBadge: path correction doesn't introduce new dependency

**Claim:** Changing `../../../packages/...` to `../../../../packages/...` causes
`ClassArchetypeBadge.tsx` to import from `core/packages/game-core/src/replay/types.ts`.
This file already existed and already exports `ClassArchetype`.

**Constitutional check:**
- `sacred-core-spec.md`: `packages/game-core/src/replay/types.ts` is NOT on the Sacred Core
  list. The sacred list enumerates specific files: farkleStore.ts, gameStore.ts, farkleScorer.ts,
  rtpConfig.ts, monteCarlo.ts, csprng.ts, IEventStore implementation, event schema.
  `replay/types.ts` is a type-mirror file; not sacred.
- Import direction: ClassArchetypeBadge reads types from replay/types.ts — read-only dependency.
  No new write path created.

**Verdict:** No contradiction. Import fix is safe.

---

### Check 4 — Session log Session 10 insertion

**Claim:** A Session 10 entry (T6 Content Pipeline, score 94/100) was inserted into
`sessions/session-log.md` before the Session 11 (T7) entry. Source data from
`runs/2026-05-24/session-10.json`.

**Constitutional check:** session-log.md is an audit artifact managed by the Failure
Taxonomist cell. Inserting a missing entry to restore chronological continuity is a
correction, not an amendment. The entry accurately reflects the T6 session data from
the authoritative session-10.json record.

**Verdict:** No contradiction. Correction is accurate and audit-consistent.

---

### Uncited Authority Claims
None. All T8 decisions cite IEventStore.v1.md, sacred-core-spec.md, hashing-strategy.md.

### ADR Triggers Met Without ADR
None. ADR-019 authored for all T8 design decisions.

### Hashing Inconsistencies
None. No new hashing introduced. writeWithRetry passes existing events through store.write().

### Event Schema Changes Without Version Bump
None. MATCH_SCORE is an existing event type (defined in EventType union since T6).
The payload shape (`player_id`, `score_delta`, `running_total`, `bank_type`) is new data,
but the event_type itself is pre-existing. No schema version bump required for payload additions
per `event-versioning-spec.md` (MINOR/PATCH additions do not require MAJOR bump).

### Escalations Raised
None.
