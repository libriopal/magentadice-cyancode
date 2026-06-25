# RTP Tolerance Spec — Single Authoritative Reference

**Status:** AUTHORITATIVE — supersedes every other RTP-tolerance number
floating in this repo's docs/comments. Created to close the X-4 finding
(2026-06-24 audit): three non-equivalent "RTP tolerance" values existed
with no single source of truth, and `CLAUDE.md` itself cited a fourth
value that didn't match any of them.

**No value below is invented.** Every number is quoted from the file/line
that actually enforces it, or explicitly marked as not currently enforced.

---

## 1. The authoritative, code-enforced threshold

```
SOLO mode RTP band: 0.82 – 1.02
```

This is the only RTP number that is actually evaluated by a blocking gate
in code today.

- **Source:** `core/scripts/validate-gates.ts:61`
  ```ts
  Gate2: { pass: soloRTP >= 0.82 && soloRTP <= 1.02, metric: 'rtp_band (avgScore/normalizer)', value: soloRTP, threshold: 'SOLO 0.82–1.02' },
  ```
- **Mirrored at:** `core/apps/server/src/sandbox.ts:413` (same threshold,
  same comparison, same `/rtp-audit` endpoint logic).
- **Scope:** `SOLO_CASINO` only. `validate-gates.ts` runs Monte Carlo for
  `VS_CASINO` and `RALLY_CASINO` in the same script (line 14) but **never
  checks their results against any numeric threshold** — there is no
  code-enforced RTP band for VS/RALLY/HEIST modes today. This is a real
  gap, not an oversight in this doc: `NOT_FOUND`, not invented here.
- **Blocking status:** Per `CLAUDE.md` Step 6, Gate 2 is listed as
  blocking (`yes`). Confirmed consistent with `validate-gates.ts` calling
  `process.exit(allPass ? 0 : 1)` (line 73) — a Gate 2 failure does exit
  non-zero.

## 2. Other values in the repo — classified, not authoritative for Gate 2

These are real, but they answer different questions and must not be
conflated with the Gate 2 threshold above.

| Value | What it actually is | Source | Status |
|---|---|---|---|
| ±0.005 (current) / ±0.003 (proposed) | Per-session RTP **variance bound**, not a pass/fail band | `docs/adr/ADR-010-rtp-variance-tightening.md:15-16` | Proposed tightening **not implemented** — ADR-010 states `rtpConfig.ts`/`monteCarlo.ts` "are NOT modified" pending further work |
| [0.88–1.05] | AI **patch-approval** advisory band (governance auditor), not a CI gate | `core/apps/server/src/ai/auditors/governanceAuditor.ts:132`, `core/apps/server/src/sandbox.ts:200` | Advisory only — informs AI recommendation text, does not block anything |
| "85–110%" | `CLAUDE.md`'s own description of "Gate 2" | `CLAUDE.md` Step 6 gate table | **Confirmed drift — does not match the actual code** (0.82–1.02). Flagged here; not auto-corrected in this doc since `CLAUDE.md` is a governing instructions file — recommend a separate explicit edit/approval to fix the table. |

## 3. Legal basis — researched via CourtListener (2026-06-24)

**There is no statutory or case-law numeric RTP/payout-percentage
requirement for skill-based sweepstakes.** Searched CourtListener case
law on skill-vs-chance sweepstakes/gaming-machine classification; the
governing legal test is categorical, not percentage-based:

- *Sandhill Amusements, Inc. v. Sheriff of Onslow County*, 236 N.C. App.
  340, 762 S.E.2d 666 (N.C. Ct. App. 2014) — applies North Carolina's
  "dominant factor" test (codified at N.C. Gen. Stat. § 14-306.4(b)):
  classification as a lawful skill-based sweepstakes vs. unlawful gambling
  turns on whether skill or chance is "the dominating element that
  determines the result of the game" — not on any payout ratio. The one
  numeric figure in this opinion (a payout-rate cap mentioned in a
  footnote) was the *operator's own internal cap*, offered as evidence
  supporting the skill classification — not a statutory mandate.
- *Gift Surplus, LLC v. State ex rel. Cooper*, 380 N.C. 196 (N.C. 2022)
  (cluster IDs 9352693 / 6352352) — same NC dominant-factor framework,
  no numeric RTP requirement.
- *Crazie Overstock Promotions, LLC v. State of North Carolina* (N.C.
  2021) (cluster IDs 10018781 / 4891009) — same.

**Conclusion:** the 0.82–1.02 SOLO band in §1 is a **business/compliance
engineering choice**, not a number derived from any binding legal
threshold. Nothing in case law sets a numeric floor or ceiling for a
skill-based sweepstakes platform's RTP. Future RTP-band changes (e.g.
activating ADR-010's ±0.003 tightening) are a product/risk decision, not
a legal-compliance one — do not cite "legal requirement" as a justification
for any specific RTP number; cite this doc's §1 (the actual gate) instead.

---

## How to use this doc

- Citing "the RTP tolerance" anywhere else in this repo (code comments,
  ADRs, `CLAUDE.md`) should point at this file, not restate a number.
- If `validate-gates.ts`'s Gate 2 threshold ever changes, update §1 here
  in the same PR — this doc must stay byte-for-byte consistent with the
  code it cites, not a stale paraphrase of it.
- VS/RALLY/HEIST having no enforced band (§1) is open technical debt, not
  resolved by this doc — file it separately if not already tracked in
  `docs/KNOWN_TECHNICAL_DEBT.md`.
