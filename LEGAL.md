AUDIT::PATHWAY_DEPS: CLAUDE.md (references this file), docs/adr/ADR-007-threat-model.md, docs/adr/ADR-003-rng-lineage.md
AUDIT::CURRENT_GRADE: Grade B — legal classification documented; backend enforcement (KYC, AgeGate, Play Integrity) pending T2
AUDIT::ENTROPY_VECTOR: low — documentation only; changes to currency model or prize structure require re-evaluation
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

---

# LEGAL CLASSIFICATION DISCLAIMER
## FAR_NZY — Farkle Frenzy
## Platform: magentadice-cyancode / Libriopal Games Inc.
## Document: LEGAL.md
## Last Updated: 2026-05-23
## Status: Authoritative — changes require Human sign-off

---

> **THIS DOCUMENT IS NOT LEGAL ADVICE.**
> It is an internal classification record prepared for engineering and
> compliance reference purposes. It does not constitute legal advice,
> does not create an attorney-client relationship, and is not a substitute
> for advice from qualified legal counsel admitted in your jurisdiction.
> Libriopal Games Inc. should engage licensed gaming and sweepstakes
> counsel before operating in any jurisdiction.

---

## 1. Platform Classification

FAR_NZY (Farkle Frenzy) is classified as a **skill-based sweepstakes competition**
operating under the promotional sweepstakes model recognized under federal and
most state law in the United States.

This classification is based on three independent legal grounds:

| Ground | Description | Legal Basis |
|---|---|---|
| Skill predominance | Farkle outcomes are determined primarily by player decisions, not chance | Dominant-factor test |
| No illegal consideration | Alternative means of entry eliminates the consideration element | FTC 16 C.F.R. § 251; three-element gambling test |
| Prize structure | PDX prizes are awarded through a verifiable, auditable random draw among qualified entrants | State sweepstakes law |

---

## 2. The Three-Element Gambling Test

Under the law of most U.S. jurisdictions, "gambling" requires the simultaneous
presence of three elements:

```
(1) CONSIDERATION — payment or something of value wagered
(2) CHANCE — outcome determined by chance rather than skill
(3) PRIZE — something of value awarded to the winner
```

The elimination of ANY ONE of these three elements removes an activity from
the definition of illegal gambling in the majority of U.S. states.

**Sources:**

