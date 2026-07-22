# GLASSBOX_LABS_BUILD_DIRECTIVE  (the artifact Claude Code executes)

> Replaces the earlier single-shot Base44 prompt. Container: a governed, Claude-Code-buildable
> multi-experiment evidence-first ecosystem. Authority model + gates: see governance/.
> NOT legal advice. Real-money features are gated (G1) pending human decision + counsel.

## MISSION
Build a lean, **closed-loop (no real money)**, geo-gated ecosystem of small skill-game *experiments*
that generate opt-in human playtest data and optional rewarded surveys. Human evidence is the growth
nutrient. Grow the architecture toward the FAR_NZY target identity ONLY through gated expansion.

## AUTONOMY MODEL
- Phases P0–P4 below are **auto-buildable** (reversible, sandboxed). Run them hands-off.
- Phase P5 (real-money / FAR_NZY sweepstakes target) is **gate G1 + G4** — do not build without tokens.
- Deploy is **gate G2**. Secrets/real DB is **gate G3**.

## STACK (reuse OSS; minimize new code)
- App: React + Vite + TypeScript; local dev + local SQLite/Postgres in sandbox (real DB = G3).
- Reuse verified logic from the public repo **github.com/libriopal/FAR_NZY**, package
  `packages/farkle-engine`: `scoreFarkle`, `csprng.ts` (`CSPRNG`, `verifyServerSeed`,
  `deriveCombinedSeed`), `gridUtils.ts`. Keep names/behavior identical so outcomes stay verifiable.
- Surveys: SurveyJS (MIT). Region: IP-geolocation lookup → state (precise polygon later, P3).

## PHASES
- **P0 Scaffold:** repo, tooling, CI (tests only), the governance files copied into the app, the
  evidence schema, the experiment-registry table, `blocked_regions` loaded from config (read-only).
- **P1 One experiment + evidence:** Experiment #1 "One-Roll" (single-player skill dice via ported
  farkle-engine, commit-reveal fairness + public Verify view), opt-in rewarded survey + free-text
  reflection, closed-loop "Sparks" wallet (non-redeemable, no purchase/cash-out), admin evidence
  export with forbidden-field strip.
- **P2 Auth + geo-gate + consent:** 18+ age gate, consent copy, hard region gate at signup and before
  every play/earn action; log every region check.
- **P3 Library growth:** add 2–4 more experiments as registry rows; widen evidence capture; precise
  geofencing (open Census TIGER boundaries). Still closed-loop.
- **P4 AI-audit loop (advisory):** wire `scripts/ai_audit.mjs` (Claude API) to review diffs/build
  output and emit an advisory report (VF/SI/AS/SP/SC) into `evidence/audits/`. It NEVER ratifies; it
  routes flags to human gates (see governance/AI_AUDIT_LOOP_SPEC.md).
- **P5 FAR_NZY target (GATED — G1+G4):** symmetric-seed PvP + the value-model decision (redeemable vs
  closed-loop, kept open) + counsel-cleared real-value flow. Build ONLY after tokens exist.

## DEFINITION OF DONE (per phase)
Tests pass; no forbidden fields present; no gate crossed without a token; an entry appended to
`ratification/STATE.md` describing what was built and which gate (if any) is now pending.
