# CODEX P2.5 PRE-AUTHORIZATION VERIFICATION PROTOCOL
## Project: FAR_NZY / magentadice-cyancode
## Target: P2.5 Authority Consolidation — SACRED FILE VERIFICATION
## Mode: Evidence-first audit. No recommendations. No implementation.
## Runtime code is truth. Documentation is a claim until verified.

---

# MISSION

Verify the six claims made in docs/P2_5_AUTHORITY_IMPLEMENTATION_PLAN.md
before any sacred file is modified.

Return only what the repository proves.
Do not generate implementation plans.
Do not generate code.
Do not fill gaps with inference.

---

# EVIDENCE RULES

Use the cheapest path first:

1. core/.ff-core-lock            — sacred status confirmation
2. Exact runtime file evidence   — targeted reads only
3. Import traces                 — confirm actual consumers
4. Call graphs                   — confirm execution paths
5. Tests                         — confirm coverage exists
6. Documentation                 — lowest trust, never sole evidence

Stop searching once sufficient evidence exists.
Never search the entire repository when a targeted file answers.
Report UNKNOWN rather than continuing expensive searches.

---

# CLASSIFICATION SYSTEM

Every claim must resolve to exactly one:

EXISTS          — runtime implementation verified
PARTIAL         — some implementation, dependencies incomplete
MISSING         — no runtime implementation found
DOCUMENTED ONLY — appears in plan/docs, not in runtime
ASSUMED         — cannot be proven from repository evidence
UNKNOWN         — evidence exhausted, confidence below 70%

Never upgrade ASSUMED to EXISTS.
Never upgrade DOCUMENTED ONLY to EXISTS.

---

# OUTPUT ORDER

Return in this exact order:

1. Claim Verification Table (Layer 1)
2. Sacred File Impact Audit (Layer 2)
3. WS Contract Audit (Layer 3)
4. Scoring Path Audit (Layer 4)
5. Contradiction Report
6. Dependency Graph
7. Unknowns
8. Confidence Score

No recommendations unless explicitly requested.

---

# LAYER 1 — CLAIM VERIFICATION TABLE

The P2.5 plan makes six claims about the current repository state.
Verify each claim against runtime evidence.

Claims to verify:

| # | Plan Claim | Verify By | Expected Status |
|---|-----------|-----------|-----------------|
| C1 | submitChain() has zero callers | grep submitChain across core/apps/web/src/ | CONFIRMED / REFUTED |
| C2 | useFarkleGame.ts is called unconditionally in multiplayer (no isMultiplayer guard) | read GameScreen.tsx useFarkleGame call site | CONFIRMED / REFUTED |
| C3 | farkleStore has no syncFromServer action | grep syncFromServer in farkleStore.ts | CONFIRMED / REFUTED |
| C4 | multiplayerStore._applyMessage has no BOARD_UPDATE handler | read multiplayerStore.ts _applyMessage | CONFIRMED / REFUTED |
| C5 | CHAIN_RESULT is broadcast by gameRoom.ts | grep CHAIN_RESULT in gameRoom.ts | CONFIRMED / REFUTED |
| C6 | resolvedFaces is available in useFarkleGame.ts endChain() scope | read useFarkleGame.ts endChain() | CONFIRMED / REFUTED |

Return:

### Claim Verification Table
| Claim | Status | Runtime Evidence | Confidence |

---

# LAYER 2 — SACRED FILE IMPACT AUDIT

Read core/.ff-core-lock first.

For each of the three sacred files the plan proposes to modify:

  gameRoom.ts
  useFarkleGame.ts
  farkleStore.ts

Determine for each:

- Current line count (size of change surface)
- Existing consumers (who imports it)
- Whether the proposed addition is additive-only or modifies existing logic
- Whether any existing test covers the area being changed

Return:

### Sacred File Impact Table
| File | Lock Status | Current Consumers | Change Type | Test Coverage | Risk |

Change Type options:
  ADDITIVE      — new function/case, nothing existing modified
  MODIFYING     — existing function signature or logic changed
  BOTH          — adds new and modifies existing

Risk options:
  LOW    — additive only, no existing logic changed
  MEDIUM — modifies existing logic in non-critical path
  HIGH   — modifies existing logic in scoring or RNG path

---

# LAYER 3 — WS CONTRACT AUDIT

The plan introduces a new WebSocket message type: SUBMIT_CHAIN_FACES.

Verify the current WS contract before adding to it.

