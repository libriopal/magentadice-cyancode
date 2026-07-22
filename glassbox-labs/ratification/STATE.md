# BUILD STATE LEDGER (agent appends; human reads)
- init: scaffold delivered. Current phase: P0 (not yet started by Claude Code).
- Pending gates: none until P5/deploy/secrets/legal-config are reached.
- To grant a gate, a HUMAN creates ratification/<GATE>.granted (see governance/HUMAN_GATES.md).

## 2026-07-22 — P0 + P1 built; P2 (sandbox form) + P4 wired. Host: magentadice-cyancode/glassbox-labs
Built by Claude Code on branch `claude/glassbox-labs-directive-tdohsc`. All work is sandboxed,
reversible, closed-loop. NO gate was crossed; NO ratification token was created or used.

### P0 — Scaffold (DONE)
- React + Vite + TypeScript app; strict TS (0 errors); Vitest suite (39 tests, all green); vite build passes.
- Governance corpus copied into the app under governance/; constitution/anti-circularity/gates intact.
- Evidence schema (src/evidence/schema.ts) mirrors spec/data_model.md.
- Experiment registry loaded read-only from config/experiments.registry.json (src/experiments/registry.ts).
- blocked_regions loaded READ-ONLY + frozen (src/region/regionGate.ts) — never written by code (G4-owned).
- CI (tests only): .github/workflows/glassbox-labs-ci.yml runs type-check + vitest, scoped to glassbox-labs/**. No deploy.

### P1 — Experiment #1 "One-Roll" + evidence (DONE)
- farkle-engine ported behavior-identical from FAR_NZY (scoreFarkle + chainIndex + csprng); parity suite mirrors
  the 16 PRESERVATION_SPEC cases (src/engine/farkle-engine, see PORTED.md).
- Commit-reveal fairness (sha256 commitment → reveal → recompute) + public Verify view (src/experiments/one-roll,
  src/app/views/Verify.tsx).
- Opt-in rewarded survey (SurveyJS, MIT) + free-text reflection; FLAT completion bonus, never content-scaled.
- Closed-loop Sparks wallet: EARN-ONLY by construction, no debit/redeem/withdraw/transfer API (src/sparks/wallet.ts).
- Admin evidence export with forbidden-field strip: skill_score / was_optimal can never leave the system,
  by construction AND defensively (src/evidence/forbiddenFields.ts, store.exportEvidence). Verified by tests.

### P2 — Auth + geo-gate + consent (SANDBOX FORM)
- 18+ age gate + honest consent copy + hard region gate at entry AND before every play/earn action; every region
  check logged to region_checks (src/app/views/Gate.tsx, labStore.assertPlayAllowed). Fail-closed on unknown region.
- Deferred to a gate: real auth + real IP-geolocation provider need network/secrets → G3. Precise geofencing (TIGER) → P3.

### P4 — AI-audit loop (WIRED, advisory)
- scripts/ai_audit.mjs wired via `npm run audit:ai`; advisory-only, routes gate flags to humans, cannot ratify.
- Degrades gracefully with no ANTHROPIC_API_KEY (the key is a G3 secret; NOT provided or requested here).

### NOT built (correctly halted / out of scope this pass)
- P3 library growth (2–4 more experiments, precise geofencing) — registry + evidence already support it; next up.
- P5 FAR_NZY target (real-money / sweepstakes / PvP value model) — **BLOCKED: requires G1 + G4 tokens.** Not started.

### Gates
- Crossed: NONE.
- Pending human tokens (none created by agent): G1 (real-money, for P5), G2 (deploy), G3 (secrets/real DB, for real
  auth + IP-geo + persistence), G4 (any change to blocked_regions / value-model / geo-legal / age logic).
- Forbidden-field invariant (C7) and closed-loop invariant (C6/C10) hold and are test-enforced.

## 2026-07-22 — P3 (library growth) built; precise geofencing HALTED at G4
Non-gated portion of P3 built on the same branch. Still closed-loop, sandboxed, reversible. No gate crossed.

### P3 — Experiment library growth (DONE, non-gated portion)
- Shared commit-reveal fairness primitives extracted (src/experiments/shared/fairness.ts); One-Roll refactored to
  consume them (public API + outcome shape unchanged; its parity + verify tests still green).
- Experiment #2 "Keeper's Dilemma" (src/experiments/keeper): reveal 6 provably-fair faces → player keeps a subset →
  score the kept faces. Records kept_indices + raw score; keep-choice never touches randomness. +5 tests.
- Experiment #3 "Call Your Shot" (src/experiments/target): pre-commit self-set target + dice count → reveal → score →
  met_target (the player's OWN goal outcome, not a skill grade). +5 tests.
- Both added as registry rows (config/experiments.registry.json); the app renders the library from the registry and
  the Verify view now dispatches across all three experiment types.
- Widened evidence capture: SessionRecord gained `decision_json` (the player's pre-commit decision), captured for
  every experiment. Still no forbidden fields (C7 enforced by tests + export strip).
- Central play/earn path (labStore.recordPlaySession) shared by all experiments: runs the hard region gate, persists
  the session, awards the FLAT play reward. Sparks reward is identical across experiments (never outcome-scaled).
- Suite now 49 tests, all green; strict type-check clean; production build passes.

### ESCALATION — precise geofencing (Census TIGER) routed to Gate G4 (NOT built)
BUILD_DIRECTIVE lists "precise geofencing (Census TIGER boundaries)" under P3, but AUTONOMY_POLICY.md and
HUMAN_GATES G4 place ANY geo/legal eligibility logic behind a human token "regardless of session mode." Precise
geofencing determines who may play/earn — that is geo-legal logic. Per CLAUDE.md ("On reaching a gate, halt and
escalate"), I did NOT build it and did NOT alter any region/eligibility logic.
- To proceed, a human must place `ratification/G4_LEGAL_CONFIG.granted` (GRANTED BY <name> ON <date> FOR
  "precise TIGER-based geofencing") + the approved boundary-resolution approach + counsel confirmation that the
  boundary data and method are legally sufficient.
- Until then, region eligibility remains the coarse, human-owned US-state blocklist (unchanged, read-only, frozen).

### Gates (updated)
- Crossed: NONE. Escalated this pass: G4 (precise geofencing) — awaiting human token.
- Still pending (none created by agent): G1, G2, G3, G4.
