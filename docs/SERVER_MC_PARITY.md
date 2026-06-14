# SERVER_MC_PARITY — Priority 1 Authority Alignment Audit
# FAR_NZY / magentadice-cyancode
# Generated: 2026-06-03
# Branch: feature/deployment-setup
# Status: AUDIT COMPLETE — DO NOT FIX DURING AUDIT

---

## INSTRUCTIONS (from MASTER_DIRECTIVE.md §4 Priority 1)

For every mechanic: MATCH | DIVERGE | MISSING | STUB
Any DIVERGE or MISSING is a parity bug.
Document only — do not fix during the audit.
Parity bugs must be resolved before Priority 2 (Opportunity Scanner).

---

## AUTHORITY MATRIX

| # | Mechanic | Status | Server Location | Client Location | Notes |
|---|---|---|---|---|---|
| 1 | Board truth (grid state, tile placement) | **DIVERGE** | `gameRoom.ts:104-114` (createGrid once) | `useFarkleGame.ts:259-290` (physics bodies) | Server initializes grid but NEVER updates it after chain submission. Client physics engine maintains independent body positions. Server grid is static zombie state. |
| 2 | Chain validation (adjacency, legality) | ~~**DIVERGE**~~ **PARTIAL** | `gameRoom.ts` SUBMIT_CHAIN: 4-way adjacency + dedup + length cap; SUBMIT_CHAIN_FACES: column adjacency + chainLength clamp | `useFarkleGame.ts:196-245` (full adjacency, proximity, NORMAL-mode, backtrack, dedup) | BUG-02 RESOLVED 2026-06-03. Server now validates 4-way grid adjacency and no-duplicate for SUBMIT_CHAIN. SUBMIT_CHAIN_FACES: column adjacency (1 axis) + chainLength clamp. Row-axis validation pending BUG-01 (grid sync). NORMAL-mode face restriction not yet server-enforced. |
| 3 | Refill / spawnTiles | **MISSING** | `gridUtils.ts:335-364` (function exists) | `useFarkleGame.ts:282-291` (physics cascade, sends faces to server) | Server NEVER calls spawnTiles(). No cascade, no gravity, no spawn on server. Grid is static after init. Client sends resolved face arrays to server; server scores them but does not refill. |
| 4 | RNG ownership | **DIVERGE** | `gameRoom.ts:99` (CSPRNG init), `gameRoom.ts:567` (used only for doubler column) | `useFarkleGame.ts:26-28` (seededRng created, never used for game ops) | Server CSPRNG used only for doubler column selection (~once every 3 banks). Physics engine RNG is opaque and client-local. Neither party has authoritative per-turn seeding. |
| 5 | Reward eligibility (bank, vault, orb, doubler) | **MATCH** | `gameRoom.ts:376-479` (orb, doubler, vault split, ARCHIVIST%) | `useFarkleGame.ts:303-336` (solo-only; server authoritative in MP) | Server authoritative in multiplayer (computes and broadcasts deltas). Solo applies client-side. Constants (70/30 vault, 0.15 ARCHIVIST_PCT) match. |
| 6 | Dead-board detection and recovery | **DIVERGE** | `gameRoom.ts:673-702` (_checkAndRecoverDeadBoard, hasValidChain, _reshuffleGridFaces) | `useFarkleGame.ts:589-601` (physics.isDeadBoard, physics.reshuffleBoard, injectScoringDie) | Both run independently. No mutual exclusion. If both trigger, double-reshuffle possible. Server uses stale grid; client uses live physics state. |
| 7 | Scoring / scoreFarkle | **MATCH** | `gameRoom.ts:331,398` (scoreFarkle + multiplier scaling) | `useFarkleGame.ts:144-156` (lookupScore preview; farkleStore.ts:196-248 for local commit) | Both use shared farkleScorer.ts. Server is authoritative (MP: CHAIN_RESULT broadcasts server score). Client preview is display-only. |
| 8 | Multiplier ladder | **MATCH** | `gameRoom.ts:356,419` (chain-6 → +1 step, cap 5) | `farkleStore.ts:218-220` (identical logic) | Identical logic. Server authoritative in MP (syncFromServer). |
| 9 | Energy (PRIME / FRENZY) state | **DIVERGE** | `gameRoom.ts:144-160` (200ms tick, ±1 per tick = 5/sec; broadcasts ENERGY_UPDATE) | `useFarkleGame.ts:65-111` (RAF tick: PRIME +5/sec; FRENZY variable: 3/sec if energy<75, else 5/sec) | Client has catchup-drain logic (line 76: `drainRate = energy < 75 ? 3 : 5`) that server does not implement. Client also advances energy locally rather than waiting for server broadcast. Energy state can diverge within seconds under network load. |
| 10 | Farkle detection | **MATCH** | `gameRoom.ts:334` (scoreFarkle → result.isFarkle) | `farkleStore.ts:203` (chainScore === 0) | Both use shared scoreFarkle. Server authoritative; broadcasts isFarkle in CHAIN_RESULT. |
| 11 | RALLY roles (RAINMAKER, HEADHUNTER, ARCHIVIST, CONDUCTOR) | **DIVERGE** | `gameRoom.ts:516-537` (assignRoles), `482-489` (ARCHIVIST%), `538-554` (HEADHUNTER bomb 2×) | `useFarkleGame.ts:491-643` (RAINMAKER face picker, CONDUCTOR +1 step, ARCHIVIST drain, HEADHUNTER charge 2×) | Server: assigns roles; enforces ARCHIVIST and HEADHUNTER. CONDUCTOR and RAINMAKER enforcement is CLIENT-ONLY. Server has no logic to validate CONDUCTOR +1 step or RAINMAKER face selection. |
| 12 | HEIST vault mechanics (70/30 split, vault window) | **MATCH** | `gameRoom.ts:422-428` (70/30 at scoring), `284-296` (claimVault) | `useFarkleGame.ts:338-346` (solo: 70/30), `farkleStore.ts:342-354` (addToVault, claimVault) | Consistent 70/30 constant. Vault window expiry tracked by both. Server authoritative in MP. |
| 13 | Analytics / chain decisions (was_optimal, farkleRate) | **MATCH** | `gameRoom.ts:339-374,497-505` (insertChainDecision with was_optimal, farkleRisk) | None | Server is sole source of analytics. Client has no analytics writes. |
| 14 | Session end / payout | **MATCH** | `gameRoom.ts:604-658` (endSession: mode-specific payout, seed reveal, insertSession) | None | Server is sole authority. Client receives SESSION_END and displays. |

