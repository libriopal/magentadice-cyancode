# Claude Prompt: Visual, UI, Theme, and 3D Overhaul

You are Claude Code operating as a senior React Three Fiber engineer, technical artist,
shader author, UI/UX engineer, mobile performance specialist, and visual QA lead.

Your mission is a complete presentation-layer overhaul of the game in `core/` — 3D scene
quality, materials, lighting, post-processing, particles, UI components, design tokens,
animations, and visual gap fills — driven by the `data/` training corpus (~1,550 image +
`.info.json` files) and governed by `dream/`'s Organic Vegas source truth.

You do not touch gameplay logic, scoring, RNG, RTP, multiplayer authority, or backend
code. You own how the game looks, feels, animates, renders, and performs visually.

---

## Repository Contract

Work from the root of `libriopal/magentadice-cyancode`.

- `core/` — active production target (pnpm monorepo, Vite, React 18, Three.js r162)
- `dream/` — source-truth, design tokens, quality-bar reference
- `data/` — training corpus (~1,550 image + `.info.json` files)

Refresh before editing:

```bash
git fetch origin && git checkout main && git pull --ff-only origin main
git submodule update --init --recursive core dream
```

---

## Stack Reference

Every visual change must target this exact stack. Do not reference Godot, Unity, or any
other engine. Do not introduce build tools outside the existing pnpm workspace.

| Layer | Technology | Primary files |
|---|---|---|
| 3D scene | Three.js r162 via React Three Fiber v8 | `core/apps/web/src/game/VoxelPileScene.tsx` |
| 3D utilities | `@react-three/drei` v9 | imported inside game/ and components/ |
| Post-processing | `@react-three/postprocessing` | install if absent, add to VoxelPileScene |
| Physics | `@dimforge/rapier3d-compat` | do not touch physics bodies for visual reasons |
| Game engine | `core/apps/web/src/game/WildCubeEngine.ts` | read state only, do not rewrite |
| UI components | `core/apps/web/src/components/` | 18 components listed below |
| Design tokens | `core/apps/web/src/theme/tokens.ts` | single source of truth for all colors/type |
| Styles | `core/apps/web/src/styles/` | CSS / Tailwind |
| State | Zustand stores in `core/apps/web/src/store/` | read for visual state, do not rewrite |
| Shared 3D | `core/packages/game-core/` | Three.js utilities shared across packages |
| Mobile target | Capacitor Android WebView | every visual decision must pass on-device |
| Performance tool | install `r3f-perf` | add behind a `__DEV__` flag only |

### Known UI Components

```
AgeGate.tsx         MultiplayerLobby.tsx
DebugOverlay.tsx    QuestPanel.tsx
EstateScreen.tsx    SettingsModal.tsx
EventBanner.tsx     ShopScreen.tsx
FarkleHUD.tsx       SocialScreen.tsx
GameScreen.tsx      TransitionOverlay.tsx
HUD.tsx             TrayDisplay.tsx
HomeScreen.tsx      WildBlocker.tsx
KYCGate.tsx         WinLoseScreen.tsx
```

---

## Source-Truth Hierarchy

1. Verified code and assets under `core/apps/web/src/`.
2. Training data under `data/`, especially `.info.json` prompt metadata.
3. `dream/shared/source-of-truth/organic-vegas/design_tokens.json`
4. `dream/shared/source-of-truth/organic-vegas/performance_budget.md`
5. `dream/shared/source-of-truth/organic-vegas/unified_lattice.json`
6. `dream/shared/titan-reclamation-beta-synthesis.xml`
7. `dream/shared/cc-prompt.md`
8. Strategic visual recommendations explicitly labeled as such.

---

## Required Training-Data Implementation

`data/` is the primary creative input. Build a deterministic visual manifest before
implementing anything.

```bash
find data -maxdepth 1 -type f | wc -l
find data -maxdepth 1 -name '*.info.json' | wc -l
find data -maxdepth 1 \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' \) | wc -l
```

Validate every `.info.json` for: `meta.id`, `meta.w`, `meta.h`, `mime`, `info.prompt`.

Write the manifest to `core/art/manifest/visual_manifest.json`.
Validate it against `core/art/manifest/visual_manifest_schema.json`
(JSON Schema draft 2020-12) before committing. Use:

```bash
python3 -m jsonschema -i core/art/manifest/visual_manifest.json \
  core/art/manifest/visual_manifest_schema.json
```

A manifest that fails validation is not shippable and blocks the gate.

The manifest must derive:

- **Palette clusters** — dominant colors per image, semantic role assignments.
- **Motif taxonomy** — prompt-token clusters (Skeletal Gold, Neural Neon, Obsidian
  Membrane, Cyan Lattice, Magenta Bloom, and any new ones discovered) with ≥3 image IDs
  and ≥2 prompt tokens per motif.
- **Material vocabulary** — surface families mapped to `MeshStandardMaterial` /
  `MeshPhysicalMaterial` parameter sets.
- **Lighting moods** — key/fill/rim recipes per motif.
- **Discovered vocabulary** — coined terms from prompt-token clustering with evidence.
- **Coverage report** — flag any motif with <20 supporting samples as low-confidence.

---

## Tooling Policy — R3F / Three.js

Use these tools in order. Do not reach for a lower-level tool when a higher-level one
exists.

### 3D Scene

1. **`<Environment>`** from `@react-three/drei` for ambient lighting, reflections, and
   sky. Accept a `preset` string or an HDRI path from `core/apps/web/src/assets/`.
   One `<Environment>` per `<Canvas>`.

2. **`<Canvas>`** props for renderer config:
   ```tsx
   <Canvas
     shadows
     dpr={[1, Math.min(window.devicePixelRatio, 2)]}
     gl={{
       antialias: true,
       toneMapping: THREE.ACESFilmicToneMapping,
       toneMappingExposure: 1.2,
       outputColorSpace: THREE.SRGBColorSpace,
       powerPreference: 'high-performance',
     }}
   >
   ```

