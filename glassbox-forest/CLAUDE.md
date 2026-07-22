# CLAUDE.md — GLASSBOX Forest (operating manual of record)

This is the **authoritative** operating manual for the active ecosystem. Precedence when manuals conflict:
1. `glassbox-forest/governance/**` (constitution, gates, sovereignty, anti-circularity) — supreme.
2. This file.
3. `glassbox-forest/OVERHAUL_PLAN.md` + `MERGED_EXECUTION_PLAN.md` (approved direction).

`glassbox-labs/` is the **historical** predecessor (kept for reference); its `CLAUDE.md` does not govern
new work here. The repo-root `magentadice-cyancode/CLAUDE.md` governs the FAR_NZY production side.

## What this is
A governed, closed-loop, evidence-first experience-discovery ecosystem: a D2 geometry (`src/geometry`),
a seeded branch generator (`src/generator`), a FOREST evidence ledger + event-sourced journal
(`src/forest`), playable experiments (`src/experiments`), and a budget-isolated advisory Cohere PROPOSER
(`src/cohere`, node-side only).

## Non-negotiable laws (from governance/, do not violate)
- **Human sovereignty (C1)** — the agent is Builder/Auditor, never Architect/Decision Authority. Gates
  (G1 real-money · G2 deploy · G3 secrets/real-DB · G4 geo-legal · G5 irreversible) are opened ONLY by a
  human placing `ratification/<GATE>.granted` + the artifact. The agent CANNOT create/remove these.
- **Anti-circularity (C3)** — real play + survey is the only nutrient. Synthetic/model/Cohere signal can
  be noted for provenance but NEVER moves ledger state. Generation ≠ selection.
- **No forbidden fields (C7)** — `skill_score` / `was_optimal` are never computed, stored, or exported.
- **Closed-loop (C6/C10)** — Sparks are earn-only, non-redeemable; seeded PRNG only; reproducible from seed.
- **Cohere secret is G3** — `COHERE_API_KEY` is node-side only; never import `src/cohere/**` into `src/app/**`.

## Commands
```bash
npm test           # unit suite         npm run type-check
npm run dev        # play locally        npm run build
npm run generate:branches -- seed-42     # deterministic catalog
npm run propose    # Cohere proposer (degrades with no key; dormant proposals only)
```

## Session flow
Read governance/ + this file → find current state in `ratification/STATE.md` → build the next non-gated
step → on reaching a gate, HALT and route to the human. Keep the audit trail honest (assume it may be broken).
