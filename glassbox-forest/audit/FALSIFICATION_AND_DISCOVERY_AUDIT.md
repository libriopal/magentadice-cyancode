# Falsification & discovery audit — "assume everything I built is wrong" (fixes applied)

Method: assume every "green / provably fair / works" claim is false until re-proven; follow each intent to
its source of truth; fix what's real. Findings are VERIFIED against code + a real-browser run.

## The central claim, re-tested (survived)
"All 6 experiments are provably fair end-to-end." Driven through the ACTUAL Verify UI in Chromium
(play → extract fairness JSON → paste → verify), all six returned **PROVABLY FAIR ✓**, zero console errors:
one-roll · keeper · target · hold-crown · author-gambit · transmute. The anti-circularity guards,
determinism, and persistence also survived. So the core holds — but the pass found real defects around it.

## Confirmed defects → fixed

1. **[HIGH] Target was degenerate — "hit your number" was ~91% auto-miss.** Root cause (the rabbit hole):
   `bestSubsetScore` is the canonical "value of a roll", but it was discovered mid-build (during Hold the
   Crown) and **never retrofitted to Target**, which still scored the full roll with `scoreFarkle`
   (all-dice-must-score → 0 for ~91% of 6-die rolls). So the target was missed almost regardless of the
   player's calibration — the mechanic contradicted the stated experience. **FIX:** Target now scores the
   roll's best subset. Test: a low target on 6 dice is now met the large majority of the time (was ~9%).

2. **[HIGH] Journal could crash a play when localStorage filled.** `append()` called `setItem` with no
   guard; a long session that exceeds the ~5MB quota throws `QuotaExceededError`, which propagated up
   through `recordPlaySession` into the play handler → broken play, lost round. **FIX:** quota-tolerant
   `persist()` that sheds the oldest low-value events (region-checks, then sparks — both non-load-bearing)
   and retries, and NEVER throws upward. Test: 40 appends against a throwing Storage mock never throw.

3. **[MED] The Cohere → human-promote loop was disconnected in the app.** The `proposal` event existed but
   nothing emitted it from the UI; the node proposer wrote to different storage, so Cohere/deterministic
   proposals never reached the browser and the "human seeds a proposal playable" step had no path. **FIX:**
   a browser-safe deterministic proposer (`src/forest/proposeLocal.ts`, imports NO Cohere code — no secret,
   no network) + a Library "Propose variations" button that journals dormant proposals. Verified the client
   bundle still contains no Cohere secret / api.cohere.com. Cohere (with key) stays the node-side enrichment.

4. **[MED → RESOLVED] Two undocumented scoring regimes.** Experiments silently split between full-roll
   `scoreFarkle` and `bestSubsetScore`. The dig found this is **partly intentional, partly accident**:
   - One-Roll's all-or-nothing is **load-bearing** — it is exactly what makes "how many dice" a real
     decision (fewer dice likelier to all-score, lower ceiling). Documented as intentional; must not change.
   - Keeper scores the chosen subset (all kept must score) — inherent to keeping.
   - Target/Hold-Crown/Author/Transmute use best-subset "value of a roll".
   Source of truth recorded in code comments so the two modes are a deliberate design axis, not drift.

## Still-open (accepted, low)
- [LOW] Hold-the-Crown reads component-scope state inside async `decide` — rapid double-tap could desync the
  mid-round UI, but `resolveSession` recomputes the authoritative record, so the stored outcome is always
  correct. Cosmetic; deferred (a reducer would fully close it).
- Info-surface variants beyond authored/full-read (partial/social-witness) remain planned; social-witness
  is inherently multiplayer → **G2**.

## Net
103 tests green (+3 for the fixes); type-check clean; web build passes; all 6 provably fair in-browser;
client bundle Cohere-secret-free. No gate crossed. Non-ratifying audit; nothing here amends governance.