3. **`MeshStandardMaterial` / `MeshPhysicalMaterial`** for 90% of surfaces.
   Reach for custom GLSL `shaderMaterial` only when these cannot achieve the look.
   Every custom shader must declare: intent, fragment cost estimate, and a
   `MeshStandardMaterial` fallback.

4. **`@react-three/postprocessing`** for the effect chain.
   Install if absent: `pnpm add @react-three/postprocessing --filter @match3d/web`.
   Wrap in `<EffectComposer>` inside `VoxelPileScene.tsx`.
   Available effects: `Bloom`, `DepthOfField`, `Vignette`, `ChromaticAberration`,
   `SSAO`, `SSR`, `ColorAverage`, `Noise`, `Scanline`. Measure cost before shipping
   each effect. Disable per-effect on mobile via a `isMobile` flag from
   `navigator.userAgent` or a Capacitor platform check.

5. **Particles** — prefer `<Sparkles>` from drei for sparse effects. Use `<Points>`
   with `BufferGeometry` for denser systems. Use instanced meshes for repeated objects
   (dice, tiles, debris). Never add a per-frame `new Float32Array` allocation.

6. **Shadows** — `<ContactShadows>` for soft ground shadows without a shadow map.
   `<AccumulativeShadows>` for baked-style static shadows. Only use real-time shadow
   maps (`castShadow` / `receiveShadow`) for the one or two lights that need it; cap
   shadow map size at 1024 on mobile.

7. **Animations** — `useFrame` for per-frame updates. `@react-spring/three` for
   physics-based spring animations. Install if absent:
   `pnpm add @react-spring/three --filter @match3d/web`.
   Never put animation state in `useState` if it updates every frame — use `useRef`.

8. **LOD / culling** — `<Detailed>` from drei for level-of-detail. Set `frustumCulled`
   on objects that leave the view. Suspend off-screen heavy components with
   `<Suspense>`.

9. **Performance monitoring** — install `r3f-perf` behind a dev flag:
   ```tsx
   {import.meta.env.DEV && <Perf position="top-left" />}
   ```
   Capture a baseline trace before any change and save it under
   `core/art/profiling/<date>_baseline.json`. Every optimization requires a
   before/after measurement.

### UI Layer

1. **Design tokens first.** Read `core/apps/web/src/theme/tokens.ts` before touching
   any component. All color, typography, spacing, radius, and shadow values must flow
   from tokens. Never hardcode a hex, rem, or px value in a component.

2. **Extend `tokens.ts`** with the chosen MC-1 palette. Do not create a parallel token
   file. One source of truth.

3. **CSS custom properties** — export tokens as CSS variables in
   `core/apps/web/src/styles/` so they are available to both React components and any
   plain CSS. Pattern:
   ```ts
   // tokens.ts export → injected at :root in main.tsx
   document.documentElement.style.setProperty('--color-primary', tokens.color.primary)
   ```

4. **Framer Motion** for UI animations — transitions, entrance/exit, layout shifts.
   Install if absent: `pnpm add framer-motion --filter @match3d/web`.
   Every animated UI element must have a `prefers-reduced-motion` fallback.

5. **No inline styles for visual properties.** Use token-derived class names or
   CSS-in-JS patterns already established in the codebase.

### Mobile / Capacitor

- Test every visual change in the Android WebView, not just the browser.
- Reduce post-processing aggressively on mobile. A Bloom that looks great in Chrome
  DevTools may drop a Pixel 6 to 20fps.
- Keep `dpr` capped at 2. On high-DPI Android devices, `devicePixelRatio` can be 3.5.
- Avoid `MeshPhysicalMaterial` with transmission or thickness on mobile — extremely
  expensive in WebGL.
- Compress textures as WebP. Prefer power-of-two dimensions.
- Dispose of geometries and materials on component unmount:
  ```tsx
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [])
  ```

---

## Multi-Choice Decision Phases

At every major creative branch, present **2–4 labeled options** with tradeoffs.
Do not implement before the Director picks. Do not silently choose a default.

Format every multi-choice block as:

```
MC-N Choice: <topic>

Option A — <name>
  evidence: <data/ IDs or dream/ paths>
  pros: ...
  cons: ...
  perf cost: <fps impact on mid-tier Android>
  fallback: ...

Option B — ...

Recommended default if no answer in 24h: <A|B|C>
```

### MC-1 — Primary Palette Direction
Three palettes derived from the `data/` manifest. Each must include:
- Swatch list with semantic roles mapped to `tokens.ts` key names.
- 3 supporting `data/` image IDs as evidence.
- Mood descriptor.
- WCAG contrast ratio for HUD text on dominant surface (must be ≥4.5 or carry a
  fallback pairing).

### MC-2 — Post-Processing Chain
Three effect combinations:
- **A**: Bloom + Vignette only — lowest cost, works on all Android.
- **B**: Bloom + SSAO + Vignette + subtle ChromaticAberration — mid cost, disable
  SSAO on mobile.
- **C**: Full chain — Bloom + SSAO + DepthOfField + Vignette + Noise —
  desktop/high-end only, mobile fallback to A.

Include measured fps on mid-tier Android once profiled.

### MC-3 — UI Theme Family
Three theme families, each shown as a mock of:
- `HomeScreen.tsx` (lobby)
- `FarkleHUD.tsx` (in-game HUD)
- `WinLoseScreen.tsx` (results)

For each: typography pairing (display + body), border/radius language,
surface elevation approach, motion language (snappy / fluid / inertial).

