# RNG LINEAGE SPECIFICATION
## FAR_NZY / magentadice-cyancode
## Document: rng-lineage-spec.md
## Status: Constitutional — changes require ADR + Human approval + Monte Carlo pass

---

## Principle

Without a defined seed lineage, every RNG output is unreplayable.
Every RNG output that is unreplayable is unauditable.
Every unauditable output in a sweepstakes platform is a legal liability.

The lineage defines not just how seeds are generated,
but how every derived value traces back to a single genesis root.

---

## The Four-Level Lineage

```
GENESIS
  ↓ HMAC-SHA256(ServerSecret, "genesis")
SESSION
  ↓ HMAC-SHA256(SessionSeed, RoomID ∥ Timestamp)
GAME
  ↓ HMAC-SHA256(GameSeed, RoundNumber ∥ MatchPhase)
EVENT
  ↓ HMAC-SHA256(EventSeed, EventIndex ∥ EventType)
```

Every derived value at every level is deterministically reconstructable
from the level above it, given the same inputs.

---

## Level Definitions

### GENESIS — Server Root Secret

```
Owner:      Server (HSM or equivalent secure enclave)
Storage:    Never in code, never in logs, never in transit
Rotation:   On security incident only (requires full audit)
Format:     256-bit cryptographically random value
Derivation: None — this IS the root
```

The GENESIS seed never leaves the server.
Claude Code never sees it, never proposes changes to its format,
and never touches the derivation path below it.
Any code that claims to need the GENESIS value is a Sacred Core violation.

### SESSION — Per-Match Seed

```
Derivation: HMAC-SHA256(GenesisSecret, RoomID ∥ TimestampMs)
Owner:      Server — generated before match starts
Committed:  To PDX ledger before any player input is accepted
Storage:    In replay log as encrypted field
Visibility: Players may verify after match (provably fair disclosure)
```

```
Seed_Session = HMAC-SHA256(ServerSecret, RoomID ∥ Timestamp)
```

The SESSION seed is committed to the ledger before the first tile is dealt.
No SESSION seed = no match start. This is enforced at the server layer.
Players receive the SESSION seed after match completion for verification.

### GAME — Per-Round Seed

```
Derivation: HMAC-SHA256(SessionSeed, RoundNumber ∥ MatchPhase)
Owner:      Execution Runtime (derived deterministically)
Storage:    In replay log per round
Visibility: Included in full replay disclosure
```

```
Seed_Game = HMAC-SHA256(Seed_Session, RoundNumber ∥ MatchPhase)
```

GAME seeds are derived client-side from the SESSION seed.
They are deterministic — given the same SESSION seed and round number,
the same GAME seed is always produced on any device.
This is what makes cross-device replay deterministic.

### EVENT — Per-Action Value

```
Derivation: HMAC-SHA256(GameSeed, EventIndex ∥ EventType)
Owner:      Execution Runtime (derived per event)
Storage:    In replay log per event
Visibility: Verifiable from GAME seed by any party with full replay
```

```
Seed_Event = HMAC-SHA256(Seed_Game, EventIndex ∥ EventType)
Value = Seed_Event mod DomainSize
```

EVENT values are the atomic outputs the game consumes.
A tile type, a die face, a cascade depth — all are EVENT values.
Every EVENT value is verifiable from the SESSION seed without revealing GENESIS.

---

## Lineage Proof Requirements

For any match to be considered auditable:

```
1. SESSION seed committed to ledger BEFORE match start ✓
2. SESSION seed matches: HMAC-SHA256(ServerSecret, RoomID ∥ Timestamp) ✓
3. All GAME seeds derivable from SESSION seed + round inputs ✓
4. All EVENT values derivable from GAME seeds + event inputs ✓
5. Final match state reconstructable from SESSION seed + input log alone ✓
```

If any step fails, the match is not auditable and is therefore
not legal as a sweepstakes skill competition.

---

## Lineage Audit Trail

The Replay Archivist audit cell records per session:

```json
{
  "lineage_audit": {
    "session_seed_committed_before_start": true,
    "session_seed_verifiable": true,
    "game_seeds_deterministic": true,
    "event_values_traceable": true,
    "full_replay_reconstructable": true,
    "lineage_version": "1.0.0"
  }
}
```

Any `false` in this record triggers a Level 3 Critical Violation.

---

## Prohibited Patterns

```
// PROHIBITED: Math.random() in any scoring or event path
const tileType = Math.floor(Math.random() * 6);  // ← HALT

// PROHIBITED: Date.now() as seed input without SESSION commitment
const seed = Date.now();  // ← HALT

// PROHIBITED: Client-generated seed for competitive match
const seed = crypto.getRandomValues(new Uint8Array(32));  // ← HALT (client-side)

// REQUIRED: Derived from committed SESSION seed
const eventValue = deriveEventValue(sessionSeed, eventIndex, eventType);  // ✓
```

---

## Version

rng-lineage-spec.md v1.0.0
Effective: at plan approval
Change authority: Human only
ADR required for any amendment
Monte Carlo re-run required for any change to derivation formula
