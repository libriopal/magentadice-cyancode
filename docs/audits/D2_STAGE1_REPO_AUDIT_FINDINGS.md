# D2 Stage-1 Research Environment — Repository Audit Findings

Source handoff: `D2_STAGE1_RESEARCH_ENVIRONMENT_HANDOFF_V3.md` (Claude Design project
`b0815c65-5c3a-496c-88f5-3ea5e05a6299`), §3 Repository Audit Plan.

**Nature of this document:** read-only findings only. No code was written, no CORE
file was touched. Per the handoff's own execution plan (§28/§29), this audit is
step 1 of 3 — step 2 is the human decisions in §27 below, and step 3
(implementation) does not begin until those are answered.

---

## 1. Apps/packages inventory

`core/apps/{server,web}` are both live entry points. All `core/packages/*` are
live and imported except part of `game-core`:

| Package | Status |
|---|---|
| `farkle-engine`, `farkle-shared` | Live — CORE |
| `ads`, `ai-quests`, `analytics`, `backend-client`, `blockchain`, `compliance`, `economy` | Live — SURFACE |
| `owc` | Live, but scoped to `apps/server/src/sandbox.ts` (Monte Carlo / dev tooling), not `gameRoom.ts` |
| `game-core` | **Mixed** — see below |

**`game-core` detail (the handoff asked this to be confirmed, not assumed):**
- `VoxelPhysicsSystem` is **live** — instantiated in `apps/web/src/components/GameScreen.tsx:17,72,122`, drives the real dice-drop physics rendering every player sees.
- `GameSessionManager`, `ItemSystem`, `MatchSystem`, `MetaSystem`, `ModifierSystem`, `ObjectiveSystem`, `PhysicsPileSystem`, `EventBus`, `ObjectPool` are **dead/orphaned** — the old match-3/meta-game (BV1) concept. `useGameSession()` (the only consumer) is never called; `HUD.tsx` (the only consumer of the related types) is never rendered.

Correction to the handoff: "game-core voxel systems are the BV1 deprecated coupling" is only half true — the physics half is live production code, the meta-game half is dead. Any Stage-1 work must not assume all of `game-core` is safely ignorable.

## 2. Existing persistence ("Plane B")

Confirmed live, not hypothetical. `core/apps/server/src/analytics.ts`:
- `insertSession()` (`:70-79`) → upserts to Supabase `session_analytics`, **includes `skill_score`** in the row today.
- `insertChainDecision()` (`:81-89`) → inserts to Supabase `chain_decisions`.
- Both fire-and-forget, no-op silently if `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` unset.
- Wired into live gameplay: `gameRoom.ts:16` imports both; `insertSession(...)` called at `gameRoom.ts:686` right after `SESSION_END` broadcast (`:677`).
- Read-side also exists: `getSkillPercentile`, `getSkillDifferentialReport` (`:91-132`).

Note for §27: the handoff's anti-circularity law forbids `skill_score` in any evidence *export*. It does not currently forbid it from the existing Plane B *storage* table — `session_analytics` already stores it. If Stage-1 evidence reuses Plane B as its source (an open question in the handoff, §19/§26), the export projection must strip `skill_score` at read time; the column itself is pre-existing and out of Stage-1 scope to remove.

## 3. IEventStore — handoff premise partially refuted

An `IEventStore` **contract** already exists at `contracts/IEventStore.ts` (frozen v1.0.0, "do not modify without IEventStore.v2.md + ADR + Human approval"), with companion specs in `contracts/` and `mesh/`. Test file `tests/test_pr_changes.py:984-1091` even expects named implementation classes (`InMemoryEventStore`, `SupabaseEventStore`, `PostgresEventStore`).

However, **no implementation exists anywhere** — zero `.ts` hits for those class names outside docs/tests, and zero imports of `IEventStore` outside its own definition file. The handoff's claim "confirm no IEventStore implementation exists (expected: none)" is **confirmed** as stated — the correction is that the interface/spec does exist (frozen, root-level), only the implementation is absent. This matters because it means Stage-1 must not accidentally treat `contracts/IEventStore.ts` as fair game to change — it's already a frozen contract under a separate governance rule, independent of `.ff-core-lock`.

