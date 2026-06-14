# Authorization Model — FAR_NZY
## Authority: Constitutional (mesh/authority-model.md)
## Status: Operational summary for sprint work
## Changes to this document require: Human approval + ADR

---

## Three Tiers

### Routine — Execution Runtime proceeds autonomously

Claude Code may implement, commit, and push without Human pre-approval.

**Applies to:**
- Non-sacred file changes (visual, audio, content, infrastructure, test utilities)
- New non-sacred packages or scripts
- Documentation, ADR drafts, session logs, roadmap updates
- Profiling artifacts and compliance records
- Sandbox UI, sandbox server, CLI tools
- Meshy AI generation pipeline, manifest pipeline
- Sprint design and roadmap entries
- Bug fixes to non-sacred surface files

---

### Elevated — Claude Code proposes; Human approves before execution

Claude Code drafts the change and presents it for review.
No implementation until explicit Human "approved" or equivalent confirmation.

**Applies to:**
- Any PR merge to main
- Production deployment
- Force push or destructive git operations (`--force`, `reset --hard`, `filter-repo`)
- Supabase edge function deployment
- External service configuration (PostHog, Alchemy, Play Console, App Signing)
- Changes to `docs/SACRED.md` or `docs/AUTHORIZATION.md`
- New ADR proposals (draft is Routine; commit requires Human review)
- Release keystore generation and storage

---

### Sacred — No execution without written Human approval + committed ADR

No code is written, staged, or committed until:
1. Human has given explicit written approval of the proposed change
2. The corresponding ADR is written and committed to `docs/adr/`

**Applies to:**
- Any file listed in `core/.ff-core-lock`
- Any file in `payout_math`, `rng`, `game_state_authority` categories (`mesh/sacred-core-spec.md`)
- Any change to `mesh/` constitutional documents
- Ledger schema changes (`ledger_state` category)
- Replay hash chain format changes
- Event signature algorithm changes

---

## Current Finding Authorization Map

| Finding | File | Tier | Required before implementation |
|---------|------|------|-------------------------------|
| Finding A — playerContinue inversion | `monteCarlo.ts:126` | **Sacred** | ADR-022 approved + Human written approval + 10k MC pass |
| Finding B — Circular normalizer | `sandbox.ts`, `validate-gates.ts` | **Routine** | None — non-sacred files only |
| Finding C — Compliance record uncommitted | `core/art/profiling/` | **Routine** | None — profiling artifact (resolved in P5) |
| BrightData history scrub + force push | git history | **Elevated** | Human explicit confirmation of force push |
| stakeAmount default fix | `sessionStore.ts` | **Routine** | None — surface file |
| Privacy policy hosting | external | **Elevated** | Human confirmation before publish |
| Release keystore generation | CI secrets | **Elevated** | Human confirmation before storage |
| Play Store submission | Play Console | **Elevated** | Human confirmation |
| DEBT-01 — MULTIPLIER_LADDER floats | `farkleStore.ts:28` | **Sacred** | ADR required + Human approval |
| DEBT-02 — Orb float intermediate | `useFarkleGame.ts:305` | **Sacred** | ADR required + Human approval |

---

## P5-GOVERNANCE Sprint Authorization Map

| Deliverable | Tier | Notes |
|-------------|------|-------|
| Compliance record committed to core/ | Routine | Done |
| session-log.md created and populated | Routine | |
| docs/SACRED.md | Elevated | Approved 2026-06-14 by Human |
| docs/AUTHORIZATION.md | Elevated | Approved 2026-06-14 by Human |
| ADR-021 (P5-GOVERNANCE sprint authorization) | Elevated | Approved 2026-06-14 by Human |
| Finding B fix — null-bot baseline | Routine | Non-sacred, no auth needed |
| stakeAmount default to non-zero | Routine | Non-sacred surface file |
| New compliance record post-fix | Routine | Profiling artifact |
| KNOWN_TECHNICAL_DEBT.md Finding A entry | Routine | Documentation only |

---

## Version

docs/AUTHORIZATION.md v1.0.0 — created 2026-06-14 (P5-GOVERNANCE sprint)
Derived from: `mesh/authority-model.md` v1.0.0
Next review: at any authorization tier change or constitutional amendment