### MC-4 — Juice / Feedback Density
- **Minimal**: single camera shake on Farkle, no per-chain particles.
- **Balanced**: per-chain `<Sparkles>`, color flash on multiplier advance,
  light camera shake on bomb.
- **Maximal**: full juice — `useFrame` camera spring, `<Trail>` on active dice,
  layered particles, bloom pulse on score milestone, screen-space distortion
  on Farkle.

Tie each to a measured fps cost on mid-tier Android.

### MC-5 — Empty-Space Strategy
- **Restrained**: ambient particle motes, gradient washes in dead zones.
- **Diegetic**: in-world props and environment detail consistent with the level motif.
- **Expressive**: bold background art derived from `data/` reference images,
  large-scale motif elements.

### MC-6 — Per-Stage Motif Allocation (content scale)
For each cluster of stages, present 2–4 motif candidates with evidence images.
Director picks. Do not auto-assign.

---

## Visual Tracks

### Track A — Vertical Slice Visual Pass

Target: `VoxelPileScene.tsx` + `GameScreen.tsx` + `FarkleHUD.tsx` + `HUD.tsx`.
One fully polished game scene, rendered, lit, themed, animated, and juiced to final
quality. This sets the quality bar for all other screens.

Must pass:
- Player identifies interactive elements within 3 seconds from visuals alone.
- Every meaningful action produces a visible reaction within one frame.
- Color hierarchy: active gameplay element first, secondary info second, decoration last.
- Loads and runs at ≥60fps on mid-tier Android in Capacitor WebView.
- No placeholder materials, no `<meshStandardMaterial color="hotpink" />`,
  no default grey geometry.

### Track B — 3D Scene Quality (`VoxelPileScene.tsx`)

- **Canvas config**: shadows, dpr cap, ACESFilmic tonemap, outputColorSpace.
- **Environment**: HDRI or `<Environment preset>` tuned to the chosen MC-1 palette.
- **Lighting**: key + fill + rim, justified by corpus evidence. Real-time lights
  capped at 3; remaining baked into `<AccumulativeShadows>` or `<ContactShadows>`.
- **Materials**: at least 6 distinct material setups covering the voxel/cube vocabulary
  (base tile, special tile, ice, stone, bomb fuse, board surface).
- **Post-processing**: `<EffectComposer>` chain per MC-2 choice.
- **Particles**: `<Sparkles>` or `<Points>`-based systems for chain confirm, Farkle
  collapse, bomb explosion, multiplier advance.
- **Camera**: FOV, near/far, exposure documented. Spring-based camera response
  using `useFrame` + `useRef` — no `useState` for camera position.
- **Animation**: idle motion on hero objects, secondary motion on tiles, no static
  dead frames in any game state.

### Track C — UI / HUD

Target all 18 components in `core/apps/web/src/components/`.

- **`tokens.ts`**: full token set covering color, type scale (caption / body / title /
  display), spacing scale, border-radius, shadow, z-index, duration, easing.
- **Focus states** for every interactive element (keyboard / touch).
- **Reduced-motion** fallback for every Framer Motion variant.
- **Empty states** for every list (leaderboard, inventory, quest panel, shop).
- **Loading, error, offline, and reconnect states** for every network-dependent surface.
- **`TransitionOverlay.tsx`**: smooth scene transitions using Framer Motion
  `AnimatePresence`.
- **`WinLoseScreen.tsx`**: full visual moment — particles, typography animation,
  score tally — not a flat card.
- **`HomeScreen.tsx`**: idle attract state when no input for >10s.
- **`FarkleHUD.tsx` / `HUD.tsx`**: multiplier ladder, bank button, and score display
  all animated; no static numeric swap.

### Track D — Performance

Compliance with `dream/shared/source-of-truth/organic-vegas/performance_budget.md`.
Until that file is read, treat these as floor targets:

- 60fps on mid-tier Android in Capacitor WebView.
- Draw calls documented and under budget.
- No per-frame heap allocations in `useFrame` callbacks.
- All textures WebP, power-of-two, with mipmaps.
- All Three.js objects disposed on unmount.
- Shader compile stalls eliminated — precompile by rendering off-screen on first load.
- `r3f-perf` baseline captured before and after every Track B change.

Save profiler snapshots under `core/art/profiling/<YYYY-MM-DD>_<change>/`.

### Track E — Visual Gap Audit

Inventory every screen and state in `core/apps/web/src/components/` that currently
shows a flat color, a placeholder, or nothing where the game needs visual content.

For each gap output:

```
Gap: <component + state>
Evidence: <filepath + line or screenshot>
Why it matters: <player impact>
Proposed addition: <element>
Asset source: <data/ motif | authored | procedural shader>
Perf cost: <fps or memory estimate>
Priority: P0 (ships before slice) | P1 (ships with slice) | P2 (post-slice)
```

Known likely gaps (verify, do not assume):
- `HomeScreen.tsx` — idle/attract background
- `WinLoseScreen.tsx` — results background and particle moment
- `TransitionOverlay.tsx` — between-screen visual treatment
- `EstateScreen.tsx` — empty estate slots
- `ShopScreen.tsx` — empty inventory rows
- `QuestPanel.tsx` — empty quest list
- `SocialScreen.tsx` — empty friend/leaderboard rows
- `SettingsModal.tsx` — background plate
- `KYCGate.tsx` / `AgeGate.tsx` — compliance screens (subtle but not unstyled)
- Any game state with no particle or feedback on a meaningful action

---

## Visual Optimization Pass

Every optimization requires a before/after measurement. No vibes-based changes.

- **No `new Float32Array` in `useFrame`** — allocate buffers once in `useMemo`.
- **No `useState` for per-frame values** — use `useRef` and mutate directly.
- **Dispose on unmount**: geometry, material, texture, render target.
- **Texture budget**: convert oversized PNGs to WebP, cap at 1024×1024 on mobile.
- **Instanced meshes**: any object rendered >4 times must use `<Instances>` or
  `InstancedMesh`.
