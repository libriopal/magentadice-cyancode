# Cohere credit-use governance audit (advisory, NON-RATIFYING)

Question audited: *can the $1000 Cohere balance fund an automated, no-human-intervention
"self-constructing architect" that turns play/survey nutrient into new experiences/experiments on its
own?* Short answer: **No — not under the current constitution.** A large, compliant subset IS available.
This audit observes and classifies; it does not amend governance and cannot ratify a design.

---

## 1 · What already exists (inventory, VF = verified in-repo)

### A. FAR_NZY Cohere subsystem (`apps/server/src/ai/**`) — the real, enforced model [VF]
A full governance-first Cohere integration already ships, with a hard call hierarchy:
```
authorization → complianceGuard → budgetGuard → auditors → gateway → providers(cohere)
→ policyEngine → auditExporter → caller
```
- **AI MAY:** analyze, summarize, recommend, audit, classify, retrieve.
- **AI MAY NEVER:** decide outcomes, modify probabilities, execute gameplay logic, calculate RTP,
  determine payouts, generate RNG, influence dice, issue rewards, make compliance decisions,
  **execute the gameplay loop** (`COHERE_INTEGRATION_DIRECTIVE.md`).
- **Governance stays operational if Cohere is unavailable** (degrade, never depend).
- **Budget categories are isolated, USD-ceilinged, no cross-borrow** (`ai/config.ts`):
  Governance $300 · Monte Carlo $250 · Opportunity $150 · Retrieval $150 · Quest $50 (= $900 default).
  Thresholds: warn 0.75 · restrict 0.90 · **shutdown 1.00**.
- **Opportunity Engine** (the closest thing to "auto-construction") is **scaffold-only, no Cohere calls
  at launch**, and even when live: *"AI recommendations are advisory. The deterministic game engine
  reads the recommendation and decides whether to act. No LLM output ever writes directly to state."*

### B. GLASSBOX / D2 constitution (now governs glassbox-forest) [VF]
- **C1** Human sovereignty is supreme and **may not be amended by any agent.**
- **C3** Anti-circularity: model/agent agreement is never evidence.
- **SOVEREIGNTY:** Claude/AI = Builder + Auditor, **NOT** Architect / Decision Authority. *"Never convert
  Evidence → Decision. Chain: Evidence → Interpretation → Recommendation → HUMAN DECISION."*
- **AGENT_AUTHORITY_BOUNDARY:** may NOT decide product/architecture direction, certify outcomes, or
  ratify; *"a flag … ROUTES TO A HUMAN GATE; it is never auto-resolved."*
- **HUMAN_GATES:** G1 real-money · G2 deploy/public exposure · G3 secrets/real-DB · G4 geo/legal/
  value-model · G5 irreversible.

### C. glassbox-forest FOREST ledger guard — ratified by the human THIS session [VF]
Growth authority = **real human play + survey ONLY.** `recordPlay` rejects any non-`observed`
evidence; `nourish` refuses without real play; synthetic/model signal can be *noted* but **can never
change state.** The human explicitly rejected "allow simulated fitness to auto-prune" as anti-circular.

---

## 2 · Verdict on the requested use — DENIED under current governance [SI, decisive]

"Automatically construct/evolve experiences from nutrient **without any human intervention**" =
an AI that **selects** which experiences are good and **builds/changes** them autonomously. That is the
single thing every governance layer here exists to prevent. Specific collisions:

| The request… | …violates |
|---|---|
| AI is the "self-constructing **architect**" | SOVEREIGNTY + AGENT_AUTHORITY_BOUNDARY (AI is Builder, never Architect/Decision Authority) |
| Nutrient → auto-decides which experiences grow | C3 anti-circularity + the ratified FOREST guard (human-play-only; synthetic never moves state) + "never convert Evidence → Decision" |
| "**without any human intervention**" | C1 human sovereignty (and C1 may not be amended by an agent) |
| Cohere alters/creates the experiment loop autonomously | FAR_NZY "AI may never … execute the gameplay loop / decide outcomes" |
| Runs in a **deployed** project, spending real credits | G2 (deploy) + G3 (API key = secret / real spend); possibly G1/G4 if experiences drift toward real value or legal surface |

**I will not build this, and structurally I cannot:** the FOREST guard already refuses synthetic-driven
state change, and C1 cannot be amended by an agent. An LLM "deciding a branch is positive and building
more of it" is model-output-as-ratification — barred.

---

