# AI AUDIT LOOP SPEC (Claude API — ADVISORY, non-ratifying)
Purpose: a Claude-API auditor helps Claude Code by reviewing diffs/build output — WITHOUT becoming a
decision/ratification authority.
- Input: a diff or build artifact + the governance files.
- Output: a report classifying findings VF/SI/AS/SP/SC + contradictions + gate flags + forbidden-field/
  consent/geo violations -> evidence/audits/<timestamp>.md.
- Effect: P0-P4 reversible work -> advisory (builder may fix + proceed). Anything touching a gate ->
  MUST route to the human gate; the auditor may not clear it.
- Hard limits: cannot write ratification tokens, deploy, edit governance, or mark human outcomes.
  Its agreement with the builder is not evidence.
- Impl: scripts/ai_audit.mjs calls the Anthropic Messages API (model + max_tokens via env). API key is
  a G3 secret (human-provided at runtime).