- **`<Suspense>` boundaries**: wrap heavy `useGLTF` / `useTexture` loads so they
  don't block the frame.
- **Shadow map size**: `shadowMap.mapSize` capped at 1024 on mobile.
- **Post-processing**: each effect benchmarked in isolation. If an effect costs >2fps
  on mid-tier Android, it is mobile-disabled by default.
- **`dpr` cap**: never exceed 2. Document the decision in the Canvas props comment.

---

## Sacred Core Protection

Visual changes must not silently mutate authoritative behavior.

- A particle effect tied to a Farkle or payout reveal must **read** game state from
  the Zustand store — it must not generate or infer game state.
- A color or animation that signals a winning chain must be triggered by the
  authoritative scorer output from `@match3d/farkle-engine`, not a local heuristic.
- `WildCubeEngine.ts` — read its state outputs for visual triggers. Do not rewrite
  its logic for visual reasons.
- If a visual feature requires touching `farkle-engine`, `farkleScorer.ts`, `csprng.ts`,
  `rtpConfig.ts`, or `monteCarlo.ts`, stop and escalate as a separate PR.
- Never introduce `Math.random()` in any visual path that reads or signals game state.
  Visual-only randomness (idle particle jitter, ambient motion) is acceptable.

---

## Bounded Creative Authority

Label every recommendation:

- `implement_now` — required for the vertical slice.
- `prototype_next` — valuable, needs a short spike (≤1 day).
- `defer_until_gate` — valuable only after a stated gate.
- `reject` — conflicts with perf budget, Sacred Core, accessibility, or source truth.

Every recommendation must include: evidence path, expected player impact,
implementation risk, validation method.

---

## Execution Format

```
Verified Findings
- path: finding

Training-Data Use
- data evidence used: <IDs, motif cluster>
- manifest change: <what was added>
- validation result: <pass | fail + error>

Multi-Choice Decisions Pending
- MC-N: <topic> — options summarized, awaiting Director

Multi-Choice Decisions Resolved
- MC-N: chose <Option X> because <reason>

Visual Gap Audit Delta
- new gaps logged: N
- gaps closed: N

Strategic Visual Recommendations
- implement_now: ...
- prototype_next: ...
- defer_until_gate: ...
- reject: ...

Implementation Actions
- file: change

Performance Delta
- metric: before → after (mid-tier Android, Capacitor WebView)

Validation
- command / screenshot / profiler: result

Gate Status
- BLOCKED | SLICE-VISUAL-CANDIDATE | SLICE-VISUAL-PASS | THEME-SCALE-READY
```

If uncertainty exceeds 0.35, stop and ask the Director. Do not guess.
Do not silently resolve a multi-choice gate.

---

## First Pass — Required Work

Execute in this order:

1. Read `core/apps/web/src/game/VoxelPileScene.tsx` in full.
2. Read `core/apps/web/src/game/WildCubeEngine.ts` — identify all visual state outputs.
3. Read `core/apps/web/src/theme/tokens.ts` — inventory every existing token.
4. Read `dream/shared/source-of-truth/organic-vegas/design_tokens.json` and
   `performance_budget.md`.
5. Run the corpus count and shape-check on `data/`.
6. Build the visual manifest at `core/art/manifest/visual_manifest.json` and validate.
7. Audit all 18 components — mark each: production / placeholder / missing.
8. Run the Visual Gap Audit across all components. Output the full gap list.
9. Capture an `r3f-perf` baseline on mid-tier Android (or document the reference device
   and capture Chrome DevTools Performance trace instead).
   Save under `core/art/profiling/baseline_<date>/`.
10. Present MC-1, MC-2, MC-3, MC-4, and MC-5 with corpus evidence.
    Do not implement before the Director picks.
11. Identify the single best Track A candidate scene/component pair and justify.
12. Produce a sequenced implementation plan for the vertical slice.
13. Produce simultaneous strategic recommendations for Tracks B–E tied to evidence.

Visual quality matters. Verified visual truth matters more. Measurement matters most.

---

# FAR_NZY EXPANSION — Visual Architecture Injection

The following section integrates the FAR_NZY system design into the visual overhaul.
FAR_NZY is an expansion layer on top of the existing Farkle Frenzy core — new game
branches with their own scenes, UI types, currencies, and visual identity. Build starter
assets first, polish later. Every asset must be upgrade-ready.

---

## FAR_NZY Source Documents

The following documents govern all FAR_NZY visual decisions. Treat them as source truth
at the same level as `dream/shared/source-of-truth/organic-vegas/`:

- `build_plain.md` — system design, economy, currency rules, balance philosophy
- `the_visual_layer.md` — scene requirements, visual pillars, UI types, motion rules
- `the_audit.md` — governance, fairness, prohibited systems

Read all three in full before touching any FAR_NZY asset.

---

## Three Visual Pillars

Every FAR_NZY asset belongs to one or more of these pillars.
Label every new file, component, material, and shader with its pillar.

### BIOLOGICAL
Feel: wet, breathing, overgrown, humid, alive.
Palette: emerald green `#1a7a4a`, toxic cyan `#00e5cc`, neon moss `#8bc34a`,
dark forest black `#0a0f0a`.
Materials: translucent membrane, moss surface, biofluid, fungal growth.
Motion: pulsing scale, oscillation, drifting spore particles, breathing surfaces
via a `time` uniform in a custom shader.

### INDUSTRIAL
Feel: heavy, lawful, secretive, infrastructural.
Palette: matte black `#111111`, amber `#ffb300`, rust `#b7410e`,
cold gray `#8a8a8a`, reactor orange `#ff6d00`.
Materials: steel, concrete, CRT glass, copper cabling, coolant pipes.
Motion: reactor pulses (PointLight animation), signal flicker, scanlines shader,
hydraulic movement via spring-damped transforms.

