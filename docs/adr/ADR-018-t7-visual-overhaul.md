# ADR-018 — T7 Visual Overhaul

**Date:** 2026-05-25  
**Branch:** tier/T7-visual-overhaul-20260525  
**Status:** ACCEPTED  
**Author:** Claude Code (Execution Runtime)  
**Session:** Session 11

---

## Context

T7 targets visual system coherence across three domains:

1. **ERK wiring** — `erkConductor.ts` was missing; GameScreen used a static `setMusicState()` call selected at level-load time, producing a flat emotional tone that ignored in-game dynamics.
2. **Design token export** — No canonical machine-readable token file existed. Asset pipeline and external tools had no authoritative color source.
3. **NFT rarity visual tier** — `NFTItemCard` only covered four `ItemRarity` values; `voidshard` (highest tier) was unimplemented, breaking the five-pillar visual hierarchy.
4. **WinLoseScreen hardcoded palette** — Approximately 14 hardcoded hex/rgba literals were embedded inline, coupling the component to specific palette values rather than the token system.

---

## Decisions

### D1 — Live ERK Conductor

**Decision:** Author `core/apps/web/src/audio/erkConductor.ts` exporting `useERKConductor(winScore)`. The hook reads `useFarkleStore` (mode, multiplierStep, chain, farkleCount, banked, unbanked) and `useGameStore` (gamePhase) — both sacred core, read-only — and derives `EmotionalState` from three continuous axes:

| Axis | Formula | Range |
|---|---|---|
| tension | `multiplierStep / 5` | [0, 1] |
| chaos | `frenzy_base + farkleCount/5` | [0, 1] |
| resolution | `banked / winScore` | [0, 1] |

State mapping (priority order): chaos > 0.7 → `tense`; resolution > 0.75 → `euphoric`; tension < 0.25 ∧ chaos < 0.3 → `calm`; else `melancholic`.

A 3000ms hold timer prevents state flickering on rapid multiplier changes. State transitions only fire when `gamePhase === 'playing'`.

**Rejected:** Inline derivation in GameScreen — would violate surface/logic separation.  
**Rejected:** Polling interval — reactive Zustand selectors are sufficient and cheaper.

### D2 — Design Token Export

**Decision:** Generate `core/art/manifest/design_tokens.json` as a flat canonical export of all values from `theme/tokens.ts`. Seven sections: palette, pillars, voidshard, ui_themes, currency, typography, spacing. Values are copied verbatim; no new constants are introduced.

**Rationale:** Asset pipeline tooling, Figma bridge, and external validators need a single machine-readable source. The TypeScript module is not consumable by non-TS tooling.

### D3 — ExtendedRarity + VoidShard Visual Tier

**Decision:** Extend `NFTItemCard` rarity system to `ExtendedRarity = ItemRarity | 'voidshard'`. VoidShard visual behavior:

- CSS: `nft-void-halo` pulsing UV box-shadow animation (2s, 24–40px glow)
- 3D: wireframe `meshStandardMaterial` with emissive UV (`#7b00ff`), metalness 0.9
- Scale: `1.04` (largest of all tiers)
- Sparkles: 40 count, UV color, same as legendary

VoidShard and legendary both use the `isLegendary` branch for 3D material (wireframe UV). This is correct per the Three Visual Pillars spec: both occupy the CRYSTALLINE pillar at maximum intensity.

**Rejected:** Separate 3D material for voidshard — adds complexity without visual differentiation when wireframe + emissive already reads as "negative space entity."

### D4 — WinLoseScreen Token Adoption

**Decision:** Replace all hardcoded palette literals in `WinLoseScreen.tsx` with imports from `theme/tokens.ts`. Mapping:

| Hardcoded | Token |
|---|---|
| `rgba(201,168,76,0.18)` | `OV.goldDim` |
| `rgba(201,168,76,0.55)` | `OV.goldGlow` |
| `rgba(255,0,204,0.06/0.12/0.25/0.45/0.8)` | `OV.magentaGlow` |
| `rgba(123,47,255,0.22)` | `PILLAR.CRYSTALLINE.surface` |
| `rgba(5,0,18,0.96)` | `OV.neural` |
| `rgba(123,47,255,0.45)` | `CURRENCY.pdx.glowColor` |
| `#ffffff` / `'#fff'` | `OV.bone` |

The scanline overlay `rgba(0,0,0,0.07)` is retained as a structural CSS trick — it is not a palette color and has no token equivalent.

**Rationale:** Token adoption means future palette changes propagate automatically. Hardcoded literals create palette drift risk.

---

## Sacred Core Compliance

- `farkleStore.ts` — read-only via Zustand selector hooks. No writes.  
- `gameStore.ts` — read-only via Zustand selector hooks. No writes.  
- All changes are surface layer (L5 ADORNMENT) per the Five-Layer architecture.

---

## Pass Gates

| Gate | Result |
|---|---|
| `pnpm type-check` 0 new errors | PASS |
| `useERKConductor` exported, no `Math.random()` | PASS |
| `design_tokens.json` valid JSON, 7 sections | PASS |
| NFTItemCard 5 rarity tiers with VoidShard | PASS |
| WinLoseScreen 0 hardcoded hex values | PASS |
| Sacred Core 0 writes | PASS |

---

## Consequences

- ERK emotional state now tracks live gameplay, not a static level-load assignment.
- Design token JSON is the new canonical artifact for external tooling; do not edit manually.
- VoidShard is fully implemented as a visual tier — marketplace grids and win screens can display it.
- WinLoseScreen is palette-agnostic; future theme changes require only token updates.