Determine:

- What message types currently exist in gameRoom.ts (list all case handlers)
- What message types currently exist in multiplayerStore._applyMessage (list all case handlers)
- Whether the two sides are symmetric (server sends what client handles)
- Whether any existing message type conflicts with SUBMIT_CHAIN_FACES

Return:

### WS Message Inventory
| Direction | Message Type | Handler Location | Status |

### Symmetry Gaps
| Message Type | Server Sends | Client Handles | Gap |

---

# LAYER 4 — SCORING PATH AUDIT

The plan uses optimistic client scoring with server reconciliation.

Verify the scoring path is actually consistent between client and server.

Determine:

- Does useFarkleGame.ts call scoreFarkle() or farkleStore.commitChain()?
- Does gameRoom.ts call scoreFarkle() directly or via an intermediary?
- Do both paths use the same buildScoreTable() call?
- Does farkleStore.commitChain() apply any bonuses (orb, doubler, ARCHIVIST, heist vault) that gameRoom does not?
- Is multiplierStep managed identically in both paths?

Return:

### Scoring Path Comparison Table
| Step | Client Path | Server Path | Divergence |

Flag any divergence as a CONTRADICTION.

---

# CONTRADICTION REPORT

Format each contradiction as:

CONTRADICTION

Claim:
<exact statement from P2_5_AUTHORITY_IMPLEMENTATION_PLAN.md>

Runtime Truth:
<exact runtime evidence>

Severity:
LOW / MEDIUM / HIGH / CRITICAL

Impact:
<what breaks if this contradiction is not resolved before P2.5 executes>

Rules:
- Only include contradictions supported by runtime evidence
- Never infer
- A claim that cannot be verified is an UNKNOWN, not a contradiction

---

# DEPENDENCY GRAPH

Return only validated dependencies using runtime evidence.

Scope: P2.5 change set only.

Format: A → B

Verify each edge exists in runtime before including it.
Never include speculative edges.

Required edges to verify:

  useFarkleGame.endChain() → farkleStore.commitChain()
  useFarkleGame.endChain() → mpActions.submitChainFaces() [PROPOSED — verify gap]
  multiplayerStore.CHAIN_RESULT → farkleStore.syncFromServer() [PROPOSED — verify gap]
  gameRoom.SUBMIT_CHAIN_FACES → processChainFaces() [PROPOSED — verify gap]
  farkleStore.syncFromServer() → HUD display [verify farkleStore → FarkleHUD path]

Mark each edge:
  CONFIRMED — exists in runtime today
  PROPOSED  — would be created by P2.5
  BROKEN    — referenced but not connected

---

# UNKNOWNS

List every item that cannot be proven from the repository.

Format:

UNKNOWN:
Reason:
Evidence Needed To Resolve:

Required unknowns to investigate:

U1 — Does faceRng in injectScoringDie() trace to the server seed or is it independently seeded?
U2 — Are client-side bonuses (orb, doubler, ARCHIVIST, heist vault) applied in farkleStore.commitChain() and absent from gameRoom.processChain()?
U3 — Does any existing test cover the multiplayer scoring path?
U4 — Is there a body-ID → DieFace[] mapping already available in useFarkleGame scope when endChain() fires?

---

# CONFIDENCE SCORE

0–100

Based on:
- Runtime coverage of the six plan claims
- Evidence quality for sacred file changes
- Number of UNKNOWN items remaining
- WS contract symmetry

Formula:
  Start: 100
  -10 per UNKNOWN critical dependency
  -10 per unverified sacred file change
  -5  per WS symmetry gap
  -5  per scoring path divergence found

Return:

### Confidence Score: N/100
### Breakdown: (show deductions)
### Authorization Recommendation: SAFE / REVIEW REQUIRED / DO NOT AUTHORIZE

Authorization thresholds:
  ≥80  — SAFE to authorize
  60–79 — REVIEW REQUIRED (list what needs resolution first)
  <60   — DO NOT AUTHORIZE (list blocking unknowns)

---

# HARD RULES

DO NOT:
- Assume intent
- Assume implementation
- Trust documentation
- Generate roadmaps
- Generate implementation code
- Recommend features
- Fill gaps with inference
- Authorize or recommend authorization

ONLY REPORT WHAT THE REPOSITORY PROVES.

If evidence is insufficient: return ASSUMED or UNKNOWN.
Never upgrade ASSUMED to EXISTS.
Repository truth is more important than completeness.
