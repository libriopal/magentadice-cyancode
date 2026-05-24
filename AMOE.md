AUDIT::PATHWAY_DEPS: LEGAL.md, docs/adr/ADR-013-t2-security-compliance.md
AUDIT::CURRENT_GRADE: Grade A
AUDIT::ENTROPY_VECTOR: Low — documentation only
AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE

---

# ALTERNATE METHOD OF ENTRY (AMOE)
## FAR_NZY — Farkle Frenzy
## Platform: magentadice-cyancode / Libriopal Games Inc.
## Document: AMOE.md
## Status: Authoritative — changes require Human sign-off
## Effective Date: 2026-05-24

---

> **NO PURCHASE NECESSARY TO ENTER OR WIN.**
> A purchase does not improve your chances of winning.
> Void where prohibited by law.

---

## 1. Legal Basis

FAR_NZY operates as a skill-based sweepstakes under the promotional sweepstakes
model. The elimination of consideration through this AMOE mechanism is one of
three independent legal grounds on which FAR_NZY avoids classification as
illegal gambling. See `LEGAL.md` Section 2 for the full three-element analysis.

**Governing law:**
- FTC Act, 15 U.S.C. § 45 (unfair or deceptive acts or practices)
- FTC Sweepstakes Guidance, 16 C.F.R. § 251 (use of the word "free")
- *Pre-Paid Solutions, Inc. v. City of Little Rock*, 343 Ark. 317 (2001)

---

## 2. Free Entry Method

Players may enter the FAR_NZY sweepstakes at no cost through the following method:

### 2.1 Email Entry

Send a plain-text email to:

```
amoe@libriopal.com
```

Subject line: `FAR_NZY FREE ENTRY`

Body must include:
- Full legal name
- Email address for prize notification
- State of residence (2-letter US state code)
- Date of birth (MM/DD/YYYY)
- Confirmation: "I am 18 years of age or older and agree to the Official Rules."

**One entry per person per calendar day.** Duplicate entries on the same day are discarded. Entries from restricted jurisdictions are void.

### 2.2 Entry Equivalence

One free email entry confers exactly one sweepstakes ticket — identical to one ticket earned through in-app gameplay. Free entries are pooled with gameplay entries for prize draws. The probability of winning is proportional to total tickets held, regardless of how tickets were obtained.

### 2.3 Entry Processing

Email entries received by 11:59 PM PT on any calendar day are processed within 2 business days. Entrants receive a confirmation reply with their assigned ticket number(s).

---

## 3. Eligibility

- Age: 18 years or older at time of entry
- Residence: Legal resident of the United States
- Jurisdiction: Void in Washington State (WA) and any other jurisdiction where sweepstakes are prohibited
- Employment: Employees, officers, and directors of Libriopal Games Inc. and their immediate family members are ineligible

---

## 4. Entry Limits

| Period | Limit |
|---|---|
| Per calendar day (email) | 1 free entry |
| Per calendar day (in-app) | No limit (gameplay tickets) |
| Per calendar month (total email) | 30 free entries |

---

## 5. Disclosure Requirements

Per 16 C.F.R. § 251, the following disclosures must appear:
- On the main app store listing
- Within the app on the main screen or settings menu
- On any promotional material mentioning prizes

**Required disclosure text:**

> NO PURCHASE NECESSARY. Open to US residents 18+. Void in WA and where prohibited.
> For free entry, email amoe@libriopal.com with subject "FAR_NZY FREE ENTRY".
> See Official Rules at [rules URL].

---

## 6. Odds

Odds of winning depend on the total number of eligible entries received. Estimated odds are posted in the app and updated monthly. No purchase improves the odds of winning.

---

## 7. Implementation Status

**Backend status as of 2026-05-24: IMPLEMENTED (T2)**

- Email ingestion: `amoe@libriopal.com` inbox monitored by ops
- Ticket issuance: Manual processing until automated pipeline (T4)
- Compliance gate: See `core/apps/server/src/playIntegrity.ts` — AMOE entry path bypasses Play Integrity (no device required for email entry)
- KYC: Age and state verified manually from email content until backend KYC automation (T4)

---

## 8. Record Retention

AMOE entry records must be retained for 3 years per FTC recordkeeping guidance. Records include: entrant name, email, date, ticket number, draw outcome.

---

## 9. Cross-References

- `LEGAL.md` Section 3.2 — AMOE Implementation details
- `LEGAL.md` Section 2 — Three-element gambling test and consideration elimination
- `docs/adr/ADR-013-t2-security-compliance.md` — T2 compliance architecture decision
- `core/packages/compliance/src/index.ts` — ComplianceService (age/state/terms checks)
- `core/apps/server/src/playIntegrity.ts` — Hardware attestation middleware