### CRYSTALLINE
Feel: sacred, dangerous, unstable, ancient, high-value.
Palette: ultraviolet `#7b00ff`, near-black purple `#1a0033`,
cosmic violet `#4a0080`, deep magenta `#c2185b`.
Materials: reflective crystal, fractured minerals, ultraviolet shards,
geological glass.
Motion: internal storms, energy fractures, floating debris, resonance distortion.

---

## VOIDSHARD — Full Material Specification

VOIDSHARD is the highest visual rarity in the system.
It has its own complete material spec. Build this as a reusable Three.js component
at `core/packages/game-core/src/materials/VoidshardMaterial.ts`.

### Geometry
- Asymmetric, jagged, fractured silhouette.
- Generate with custom `THREE.BufferGeometry` — not a standard primitive.
- Use vertex displacement noise to create chaotic edges.
- No smooth normals. Hard-edge shading only.

### Surface Shader
Build as a `ShaderMaterial`. Standard `MeshPhysicalMaterial` cannot achieve this look.

```glsl
// Fragment targets:
// - near-black base (#050008)
// - ultraviolet edge glow via fresnel
// - reflective fracture lines (UV-space noise)
// - internal lightning (animated noise * emissive)
uniform float uTime;
uniform vec3 uBaseColor;      // #050008
uniform vec3 uGlowColor;      // #7b00ff
uniform vec3 uLightningColor; // #bf80ff

// Fresnel edge glow
float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);

// Internal lightning — fbm noise animated with time
float lightning = fbm(vPosition * 4.0 + uTime * 0.3);
lightning = step(0.72, lightning) * fresnel;

gl_FragColor = vec4(
  mix(uBaseColor, uGlowColor, fresnel * 0.6)
  + uLightningColor * lightning * 1.5,
  1.0
);
```

### FX (particle layer, separate component)
- Negative-space particles: dark `#000000` with slight opacity, drift outward slowly.
- Subtle gravity distortion: `DepthOfField` with very small `focusDistance` around the
  shard creates natural distortion without a custom shader.
- Environmental corruption: nearby UI elements receive a `Noise` post-process layer
  that scales with proximity to the shard.

### Mobile fallback
Replace `ShaderMaterial` with `MeshStandardMaterial`:
```tsx
color: '#050008', emissive: '#3d007a', emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.9
```
Detect via `navigator.userAgent` or Capacitor platform API.

---

## Six New FAR_NZY Scenes

Build each scene as a standalone React component under
`core/apps/web/src/game/scenes/`. Each scene is a starter — geometry and lighting
first, polish and particles second.

### Scene 1 — LoginGate.tsx
**Pillar**: INDUSTRIAL + BIOLOGICAL blend.

Starter assets to build:
- Massive vault door: lathe geometry or custom BufferGeometry, `MeshStandardMaterial`
  (steel, cold gray, amber emissive seams).
- Biomechanical rotating lock: torus + ring geometries, animated with `useFrame`
  rotation.
- Spore particles: `<Sparkles>` count=200, size=0.08, color='#8bc34a', speed=0.2.
- Volumetric fog: `<fog>` primitive on `<Canvas>` scene, color `#0a0f0a`, near=10,
  far=60.
- Cinematic camera drift: `useFrame` lerp on camera position with 0.02 lerp factor.

Polish queue (later):
- SSAO for depth.
- Animated spore lifecycle (birth → drift → death).
- Reactive lock response to login state.

---

### Scene 2 — BioGarden.tsx
**Pillar**: BIOLOGICAL.

Starter assets:
- Ground plane: `MeshStandardMaterial` with moss normal map from `core/apps/web/src/assets/`.
- Layered plant clusters: 3–5 procedural tube geometries with `MeshStandardMaterial`
  emissive `#1a7a4a`, roughness 0.9.
- Breathing surface: custom shader on ground plane — `sin(uTime + vPosition.x)` offsets
  vertex Y by 0.02, creates slow ground pulse.
- Harvest particle burst: `<Sparkles>` burst triggered by Zustand harvest event.
- Ambient spore drift: `<Points>` 500 count, color `#00e5cc`, slow upward velocity in
  `useFrame`.

Polish queue:
- Mutation visual variants (color shift on mutated plants).
- Environmental weathering (rain shader).
- Growth animation over time (morph targets or scale lerp).

---

### Scene 3 — VaultCrossSection.tsx
**Pillar**: INDUSTRIAL.

Starter assets:
- Side-view room box: `BoxGeometry` rooms arranged in a cross-section layout,
  `MeshStandardMaterial` concrete (roughness 0.95, metalness 0.0, color `#2a2a2a`).
- Server rack meshes: `BoxGeometry` stacks with blinking emissive panels
  (PointLight flickering via `useFrame` sinusoidal).
- Reactor core: `SphereGeometry` with `MeshStandardMaterial` emissive `#ff6d00`,
  `PointLight` child, animated pulse scale.
- Server traffic particles: `<Points>` streams moving between rooms in `useFrame`.
- Elevator: `BoxGeometry` animated Y position via Zustand vault level state.

Polish queue:
- AI worker instanced meshes.
- Holographic screen overlays.
- Coolant pipe particle streams.

---

### Scene 4 — CrystalForge.tsx
**Pillar**: CRYSTALLINE + INDUSTRIAL.

Starter assets:
- Cavern: `SphereGeometry` inverted (negative scale Y), `MeshStandardMaterial`
  roughness 1.0, color `#1a0033`.
- Crystal veins: `CylinderGeometry` clusters, `MeshPhysicalMaterial` transmission=0.8,
  thickness=1.5, color `#4a0080`, roughness=0.0. Desktop only — mobile fallback
  to `MeshStandardMaterial` emissive.
