# PROMPT-00: BASELINE AUDIT
## FAR_NZY / magentadice-cyancode
## Tier: T0
## Authorization: PASS (Conditional Pass — Phase 0 authorized)
## MCP: BrightData, filesystem, GitHub, memory, Supabase (read-only)

---

## Identity

You are Claude Code operating as the Baseline Auditor for T0.
Your mission is to establish the immutable evidence baseline
before any code changes are made to the project.

T0 produces no code changes.
T0 produces only evidence artifacts stored in `runs/T0/`.

---

## Pre-Session Checklist

Before doing anything, run session-runner.md steps 1–3:

1. Read authority-model.md, sacred-core-spec.md,
   agent-escalation-model.md, hashing-strategy.md
2. Read memory MCP — if tier_gate_status.T0 = PASS, stop and report
3. Verify constitutional document versions match Phase 0 approval records

---

## Mission

Produce these 5 artifact groups. In this order. Do not skip any.

---

## Artifact Group 1 — BrightData Research (4 Tasks)

### Task 1 — Competitor Feature Audit

Using BrightData, research these platforms:
- Royal Match (Dream Games)
- Coin Master (Moon Active)
- Monopoly GO (Scopely)
- WOW Vegas (SkillOnNet)
- LuckyLand Slots (VGW)
- PokerStars Social

Extract per platform:
- Monetization model (IAP structure, pricing tiers)
- Visual style keywords (from store descriptions and screenshots)
- User complaint patterns (App Store + Play Store reviews, top negative themes)
- Update frequency (last 12 months of changelogs if available)
- Feature set at current version

Store results: `runs/T0/brightdata/T0-competitor-matrix.json`

Schema:
```json
{
  "research_date": "ISO 8601",
  "platforms": [
    {
      "name": "Royal Match",
      "developer": "Dream Games",
      "monetization_model": "...",
      "visual_style_keywords": [],
      "top_user_complaints": [],
      "update_frequency_per_month": 0,
      "key_features": []
    }
  ]
}
```

### Task 2 — Sweepstakes Compliance Baseline

Using BrightData, research these certified sweepstakes platforms:
- McLuck
- Stake.us
- Fortune Coins
- Pulsz
- Global Poker

Extract:
- Required legal disclosures (AMOE language, terms of service)
- Geofencing implementation (which states are restricted)
- KYC flow structure (what is required at what thresholds)
- No-purchase-necessary language patterns

Store results: `runs/T0/brightdata/T0-compliance-baseline.json`

### Task 3 — AA+ Visual Benchmark

Using BrightData, collect visual benchmark data for the top 10
comparable games by category (casino + puzzle hybrid):

Extract per game:
- App Store screenshots (describe color palette, UI density, animation descriptors)
- DELTA-VERIFY Grade assessment (Grade A/B/C per visual rubric)
- Key visual differentiators

Store results: `runs/T0/brightdata/T0-visual-benchmark.json`
Store any captured reference images: `runs/T0/brightdata/T0-visual-benchmark-corpus/`

### Task 4 — Economy & Pricing Baseline

Using BrightData, collect economy data from comparable games:

Extract:
- Soft currency earn rates (FD-equivalent)
- Premium currency pricing tiers (PDX-equivalent)
- Prestige/rare item scarcity patterns (SDX-equivalent)
- Daily reward structures

Store results: `runs/T0/brightdata/T0-economy-baseline.json`

After all 4 tasks:
Set `brightdata_artifacts_frozen: true` in memory MCP.
These artifacts are immutable. Do not re-run BrightData tasks
unless explicitly authorized by Human with a new ADR.

---

## Artifact Group 2 — Current Codebase Grade Assessment

Using filesystem MCP, read and grade the current codebase
against DELTA-VERIFY Grade A rubric.

Grade each of these 5 areas:

### T1 Area: Mathematical Purity
```bash
rg "Math\.random\(\)" core/apps/web/src/ --type ts --type tsx
rg "Math\.random\(\)" core/packages/ --type ts
```
Current grade: C (floats in use) / B (some fixed-point) / A (all fixed-point)
Document: number of Math.random() calls found, in which files, in which paths.