## 4. Nondeterminism audit — both claims confirmed, one addition found

- **`gameRoom.ts:100-105`** — `Math.random()` for `this.boardSeed`, explicitly commented in-code as cosmetic-only, never feeds `this.csprng` (the real fairness RNG, `CSPRNG(nanoid(32))` at `:100`). Confirmed cosmetic.
- **`gridUtils.ts:234`** (`createGrid`, CORE SACRED file) — `seedNum = Date.now()` default, called from `gameRoom.ts:110` with no seed argument, so always uses the default. Seeds blocker-count/shuffle/clustering placement order only — die *face values* still come from the CSPRNG-seeded `SixPoolManager`. Confirmed.
- **Addition not named in the handoff:** `apps/server/src/sandbox.ts:343,377,435` and `apps/server/src/sandbox/sessionStore.ts:67,97` default Monte Carlo simulation seeds to `Date.now()`. This affects reproducibility of the `/sandbox` RTP-simulation dev tooling, not live play/fairness. Flagging for completeness; out of Stage-1 scope unless Stage-1 wants to record sandbox-driven synthetic sessions (it shouldn't, per anti-circularity law).
- No other `Math.random(`/`Date.now(` hits in `farkle-engine/src`, `apps/server/src`, or `apps/web/src` are RNG-seeding-relevant; the rest are UI timers/cooldowns.

## 5. File classification vs `.ff-core-lock` — no collisions

Checked `core/.ff-core-lock` CORE SACRED list against every new path the handoff proposes (`manifest.json`, `behavior_log.json`, `participant_journey.json`, `responses.json`, `research_notes.json`, `discovery_log.json`, `experiments.json`, `hypotheses.json`, `evidence_manifest.json`, plus recorder/registry modules). **Zero collisions** — none of these filenames exist anywhere in the repo today (verified via repo-wide `find`), so they are genuinely additive.

**Read-only integration touchpoints that exist today**, for a future recorder to observe without editing CORE:
- `gameRoom.ts` broadcasts: `ROOM_STATE` (:183), `PLAYER_JOINED` (:184), `PLAYER_LEFT` (:189), `BOARD_UPDATE` (:432, :552, :727), `GAME_STARTED` (:566), `CHAIN_RESULT` (:431, :551, etc.), `TURN_CHANGE` (:629), `MILESTONE_PAYOUT` (:642), `SESSION_END` (:677).
- `SESSION_END` (:677) is immediately followed by the existing `insertSession(...)` persistence call (:686) — i.e., session-end is already an established hook point, and the existing `analytics.ts` fire-and-forget pattern (SURFACE-adjacent, not CORE) is the template a recorder should follow rather than touching `gameRoom.ts` (CORE SACRED) directly.

## Capacitor / APK path

Confirmed present: `core/package.json` has `@capacitor/{android,cli,core}` ^8.3.1, `core/capacitor.config.ts` configured (`appId: app.match3d.greenhouse`, `webDir: apps/web/dist`), a full `core/android/` Gradle project, and an existing built `core/app-debug.apk`. Capacitor is wired at the `core/` workspace root only, not in `apps/web` or `apps/server` individually. The APK packaging path the handoff wants (§20) already has working tooling in place — no new packaging setup needed for Stage 1.

---

## Summary of corrections to the handoff's assumptions

1. `game-core` is not uniformly dead — its `VoxelPhysicsSystem` half is live production code.
2. `IEventStore` exists as a frozen contract (not implemented) — treat `contracts/IEventStore.ts` as a second, separate lock, not something Stage-1 touches.
3. Plane B's `session_analytics` table already stores `skill_score` today — any Stage-1 export sourced from Plane B needs an explicit strip-at-projection step (the handoff already requires this for exports; this just confirms the existing table is where it'd need to be stripped from).
4. One additional non-gameplay nondeterminism source exists (Monte Carlo sandbox seeds) — irrelevant to live play, flagged for completeness only.
5. Capacitor/APK tooling already exists and works — §20 packaging is not new work.

Everything else in the handoff's audit assumptions (§2–§7) is confirmed as stated.
