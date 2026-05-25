<!--
AUDIT::PATHWAY_DEPS: all tiers T5-T9 (roadmap reference)
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: documentation only; no code changes
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
-->

# FF_V4 Gap Analysis & Implementation Roadmap
## FAR_NZY / magentadice-cyancode
## Date: 2026-05-24 (post-T4 merge, T5 session)
## Authority: docs/protocols/FF_V4_Claude_Code_Directive.xml (supplemental)

---

## 1. Repository Audit (Current State — post-T4)

### What Exists

| Layer | Status | Evidence |
|---|---|---|
| Constitutional governance (9 docs) | COMPLETE | mesh/*.md, docs/adr/ADR-000–015 |
| Sacred Core protection (6 files enumerated) | COMPLETE | sacred-core-spec.md |
| Event store contracts (IEventStore v1.0.0) | FROZEN | contracts/, ADR-011 |
| SHA-256 replay chain (InMemoryEventStore) | IMPLEMENTED | replay.test.ts 5/5 |
| Supabase production store (SupabaseEventStore) | IMPLEMENTED | T4, ADR-015 |
| FD/PDX ledger separation (SQL migration) | IMPLEMENTED | 002_event_store_ledger.sql |
| PDX attestation gate (SQL + app layer) | IMPLEMENTED | pdx_ledger_award_attestation_check |
| RTP harness (all 8 modes) | IMPLEMENTED | rtp.harness.test.ts 3/3 |
| Fixed-point Q×1000 arithmetic | IMPLEMENTED | T1, ADR-012 |
| AMOE (free entry path) | IMPLEMENTED | AMOE.md, T2, ADR-013 |
| Play Integrity / hardware attestation | IMPLEMENTED | playIntegrity.ts, T2 |
| KYC (server-side) | IMPLEMENTED | ComplianceService, T2 |
| Geofencing | IMPLEMENTED | checkGeofence(), T2 |
| Physics fixed-step (PHYSICS_TIMESTEP=1/30) | IMPLEMENTED | VoxelPhysicsSystem.ts, T3, ADR-014 |
| Input queue (FIFO, no dropped taps) | IMPLEMENTED | enqueueAction(), T3 |
| Spawn queue (enqueueAction for spawn) | IMPLEMENTED | spawnBodyQueued(), T5 |
| Class archetype display badge | IMPLEMENTED | ClassArchetypeBadge.tsx, T5 |
| Softlock prevention (5 mechanisms) | VERIFIED | softlock-verification.md, T5 |

### What Remains (Gaps by Tier)

| Gap | Tier | Priority |
|---|---|---|
| Class multiplier calibration (ADR-010: ±0.003 RTP) | T5/T6 | HIGH |
| RALLY_FREE / HEIST_FREE RTP deviation 0.1158 (gate: ±0.005) | T6 | HIGH |
| gridUtils.ts SEVERITY-C float (blockerCount*0.5) | T6 | MEDIUM |
| SupabaseEventStore not wired to server routes | T6 | HIGH |
| Level schema (50+ stage taxonomy) | T6 | MEDIUM |
| Authoring tools and content pipeline | T6 | MEDIUM |
| Visual overhaul (Gothic Hacker Neon — 3libras spec) | T7 | HIGH |
| Audio routing graph (AGROS ERK conductor wiring) | T7 | MEDIUM |
| FD/PDX/SDX economy UI (staking, marketplace) | T8 | MEDIUM |
| SDX blockchain confirmation gate (UI ceremony) | T8 | HIGH |
| Multiplayer determinism verification (100 matches) | T9 | HIGH |
| PostHog analytics events | T9 | MEDIUM |
| Play Store submission checklist | T9 | MEDIUM |
| skillMetrics.ts SEVERITY-C advisory floats | T6 | LOW |

---

## 2. Dependency Map

### Internal Package Graph

```
@match3d/web (apps/web)
  ├── @match3d/game-core      (physics, replay, event store)
  ├── @match3d/farkle-engine  (scoring, CSPRNG, Monte Carlo) [SACRED]
  ├── @match3d/farkle-shared  (types, constants)
  ├── @match3d/economy        (FD/PDX/SDX calculations)
  ├── @match3d/compliance     (session analytics, KYC)
  ├── @match3d/blockchain     (SDX confirmation events)
  ├── @match3d/ads            (rewarded video)
  ├── @match3d/ai-quests      (NPC quest generation)
  ├── @match3d/analytics      (PostHog events)
  └── @match3d/backend-client (Supabase API interface)

@match3d/server (apps/server)
  ├── @match3d/farkle-engine  (scoring authority)
  ├── @match3d/farkle-shared  (shared types)
  └── @match3d/compliance     (session analytics)
```

### Critical External Dependencies

| Package | Version | Risk | Notes |
|---|---|---|---|
| @dimforge/rapier3d-compat | 0.12.0 | LOW | WASM — stable; physics determinism verified |
| three | 0.162.0 | LOW | Rendering only; not in scoring path |
| @supabase/supabase-js | 2.39.0 | MEDIUM | Ledger writes — T4 migration covers schema |
| express | 5.2.1 | MEDIUM | Server — no input validation library yet |
| ws | 8.19.0 | LOW | WebSocket multiplayer — stable |
| zustand | 4.5.0 | LOW | Client state — not authoritative |

### Sacred Core Isolation

All Sacred Core files are in `core/packages/farkle-engine/src/`. No other package
writes to these files. Game-core and server packages import them read-only.

---

## 3. Risk Report

### CRITICAL

| # | Risk | Impact | Mitigation | Tier |
|---|---|---|---|---|
| R-1 | RALLY_FREE/HEIST_FREE RTP deviance 0.1158 (AA+ gate: ±0.005) | Legal RTP violation | monteCarlo.ts calibration via ADR-010 | T6 |
| R-2 | SupabaseEventStore not wired to any server route | Replay chain not populated in production | Wire to gameRoom.ts IEventStore.write() calls | T6 |
| R-3 | SDX ceremony fires before blockchain confirmation | SDX over-award (legal) | @match3d/blockchain confirmation gate enforced in T8 | T8 |

### HIGH

| # | Risk | Impact | Mitigation | Tier |
|---|---|---|---|---|
| R-4 | No per-message sequence number on WebSocket | Cross-session replay attack vector | Add nonce + session binding to message schema | T9 |
| R-5 | skillMetrics.ts skill_score heuristic unvalidated | Regulatory challenge to skill-based classification | Statistical validation vs. play data (correlation ≥0.7) | T9 |
| R-6 | Class archetype multipliers not calibrated to ±0.003 RTP | ADR-010 gate not yet satisfied | Monte Carlo pass after ADR-010 implementation | T6 |
| R-7 | gameRoom.ts pre-existing type error (msg at line 646) | Build fragility | Fix in T6 scope | T6 |

### MEDIUM

| # | Risk | Impact | Mitigation | Tier |
|---|---|---|---|---|
| R-8 | gridUtils.ts blockerCount*0.5 float (SEVERITY-C) | Non-scoring path; no RTP impact | Convert to integer arithmetic | T6 |
| R-9 | Level content not schema-validated | Malformed levels crash game | Level schema + authoring validation | T6 |
| R-10 | AGROS ERK conductor not wired to FAR_NZY game state | Audio emotional continuity broken | dream/apps/frontend ERK wiring | T7 |

---

## 4. Implementation Roadmap (T5–T9)

### T5 — Core Loop Excellence (CURRENT SESSION)
- enqueueAction spawn extension ✓
- ClassArchetypeBadge display ✓
- Softlock verification: 0/50 ✓
- FF_V4 deliverables ✓

### T6 — Content Pipeline + Calibration
**Key tasks:**
1. Wire SupabaseEventStore into gameRoom.ts (replace InMemoryEventStore in production)
2. Fix gridUtils.ts SEVERITY-C float (blockerCount → integer)
3. Fix gameRoom.ts type error at line 646
4. Implement level schema (JSON Schema for LevelDef)
5. Build 50-stage taxonomy from data/ corpus
6. ADR-010 Monte Carlo calibration pass (target: ±0.005 → ±0.003 for RALLY/HEIST modes)

**Pass gate:** SupabaseEventStore active in staging → chain populates → verifyChain() PASS.

### T7 — Presentation Excellence
**Key tasks:**
1. Full Gothic Hacker Neon UI pass (3libras/ visual law)
2. AGROS ERK conductor wired to FAR_NZY game state events
3. Audio routing graph: Web Audio API → ERK → DSP (WASM AudioWorklet)
4. All 18 UI components have complete state coverage
5. Figma component library mapped to codebase

**Pass gate:** Audio latency <10ms + Grade A rubric on all 18 components.

### T8 — Economy & FAR_NZY
**Key tasks:**
1. FD/PDX/SDX economy UI (staking, marketplace, ceremony animations)
2. SDX ceremony fires ONLY after @match3d/blockchain confirmation
3. NFT item visual presentation (VOIDSHARD tier)
4. 6 production scenes (level themes from data/ corpus)

**Pass gate:** SDX never increments before blockchain confirmation (0 Math.random() in economy path).

### T9 — Social, Platform & LiveOps
**Key tasks:**
1. 2-player multiplayer determinism (100 test matches, 0 desync)
2. Per-message sequence numbers (replay attack prevention)
3. PostHog analytics events wired
4. Play Store submission checklist complete
5. Leaderboard policy documented
6. skillMetrics.ts statistical validation

**Pass gate:** 2-player match deterministic + PostHog active + Play Store checklist green.

---

## 5. T-Series Test Plan

| Tier | New Tests | Regression Gate |
|---|---|---|
| T5 | spawnQueue.test.ts 4/4 | farkleScorer 16/16, replay 5/5, chain 2/2, inputQueue 2/2, spawn 3/3 |
| T6 | eventStore.integration.test.ts, level.schema.test.ts | All T5 + rtp.harness (deviance <0.05 for all 8 modes) |
| T7 | audio.latency.test.ts (<10ms), component.coverage.test.ts | All T6 |
| T8 | economy.integrity.test.ts, sdx.confirmation.test.ts | All T7 + 0 Math.random() in economy |
| T9 | multiplayer.determinism.test.ts (100 matches), posthog.events.test.ts | All T8 + 0 desync in 100 matches |

---

## 6. FF_V4 Execution Order Verification

Per `docs/protocols/FF_V4_Claude_Code_Directive.xml`:
```
Audit→MapDependencies→PreserveSacredFiles→Implement→Test→Balance→Security→Compliance→Production
```

| Step | Status |
|---|---|
| Audit | COMPLETE — this document |
| MapDependencies | COMPLETE — Section 2 above |
| PreserveSacredFiles | ACTIVE — 0 Sacred Core writes across T0–T5 |
| Implement | IN PROGRESS — T5 core loop excellence |
| Test | IN PROGRESS — 35/35 tests pass post-T5 |
| Balance | PENDING — T6 ADR-010 Monte Carlo calibration |
| Security | COMPLETE (T2) — Play Integrity, KYC, geofencing, attestation |
| Compliance | COMPLETE (T2) — AMOE, PDX gate, FTC 16 C.F.R. § 251 |
| Production | PENDING — T8/T9 |