---

## PARITY BUGS

All DIVERGE and MISSING mechanics above are parity bugs. Ordered by severity.

---

### BUG-01 — Board Truth Divergence (DIVERGE) — CRITICAL

**Files:** `gameRoom.ts:104-114`, `useFarkleGame.ts:259-290`

Server initializes the grid once (`createGrid()`, line 105) and never updates it after chain submission. Client physics engine maintains independent body positions across cascade, gravity, and refill. Server broadcasts `BOARD_UPDATE` only after farkle or dead-board recovery (`_reshuffleGridFaces()`), which redraws faces but does not track structural board state.

Server chain validation, dead-board detection, and any future opportunity scanner all operate on a stale server grid. The server's grid state cannot be trusted as truth.

**Options:**
  A. Server drives full physics simulation; sends grid deltas to client (server becomes true source)
  B. Server drops grid state entirely; client is authoritative for board shape (server validates only scoring)

---

### BUG-02 — Chain Validation: Server Does Not Validate Adjacency or Legality — ✅ RESOLVED 2026-06-03

**Files:** `gameRoom.ts:207-211`, `useFarkleGame.ts:196-245`

Server only checks `chain.length >= 2`. A malicious client can submit any set of face values — `[1,1,1,1,1,1]` from six non-adjacent tiles — and server will score it as Six of a Kind (3000 pts). No adjacency, proximity, NORMAL-mode (1/5 only), backtrack, or duplicate checks exist server-side.

**Fix required:** Server must implement `validateChainAdjacency(chain, grid)` (or equivalent) before `scoreFarkle()`.

---

### BUG-03 — Refill / spawnTiles: Server Never Calls spawnTiles() (MISSING) — CRITICAL

**Files:** `gridUtils.ts:335-364` (dead code on server), `gameRoom.ts` (no call site)

`spawnTiles()`, `stepGravity()`, and `hasEmptyBelow()` are defined in gridUtils.ts but called zero times by the server. All tile cascade and grid management is physics-engine-local on the client. Server grid is effectively frozen from game start.

This makes BUG-01 and BUG-02 worse: even if server wanted to validate chains against a live grid, the grid would be stale.

---

### BUG-04 — RNG Ownership: No Authoritative Per-Turn Seeding (DIVERGE) — HIGH

**Files:** `gameRoom.ts:99,567`, `useFarkleGame.ts:26-28`

Server's CSPRNG is used only for doubler column selection (`gameRoom.ts:567`). Physics engine RNG is opaque and client-local (not seeded from server). Per-turn board events (cascade, tile placement) are driven by physics — no CSPRNG lineage. Client's `seededRng` is created but never used for game mechanics.

No audit trail links board sequences to a commit-revealed seed, which is a compliance risk.

---

### BUG-05 — Energy Desync: Client Catchup-Drain Logic Not in Server (DIVERGE) — MEDIUM

**Files:** `gameRoom.ts:144-160`, `useFarkleGame.ts:65-111`