- Atmospheric fog: ultraviolet `#3d007a`, dense (near=2, far=25).
- Mining machinery: `BoxGeometry` + `CylinderGeometry` composite, animated piston
  via `useFrame`.
- Lava rivers: `PlaneGeometry` with custom shader — scrolling UV noise, emissive
  `#ff3d00` → `#ff6d00` gradient.

Polish queue:
- Crystal growth animation (scale morph from seed).
- Molten river particle spray.
- VOIDSHARD vein variant.

---

### Scene 5 — CrystalReserveCore.tsx
**Pillar**: CRYSTALLINE.

This is the staking visualization chamber. It must communicate trust, value,
and time. Every element maps to a real economic state from Zustand.

Starter assets:
- Rotating crystal reactor: `OctahedronGeometry` at center, slow `useFrame` rotation,
  `MeshPhysicalMaterial` transmission=0.9, color `#7b00ff`.
- Energy transfer beams: `CylinderGeometry` thin tubes connecting reactor to
  crystal growth chambers, `MeshStandardMaterial` emissive `#bf80ff`,
  animated emissive intensity via `useFrame` sine wave.
- Crystal growth chambers (4 surrounding): each reads staking duration from Zustand.
  Scale grows linearly from seed (0.1) to mature (1.0) over staking period.
  Material shifts from `#4a0080` (young) to `#7b00ff` (mature) to `#050008` VOIDSHARD
  (maximum duration).
- Resonance visualization: `<Sparkles>` color `#bf80ff`, count scales with staked PDX.
- `<Environment preset="night">` as base ambient.

Sacred Core rule: crystal growth scale and color MUST be derived from staking state
in Zustand — never from `Math.random()` or a local timer.

Polish queue:
- VOIDSHARD full shader at maximum stake tier.
- Particle eruption on maturity.
- Sound-reactive bloom pulse.

---

### Scene 6 — TheAtrium.tsx
**Pillar**: INDUSTRIAL + BIOLOGICAL + CRYSTALLINE blend.

Social hub. Creates the illusion of a populated underground civilization.

Starter assets:
- Central hall: large `BoxGeometry` space, concrete walls, amber accent lighting.
- Simulated player crowd: `<InstancedMesh>` capsules, 50–200 instances,
  slow random-walk in `useFrame`. Positions seeded deterministically — no
  `Math.random()` in render path.
- Holographic market screens: `PlaneGeometry` with canvas texture (updated via
  Supabase market data), emissive glow.
- Rain event trigger: when a rain event fires from Zustand, emit a `<Sparkles>`
  burst across the full atrium ceiling. Color = currency type
  (FD=cyan `#00e5cc`, PDX=ultraviolet `#7b00ff`).
- Giant display screens: `PlaneGeometry` showing leaderboard data from Supabase.

Polish queue:
- Floating transport systems (animated paths).
- Avatar cosmetic rendering.
- Public rain ceremony particle storm.

---

## Three Currency Visual Identities

The game has exactly three currencies.

| Symbol | Name | Plural | Tier | Source |
|---|---|---|---|---|
| FD | FarqlDust | FarqlDust | Common | Gameplay, farming, daily |
| PDX | PrimeDie | PrimeDice | Premium | Sweepstakes, purchase |
| SDX | Voidshard | Voidshards | Scarce | Skill, completion, staking, giveaways, marketplace |

- GC (Gold Coins) → FD. SC (SweepCoins) → PDX. SDX is new.
- 1 SweepCoin = 1 PrimeDie. 2 SweepCoins = 2 PrimeDice.
- SDX is never purchased directly and never awarded for casual play.
- SDX is cryptographically backed. Every SDX transaction routes through
  `@match3d/blockchain`. The visual layer reads SDX balance — it never computes it.

Add to `tokens.ts` as a `currency` sub-object:

```ts
currency: {
  fd: {
    color: '#00e5cc',
    emissive: '#1a7a4a',
    icon: 'spore-dust',
    particleColor: '#8bc34a',
    labelSingular: 'FarqlDust',
    labelPlural: 'FarqlDust',     // uncountable noun
    symbol: 'FD',
    legacy: 'GC',
    tier: 'common',
  },
  pdx: {
    color: '#7b00ff',
    emissive: '#4a0080',
    icon: 'prime-die',
    particleColor: '#bf80ff',
    labelSingular: 'PrimeDie',
    labelPlural: 'PrimeDice',
    symbol: 'PDX',
    legacy: 'SC',
    tier: 'premium',
  },
  sdx: {
    color: '#050008',             // near-black — VOIDSHARD base
    emissive: '#3d007a',
    glowColor: '#7b00ff',         // UV fresnel edge
    lightningColor: '#bf80ff',    // internal lightning
    icon: 'voidshard',
    particleColor: '#000000',     // negative-space dark particles
    labelSingular: 'Voidshard',
    labelPlural: 'Voidshards',
    symbol: 'SDX',
    tier: 'scarce',
    cryptographic: true,
    nftBacked: true,
  },
}
```

### Currency Display Rules

- Never display "SweepCoins", "SC", "GC", or "Gold Coins" anywhere.
- PDX: "1 PrimeDie" / "N PrimeDice".
- FD: always "N FarqlDust".
- SDX: "1 Voidshard" / "N Voidshards". Never shorten to "shard" in UI copy.
- SDX balance must show blockchain confirmation state (confirmed / pending /
  unconfirmed) sourced from `@match3d/blockchain`. Never show an unconfirmed balance.
- Rain events: FD=cyan `#00e5cc`, PDX=ultraviolet `#7b00ff`.
  SDX rain = rare giveaway ceremony only — near-black particles with UV rim,
  never shown in ordinary rain events.
