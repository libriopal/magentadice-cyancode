# TIER PROMPT: T2 — Security & Compliance
## File: mesh/prompt-03-security-compliance.md
## Prerequisite: tier_gate_status.T1 = PASS
## Session type: ONE TIER PER SESSION
## Authority ceiling: Execution Runtime (cannot exceed)

---

## Objective

Harden the PDX (Prize Distribution Exchange) payout path behind:
1. **Hardware attestation** — Play Integrity API token required for all PDX awards
2. **Server-side KYC enforcement** — ComplianceService.fullCheck() enforced in gameRoom before PDX award
3. **AMOE documentation** — Alternate Method of Entry written and committed (legal requirement)
4. **Server-side geofencing** — RESTRICTED_STATES enforced server-side, not UI-only

**Pass gate:**
- PDX award path returns 403 when attestation token absent or invalid
- ComplianceService.fullCheck() blocks PDX for age/state/terms violations server-side
- AMOE.md present at repo root and referenced in LEGAL.md
- RESTRICTED_STATES enforced in server middleware (not UI-only)

---

## Background

From LEGAL.md: FAR_NZY is a skill-based sweepstakes under the promotional sweepstakes model.
The elimination of CONSIDERATION via AMOE is the legal foundation. Without AMOE enforcement,
the platform cannot legally operate a sweepstakes in the US.

PDX (Prize Distribution Exchange) = real-value payout mechanism. Any PDX award without:
- Verified player age (≥18)
- State eligibility (non-restricted jurisdiction)
- Terms acceptance
- Device attestation (Play Integrity API — prevents emulators/rooted devices gaming the system)

...is a legal violation, not a bug.

From prior sessions (L1 findings now due):
- AMOE not implemented (L1 from T1A)
- Play Integrity API absent (L1 from T1A)
- KYC gate UI-only (L1 from T1A)
- AgeGate UI-only (L1 from T1A)

---

## Existing Code to Extend

- `core/packages/compliance/src/index.ts` — ComplianceService, AgeGateStateMachine (UI-only today)
- `core/apps/server/src/gameRoom.ts` — PDX awards at lines ~345, ~1016, ~1031 (currencyMode === 'PDX')
- `core/packages/blockchain/src/index.ts` — BlockchainQueue, RNG proof (no attestation gate today)

---

## Task Sequence

### Task 1 — AMOE.md (Alternate Method of Entry)

Write `AMOE.md` at repo root. Contents must include:
- Free entry method: player can request a free game credit via mail-in or email to ops@libriopal.com
- No purchase necessary language (explicit)
- Entry limits (reasonable daily/weekly cap to prevent abuse)
- Odds disclosure reference (point to LEGAL.md)
- Void where prohibited language

Update `LEGAL.md` to cross-reference AMOE.md under Section 2 (consideration elimination).

This is a documentation task. No code changes. Grade A required.

### Task 2 — Play Integrity middleware

In `core/apps/server/src/`:
Create `playIntegrity.ts` — a server-side middleware module:

```ts
// Validates a Google Play Integrity API token.
// In production: verifies token against Google's API with package name + nonce.
// In development/test: accepts a well-known stub token for local dev.

export interface IntegrityVerdict {
  deviceIntegrity: 'MEETS_DEVICE_INTEGRITY' | 'MEETS_BASIC_INTEGRITY' | 'FAILS_INTEGRITY';
  appIntegrity: 'RECOGNIZED' | 'UNRECOGNIZED_VERSION' | 'UNEVALUATED';
  accountActivity: 'UNEVALUATED' | 'UNKNOWN_ACCOUNT_RISK';
}

export async function verifyPlayIntegrity(
  token: string | undefined,
  isDev: boolean = process.env.NODE_ENV !== 'production',
): Promise<{ allowed: boolean; verdict?: IntegrityVerdict; reason?: string }>
```

Requirements:
- If `isDev`: accept stub token `'dev-integrity-ok'` → `{ allowed: true }`. All other tokens fail in prod.
- If `!isDev` and token is absent: `{ allowed: false, reason: 'ATTESTATION_MISSING' }`
- If `!isDev` and token present: call Google Play Integrity API (stub the actual HTTP call — use `process.env.PLAY_INTEGRITY_DECRYPTION_KEY` and `PLAY_INTEGRITY_VERIFICATION_KEY`). Return verdict.
- Minimum required for PDX: `deviceIntegrity === 'MEETS_DEVICE_INTEGRITY'`

FIXED_POINT_CHECK: NOT_APPLICABLE (no scoring arithmetic in this file).

### Task 3 — Server-side KYC + attestation gate in gameRoom.ts

In `core/apps/server/src/gameRoom.ts`, before any PDX award is processed:

```ts
// Before PDX award:
// 1. Check player compliance profile (age, state, terms)
// 2. Check Play Integrity attestation token
// If either fails → reject with reason, do not award PDX
```

Specifically:
- Find the PDX award lines (~345, ~1016, ~1031)
- Before each PDX award, call `ComplianceService.fullCheck(playerComplianceProfile)`
- Before each PDX award, call `verifyPlayIntegrity(playerAttestationToken)`
- If either check fails: emit `PDX_BLOCKED` event to client with reason, return without awarding

The player's `attestationToken` should be submitted with the game-joining message (add to join schema).
The player's `complianceProfile` should be submitted at KYC gate (add to join schema or separate message).

For T2: store compliance profile in-memory on the GameRoom per player (no Supabase yet — T4 handles persistence). Accept `complianceProfile` and `attestationToken` in the `JOIN` message.

### Task 4 — Geofencing server-side

Add a `checkGeofence(state: string): boolean` utility to `playIntegrity.ts` (or compliance middleware):
- Import `RESTRICTED_STATES` from compliance package
- Apply at PDX award time (already done if Task 3 uses ComplianceService.fullCheck which checks state)
- Verify: WA state → blocked; CA state → allowed

Write a unit test confirming WA is blocked and CA is allowed.

### Task 5 — Run audit cells + write ADR-013

After Tasks 1-4, run all 6 audit cells (per EXECUTE.md EX-2).
Write `docs/adr/ADR-013-t2-security-compliance.md` documenting:
- AMOE approach and legal basis
- Play Integrity integration pattern (stub + prod path)
- KYC gate server-side enforcement
- Geofencing states covered

---

## Severity Notes

- AMOE absent = legal violation. Task 1 is highest priority.
- PDX award without attestation = legal violation. Task 2+3 are legal-grade.
- Geofencing bypass = legal violation (WA). Task 4 closes this loop.
- These are not nice-to-haves. They are prerequisites for operating legally.

---

## FIXED_POINT_CHECK Scope

- `playIntegrity.ts` — NOT_APPLICABLE (no scoring arithmetic)
- `gameRoom.ts` changes — NOT_APPLICABLE (guard clauses only, no arithmetic)
- `compliance/src/index.ts` — already NOT_APPLICABLE (age arithmetic uses dates, not scoring)
- `AMOE.md` — NOT_APPLICABLE (documentation)

---

## AUDIT Signature

```yaml
AUDIT::PATHWAY_DEPS: [core/apps/server/src/gameRoom.ts, core/packages/compliance/src/index.ts, LEGAL.md, AMOE.md]
AUDIT::CURRENT_GRADE: [Target: Grade A — attestation + KYC enforced server-side]
AUDIT::ENTROPY_VECTOR: [Medium — server middleware added; gameRoom PDX path gated; no Sacred Core]
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE (no scoring arithmetic in T2 scope)
```