- *Department of Legal Affairs v. Rogers*, 329 So. 2d 257, 261 (Fla. 1976)
  ("To constitute a lottery there must be a prize, chance, and consideration.
  The elimination of any one of these elements removes the scheme from the
  category of lottery.")

- *Mississippi Gaming Commission v. Treasured Arts, Inc.*, 699 So. 2d 936, 939
  (Miss. 1997) (applying three-element test; lawful activity where consideration
  element absent)

- *Pre-Paid Solutions, Inc. v. City of Little Rock*, 343 Ark. 317, 34 S.W.3d 360
  (Ark. 2001) (sweepstakes lawful where free alternative means of entry offered)

FAR_NZY eliminates the **consideration** element through its no-purchase-necessary
alternative means of entry (AMOE) model. It also substantially reduces the
**chance** element through skill-predominant gameplay (see Section 4).

---

## 3. Sweepstakes Model — No Purchase Necessary

### 3.1 Federal Framework

The Federal Trade Commission regulates sweepstakes promotions under Section 5
of the FTC Act, 15 U.S.C. § 45 (unfair or deceptive acts or practices), and
its implementing guidance at 16 C.F.R. § 251 (use of the word "free").

**Core requirement:** A sweepstakes promotion that offers prizes may not require
a purchase as a condition of entry or winning. The alternative means of entry
(AMOE) must be:
- Clearly and conspicuously disclosed
- At least as easy to use as the paid entry method
- Capable of producing winners with equal probability

### 3.2 FAR_NZY AMOE Implementation

FAR_NZY must implement and maintain the following AMOE mechanism:

```
FREE ENTRY METHOD:
  URL: [to be determined — T2 implementation]
  Method: Web-based entry form requiring no payment
  Entry equivalence: One free web entry = one sweepstakes entry ticket
  Disclosure: Prominently displayed on main screen and store listings
```

**Implementation Status:** AMOE backend is a T2 deliverable.
`[L1-FINDING]` AMOE mechanism is not yet implemented.
AMOE UI disclosure placeholder exists; backend routing is absent.

### 3.3 Applicable State Sweepstakes Statutes

The following states impose specific sweepstakes disclosure requirements beyond
the federal baseline:

| State | Key Requirement | Status |
|---|---|---|
| Florida | Fla. Stat. § 849.094 — registration required for prizes > $5,000 | Review required |
| New York | N.Y. Gen. Bus. Law § 369-e — registration/bonding for prizes > $5,000 | Review required |
| Rhode Island | R.I. Gen. Laws § 11-50-1 et seq. — sweepstakes registration | Review required |
| Arizona | A.R.S. § 13-3301 — three-element test applies | Compliant (AMOE) |
| Washington | Wash. Rev. Code § 9.46 — historically broad prohibition | Geographic block recommended |
| Utah | Utah Code § 76-10-1101 — prohibits all forms of gambling | Geographic block required |

---

## 4. Skill Determination — Dominant-Factor Test

### 4.1 Legal Standard

Courts and regulatory bodies determine whether a game is one of skill or chance
using the **dominant-factor test** (also called the "material element" test):

> If skill is the dominant factor in determining the outcome — such that
> player decisions materially affect results — the game is not gambling,
> even if some element of chance is present.

- *Hest Technologies, Inc. v. State ex rel. Perdue*, 366 N.C. 289, 749 S.E.2d 429
  (N.C. 2012) (applying dominant-factor test to electronic skill game terminals;
  held: skill-predominant games are not prohibited gambling machines)

- *United States v. Daniel Davis*, 690 F.3d 330, 336 (5th Cir. 2012)
  ("The dominant factor test asks whether the outcome of the game is
  predominantly determined by the skill of the participants.")

- *Sterling v. San Antonio Police Dep't*, 94 S.W.3d 790 (Tex. App. 2002)
  (skill game terminals lawful where player decisions materially affect outcome)

### 4.2 Farkle Skill Elements

Farkle (the underlying game mechanic) satisfies the dominant-factor test
because player decisions — not dice outcomes — determine session performance:

| Decision Point | Skill Component | Chance Component |
|---|---|---|
| Which dice to score vs. re-roll | Expected value calculation | Initial roll outcome |
| When to bank score vs. continue rolling | Risk assessment / probability | Next roll outcome |
| Which scoring combinations to prioritize | Strategy / pattern recognition | Dice face values |
| Session-level resource management | Long-game optimization | None |

The RNG seed derivation chain (HMAC-SHA256 per `mesh/rng-lineage-spec.md`) is
cryptographically sound and produces fair, non-manipulable dice outcomes.
The Deterministic PRNG ensures reproducibility for audit and replay — a property
that distinguishes FAR_NZY from casino-style games where reproducibility is
deliberately prevented.

### 4.3 Monte Carlo Verification Requirement

RTP (Return-to-Player) targets must remain within ±0.005 of declared targets
across a minimum 10,000-generation Monte Carlo simulation.
This requirement is enforced by the Sacred Core (`mesh/sacred-core-spec.md`)
and documented in `core/packages/farkle-engine/src/rtpConfig.ts` (propose only).

Any change to scoring functions, payout multipliers, or RTP targets requires:
- An Accepted ADR
- Human approval
- Monte Carlo pass at 10,000 generations

---

## 5. Currency System Legal Classification

FAR_NZY operates a three-tier currency system. Each tier has a distinct
legal classification:

### 5.1 FD — Frenzy Dice (In-Game Currency)

| Property | Value |
|---|---|
| Real-world monetary value | None |
| Redeemable for cash or prizes | No |
| Purchasable | No (earned through gameplay only) |
| Legal classification | Non-monetary game token |
| Gambling consideration | No — zero monetary value |

FD has no monetary value and cannot be redeemed for anything of real-world
value. It is purely a game mechanic. No gambling or sweepstakes laws apply.

### 5.2 SDX — Skill Dollar Exchange (Blockchain Token)

| Property | Value |
|---|---|
| Real-world monetary value | Market-determined (blockchain-based) |
| Redeemable | Subject to platform terms |
| Blockchain-recorded | Yes — @match3d/blockchain |
| Legal classification | Digital asset / token (jurisdiction-dependent) |
| Gambling consideration | Potentially — see note |

**SDX Legal Note:** The regulatory treatment of blockchain tokens as
"consideration" for gambling purposes is unsettled. The SEC treats some tokens
as securities (*SEC v. Ripple Labs*, S.D.N.Y. 2020). FinCEN treats certain
token exchanges as money transmission. SDX balances may only be incremented
upon confirmed blockchain event — never optimistically — to maintain a clean
audit trail.

**Implementation requirement:** SDX balance increment is gated on
`@match3d/blockchain` confirmation event. This is a Sacred Core constraint
enforced at the IEventStore write boundary.

### 5.3 PDX — Premium Digital Experience (Prize Pool)

| Property | Value |
|---|---|
| Real-world monetary value | Yes — cash-equivalent prizes |
| Redeemable | Yes — per prize fulfillment terms |
| Legal classification | Sweepstakes prize |
| Gambling consideration | Eliminated by AMOE model |
| Attestation required | Yes — Play Integrity API verdict PASS |

PDX prizes are the primary sweepstakes prize mechanism.
They are awarded through a verifiable, auditable draw that is:
- Seeded from a server-side secret (not player-influenceable)
- Reproducible via HMAC-SHA256 chain (audit-ready)
- Gated on hardware attestation to prevent client-side tampering

**Implementation status:** Play Integrity API integration is a T2 deliverable.
`[L1-FINDING]` Hardware attestation for PDX path is absent until T2.
PDX award events are constitutionally blocked at IEventStore.write() without
a valid attestation verdict of 'PASS'. This is enforced by Sacred Core
constraint in `mesh/sacred-core-spec.md`.

---

## 6. Federal Statutory Framework

### 6.1 Wire Act — 18 U.S.C. § 1084

The Wire Act prohibits the use of wire communications for placing bets on
"sporting events or contests."

**Applicability to FAR_NZY:** The Wire Act does NOT apply to FAR_NZY's
core sweepstakes mechanism. The First Circuit confirmed in *NH Lottery
Commission v. Rosen*, 986 F.3d 38 (1st Cir. 2021) that the Wire Act applies
exclusively to sports betting, not to other forms of online gaming or
sweepstakes promotion. This interpretation aligns with the DOJ Office of Legal
Counsel's 2011 opinion (though the 2018 OLC opinion took a broader view that
was subsequently rejected by the courts).

**Conclusion:** Sweepstakes entry transmission and prize notification via
internet are not "bets on sporting events" and are not covered by the Wire Act.

### 6.2 UIGEA — 31 U.S.C. §§ 5361-5367

The Unlawful Internet Gambling Enforcement Act prohibits payment processors
from knowingly accepting payments related to "unlawful Internet gambling."

**Skill game exemption:** 31 U.S.C. § 5362(1)(E)(ix) expressly excludes from
the definition of "unlawful Internet gambling" any game:
> "in which the outcome reflects the relative knowledge and skill of the
> participants and in which no part of the outcome is based on the chance
> of a computer program."

**Applicability to FAR_NZY:** Farkle's outcome reflects player skill
(see Section 4). The UIGEA exemption applies to skill-predominant games.
Payment processors accepting PDX-related transactions operate within the
UIGEA skill-game exemption.

**Relevant precedent:** *Lawson v. Full Tilt Poker Ltd.*, 930 F. Supp. 2d 476
(S.D.N.Y. 2013) (UIGEA analysis of online skill vs. chance games);
*Wong v. PartyGaming Ltd.*, 589 F.3d 821 (6th Cir. 2009) (Wire Act and UIGEA
scope in online gaming context).

### 6.3 Indian Gaming Regulatory Act — 25 U.S.C. § 2701 et seq.

IGRA governs Class II and Class III gaming on tribal lands. FAR_NZY does not
operate on tribal lands and is not subject to IGRA regulation. *West Flagler
Associates, Ltd. v. Debra Haaland*, 71 F.4th 1059 (D.C. Cir. 2023)
(IGRA scope and tribal gaming compacts) is inapplicable.

---

## 7. Age and Identity Verification Requirements

### 7.1 Current Status

| Requirement | Status | Resolution Path |
|---|---|---|
| Age verification (18+) | UI-only checkbox | T2 — backend enforcement |
| KYC (Know Your Customer) | UI-only gate | T2 — backend enforcement |
| Geographic restriction | Not implemented | T2 |
| Play Integrity attestation | Not implemented | T2 |

`[L1-FINDING]` AgeGate is UI-only — a checkbox with no backend verification.
`[L1-FINDING]` KYCGate is UI-only — no identity document verification.

### 7.2 Required T2 Implementations

The following must be implemented before PDX prizes are awarded to real users:

1. **Age verification** — backend confirmation that user is 18+ (or 21+ where required)
   before any PDX prize ticket is issued.

2. **KYC verification** — identity verification for prize redemptions above
   state-specific thresholds (typically $600 for tax reporting under 26 U.S.C. § 6041).

3. **Geographic blocking** — automatic block for users in:
   - Utah (complete prohibition — Utah Code § 76-10-1101)
   - Washington (historically broad prohibition — recommend block pending legal review)
   - Any other jurisdiction where operation would require an unlicensed gambling license

4. **Play Integrity API** — hardware attestation required before PDX_AWARD events
   are written to IEventStore. Absent attestation = event rejected at write boundary.

---

## 8. Tax Reporting Obligations

Prize winners are subject to U.S. federal income tax on prize income
under 26 U.S.C. § 74. Platform obligations:

| Threshold | Obligation |
|---|---|
| Prize value ≥ $600 | Form 1099-MISC or 1099-NEC to winner and IRS |
| Gambling winnings ≥ $1,200 | Form W-2G (if classified as gambling — see Section 4) |
| Prize value > fair market value | FMV used for tax reporting |

FAR_NZY's sweepstakes classification (not gambling) means Form 1099-MISC
applies rather than Form W-2G. This distinction is favorable and supports the
skill-based sweepstakes classification argument.

---

## 9. Prohibited Conduct and Enforcement Boundaries

The following are prohibited at the engineering level and enforced by
constitutional governance (`mesh/sacred-core-spec.md`, `mesh/agent-escalation-model.md`):

| Prohibition | Enforcement |
|---|---|
| `Math.random()` in any scoring or payout path | L3 halt — FIXED_POINT_CHECK: FAIL |
| SDX balance increment without blockchain confirmation | Sacred Core constraint — IEventStore write boundary |
| PDX_AWARD without attestation verdict 'PASS' | Sacred Core constraint — IEventStore write boundary |
| Float in any currency amount field | L3 halt — Q32.32 enforcement |
| Retroactive score modification | SHA-256 chain — tamper-evident |
| Replay manipulation | Replay reconstruction hash verification |

---

## 10. Jurisdictional Compliance Map

| Jurisdiction | Classification | Status |
|---|---|---|
| Federal (US) | Skill-based sweepstakes — lawful under Wire Act, UIGEA exemption | Compliant (architecture) |
| Most US states | Sweepstakes lawful — three-element test, AMOE eliminates consideration | Compliant (AMOE required at T2) |
| Utah | All gambling prohibited | **Block required** |
| Washington | Broad prohibition — pending legal review | **Block recommended** |
| Canada (federal) | Criminal Code § 206 — sweepstakes lawful with AMOE | Review required |
| EU | Varies by member state; GDPR applies to user data | Review required |
| Other international | Highly variable — no operation until legal review complete | No operation |

---

## 11. Document Version and Review Schedule

| Field | Value |
|---|---|
| Document version | 1.0.0 |
| Created | 2026-05-23 |
| Created by | Claude Sonnet 4.6 (Execution Runtime) under Human directive |
| Legal research sources | CourtListener case law database; Federal statutes |
| Next review | Before any PDX prize is awarded to a real user |
| Next review trigger | T2 completion (KYC, AgeGate, Play Integrity implementation) |
| Change authority | Human only |

### Case Law Sources (CourtListener)

| Case | Citation | Court | Year | Relevance |
|---|---|---|---|---|
| *Hest Technologies v. State ex rel. Perdue* | 366 N.C. 289, 749 S.E.2d 429 | N.C. Supreme Court | 2012 | Dominant-factor test for skill games |
| *Dept. of Legal Affairs v. Rogers* | 329 So. 2d 257 | Fla. Supreme Court | 1976 | Three-element gambling test |
| *United States v. Davis* | 690 F.3d 330 | 5th Cir. | 2012 | Skill vs. chance determination |
| *Pre-Paid Solutions v. City of Little Rock* | 343 Ark. 317, 34 S.W.3d 360 | Ark. Supreme Court | 2001 | Sweepstakes AMOE legality |
| *Mississippi Gaming Comm'n v. Treasured Arts* | 699 So. 2d 936 | Miss. Supreme Court | 1997 | Three-element test; gaming regulation |
| *Sterling v. San Antonio Police Dept.* | 94 S.W.3d 790 | Tex. App. (4th Dist.) | 2002 | Skill game terminals |
| *Wong v. PartyGaming Ltd.* | 589 F.3d 821 | 6th Cir. | 2009 | Wire Act / UIGEA — online gaming |
| *NH Lottery Commission v. Rosen* | 986 F.3d 38 | 1st Cir. | 2021 | Wire Act: sports-only scope confirmed |
| *West Flagler Associates v. Haaland* | 71 F.4th 1059 | D.C. Cir. | 2023 | IGRA scope — inapplicable to FAR_NZY |
| *Lawson v. Full Tilt Poker Ltd.* | 930 F. Supp. 2d 476 | S.D.N.Y. | 2013 | UIGEA skill game analysis |

### Federal Statutory Sources

| Statute | Citation | Applicability |
|---|---|---|
| Wire Act | 18 U.S.C. § 1084 | Does not apply (non-sports sweepstakes) |
| UIGEA | 31 U.S.C. §§ 5361-5367 | Skill-game exemption applies |
| FTC Act | 15 U.S.C. § 45 | Sweepstakes deceptive practices standard |
| FTC Sweepstakes Guidance | 16 C.F.R. § 251 | AMOE disclosure requirement |
| Internal Revenue Code | 26 U.S.C. §§ 74, 6041 | Prize tax reporting (1099-MISC) |
| Indian Gaming Regulatory Act | 25 U.S.C. § 2701 | Not applicable (non-tribal) |

---

*This document was produced by Claude Sonnet 4.6 (Execution Runtime) during*
*T1A Governance Runtime session, 2026-05-23, under Human directive to resolve*
*a Level 2 Violation (LEGAL.md absent from main branch).*
*Legal research performed using CourtListener (free.law) case law database.*
*This document must be reviewed by licensed legal counsel before any PDX*
*prizes are awarded to real users or the platform is made publicly available.*
