# Audit 01 — Sacred Core Integrity Status

**Date:** 2026-05-25 | **Tiers audited:** T0–T9

## Sacred Core File Inventory

Per `mesh/sacred-core-spec.md`:

| File | T-series writes | Last authorized write | Status |
|---|---|---|---|
| `packages/farkle-engine/src/farkleStore.ts` | 0 (post-T0) | Pre-T-series baseline | CLEAN |
| `packages/farkle-engine/src/gameStore.ts` | 0 (post-T0) | Pre-T-series baseline | CLEAN |
| `packages/farkle-engine/src/farkleScorer.ts` | 1 | T1 (7d512bf) — Q×1000 multiplier fix | AUTHORIZED |
| `packages/farkle-engine/src/rtpConfig.ts` | 0 (post-T0) | Pre-T-series baseline | CLEAN |
| `packages/farkle-engine/src/monteCarlo.ts` | 0 (post-T0) | Pre-T-series baseline | CLEAN |
| `packages/farkle-engine/src/csprng.ts` | 0 (post-T0) | Pre-T-series baseline | CLEAN |

## T1 Sacred Core Write — Authorization Audit

**Commit:** `7d512bf feat(T1): farkleScorer multiplierQ — Q×1000 fixed-point, no float literal`
**File:** `farkleScorer.ts`
**Nature:** Fixed-point arithmetic correction — replaced float multiplier with Q×1000 integer representation
**Authorization:** T1 (Mathematical Foundation) is the designated tier for scoring arithmetic corrections
**ADR:** ADR-001 (mathematical foundation, T1 scope)
**Verdict:** AUTHORIZED — corrects a legal violation (float in scoring path); no scoring logic altered

## T9 Core Submodule Change Evidence

**Submodule pointer update:** `b7c790b` → `07c9963` (PR #19 diff)

Files changed between those SHAs (`git diff b7c790b..07c9963 --name-only` in `core/`):

```
apps/server/src/__tests__/twoPlayer.determinism.test.ts  (new)
apps/server/src/analytics.ts                              (modified)
apps/server/src/gameRoom.ts                               (modified)
```

No Sacred Core file appears in this diff. All 6 Sacred Core files (`farkleStore.ts`, `gameStore.ts`, `farkleScorer.ts`, `rtpConfig.ts`, `monteCarlo.ts`, `csprng.ts`) are unchanged between the two SHAs.

**Session artifact evidence:** `runs/2026-05-25/session-13.json` records `git_head: "tier/T9-social-platform-liveops-20260525 (core submodule at 07c9963)"` and `sacred_core_writes: 0`. `handoff/02-session-snapshot.json` confirms `git_head` and `rng_lineage_intact: true`.

## Verdict

**Sacred Core integrity: PASS**
- 5 of 6 files: zero T-series writes
- 1 of 6 files (farkleScorer.ts): 1 authorized write (T1, legal compliance fix)
- Zero unauthorized Sacred Core writes across T0–T9

## Proof of Value

- **Expected impact:** Zero Sacred Core regressions confirmed; deterministic replay chain intact
- **Risk:** None — read-only verification
- **Dependencies:** None
- **Rollback:** N/A

```text
AUDIT::PATHWAY_DEPS: mesh/sacred-core-spec.md, core/packages/farkle-engine/src/
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: Zero unauthorized Sacred Core writes; farkleScorer T1 write authorized
AUDIT::FIXED_POINT_CHECK: PASS
```
