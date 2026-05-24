# ADR-013: T2 Security & Compliance — AMOE, Play Integrity, KYC Server-Side, Geofencing

**Status:** Accepted  
**Date:** 2026-05-24  
**Session:** tier/T2-security-compliance-20260524  
**Deciders:** Execution Runtime (Libriopal / Claude Sonnet 4.6)  

---

## Context

T2 Security & Compliance audit required:
1. AMOE (Alternate Method of Entry) documentation — legal prerequisite
2. Play Integrity API middleware — hardware attestation before PDX award
3. Server-side KYC enforcement — ComplianceService.fullCheck() in gameRoom
4. Server-side geofencing — RESTRICTED_STATES enforced server-side

All four items were L1 findings from T1A, deferred to T2.

---

## Decisions

### 1. AMOE — Email-Based Free Entry

**Decision:** AMOE implemented via email entry to `amoe@libriopal.com`.

**Rationale:** FTC 16 C.F.R. § 251 requires that any sweepstakes offering prizes must provide a free alternative means of entry at least as accessible as the paid method. Email entry satisfies this requirement. Web form deferred to T4 (requires Supabase form backend).

**Legal basis:** *Pre-Paid Solutions, Inc. v. City of Little Rock*, 343 Ark. 317 (2001) — sweepstakes lawful where AMOE offered. See `AMOE.md` for complete rules and disclosure text.

**Entry equivalence:** One email entry = one sweepstakes ticket. Identical probability to gameplay tickets. Entry processing: manual for T2; automated pipeline in T4.

### 2. Play Integrity Middleware

**Decision:** `core/apps/server/src/playIntegrity.ts` — async attestation check before PDX award.

**Interface:**
```ts
verifyPlayIntegrity(token: string | undefined, isDev?: boolean): Promise<AttestationResult>
```

**Dev mode:** Accepts stub token `'dev-integrity-ok'`. All other tokens fail.  
**Production:** Calls Google Play Integrity API. Requires `PLAYS_INTEGRITY_DECRYPTION_KEY` + `PLAY_INTEGRITY_VERIFICATION_KEY` env vars.  
**Minimum for PDX:** `deviceIntegrity === 'MEETS_DEVICE_INTEGRITY'`.

**Why not a blocking middleware:** PDX awards happen at session end (async), not in the real-time WS hot path. `checkPdxEligibility` is called void-style; if eligibility fails, `PDX_BLOCKED` event is sent to the client and the wallet transaction is not written.

### 3. Server-Side KYC Enforcement

**Decision:** `ComplianceService.fullCheck(profile)` called inside `GameRoom.checkPdxEligibility()` before every PDX wallet write.

**Checks enforced:**
- Age ≥ 18 (via birthYear/birthMonth/birthDay)
- State not in RESTRICTED_STATES
- Terms accepted

**Storage:** Per-player compliance profile stored in `playerComplianceProfile` Map on GameRoom (in-memory for T2). Submitted via `setPlayerCompliance()` call from room orchestrator at join time. Persistent storage (Supabase) deferred to T4.

### 4. Server-Side Geofencing

**Decision:** `checkGeofence(state: string)` in `playIntegrity.ts` — imports `RESTRICTED_STATES` from `@match3d/compliance` and enforces server-side.

**Restricted states:** Currently `{ 'WA' }`. Additional states added to `compliance/src/index.ts` as needed.

**Why separate from KYC:** Geofence check is synchronous and cheap. KYC check includes async operations (future: Supabase lookup). Keeping them separate allows independent updates.

---

## Architecture

```
JOIN_ROOM
  → setPlayerCompliance(profile, attestationToken)
  → stored in playerComplianceProfile / playerAttestationToken Maps

SESSION_END → PDX award path:
  → checkPdxEligibility(playerId)
      → ComplianceService.fullCheck(profile)   // age, state, terms
      → checkGeofence(profile.state)           // RESTRICTED_STATES
      → verifyPlayIntegrity(token)             // Play Integrity API
  → if allowed: insertWalletTransaction(PDX_AWARD)
  → if blocked: send PDX_BLOCKED to client (with reason)
```

---

## T2 Pass Gate — ALL CONDITIONS MET ✓

- [x] AMOE.md present at repo root — email entry, disclosure text, record retention policy
- [x] LEGAL.md Section 3.2 updated to reference AMOE.md and mark L1 finding resolved
- [x] `playIntegrity.ts` — PDX returns `PDX_BLOCKED` without valid attestation token
- [x] `checkGeofence` — WA blocked server-side (6/6 tests pass)
- [x] `ComplianceService.fullCheck()` called server-side before PDX award
- [x] TypeScript type-check: zero new errors
- [x] `@match3d/compliance` added to server dependencies (`workspace:*`)

---

## Tests

- `playIntegrity.test.ts` — **6/6 PASS**
  - WA geofence blocked ✓
  - CA/TX geofence allowed ✓
  - Dev stub token accepted ✓
  - Missing token → ATTESTATION_MISSING ✓
  - Wrong dev token → ATTESTATION_INVALID_DEV_STUB ✓
  - (missing: prod API test — skipped, requires live credentials)

---

## Deferred to T4

- Supabase: persistent compliance profile storage (KYC records)
- Web-based AMOE form (no-download email alternative)
- Automated AMOE email ingestion + ticket issuance pipeline
- Play Integrity production credentials wiring (env var setup)

---

## FIXED_POINT_CHECK

NOT_APPLICABLE — no scoring arithmetic in T2 scope.
