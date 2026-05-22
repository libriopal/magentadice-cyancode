# HASHING STRATEGY
## FAR_NZY / magentadice-cyancode
## Document: hashing-strategy.md
## Status: Constitutional — changes require ADR + Human approval
## ADR: ADR-008 (bootstrapped with this document)

---

## Concern Addressed

The Conditional Pass audit identified an inconsistency:
- `rng-lineage-spec.md` referenced HMAC-SHA256
- Architecture discussions referenced BLAKE3
- `snapshot-strategy.md` referenced SHA-256

This document resolves the inconsistency with an explicit decision.

---

## Decision

    SHA-256 for all external chain links and audit-facing hashes.
    BLAKE3 permitted for internal acceleration only, with constraints.

---

## Why SHA-256 for Chain Hashes

1. External audit familiarity — regulators, legal counsel, and external
   auditors universally understand SHA-256. BLAKE3 requires explanation.

2. Chain compatibility — SHA-256 is specified in DELTA-VERIFY and is
   the industry standard for blockchain-adjacent audit chains.

3. Library availability — SHA-256 is natively available in:
   - Node.js crypto module (no dependency)
   - WebCrypto API (browser, Capacitor WebView)
   - WASM (Rust sha2 crate)
   No new dependency required.

4. Conservative choice — for a real-money sweepstakes platform,
   the more conservative, widely audited choice is correct.
   BLAKE3 is newer and less battle-tested in legal contexts.

---

## Where Each Algorithm Applies

| Use Case | Algorithm | Rationale |
|---|---|---|
| Event predecessor hash | SHA-256 | External chain, audit-facing |
| Snapshot predecessor hash | SHA-256 | External chain, audit-facing |
| PDX transaction signature | HMAC-SHA256 | Per DELTA-VERIFY Article 2.3 |
| RNG seed derivation | HMAC-SHA256 | Per rng-lineage-spec.md |
| State hash (snapshot.state_hash) | SHA-256 | Audit-facing, must be reproducible |
| Session commit hash (git) | SHA-256 | Git native |
| Internal replay acceleration | BLAKE3 (optional) | Speed, not audit-facing |
| Internal cache keys | BLAKE3 (optional) | Speed, not audit-facing |

---

## BLAKE3 Constraints (if used for internal acceleration)

BLAKE3 may be used ONLY when ALL of the following are true:

1. The output is never stored in an audit artifact
2. The output is never included in an event payload
3. The output is never used in a chain link
4. The use case is purely internal (cache key, fast lookup, dev tooling)
5. A SHA-256 equivalent exists alongside it for any audit-facing path

If BLAKE3 output is ever promoted to an audit-facing path,
the path must be converted to SHA-256 before that promotion.

---

## Implementation

```typescript
// REQUIRED for all chain hashes
import { createHash, createHmac } from 'crypto'; // Node.js native

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmacSha256(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

// OPTIONAL for internal acceleration only
// import { hash } from 'blake3'; // external dependency — use sparingly
```

---

## All References Updated

This document supersedes any implicit BLAKE3 reference in:
- event-versioning-spec.md → SHA-256 confirmed
- snapshot-strategy.md → SHA-256 confirmed
- rng-lineage-spec.md → HMAC-SHA256 confirmed
- threat-model.md → SHA-256 chain attack confirmed as low severity

---

## Version

hashing-strategy.md v1.0.0
ADR-008 (bootstrapped)
Change authority: Human only
Any change to chain hash algorithm requires MAJOR event schema version bump