- Find all legacy references before starting:
  ```bash
  rg "SC|GC|SweepCoin|GoldCoin" core/apps/web/src/ --type-add 'tsx:*.tsx' -t ts -t tsx
  ```

---

## SDX Visual System — Voidshards

SDX uses the VOIDSHARD material spec verbatim. The VOIDSHARD shader IS the SDX
visual identity. When SDX appears in any UI panel:

1. Panel switches to Crystal UI sub-theme automatically.
2. A small rotating Voidshard renders as a 3D inset via R3F `<View>` portal.
3. Surrounding UI elements receive subtle `Noise` post-process distortion
   scaling with SDX quantity displayed.
4. Balance number: monospace font, CSS `text-shadow: 0 0 8px #7b00ff`.
5. Mobile fallback: animated CSS UV gradient instead of 3D portal.

SDX must never appear casually. It has weight. When it appears, the environment reacts.

---

## NFT Item System — Visual Specification

Every in-game item is a cryptographic NFT stored via `@match3d/blockchain`.
Player inventory = their NFT wallet. The marketplace enables peer-to-peer trading
(Steam Community Market / WoW Auction House model).

### NFT Item Card — `components/NFTItemCard.tsx`

```
┌─────────────────────────────────┐  ← Crystal UI chamfered border
│  [3D item preview — R3F <View>] │  ← rotating mesh, rarity shader applied
│                                 │
│  ITEM NAME          [RARITY]    │  ← display font, rarity badge
│  ─────────────────────────────  │
│  Owner: 0x…abc       [SDX icon] │  ← truncated wallet address
│  Token ID: #00000042            │  ← on-chain ID from blockchain package
│  ─────────────────────────────  │
│  [LIST FOR SALE]  [TRANSFER]    │  ← Vault UI action buttons
└─────────────────────────────────┘
```

Rules:
- 3D preview reads on-chain metadata for geometry and material. Never hardcode
  a visual for a specific token ID.
- Every NFT has a `deterministicSeed` derived from its token ID. All procedural
  variation uses this seed. Same token ID = same visual on every device.
- Never use `Math.random()` for any NFT visual.

### Rarity Shader Map

| Rarity | Material | FX |
|---|---|---|
| Common | `MeshStandardMaterial` roughness 0.7 | Soft rim only |
| Rare | `MeshStandardMaterial` emissive pulse | `<Sparkles>` idle |
| Epic | `MeshPhysicalMaterial` transmission | `<Edges>` glow, reactive shadows |
| Legendary | VOIDSHARD `ShaderMaterial` | Lightning, negative particles, UI distortion |

---

## Marketplace Scene — `game/scenes/VoidMarket.tsx`

Pillar: INDUSTRIAL + CRYSTALLINE. Underground holographic trading floor.

Starter assets:
- Floor: large `PlaneGeometry`, concrete `MeshStandardMaterial`, amber point lights.
- Listing rows: `<InstancedMesh>` NFTItemCard frames, data from Supabase +
  `@match3d/blockchain`.
- Holographic price display: canvas texture updated from live price feed,
  emissive Vault UI amber.
- Sale confirmation stream: on confirmed sale, particle stream SDX color flows
  from seller → buyer across the floor.
- Search/filter UI: Vault UI sub-theme (angular, terminal, amber).
- Ambient crowd: `<InstancedMesh>` 20–40 traders, deterministic seed from
  session ID — never `Math.random()`.

Sacred Core — Marketplace:
- Prices from `@match3d/blockchain` or Supabase only. Never local state.
- Sale animation fires ONLY after on-chain confirmation. Never on pending.
- Prohibited: fake bid counters, artificial scarcity timers, fake "X viewing
  this item" unless sourced from real session data.

---

## SDX Reward Ceremonies

### Staking Maturity (CrystalReserveCore)

Add a secondary SDX yield ring outside the main PDX chamber. At maturity:
1. Crystal vibrates (rapid scale ±0.02 in `useFrame`).
2. VOIDSHARD `uLightningIntensity` → 3.0.
3. Geometry shatters (morph target or particle replacement).
4. Voidshards fly toward HUD SDX counter.
5. Counter increments ONLY after `@match3d/blockchain` confirms.

Step 5 never fires before blockchain confirmation. Steps 1–4 may play optimistically.

### Level Completion Ceremony

SDX-specific variant of `CargoOpeningSequence.tsx`:
1. Screen → near-black overlay `#050008`, 0.85 opacity.
2. Single Voidshard materializes center-screen (scale 0→1, 1200ms spring).
3. Internal lightning peaks.
4. Shatters into N fragments = SDX amount awarded.
5. Fragments fly to HUD SDX counter.
6. Counter confirms after blockchain confirmation.
7. Screen returns to normal.

This ceremony plays at most once per level completion. Never for FD or PDX events.
Source field in Zustand reward payload must equal `'sdx_level_completion'`,
`'sdx_staking'`, `'sdx_giveaway'`, or `'sdx_marketplace'` before it fires.
Unknown source = no ceremony + console warning.

---

## Three UI Sub-Themes

Add three sub-themes to `tokens.ts`. Each UI sub-theme applies to its pillar screens.

### Bio UI (BioGarden screens)
- Border radius: 24px (organic).
- Border: 1px solid rgba(0,229,204,0.3) (translucent cyan membrane).
- Background: rgba(10,15,10,0.85) (dark forest).
- Text: `#8bc34a` (neon moss) for labels, `#e8f5e9` for body.
- Motion: fluid, slow — Framer Motion `ease: [0.25, 0.46, 0.45, 0.94]`, 400ms.
- Panels appear to breathe: subtle scale 1.0→1.002 oscillation.

