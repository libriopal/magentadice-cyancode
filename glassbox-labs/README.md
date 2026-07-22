# GLASSBOX Labs — Claude-Code-buildable, evidence-first skill-game ecosystem
A governed multi-experiment library that generates opt-in human playtest data + rewarded optional
surveys (the growth nutrient), closed-loop (no real money), geo-gated, provably fair. Claude Code
executes BUILD_DIRECTIVE.md autonomously for P0-P4; consequential steps (real money, deploy, secrets,
geo-legal, irreversible) are blocked by human ratification tokens it cannot self-create.

Start: point Claude Code at this folder. It reads CLAUDE.md first. NOT legal advice; real-money
features gated pending human decision + counsel.

## Running the sandbox
```bash
cd glassbox-labs
npm install
npm test           # 54 unit tests: engine parity, commit-reveal, forbidden-field strip, region gate,
                   #   wallet, the 3 experiments, and the full-pipeline execution audit
npm run type-check
npm run dev        # http://localhost:5173 — consent+18+ gate → Experiments → Verify → Admin export
npm run build      # production build
npm run audit:play # advisory execution audit: drives the full play→survey→evidence pipeline with
                   #   forced mistakes, checks fairness + forbidden-field + survey nutrient, and writes
                   #   evidence/audits/<ts>-execution-audit.md. NON-RATIFYING.
npm run audit:ai   # advisory Claude-API auditor (no-op without ANTHROPIC_API_KEY, a G3 secret)
```

## Running a human playtest (single facilitator, local sandbox — no gate)
```bash
npm run dev        # tester clears the consent+18+ gate, enters a US state, plays rounds across the
                   #   three experiments, optionally completes the rewarded reflection survey
# then in the Admin · Evidence tab: Preview / Download JSON (forbidden fields stripped on export)
npm run audit:play # sanity-check the capture pipeline before/after a session
```
A PUBLIC playtest (real external users) would be gate **G2**; multi-device evidence aggregation is **G3**.

## What's implemented (see ratification/STATE.md for the ledger)
- **P0** scaffold, tests-only CI, governance in-app, evidence schema, registry, read-only blocked_regions.
- **P1** One-Roll (ported FAR_NZY farkle-engine, commit-reveal + public Verify), opt-in SurveyJS survey +
  reflection, closed-loop non-redeemable Sparks, admin export with forbidden-field strip.
- **P2** (sandbox form) 18+/consent + hard region gate at entry and before every play/earn, region checks logged.
- **P3** experiment library growth — 3 experiments (One-Roll, Keeper's Dilemma, Call Your Shot) rendered from the
  registry, shared commit-reveal primitives, widened evidence capture (`decision_json`), multi-experiment Verify.
- **P4** advisory AI-audit loop wired (non-ratifying), plus an in-repo **execution audit** (`npm run audit:play`)
  that drives full play with forced mistakes and verifies fairness / forbidden-field / survey-nutrient invariants.

Total **54 unit tests**; all experiments closed-loop and provably fair. Every play captures `decision_ms`
(deliberation latency) as a raw reflection signal — never a skill grade.

## Gated — NOT built without a human token in `ratification/`
- **Precise geofencing (Census TIGER)** — the remaining P3 item — is **halted at G4** (geo-legal eligibility logic).
  See the ESCALATION note in `ratification/STATE.md`.
- **P5** real-money / sweepstakes / PvP value model → **G1 + G4**.
- Deploy → **G2**. Secrets / real DB (real auth, IP-geolocation, persistence) → **G3**.
- Editing `config/blocked_regions.json` / value-model / geo-legal / age logic → **G4**.
