# Ported farkle-engine (parity contract)

These files are a **behavior-identical port** of `packages/farkle-engine` from the
public repo `github.com/libriopal/FAR_NZY`, as required by `BUILD_DIRECTIVE.md`
(STACK clause: "Keep names/behavior identical so outcomes stay verifiable").

| File | Source | Notes |
|------|--------|-------|
| `chainIndex.ts` | FAR_NZY `farkle-engine/src/chainIndex.ts` | verbatim; only `DieFace` import re-pointed |
| `farkleScorer.ts` | FAR_NZY `farkle-engine/src/farkleScorer.ts` | verbatim; `scoreFarkle`, exhaustive (not greedy) |
| `csprng.ts` | FAR_NZY `farkle-engine/src/csprng.ts` | verbatim; `CSPRNG`, `verifyServerSeed`, `deriveCombinedSeed` |
| `types.ts` | FAR_NZY `farkle-shared/src/types.ts` (subset) | just `DieFace` |

## Rules
- Do **not** refactor or "improve" these files. Parity with FAR_NZY is the contract —
  a divergence silently breaks public verifiability of past sessions.
- The 16-case scorer regression suite from FAR_NZY is mirrored in
  `../../__tests__/farkleScorer.parity.test.ts` and must stay green.
- `gridUtils.ts`, `monteCarlo.ts`, `rtpConfig.ts` are named in the directive but the
  One-Roll experiment does not use them, so they are intentionally not ported yet
  (Constitution C10: minimal footprint). Port them behavior-identical from FAR_NZY
  the moment an experiment needs them.