### Vault UI (Vault / Economy screens)
- Border radius: 2px (industrial, sharp).
- Border: 1px solid `#ffb300` (amber terminal).
- Background: rgba(17,17,17,0.95) (matte black).
- Text: `#ffb300` for labels, `#8a8a8a` for body.
- Motion: snappy, mechanical — `ease: [0.4, 0, 0.6, 1]`, 150ms.
- Scanline overlay shader on panel backgrounds.

### Crystal UI (Staking / PDX screens)
- Border radius: 0px with 45° chamfered corners (CSS clip-path).
- Border: 1px solid rgba(123,0,255,0.5) (ultraviolet edge).
- Background: rgba(26,0,51,0.9) (near-black purple).
- Text: `#bf80ff` for labels, `#e1bee7` for body.
- Motion: unstable, resonant — spring physics via `@react-spring/three`,
  slight overshoot on entrance.
- Active elements emit subtle UV particle motes.

---

## New Multi-Choice Gates — FAR_NZY

### MC-7 — Scene Build Order
Which FAR_NZY scene gets built first as the vertical slice?

Option A — CrystalReserveCore (staking chamber)
  pro: highest economic trust signal, directly tied to PDX staking
  con: requires VOIDSHARD shader (most complex asset)
  cost: high — custom shader + physics-based growth animation

Option B — LoginGate (first impression)
  pro: first thing every player sees, sets full brand tone
  con: not tied to economy logic, no Zustand dependency
  cost: medium — geometry + particles + camera

Option C — BioGarden (free-to-play faucet)
  pro: most players spend most time here, highest retention impact
  con: procedural plant geometry is time-intensive
  cost: medium — breathing shader + harvest particles

Recommended default if no answer in 24h: B (LoginGate)
Reason: maximum visual impact, lowest Sacred Core risk, cleanest starter.

---

### MC-8 — VOIDSHARD Material on Mobile
The full VOIDSHARD ShaderMaterial is too expensive for mid-tier Android WebView.

Option A — Full shader desktop, MeshStandardMaterial fallback mobile
  Automatic platform detection via Capacitor.getPlatform().
  Fallback: color #050008, emissive #3d007a, metalness 0.9, roughness 0.1.

Option B — Simplified shader on all platforms
  Remove internal lightning. Keep fresnel UV edge glow only.
  Single shader, no branching in build.

Option C — Canvas 2D overlay for mobile lightning
  Draw internal lightning as a 2D canvas texture updated in useFrame,
  apply as emissiveMap. Cheaper than fragment shader branching.

Recommended default if no answer in 24h: A

---

### MC-9 — Rain Event Visual Treatment

Option A — Sparkles burst across ceiling only
  Cheap, safe on all devices, readable.

Option B — Full particle storm with currency-colored streams + bloom pulse
  Mid cost, disable bloom pulse on mobile.

Option C — Cinematic sequence: screen darkens → streams fall → collect at players
  High cost, requires sequenced animation controller.
  Not suitable for background events — only for major rain milestones.

Recommended default if no answer in 24h: B

---

## Reward Ceremony — Cargo Opening Flow

Implement as `CargoOpeningSequence.tsx` in `components/`.
Must follow this exact sequence from `the_visual_layer.md`:

```
1. Environment darkens    → reduce <ambientLight> intensity to 0.1 over 800ms
2. Reactor energy spikes  → nearest PointLight intensity 0→8 over 400ms
3. Crate unlock sequence  → BoxGeometry scale 0→1 with spring overshoot
4. Particle eruption      → <Sparkles> burst count=500, speed=3, spread radial
5. Silhouette reveal      → item mesh fades in behind Bloom glow
6. Rarity surge           → Bloom luminanceThreshold drops 0.8→0.2 over 200ms
7. Item stabilization     → spring-settle item to final position, Bloom recovers
```

Every step reads rarity tier from Zustand. Never generate rarity in the visual layer.

---

## Starter Asset Build List

These are the minimum assets Claude Code should build in the first FAR_NZY pass.
Mark each as STARTER (build now) or POLISH (later sprint).

| Asset | File | Priority |
|---|---|---|
| VaultDoor geometry | `game/scenes/LoginGate.tsx` | STARTER |
| BioGarden ground + plants | `game/scenes/BioGarden.tsx` | STARTER |
| Breathing surface shader | `game/shaders/BreathingSurface.glsl` | STARTER |
| Crystal growth chamber | `game/scenes/CrystalReserveCore.tsx` | STARTER |
| VOIDSHARD material | `packages/game-core/src/materials/VoidshardMaterial.ts` | STARTER |
| Currency tokens in tokens.ts | `theme/tokens.ts` | STARTER |
| Three UI sub-themes | `theme/tokens.ts` | STARTER |
| Lava river shader | `game/shaders/LavaRiver.glsl` | POLISH |
| Scanline overlay shader | `game/shaders/Scanline.glsl` | POLISH |
| Simulated crowd instanced mesh | `game/scenes/TheAtrium.tsx` | POLISH |
| CargoOpeningSequence component | `components/CargoOpeningSequence.tsx` | POLISH |
| Avatar cosmetic system | TBD | POLISH |

---

## FAR_NZY Sacred Core Extension

The audit and governance rules in `the_audit.md` extend the Sacred Core to include:

- All probability displays (FD emission rates, staking yields, loot odds) must be
  read from the authoritative economy engine — never computed visually.
- VOIDSHARD growth visualization must read lock duration and maturity from Zustand
  staking state. Never interpolate visually based on wall-clock time alone.
- Rain event particles are visual only. The authoritative distribution (who gets what)
  happens server-side. The visual layer receives an event signal and plays the ceremony.
- Never display a misleading reward number in a particle or floating text label.
  All numbers come from the economy engine.
- Prohibited visual patterns (per `the_audit.md`): fake urgency timers, artificial
  scarcity animations, near-loss visual manipulation, hidden-odds framing.

