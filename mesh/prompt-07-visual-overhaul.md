# T7 — Visual Overhaul + ERK Live Conductor
## FAR_NZY Session Prompt 07
## Prompt version: 1.0.0 — Authored 2026-05-25

---

## Context

T0–T6 are PASS. The token foundation exists in `core/apps/web/src/theme/tokens.ts`
(OV, PILLAR, UI_THEME, CURRENCY, TYPE, SPACE all defined). Several components already
import from `theme/tokens.ts`. The ERK audio conductor exists in `core/apps/web/src/audio/gameAudio.ts`
but uses a **static per-level erkState** (calm/melancholic/tense/euphoric set at level load).
It does NOT read live game state — the dynamic emotional vector is unwired.

**Sacred Core boundary:** `farkleStore.ts` and `gameStore.ts` are read-only. The ERK
conductor may import and READ from these stores. It may not write to them.

---

## Scope

Seven tasks. Execute in order.

---

### Task 1 — Dynamic ERK Conductor (`core/apps/web/src/audio/erkConductor.ts`)

Create a new surface-layer module that converts live farkleStore + gameStore state
into the `EmotionalState` type consumed by `setMusicState()`.

**Emotional state mapping (non-sacred, read-only):**

```text
tension  = clamp(multiplierStep / 10, 0, 1)
momentum = chainLength >= 3 ? 0.8 : chainLength / 3
risk     = unbanked / max(banked + unbanked, 1)
chaos    = (mode === 'FRENZY' ? 0.9 : mode === 'PRIME' ? 0.55 : 0.1)
           + clamp(farkleCount / 5, 0, 0.4)
resolution = clamp(banked / winScore, 0, 1)

→ EmotionalState mapping:
  chaos > 0.7                     → 'tense'
  resolution > 0.75               → 'euphoric'
  tension < 0.25 && chaos < 0.3   → 'calm'
  default                         → 'melancholic'
```

Export: `useERKConductor()` — a React hook that calls `setMusicState()` when the
derived EmotionalState changes. Debounce transitions: minimum 3-second hold before
switching state (prevents rapid flickering).

**File:** `core/apps/web/src/audio/erkConductor.ts`
**Sacred Core contact:** READ-ONLY (imports useFarkleStore, useGameStore for reads).

---

### Task 2 — Wire `useERKConductor` into `GameScreen.tsx`

In `GameScreen.tsx`, replace the static `setMusicState(getLevelTheme(levelDef.id).erkState)`
call (currently fires only on level load at lines ~224, ~37) with `useERKConductor()` at
the top of `GameScreenInner`. Remove the now-redundant static calls.

Keep `forceMusicState` and the debug overlay intact.

**Sacred Core contact:** NONE. GameScreen is surface layer.

---

### Task 3 — Visual pillar token adoption audit + `design_tokens.json`

Create `core/art/manifest/design_tokens.json` — the canonical flat token export
consumed by Figma sync and CI. Derive from `theme/tokens.ts`.

Required sections:
```json
{
  "palette": { "void", "neural", "bone", "gold", "cyan", "magenta", "acidLime", ... },
  "pillars": { "BIOLOGICAL": {...}, "INDUSTRIAL": {...}, "CRYSTALLINE": {...} },
  "voidshard": { "base", "edgeGlow", "lightning", "particle" },
  "ui_themes": { "bio": {...}, "vault": {...}, "crystal": {...} },
  "currency": { "fd": {...}, "pdx": {...}, "sdx": {...} },
  "typography": { "fontDisplay", "fontBody", "fontCode", "scale": {...} },
  "spacing": [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64]
}
```

All values must be derivable from `theme/tokens.ts` without introducing new constants.
No Sacred Core contact.

---

### Task 4 — `NFTItemCard.tsx` rarity visualization upgrade

`NFTItemCard.tsx` must render rarity visually per the visual law:

| Rarity     | FX requirement                                      |
|------------|-----------------------------------------------------|
| common     | Subtle glow ring (OV.cyanGlow, 6px blur)            |
| rare       | Animated border pulse (CSS keyframe, PILLAR accent) |
| epic       | Animated border + background shimmer + scale 1.02   |
| legendary  | All of above + `box-shadow` UV burst (PILLAR.CRYSTALLINE.primary) |
| voidshard  | Legendary FX + inner `CURRENCY.sdx.glowColor` halo + text `CURRENCY.sdx.lightningColor` |

Apply `UI_THEME.crystal` for voidshard/legendary, `UI_THEME.vault` for epic/rare,
`UI_THEME.bio` for common items.

Use `@keyframes` via inline `<style>` injection (no CSS file needed).

**Sacred Core contact:** NONE.

---

### Task 5 — `WinLoseScreen.tsx` full token adoption

Audit `WinLoseScreen.tsx`. Replace any hardcoded hex colors with OV / PILLAR / CURRENCY
tokens. Apply:
- Win state → `UI_THEME.crystal` container + `PILLAR.CRYSTALLINE.primary` accent
- Lose state → `UI_THEME.vault` container + `OV.amberHot` accent
- Score display → `TYPE.scale.hudNumeric` font sizing, `OV.goldBright` color
- Currency rewards → `CURRENCY.fd.color` / `CURRENCY.pdx.color` per reward type

**Sacred Core contact:** NONE.

---

### Task 6 — ADR-018

Create `docs/adr/ADR-018-t7-visual-overhaul.md`.

Decisions to document:
- Dynamic ERK conductor approach (live game state → emotional vector)
- 3-second debounce rationale (prevents audio flicker on rapid multiplier changes)
- `design_tokens.json` as flat canonical export (Figma sync target)
- Rarity visualization tier system (5 levels, UI_THEME assignment)
- Static `getLevelTheme().erkState` retained as fallback only

---

### Task 7 — Audit cells + session artifacts

Run all 6 audit cells. Write `runs/2026-05-25/session-11.json` and append
`sessions/session-log.md`.

---

## Pass Gate

- `pnpm type-check` → 0 new errors in `core/`
- `erkConductor.ts` exports `useERKConductor` hook, no Math.random(), no Sacred Core writes
- `GameScreen.tsx` calls `useERKConductor()` — static erkState calls replaced
- `design_tokens.json` valid JSON, all 7 required sections present
- `NFTItemCard.tsx` renders 5 rarity tiers with distinct visual treatment
- `WinLoseScreen.tsx` — 0 hardcoded hex colors (all from OV/PILLAR/CURRENCY/TYPE tokens)
- `ADR-018` written
- FIXED_POINT_CHECK: PASS on all new production code (no float arithmetic in state paths)
- Sacred Core: 0 writes

---

## Version

Prompt-07 v1.0.0 — Authored 2026-05-25