## 3 · What the $1000 CAN compliantly do — Cohere as an advisory PROPOSER (generation ≠ selection) [SP → build path]

~90% of the practical value is reachable without crossing sovereignty, by keeping Cohere on the
**generation** side of the line the corpus draws (*"generation is allowed; selection is barred"*):

```
[ real play + survey NUTRIENT ]        (observed, human-produced — the only nutrient)
        │  READ (advisory interpretation only)
        ▼
[ Cohere EXPERIENCE-PROPOSAL engine ]  budget-isolated, provenance='synthetic'
   · reads nutrient + the D2 geometry + governance corpus (RAG)
   · PROPOSES new branch-specs / experience variations / parameterizations
   · may rank its OWN proposals — that ranking is synthetic, never nutrient
        │  proposals enter as…
        ▼
[ FOREST ledger: state 'generated' (DORMANT) ]   ← Cohere can go no further
        │  promotion requires a HUMAN (markSeededPlayable) or a human-set real-play policy
        ▼
[ real humans play the promoted branch ]
        │
        ▼
[ nourish / archive — from REAL play evidence ONLY ]   (unchanged; synthetic still barred)
```

This is a **human-in-the-loop self-improving ecosystem**: Cohere is the tireless proposer; humans +
real play are the selector. It satisfies "use the credits to evolve the ecosystem" while keeping the
one clause I must refuse — removing the human from selection/promotion/growth — out.

Guardrails (all reuse the FAR_NZY model, already proven):
- **Isolated budget category** `EXPERIENCE_PROPOSAL` with its own ceiling; warn/restrict/**shutdown**;
  spend tracked; no cross-borrow; **degrade to the deterministic seeded generator** if Cohere is down
  or the budget is exhausted (governance operational without Cohere).
- **Provenance discipline:** every Cohere artifact is `synthetic` and can NEVER be nutrient or move
  ledger state (the existing guard enforces this).
- **Secrets = G3:** the `COHERE_API_KEY` is a human-provided runtime secret; the loop can't self-provision it.
- **Deploy = G2:** running it in a *deployed* project is a separate human gate.

### Suggested $1000 allocation (isolated ceilings, mirrors ai/config.ts)
| Category | Ceiling | Purpose |
|---|---|---|
| EXPERIENCE_PROPOSAL | $400 | propose branch-specs / variations from nutrient (the new work) |
| GOVERNANCE (audit) | $250 | advisory VF/SI/AS/SP/SC review of diffs + proposals (non-ratifying) |
| RETRIEVAL (embeddings) | $200 | embed play/survey + governance corpus for RAG grounding |
| MONTE_CARLO (anomaly) | $100 | escalate only on statistical anomaly (95% deterministic) |
| QUEST / copy | $50 | flavor text for proposed experiences (never rules/scoring) |
| **Total** | **$1000** | warn 0.75 · restrict 0.90 · hard shutdown 1.00, per category |

---

## 4 · What would have to change for TRUE autonomy — and why I won't do it unilaterally [SC]

Fully removing the human requires **amending C1 (human sovereignty)** and retiring the anti-circularity
law + the FOREST guard the human just ratified. Per C1 that amendment is a **human-only constitutional
act**, not something an agent may author or self-apply. It also has real blast radius: an evidence-first,
provably-fair, legally-cautious system that lets an LLM autonomously reshape experiences (and, near real
value, the legal/geo surface) forfeits its central integrity claims and invites G1/G4 exposure. If the
human wants to go there, they must author the amendment explicitly; I will implement only the
compliant, human-in-the-loop proposer above unless a signed constitutional change says otherwise.

---

## 5 · Findings summary
- **VF:** a governance-first Cohere subsystem already exists (budget-isolated, advisory-only, AI-never-
  decides); Opportunity Engine is scaffold-only and advisory even when live.
- **SI (decisive):** the requested no-human-intervention self-constructing architect is barred by
  C1/C3/SOVEREIGNTY/AGENT_AUTHORITY_BOUNDARY + the ratified FOREST guard + "AI may never execute the loop."
- **SP (build path):** Cohere as a budget-isolated, provenance-tagged, human-gated **proposer** is fully
  compliant and spends the $1000 meaningfully.
- **SC (routed to human):** true autonomy needs a human-authored constitutional amendment + accepts loss
  of evidence-first/anti-circular guarantees + G1/G2/G3/G4 exposure. Not agent-authorable.

_Non-ratifying. Nothing here amends governance or crosses a gate._
