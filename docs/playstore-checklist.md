# Play Store Submission Checklist — FAR_NZY (Farkle Frenzy)

## 1. App Metadata

- **Title:** Farkle Frenzy — Match 3D
- **Short description** (80 chars max): Physics dice meets Match-3. Bank your score. Outsmart opponents.
- **Full description** (4000 chars max): [ TODO — draft in Play Console before submission ]
- **Category:** Casino → Casual (skill-based sweepstakes; no real-money gambling)
- **Tags:** dice, match-3, physics, skill, farkle
- **Screenshots:** 2 phone + 1 tablet minimum; 7-screenshot set preferred
- **Feature graphic:** 1024×500 PNG

## 2. Content Rating

- Complete IARC questionnaire in Play Console
- Expected rating: **Teen** (simulated gambling / sweepstakes; no real-money wagering)
- Sweepstakes disclosure must appear on first-launch screen and in store description
- "No purchase necessary" language required in description

## 3. Privacy Policy

- **URL:** [ TODO — host at https://farnzy.app/privacy or equivalent ]
- Must cover: analytics events (PostHog), userId, platform, device type
- Must cover: no real-money wagering; skill-based competition only
- Must cover: data retention and deletion request procedure

## 4. Target SDK Version

- **Target SDK:** 35 (Android 15) — required for new apps from 2024-08-31
- **Min SDK:** 26 (Android 8.0)
- Capacitor 8.3 targets SDK 35 by default — verify in `core/android/app/build.gradle`
- `compileSdkVersion 35` and `targetSdkVersion 35` must be set

## 5. Signing Keystore

- **Keystore location:** `core/android/keystore/farnzy-release.jks` [ TODO — generate ]
- **Key alias:** `farnzy-release`
- Store credentials in CI secret `KEYSTORE_PASSWORD` and `KEY_PASSWORD`
- Use Play App Signing (recommended): upload AAB, let Google manage distribution key
- **Build command:** `cd core && pnpm android:release` (builds signed AAB via Capacitor)

## 6. Release AAB Build

```bash
cd core
pnpm build:web          # build React PWA → apps/web/dist/
pnpm cap:sync           # sync dist/ into android/ Capacitor project
cd android
./gradlew bundleRelease # produces app/build/outputs/bundle/release/app-release.aab
```

- Upload `app-release.aab` to Play Console → Internal Testing track first
- Promote to Production after QA pass

## 7. Sweepstakes Compliance

- [ ] "No purchase necessary to enter or win" in store description
- [ ] Official Rules linked from in-app HomeScreen and Play Store listing
- [ ] Alternate method of entry (AMOE) documented in Official Rules
- [ ] Geofence enforcement active: WA, ID, MI, AK, AL blocked (checkGeofence in playIntegrity.ts)
- [ ] Skill-differential report available: `getSkillDifferentialReport()` in analytics.ts
  - Ratio target: top-decile players score ≥ 1.5× bottom-half players
- [ ] RTP bounded: 88–96% configured in rtpConfig.ts (ADR-010 calibration pending Human approval)

## 8. Data Safety Form

Complete the Play Console Data Safety section:

| Data type | Collected | Shared | Purpose |
|---|---|---|---|
| User ID (anonymous) | Yes | No | Analytics, session replay |
| App interactions (events) | Yes | Yes — PostHog | Analytics |
| Device / other IDs | No | — | — |
| Financial info | No | — | — |
| Location | No | — | — |

- PostHog is the only third-party recipient
- No advertising networks; no SDKs that share data for ads
- Data is not sold

---

**Last updated:** 2026-05-25 (T9 session)
