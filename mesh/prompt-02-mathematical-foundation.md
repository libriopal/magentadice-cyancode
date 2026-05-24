# PROMPT-02: MATHEMATICAL FOUNDATION
## Tier: T1
## Authorization: PASS — T1C prerequisite met
## MCPs: filesystem, GitHub, context7, memory

---

## Identity

You are Claude Code implementing Tier 1: Mathematical Foundation.
Your mission is to audit all scoring paths in the farkle-engine for float violations,
eliminate or isolate every float in a path that affects scoring or payout,
and establish a Monte Carlo RTP baseline.

Legal posture: A float in a scoring path is a legal violation, not a bug.
Act accordingly.

---

## Pre-Session

1. Verify `memory.tier_gate_status.T1C === 'PASS'`
2. Verify contracts/IEventStore.v1.md exists and is FROZEN
3. Read core/packages/farkle-engine/src/farkleScorer.ts (Sacred Core — read only)
4. Read core/packages/farkle-engine/src/rtpConfig.ts (Sacred Core — read only)
5. Read core/packages/farkle-engine/src/monteCarlo.ts (Sacred Core — read only)

---

## Mission

### Task 1 — Float Audit: All Scoring Paths

Scan every TypeScript file in `core/packages/farkle-engine/src/` for:
- Float literals (e.g., `0.5`, `1.15`, `0.40`) in any path that contributes to score, payout, or game state determination
- `parseFloat()`, `Number()` on string inputs in scoring paths
- Division (`/`) where the result feeds into score without integer truncation
- Multiplications that produce non-integer results stored in scoring fields
- `Math.random()` anywhere (banned in all scoring paths per sacred-core-spec.md)

Classify each finding:
```
SEVERITY-A: float IN scoring path (score_delta, running_total, payout amounts)
  → FIXED_POINT_CHECK: FAIL → L3 halt unless it is in a Sacred Core file (propose only)
  
SEVERITY-B: float ADJACENT to scoring path (multiplier param, intermediate value)
  → L2 — pause for Human decision: fix now vs. propose-only

SEVERITY-C: float in non-scoring path (visual, board layout, simulation only)
  → L1 — log, continue, address if time permits
```

Files to audit (minimum — do not skip):
- `farkleScorer.ts` — SACRED CORE (read only; PROPOSE if violations found)
- `rtpConfig.ts` — SACRED CORE (read only; PROPOSE if violations found)
- `monteCarlo.ts` — SACRED CORE (read only; PROPOSE if violations found)
- `csprng.ts` — SACRED CORE (read only)
- `chainIndex.ts`
- `gridUtils.ts`
- `slipstream.ts`
- `shards.ts`
- `skillMetrics.ts`
- Any other `.ts` files in src/

For Sacred Core files with violations: write a PROPOSAL document to
`runs/proposals/PROPOSAL-[filename]-floats-[YYYYMMDD].md` per the Sacred Core
proposal process. Do NOT modify Sacred Core files.

For non-Sacred Core files with SEVERITY-A or SEVERITY-B violations:
fix them using Q32.32 fixed-point integers.

### Q32.32 Fixed-Point Conversion Reference

```typescript
// Q32.32: integer where 1.0 is represented as 2^32 = 4294967296
const Q = 4294967296n; // BigInt

// Converting a known multiplier (e.g., Paladin 1.15x):
// Do NOT do: score * 1.15
// DO: (BigInt(score) * 115n) / 100n  — all integer arithmetic
// Or for Q32.32: (BigInt(score) * Q * 115n) / (Q * 100n)

// For simple percentage multipliers, integer math suffices:
// 1.15x → multiply by 115, divide by 100 (integer division)
// 2.5x  → multiply by 25, divide by 10
// 1.85x → multiply by 185, divide by 100

// FIXED_POINT_CHECK signature required on any scoring arithmetic function:
// AUDIT::FIXED_POINT_CHECK: PASS
```

### Task 2 — Fix Non-Sacred Float Violations

For each non-Sacred Core file with SEVERITY-A or SEVERITY-B float violations:

1. Run the existing farkle-engine tests BEFORE making any change:
   ```bash
   cd core/packages/farkle-engine
   node --import tsx/esm --test src/farkleScorer.test.ts
   ```
   Record: all tests pass (baseline).

2. Apply fixed-point conversion.

3. Run tests AFTER each file change:
   - All tests must still pass.
   - If a test fails: roll back that file change, raise L1 finding, continue to next file.

4. Add `AUDIT::FIXED_POINT_CHECK: PASS` comment to each fixed function.

### Task 3 — Monte Carlo RTP Baseline

Run the existing Monte Carlo harness:
```bash
cd core/packages/farkle-engine
node --import tsx/esm src/monteCarlo.ts
```
Or equivalent test invocation if monteCarlo exports a runnable function.

Record:
- RTP mean over N generations
- RTP variance
- Whether result is within ±0.005 of rtpConfig.ts target

If the harness cannot be run directly:
- Read monteCarlo.ts (Sacred Core — read only)
- Document what inputs it takes and what command runs it
- Propose the invocation in the ADR
- Mark Task 3 as: `MONTE_CARLO_BASELINE: DEFERRED — harness not directly invocable`

### Task 4 — ADR-012

Write `docs/adr/ADR-012-fixed-point-audit-t1.md`:
- Documents every float violation found (by file and line)
- Documents which violations were fixed vs. proposed (Sacred Core)
- Records Monte Carlo baseline result (or DEFERRED status)
- Status: Accepted

---

## T1 Pass Gate

- [ ] All scoring-path files audited for float violations
- [ ] SEVERITY-A violations in non-Sacred files: eliminated or zero found
- [ ] Sacred Core float violations: proposal documents written (or none found)
- [ ] All farkle-engine tests pass after changes
- [ ] Monte Carlo baseline recorded (or DEFERRED with reason)
- [ ] ADR-012 committed
- [ ] AUDIT::FIXED_POINT_CHECK: PASS on all modified files
- [ ] No L2+ flags unresolved

When passed: `memory.tier_gate_status.T1 = 'PASS'`

---

## AUDIT Signature

```yaml
AUDIT::PATHWAY_DEPS: [core/packages/farkle-engine/src/, docs/adr/ADR-012]
AUDIT::CURRENT_GRADE: [Target: Grade A — Q32.32 throughout scoring paths]
AUDIT::ENTROPY_VECTOR: [High for Sacred Core files (propose only); Medium for non-sacred scoring files]
AUDIT::FIXED_POINT_CHECK: PASS required on all modified files — FAIL triggers L3 halt
```
