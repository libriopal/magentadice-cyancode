# GLASSBOX Labs — Claude-Code-buildable, evidence-first skill-game ecosystem
A governed multi-experiment library that generates opt-in human playtest data + rewarded optional
surveys (the growth nutrient), closed-loop (no real money), geo-gated, provably fair. Claude Code
executes BUILD_DIRECTIVE.md autonomously for P0-P4; consequential steps (real money, deploy, secrets,
geo-legal, irreversible) are blocked by human ratification tokens it cannot self-create.

Start: point Claude Code at this folder. It reads CLAUDE.md first. NOT legal advice; real-money
features gated pending human decision + counsel.

## Running the sandbox (P0–P1)
```bash
cd glassbox-labs
npm install
npm test          # 39 unit tests: engine parity, commit-reveal, forbidden-field strip, region gate, wallet
npm run type-check
npm run dev       # http://localhost:5173 — consent+18+ gate → One-Roll → Verify → Admin export
npm run build     # production build
npm run audit:ai  # advisory Claude-API auditor (no-op without ANTHROPIC_API_KEY, a G3 secret)
```

## What's implemented (see ratification/STATE.md for the ledger)
- **P0** scaffold, tests-only CI, governance in-app, evidence schema, registry, read-only blocked_regions.
- **P1** One-Roll (ported FAR_NZY farkle-engine, commit-reveal + public Verify), opt-in SurveyJS survey +
  reflection, closed-loop non-redeemable Sparks, admin export with forbidden-field strip.
- **P2** (sandbox form) 18+/consent + hard region gate at entry and before every play/earn, region checks logged.
- **P4** advisory AI-audit loop wired (non-ratifying).

## Gated — NOT built without a human token in `ratification/`
- **P5** real-money / sweepstakes / PvP value model → **G1 + G4**.
- Deploy → **G2**. Secrets / real DB (real auth, IP-geolocation, persistence) → **G3**.
- Editing `config/blocked_regions.json` / value-model / geo-legal / age logic → **G4**.