Server: uniform drain (-1 per 200ms tick = 5/sec in FRENZY).
Client: `drainRate = energy < 75 ? 3 : 5` (line 76) — slower drain when energy is low. This is a catchup bonus the server does not implement.

Client also advances energy locally via RAF rather than waiting for ENERGY_UPDATE. Over a 90-second FRENZY session, client energy can be 10–30 points higher than server. This can shift FRENZY threshold (150 pts, `farkleStore.ts:19`) trigger timing.

---

### BUG-06 — Dead-Board Recovery: Independent Reshuffle, No Coordination (DIVERGE) — MEDIUM

**Files:** `gameRoom.ts:673-702`, `useFarkleGame.ts:589-601`

Both server and client detect and recover dead boards independently. Server uses `hasValidChain(this.state.grid)` (stale grid). Client uses `physics.isDeadBoard()` (live physics). No mutual exclusion or sync point.

If both trigger simultaneously, tile faces may be redrawn twice, or injected once on server and once on client, producing mismatched board states.

---

### BUG-07 — RALLY Roles: RAINMAKER and CONDUCTOR are Client-Only (DIVERGE) — MEDIUM

**Files:** `gameRoom.ts:516-537`, `useFarkleGame.ts:491-643`

RAINMAKER (bomb face selection) and CONDUCTOR (+1 multiplier step on PASS) are enforced client-side only. Server has no validator for RAINMAKER face choice or CONDUCTOR bonus application. A malicious client can pick a RAINMAKER face without constraint, or suppress/inflate CONDUCTOR bonuses.

ARCHIVIST and HEADHUNTER are consistent between server and client.

---

### BUG-08 — Orb / Doubler: Solo Mode Applies Client-Side Only (DIVERGE) — MEDIUM

**Files:** `gameRoom.ts:450-478`, `useFarkleGame.ts:303-330`

Solo mode: client applies orb and doubler bonuses locally (`useFarkleGame.ts:303-330`). Server computes them in `processChainFaces()` but only for multiplayer. If solo logic and server logic diverge (e.g., expired doubler timing), solo banked scores can differ from what server would compute.

Multiplayer is safer (server is authoritative via CHAIN_RESULT delta), but `syncFromServer` does not explicitly apply the broadcast bonus fields — it relies on the banked delta implicitly.

---

### BUG-09 — Doubler Spawn Rate Desync: Solo vs Server Column Logic (DIVERGE) — LOW

**Files:** `gameRoom.ts:565-570`, `useFarkleGame.ts:579-582`

Server: `column = (this.pool.drawDie() + this.explicitBanksTaken * 2) % 7` (pool-seeded).
Client solo: `column = _randomColumns()` (independent seededRng).

Columns differ between the two implementations. Not critical for solo UX but means server-side audit of doubler placement cannot reconstruct solo sessions.

---

## MISSING ITEMS SUMMARY

| Missing Item | Consequence |
|---|---|
| Server-side chain adjacency validation | Cheatable: any face combination can be submitted as a valid chain |
| Server-side spawnTiles() / refill | Server grid is zombie; cannot validate chains against live board |
| Authoritative per-turn RNG | No audit trail; physics randomness is opaque and unverifiable |
| RAINMAKER face validation | Client can select any bomb face without server check |
| CONDUCTOR bonus enforcement | Client can apply or suppress CONDUCTOR bonus without server check |
| Dead-board recovery coordination | Both parties reshuffle independently; possible double-reshuffle |

---

## STUB ITEMS

None found. All features are either implemented (server or client) or missing entirely. No server-side stubs detected.

---

## AUTHORITY GATE STATUS (Priority 1)

| Gate | Status |
|---|---|
| Server owns board truth | NO — grid is stale; physics is client-local |
| Server owns chain validation | NO — only length check; adjacency is client-only |
| Server owns refill | NO — spawnTiles never called by server |
| Server owns RNG | PARTIAL — CSPRNG exists but only used for doubler column; per-turn RNG is opaque |
| Server owns reward eligibility | YES — for multiplayer; solo applies bonuses client-side |

**Priority 1 gate is OPEN. Priority 2 (Opportunity Scanner) cannot begin until all five gate items are YES.**

---

## RECOMMENDED RESOLUTION ORDER

Parity bugs must be resolved before Priority 2 begins.
This is audit-only — do not begin fixes without explicit human authorization.

Suggested resolution order (to be authorized separately):
  1. BUG-02: Chain adjacency validation (smallest surface area; high security impact)
  2. BUG-01 / BUG-03: Board truth and refill (foundational; blocks scanner)
  3. BUG-04: RNG ownership (compliance; links to commit-reveal design)
  4. BUG-05 / BUG-06: Energy and dead-board coordination (correctness)
  5. BUG-07 / BUG-08: Role and bonus enforcement (anti-cheat, solo/MP consistency)
  6. BUG-09: Doubler spawn (low; audit cosmetics)