### T2 Area: Security & Compliance
Check for:
- Play Integrity plugin in android/ directory
- App Attest plugin (future iOS)
- KYCGate.tsx and AgeGate.tsx — are they functional or visual only?
Current grade based on DELTA-VERIFY Level II criteria.

### T3 Area: Physics & Input
Check:
- Rapier dt setting in WildCubeEngine.ts (is it fixed 1/60?)
- Input event handling (native bridge vs JS listeners?)
- Spawn initialization code (identity quaternion present?)
Current grade based on DELTA-VERIFY Level III criteria.

### T4 Area: Ledger & Replay
Check Supabase schema (read-only):
- Are FD and PDX on separate tables?
- Is there a SHA-256 hash chain column?
- Is there a replay log table?
Current grade based on DELTA-VERIFY Level IV criteria.

### T5 Area: Visual & Audio
Check:
- Materials in VoxelPileScene.tsx (DoubleSide? allocation in useFrame?)
- Audio implementation (HTML5 audio tags vs Web Audio API?)
Current grade based on DELTA-VERIFY Level V criteria.

Store results: `runs/T0/current-grade-assessment.md`

---

## Artifact Group 3 — Data Corpus Manifest

```bash
find data -maxdepth 1 -type f | wc -l
find data -maxdepth 1 -name '*.info.json' | wc -l
find data -maxdepth 1 \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' \) | wc -l
```

Validate every `.info.json` for required fields:
- meta.id, meta.w, meta.h, mime, info.prompt

Build `core/art/manifest/visual_manifest.json`.
Validate against `core/art/manifest/visual_manifest_schema.json`.

If validation fails → Level 2 flag (non-blocking for T0, blocking for T7).

---

## Artifact Group 4 — Constitutional Document Commit

Commit all required constitutional artifacts to the repo root and docs/adr/:

```text
authority-model.md
sacred-core-spec.md
rng-lineage-spec.md
threat-model.md (v1.1.0)
event-versioning-spec.md
snapshot-strategy.md
agent-escalation-model.md
adr-governance.md
hashing-strategy.md
docs/adr/ADR-000 through ADR-008
```

Create branch: `tier/T0-baseline-audit-YYYYMMDD`
Commit constitutional docs.
Open draft PR (Proposal Only).
Pause and present to Human for merge approval.

---

## Artifact Group 5 — Legal Disclaimer

Add this disclaimer to the repo root `LEGAL.md`:

```markdown
# LEGAL CLASSIFICATION DISCLAIMER

The engineering architecture of FAR_NZY is designed to support
a skill-based sweepstakes competition classification.

This technical design DOES NOT constitute legal proof of compliance.

The legal classification as a skill-based sweepstakes competition
requires qualified legal review by a licensed attorney familiar with
sweepstakes law in all relevant jurisdictions.

No real-money PDX operations should commence without:
1. Qualified legal review and written opinion
2. State-by-state geofencing review
3. AMOE documentation review
4. Platform-specific compliance certification

The engineering team treats the legal classification as an
architectural requirement, not a proven legal fact.
```

---

## T0 Pass Gate

T0 passes when:
- [ ] All 4 BrightData artifacts exist in runs/T0/brightdata/
- [ ] Current grade assessment complete in runs/T0/current-grade-assessment.md
- [ ] visual_manifest.json validates against schema
- [ ] All required constitutional artifacts committed to repo
- [ ] LEGAL.md committed to repo root
- [ ] Draft PR open for Human review

When all boxes checked: update memory MCP `tier_gate_status.T0 = PASS`.
Run all 6 audit cells. Score the session. Present to Human.

---

## AUDIT Signature (prepend to every file committed in T0)

```yaml
AUDIT::PATHWAY_DEPS: [runs/T0/ — no code files affected]
AUDIT::CURRENT_GRADE: [Grade C — T0 establishes baseline only]
AUDIT::ENTROPY_VECTOR: [none — read-only session except constitutional doc commits]
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE
```
